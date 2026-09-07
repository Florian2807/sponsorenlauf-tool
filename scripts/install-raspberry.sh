#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
CONFIG_FILE="${CONFIG_FILE:-$REPO_DIR/deployment/install.env}"
PRODUCTION_ENV_FILE="$REPO_DIR/deployment/production.env"

AP_SSID="${AP_SSID:-Sponsorenlauf Backend}"
AP_PASSPHRASE="${AP_PASSPHRASE:-Sponsorenlauf!}"
AP_CONNECTION_NAME="${AP_CONNECTION_NAME:-Sponsorenlauf-Hotspot}"
WLAN_INTERFACE="${WLAN_INTERFACE:-wlan0}"
UPLINK_INTERFACE="${UPLINK_INTERFACE:-eth0}"
AP_IP="${AP_IP:-10.0.0.1}"
SPONSORENLAUF_MAX_BACKUPS="${SPONSORENLAUF_MAX_BACKUPS:-20}"

if [ -f "$CONFIG_FILE" ]; then
  # shellcheck disable=SC1090
  . "$CONFIG_FILE"
fi

log() { printf '[INFO] %s\n' "$1"; }
warn() { printf '[WARN] %s\n' "$1"; }
fail() { printf '[FAIL] %s\n' "$1" >&2; exit 1; }
run_root() { sudo "$@"; }

require_command() {
  command -v "$1" >/dev/null 2>&1 || fail "Benötigter Befehl fehlt: $1"
}

docker_compose() {
  if run_root docker compose version >/dev/null 2>&1; then
    run_root docker compose --env-file "$PRODUCTION_ENV_FILE" -f "$REPO_DIR/compose.prod.yaml" "$@"
  else
    run_root docker-compose --env-file "$PRODUCTION_ENV_FILE" -f "$REPO_DIR/compose.prod.yaml" "$@"
  fi
}

check_platform() {
  [ "$(uname -s)" = 'Linux' ] || fail 'Dieses Script ist für Raspberry Pi OS/Linux vorgesehen.'
  [ -f /etc/os-release ] || fail '/etc/os-release fehlt.'
  if [ "${SPONSORENLAUF_ALLOW_NON_PI:-false}" != true ]; then
    grep -qi 'Raspberry Pi' /proc/device-tree/model 2>/dev/null \
      || fail 'Kein Raspberry Pi erkannt. Der Produktionsinstaller verändert Netzwerkdienste und wird hier nicht ausgeführt.'
  fi
  ip link show "$WLAN_INTERFACE" >/dev/null 2>&1 \
    || fail "WLAN-Interface ${WLAN_INTERFACE} wurde nicht gefunden."
  ip link show "$UPLINK_INTERFACE" >/dev/null 2>&1 \
    || fail "LAN-Interface ${UPLINK_INTERFACE} wurde nicht gefunden. Bitte Ethernet anschließen."
}

install_packages() {
  log 'Installiere Docker und NetworkManager'
  run_root apt-get update
  run_root apt-get install -y docker.io docker-compose network-manager avahi-daemon git curl
  run_root systemctl enable --now docker NetworkManager avahi-daemon
}

configure_hotspot() {
  log "Richte WLAN-Hotspot „${AP_SSID}“ über NetworkManager ein"

  if [ "${#AP_PASSPHRASE}" -lt 8 ] || [ "${#AP_PASSPHRASE}" -gt 63 ]; then
    fail 'Das WLAN-Passwort muss zwischen 8 und 63 Zeichen lang sein.'
  fi

  if nmcli -t -f NAME connection show | grep -Fxq "$AP_CONNECTION_NAME"; then
    run_root nmcli connection modify "$AP_CONNECTION_NAME" \
      connection.interface-name "$WLAN_INTERFACE" \
      connection.autoconnect yes \
      802-11-wireless.ssid "$AP_SSID" \
      802-11-wireless.mode ap \
      802-11-wireless.band bg \
      802-11-wireless-security.key-mgmt wpa-psk \
      802-11-wireless-security.psk "$AP_PASSPHRASE" \
      ipv4.method shared \
      ipv4.addresses "${AP_IP}/24" \
      ipv6.method disabled
  else
    run_root nmcli connection add \
      type wifi \
      ifname "$WLAN_INTERFACE" \
      con-name "$AP_CONNECTION_NAME" \
      autoconnect yes \
      ssid "$AP_SSID"
    run_root nmcli connection modify "$AP_CONNECTION_NAME" \
      802-11-wireless.mode ap \
      802-11-wireless.band bg \
      802-11-wireless-security.key-mgmt wpa-psk \
      802-11-wireless-security.psk "$AP_PASSPHRASE" \
      ipv4.method shared \
      ipv4.addresses "${AP_IP}/24" \
      ipv6.method disabled
  fi

  run_root hostnamectl set-hostname sponsorenlauf
  run_root systemctl restart avahi-daemon
  run_root nmcli connection up "$AP_CONNECTION_NAME"
}

