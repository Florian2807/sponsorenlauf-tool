#!/usr/bin/env bash
set -u

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
CONFIG_FILE="${CONFIG_FILE:-$REPO_DIR/deployment/install.env}"
WLAN_INTERFACE="${WLAN_INTERFACE:-wlan0}"
UPLINK_INTERFACE="${UPLINK_INTERFACE:-eth0}"
MIN_FREE_SPACE_MB="${MIN_FREE_SPACE_MB:-1500}"

if [ -f "$CONFIG_FILE" ]; then
  # shellcheck disable=SC1090
  . "$CONFIG_FILE"
fi

PASS_COUNT=0
WARN_COUNT=0
FAIL_COUNT=0
pass() { PASS_COUNT=$((PASS_COUNT + 1)); printf '[PASS] %s\n' "$1"; }
warn() { WARN_COUNT=$((WARN_COUNT + 1)); printf '[WARN] %s\n' "$1"; }
fail() { FAIL_COUNT=$((FAIL_COUNT + 1)); printf '[FAIL] %s\n' "$1"; }

check_command() {
  if command -v "$1" >/dev/null 2>&1; then pass "Befehl verfügbar: $1"; else warn "Wird vom Installer nachinstalliert: $1"; fi
}

check_interface() {
  if ip link show "$1" >/dev/null 2>&1; then pass "$2-Interface erkannt: $1"; else fail "$2-Interface fehlt: $1"; fi
}

printf 'Sponsorenlauf Docker-Setup Vorabcheck\n\n'

if [ "$(uname -s)" = Linux ]; then pass 'Linux erkannt'; else fail 'Linux wurde nicht erkannt'; fi
if grep -qi 'Raspberry Pi' /proc/device-tree/model 2>/dev/null; then
  pass 'Raspberry Pi erkannt'
else
  fail 'Kein Raspberry Pi erkannt; der Produktionsinstaller darf auf diesem Gerät nicht ausgeführt werden'
fi
if [ -f /etc/os-release ]; then
  # shellcheck disable=SC1091
  . /etc/os-release
  case "${ID:-}:${VERSION_CODENAME:-}" in
    debian:bookworm|raspbian:bookworm|debian:trixie|raspbian:trixie) pass "Unterstütztes System: ${PRETTY_NAME:-Linux}" ;;
    *) warn "Nicht ausdrücklich getestetes System: ${PRETTY_NAME:-unbekannt}" ;;
  esac
else
  fail '/etc/os-release fehlt'
fi

if command -v curl >/dev/null 2>&1 && curl -I --silent --max-time 5 https://github.com >/dev/null 2>&1; then
  pass 'Internetverbindung verfügbar'
elif command -v wget >/dev/null 2>&1 && wget -q --spider --timeout=5 https://github.com >/dev/null 2>&1; then
  pass 'Internetverbindung verfügbar'
else
  fail 'Keine Internetverbindung'
fi
if command -v sudo >/dev/null 2>&1; then pass 'sudo verfügbar'; else fail 'sudo fehlt'; fi

check_command docker
check_command nmcli
check_command git
check_interface "$WLAN_INTERFACE" 'WLAN'
check_interface "$UPLINK_INTERFACE" 'LAN'

if command -v nmcli >/dev/null 2>&1; then
  wifi_radio_state="$(nmcli radio wifi 2>/dev/null || true)"
  if [ "$wifi_radio_state" = enabled ]; then
    pass 'WLAN-Funk ist in NetworkManager aktiviert'
  else
    warn "WLAN-Funk ist in NetworkManager ${wifi_radio_state:-nicht abfragbar}; der Installer aktiviert ihn automatisch"
  fi
fi

available_kb="$(df -Pk "$REPO_DIR" 2>/dev/null | awk 'NR==2 { print $4 }')"
if [ -n "$available_kb" ] && [ $((available_kb / 1024)) -ge "$MIN_FREE_SPACE_MB" ]; then
  pass 'Genügend freier Speicher vorhanden'
else
  fail "Mindestens ${MIN_FREE_SPACE_MB} MB freier Speicher werden empfohlen"
fi

printf '\nPASS: %s  WARN: %s  FAIL: %s\n' "$PASS_COUNT" "$WARN_COUNT" "$FAIL_COUNT"
if [ "$FAIL_COUNT" -gt 0 ]; then exit 1; fi
printf 'Ergebnis: bereit für scripts/install-raspberry.sh\n'
