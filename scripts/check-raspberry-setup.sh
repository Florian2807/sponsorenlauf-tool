#!/usr/bin/env bash
set -u

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

CONFIG_FILE="${CONFIG_FILE:-$REPO_DIR/deployment/install.env}"
WLAN_INTERFACE="${WLAN_INTERFACE:-wlan0}"
UPLINK_INTERFACE="${UPLINK_INTERFACE:-eth0}"
APP_DIR="${APP_DIR:-/home/pi/sponsorenlauf-tool}"
SERVICE_NAME="${SERVICE_NAME:-sponsorenlauf}"
MIN_FREE_SPACE_MB="${MIN_FREE_SPACE_MB:-1500}"

PASS_COUNT=0
WARN_COUNT=0
FAIL_COUNT=0

if [ -f "$CONFIG_FILE" ]; then
  # shellcheck disable=SC1090
  . "$CONFIG_FILE"
fi

pass() {
  PASS_COUNT=$((PASS_COUNT + 1))
  printf '[PASS] %s\n' "$1"
}

warn() {
  WARN_COUNT=$((WARN_COUNT + 1))
  printf '[WARN] %s\n' "$1"
}

fail() {
  FAIL_COUNT=$((FAIL_COUNT + 1))
  printf '[FAIL] %s\n' "$1"
}

check_command() {
  local command_name="$1"

  if command -v "$command_name" >/dev/null 2>&1; then
    pass "Befehl verfügbar: $command_name"
  else
    fail "Befehl fehlt: $command_name"
  fi
}

check_internet() {
  if command -v curl >/dev/null 2>&1; then
    if curl -I --silent --max-time 5 https://github.com >/dev/null 2>&1; then
      pass 'Internetverbindung verfügbar (curl zu github.com erfolgreich)'
      return
    fi
  fi

  if command -v wget >/dev/null 2>&1; then
    if wget -q --spider --timeout=5 https://github.com >/dev/null 2>&1; then
      pass 'Internetverbindung verfügbar (wget zu github.com erfolgreich)'
      return
    fi
  fi

  fail 'Keine funktionierende Internetverbindung erkannt. Das eigentliche Setup-Script sollte nicht gestartet werden.'
}

check_linux() {
  if [ "$(uname -s)" = 'Linux' ]; then
    pass 'Linux-System erkannt'
  else
    fail 'Kein Linux-System erkannt'
  fi
}

check_os_release() {
  local os_id
  local os_codename

  if [ ! -f /etc/os-release ]; then
    fail '/etc/os-release fehlt'
    return
  fi

  # shellcheck disable=SC1091
  . /etc/os-release

  os_id="${ID:-}"
  os_codename="${VERSION_CODENAME:-}"

  case "${os_id}:${os_codename}" in
    debian:bookworm|raspbian:bookworm)
      pass "Unterstütztes OS erkannt: ${PRETTY_NAME:-Unbekannt}"
      ;;
    *)
      fail "Nicht unterstütztes OS erkannt: ${PRETTY_NAME:-Unbekannt}. Erwartet wird Debian/Raspberry Pi OS Bookworm."
      ;;
  esac
}

check_sudo() {
  if command -v sudo >/dev/null 2>&1; then
    pass 'sudo ist verfügbar'
  else
    fail 'sudo ist nicht verfügbar'
  fi
}

check_interface() {
  local interface_name="$1"
  local label="$2"

  if ip link show "$interface_name" >/dev/null 2>&1; then
    pass "$label-Interface erkannt: $interface_name"
  else
    fail "$label-Interface fehlt: $interface_name"
  fi
}

check_free_space() {
  local target_dir="$1"
  local available_kb
  local available_mb

  available_kb="$(df -Pk "$target_dir" 2>/dev/null | awk 'NR==2 { print $4 }')"

  if [ -z "$available_kb" ]; then
    warn "Freier Speicher für $target_dir konnte nicht ermittelt werden"
    return
  fi

  available_mb=$((available_kb / 1024))

  if [ "$available_mb" -ge "$MIN_FREE_SPACE_MB" ]; then
    pass "Genügend freier Speicher vorhanden: ${available_mb} MB"
  else
    fail "Zu wenig freier Speicher: ${available_mb} MB verfügbar, ${MIN_FREE_SPACE_MB} MB empfohlen"
  fi
}

check_file_or_parent_writable() {
  local target_path="$1"
  local label="$2"
  local parent_dir

  if [ -e "$target_path" ]; then
    if [ -w "$target_path" ]; then
      pass "$label ist schreibbar: $target_path"
    else
      warn "$label existiert, ist aber aktuell nicht direkt schreibbar: $target_path"
    fi
    return
  fi

  parent_dir="$(dirname "$target_path")"
  if [ -w "$parent_dir" ]; then
    pass "$label kann angelegt werden: $target_path"
  else
    warn "$label kann aktuell nicht angelegt werden: $target_path"
  fi
}

check_service_state() {
  if command -v systemctl >/dev/null 2>&1; then
    if systemctl list-unit-files | grep -q "^${SERVICE_NAME}\.service"; then
      pass "systemd-Service bekannt: ${SERVICE_NAME}.service"
    else
      warn "systemd-Service ${SERVICE_NAME}.service ist noch nicht eingerichtet"
    fi
  fi
}

printf 'Sponsorenlauf Raspberry Setup Check\n'
printf 'Repository: %s\n' "$REPO_DIR"
printf 'Konfiguration: %s\n\n' "$CONFIG_FILE"

printf '== Netzwerk-Preflight ==\n'
check_internet
check_command ip
check_command git
check_command curl
check_linux
check_os_release
check_sudo
check_interface "$WLAN_INTERFACE" 'WLAN'
check_interface "$UPLINK_INTERFACE" 'Uplink'
printf '\n'

printf '== Build- und Laufzeitvoraussetzungen ==\n'
check_command node
check_command npm
check_command python3
check_command systemctl
check_free_space "$REPO_DIR"
printf '\n'

printf '== Zielpfade und Konfigurationsziele ==\n'
check_file_or_parent_writable "$APP_DIR" 'App-Verzeichnis'
check_file_or_parent_writable '/etc/hostapd/hostapd.conf' 'hostapd-Konfiguration'
check_file_or_parent_writable '/etc/default/hostapd' 'hostapd Default-Datei'
check_file_or_parent_writable '/etc/dnsmasq.conf' 'dnsmasq-Konfiguration'
check_file_or_parent_writable '/etc/dhcpcd.conf' 'dhcpcd-Konfiguration'
check_file_or_parent_writable "/etc/systemd/system/${SERVICE_NAME}.service" 'systemd-Service-Datei'
check_file_or_parent_writable '/etc/sudoers.d/sponsorenlauf-maintenance' 'sudoers-Datei für Wartung'
check_service_state
printf '\n'

printf '== Zusammenfassung ==\n'
printf 'PASS: %s\n' "$PASS_COUNT"
printf 'WARN: %s\n' "$WARN_COUNT"
printf 'FAIL: %s\n' "$FAIL_COUNT"

if [ "$FAIL_COUNT" -gt 0 ]; then
  printf '\nErgebnis: FEHLGESCHLAGEN. Das eigentliche Setup-Script sollte erst nach Behebung der Fehler gestartet werden.\n'
  exit 1
fi

printf '\nErgebnis: OK. Das System erfüllt die Grundvoraussetzungen für das geplante Setup-Script.\n'
exit 0