install_application() {
  log 'Lade den fertigen Docker-Container und starte die Anwendung'
  cd "$REPO_DIR"
  umask 077
  touch "$PRODUCTION_ENV_FILE"
  if grep -q '^SPONSORENLAUF_MAX_BACKUPS=' "$PRODUCTION_ENV_FILE"; then
    sed -i "s/^SPONSORENLAUF_MAX_BACKUPS=.*/SPONSORENLAUF_MAX_BACKUPS=${SPONSORENLAUF_MAX_BACKUPS}/" "$PRODUCTION_ENV_FILE"
  else
    printf 'SPONSORENLAUF_MAX_BACKUPS=%s\n' "$SPONSORENLAUF_MAX_BACKUPS" >> "$PRODUCTION_ENV_FILE"
  fi
  grep -q '^SPONSORENLAUF_IMAGE_TAG=' "$PRODUCTION_ENV_FILE" \
    || printf 'SPONSORENLAUF_IMAGE_TAG=latest\n' >> "$PRODUCTION_ENV_FILE"
  if ! grep -q '^SPONSORENLAUF_SECRET_KEY=.' "$PRODUCTION_ENV_FILE"; then
    sed -i '/^SPONSORENLAUF_SECRET_KEY=$/d' "$PRODUCTION_ENV_FILE"
    printf 'SPONSORENLAUF_SECRET_KEY=%s\n' "$(od -An -N32 -tx1 /dev/urandom | tr -d ' \n')" >> "$PRODUCTION_ENV_FILE"
  fi
  chmod 600 "$PRODUCTION_ENV_FILE"
  run_root install -d -m 0770 -o root -g 1000 /var/lib/sponsorenlauf/maintenance
  if docker_compose pull; then
    docker_compose up -d --remove-orphans
  else
    warn 'Veröffentlichtes Image nicht verfügbar; baue es einmalig lokal auf dem Raspberry Pi.'
    docker_compose up -d --build --remove-orphans
  fi

  chmod +x "$REPO_DIR/scripts/maintenance-agent.sh"
  local unit_file
  unit_file="$(mktemp)"
  sed "s|__REPO_DIR__|$REPO_DIR|g" "$REPO_DIR/deployment/templates/sponsorenlauf-maintenance.service.template" > "$unit_file"
  run_root install -m 0644 "$unit_file" /etc/systemd/system/sponsorenlauf-maintenance.service
  rm -f "$unit_file"
  run_root systemctl daemon-reload
  run_root systemctl enable --now sponsorenlauf-maintenance.service
}

verify_installation() {
  log 'Prüfe Installation'
  local attempt
  for attempt in $(seq 1 30); do
    if curl --fail --silent --max-time 3 "http://127.0.0.1/api/setupStatus" >/dev/null; then
      log 'Installation erfolgreich.'
      printf '\nWLAN: %s\nAdresse: http://%s oder http://sponsorenlauf.local\n' "$AP_SSID" "$AP_IP"
      return
    fi
    sleep 2
  done

  docker_compose ps
  fail "Die Anwendung ist nach 60 Sekunden noch nicht erreichbar. Details: sudo docker compose --env-file deployment/production.env -f compose.prod.yaml logs"
}

main() {
  require_command sudo
  require_command ip
  require_command grep
  check_platform
  install_packages
  require_command nmcli
  configure_hotspot
  install_application
  verify_installation
}

main "$@"
