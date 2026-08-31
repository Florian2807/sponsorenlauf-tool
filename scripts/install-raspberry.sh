#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

CONFIG_FILE="${CONFIG_FILE:-$REPO_DIR/deployment/install.env}"
MODE="${MODE:-install}"

PI_USER="${PI_USER:-pi}"
APP_DIR="${APP_DIR:-/home/${PI_USER}/sponsorenlauf-tool}"
REPO_URL="${REPO_URL:-https://github.com/Florian2807/sponsorenlauf-tool.git}"
REPO_BRANCH="${REPO_BRANCH:-main}"
AP_SSID="${AP_SSID:-Sponsorenlauf Backend}"
AP_PASSPHRASE="${AP_PASSPHRASE:-Sponsorenlauf!}"
AP_DOMAIN="${AP_DOMAIN:-sponsorenlauf.de}"
WLAN_INTERFACE="${WLAN_INTERFACE:-wlan0}"
UPLINK_INTERFACE="${UPLINK_INTERFACE:-eth0}"
AP_IP="${AP_IP:-10.0.0.1}"
DHCP_RANGE_START="${DHCP_RANGE_START:-10.0.0.5}"
DHCP_RANGE_END="${DHCP_RANGE_END:-10.0.0.200}"
SERVICE_NAME="${SERVICE_NAME:-sponsorenlauf}"
NODE_MAJOR_VERSION="${NODE_MAJOR_VERSION:-20}"
SPONSORENLAUF_MAX_BACKUPS="${SPONSORENLAUF_MAX_BACKUPS:-20}"

if [ -f "$CONFIG_FILE" ]; then
  # shellcheck disable=SC1090
  . "$CONFIG_FILE"
fi

log() {
  printf '[INFO] %s\n' "$1"
}

warn() {
  printf '[WARN] %s\n' "$1"
}

fail() {
  printf '[FAIL] %s\n' "$1" >&2
  exit 1
}

run_root() {
  sudo "$@"
}

require_command() {
  command -v "$1" >/dev/null 2>&1 || fail "Benötigter Befehl fehlt: $1"
}

check_internet() {
  log 'Prüfe Internetverbindung vor dem Setup-Script'

  if command -v curl >/dev/null 2>&1 && curl -I --silent --max-time 5 https://github.com >/dev/null 2>&1; then
    log 'Internetverbindung erkannt (curl zu github.com erfolgreich)'
    return
  fi

  if command -v wget >/dev/null 2>&1 && wget -q --spider --timeout=5 https://github.com >/dev/null 2>&1; then
    log 'Internetverbindung erkannt (wget zu github.com erfolgreich)'
    return
  fi

  fail 'Keine Internetverbindung erkannt. Das Setup-Script wird nicht gestartet.'
}

backup_file() {
  local target_path="$1"

  if [ -e "$target_path" ]; then
    local backup_path="${target_path}.bak-$(date +%Y%m%d-%H%M%S)"
    run_root cp -a "$target_path" "$backup_path"
    log "Backup erstellt: $backup_path"
  fi
}

render_template() {
  local template_path="$1"
  local output_path="$2"
  local tmp_file

  tmp_file="$(mktemp)"
  cp "$template_path" "$tmp_file"

  sed -i "s|__PI_USER__|${PI_USER}|g" "$tmp_file"
  sed -i "s|__APP_DIR__|${APP_DIR}|g" "$tmp_file"
  sed -i "s|__AP_SSID__|${AP_SSID}|g" "$tmp_file"
  sed -i "s|__AP_PASSPHRASE__|${AP_PASSPHRASE}|g" "$tmp_file"
  sed -i "s|__AP_DOMAIN__|${AP_DOMAIN}|g" "$tmp_file"
  sed -i "s|__WLAN_INTERFACE__|${WLAN_INTERFACE}|g" "$tmp_file"
  sed -i "s|__UPLINK_INTERFACE__|${UPLINK_INTERFACE}|g" "$tmp_file"
  sed -i "s|__AP_IP__|${AP_IP}|g" "$tmp_file"
  sed -i "s|__DHCP_RANGE_START__|${DHCP_RANGE_START}|g" "$tmp_file"
  sed -i "s|__DHCP_RANGE_END__|${DHCP_RANGE_END}|g" "$tmp_file"
  sed -i "s|__SERVICE_NAME__|${SERVICE_NAME}|g" "$tmp_file"
  sed -i "s|__REPO_BRANCH__|${REPO_BRANCH}|g" "$tmp_file"
  sed -i "s|__MAX_BACKUPS__|${SPONSORENLAUF_MAX_BACKUPS}|g" "$tmp_file"

  run_root mkdir -p "$(dirname "$output_path")"
  run_root cp "$tmp_file" "$output_path"
  rm -f "$tmp_file"
}

ensure_nodejs() {
  if command -v node >/dev/null 2>&1; then
    local installed_major
    installed_major="$(node -p "process.versions.node.split('.')[0]")"

    if [ "$installed_major" = "$NODE_MAJOR_VERSION" ]; then
      log "Node.js ${NODE_MAJOR_VERSION} bereits vorhanden"
      return
    fi

    warn "Node.js ${installed_major} erkannt, erwartet wird ${NODE_MAJOR_VERSION}. Aktualisiere Node.js."
  else
    log 'Node.js nicht gefunden. Installation wird vorbereitet.'
  fi

  require_command curl
  run_root bash -c "curl -fsSL https://deb.nodesource.com/setup_${NODE_MAJOR_VERSION}.x | bash -"
  run_root apt install -y nodejs
}

install_system_packages() {
  log 'Installiere benötigte Systempakete'
  run_root apt update
  run_root apt install -y git curl build-essential python3 hostapd dnsmasq iptables-persistent dhcpcd
}

prepare_repository() {
  local parent_dir
  parent_dir="$(dirname "$APP_DIR")"

  run_root mkdir -p "$parent_dir"
  run_root chown "$PI_USER":"$PI_USER" "$parent_dir"

  if [ "$APP_DIR" = "$REPO_DIR" ]; then
    log 'Nutze das aktuell ausgeführte Repository als App-Verzeichnis'
  elif [ -d "$APP_DIR/.git" ]; then
    log "Bestehendes Repository gefunden: $APP_DIR"
    run_root chown -R "$PI_USER":"$PI_USER" "$APP_DIR"
  elif [ -d "$APP_DIR" ] && [ -n "$(ls -A "$APP_DIR" 2>/dev/null)" ]; then
    fail "Zielverzeichnis ist nicht leer und kein Git-Repository: $APP_DIR"
  else
    log "Klone Repository nach $APP_DIR"
    run_root -u "$PI_USER" git clone "$REPO_URL" "$APP_DIR"
  fi

  log 'Synchronisiere Repository-Stand'
  run_root -u "$PI_USER" git -C "$APP_DIR" fetch origin
  run_root -u "$PI_USER" git -C "$APP_DIR" checkout "$REPO_BRANCH"
  run_root -u "$PI_USER" git -C "$APP_DIR" pull --ff-only origin "$REPO_BRANCH"
}

prepare_application() {
  log 'Installiere App-Abhängigkeiten'
  run_root -u "$PI_USER" bash -lc "cd '$APP_DIR' && npm ci"

  log 'Baue sqlite3 lokal für den Raspberry'
  run_root -u "$PI_USER" bash -lc "cd '$APP_DIR' && npm rebuild sqlite3"

  log 'Initialisiere Datenbank'
  run_root -u "$PI_USER" bash -lc "cd '$APP_DIR' && node initDB.js"

  log 'Erzeuge Produktions-Build'
  run_root -u "$PI_USER" bash -lc "cd '$APP_DIR' && npm run build"

  run_root chmod +x "$APP_DIR/scripts/start-with-update.sh"
  run_root chmod +x "$APP_DIR/scripts/system-maintenance-runner.mjs"
}

configure_systemd() {
  local service_target="/etc/systemd/system/${SERVICE_NAME}.service"

  backup_file "$service_target"
  render_template "$APP_DIR/deployment/templates/sponsorenlauf.service.template" "$service_target"

  run_root systemctl daemon-reload
  run_root systemctl enable "$SERVICE_NAME"
}

configure_sudoers() {
  local sudoers_target='/etc/sudoers.d/sponsorenlauf-maintenance'

  backup_file "$sudoers_target"
  render_template "$APP_DIR/deployment/templates/sudoers-maintenance.template" "$sudoers_target"
  run_root chmod 440 "$sudoers_target"
  run_root visudo -cf "$sudoers_target"
}

disable_network_manager_if_present() {
  if systemctl list-unit-files 2>/dev/null | grep -q '^NetworkManager\.service'; then
    log 'Deaktiviere NetworkManager wie in der README beschrieben'
    run_root systemctl stop NetworkManager || true
    run_root systemctl disable NetworkManager || true
  else
    log 'NetworkManager nicht vorhanden oder bereits entfernt'
  fi
}

configure_access_point() {
  local hostapd_conf='/etc/hostapd/hostapd.conf'
  local hostapd_default='/etc/default/hostapd'
  local dnsmasq_conf='/etc/dnsmasq.conf'
  local dhcpcd_conf='/etc/dhcpcd.conf'
  local iptables_rules='/etc/iptables/rules.v4'
  local dhcpcd_block
  local sysctl_conf='/etc/sysctl.conf'
  local tmp_rules

  backup_file "$hostapd_conf"
  backup_file "$hostapd_default"
  backup_file "$dnsmasq_conf"
  backup_file "$dhcpcd_conf"
  backup_file "$iptables_rules"

  render_template "$APP_DIR/deployment/templates/hostapd.conf.template" "$hostapd_conf"
  render_template "$APP_DIR/deployment/templates/hostapd.default.template" "$hostapd_default"
  render_template "$APP_DIR/deployment/templates/dnsmasq.conf.template" "$dnsmasq_conf"

  dhcpcd_block="$(mktemp)"
  cp "$APP_DIR/deployment/templates/dhcpcd.conf.append.template" "$dhcpcd_block"
  sed -i "s|__WLAN_INTERFACE__|${WLAN_INTERFACE}|g" "$dhcpcd_block"
  sed -i "s|__AP_IP__|${AP_IP}|g" "$dhcpcd_block"

  if ! grep -q "interface ${WLAN_INTERFACE}" "$dhcpcd_conf" 2>/dev/null; then
    run_root bash -c "cat '$dhcpcd_block' >> '$dhcpcd_conf'"
    log "dhcpcd-Konfiguration für ${WLAN_INTERFACE} ergänzt"
  else
    warn "dhcpcd-Konfiguration enthält bereits einen Block für ${WLAN_INTERFACE}; bitte manuell prüfen"
  fi
  rm -f "$dhcpcd_block"

  if grep -q '^#\?net.ipv4.ip_forward=1' "$sysctl_conf"; then
    run_root sed -i 's/^#\?net\.ipv4\.ip_forward=.*/net.ipv4.ip_forward=1/' "$sysctl_conf"
  else
    run_root bash -c "printf '\nnet.ipv4.ip_forward=1\n' >> '$sysctl_conf'"
  fi
  run_root sysctl -w net.ipv4.ip_forward=1 >/dev/null

  tmp_rules="$(mktemp)"
  cp "$APP_DIR/deployment/iptables/rules.v4.template" "$tmp_rules"
  sed -i "s|__WLAN_INTERFACE__|${WLAN_INTERFACE}|g" "$tmp_rules"
  sed -i "s|__UPLINK_INTERFACE__|${UPLINK_INTERFACE}|g" "$tmp_rules"
  run_root cp "$tmp_rules" "$iptables_rules"
  rm -f "$tmp_rules"
  run_root iptables-restore < "$iptables_rules"
}

start_services() {
  log 'Aktiviere und starte Netzwerk- und App-Dienste'
  run_root systemctl unmask dhcpcd || true
  run_root systemctl enable dhcpcd
  run_root systemctl start dhcpcd

  run_root systemctl unmask hostapd || true
  run_root systemctl enable hostapd
  run_root systemctl start hostapd

  run_root systemctl enable dnsmasq
  run_root systemctl start dnsmasq

  run_root systemctl restart "$SERVICE_NAME"
}

verify_installation() {
  log 'Prüfe finalen Installationszustand'
  run_root systemctl is-active "$SERVICE_NAME" >/dev/null
  run_root systemctl is-active hostapd >/dev/null
  run_root systemctl is-active dnsmasq >/dev/null
  ip addr show "$WLAN_INTERFACE" >/dev/null 2>&1 || fail "WLAN-Interface ${WLAN_INTERFACE} nicht verfügbar"
  curl -I --silent --max-time 10 http://127.0.0.1:3000 >/dev/null 2>&1 || fail 'App antwortet lokal nicht auf Port 3000'
  log 'Installation erfolgreich abgeschlossen'
}

main() {
  require_command sudo
  require_command bash
  require_command grep
  require_command sed
  require_command awk
  require_command ip
  require_command systemctl

  check_internet

  log 'Starte Raspberry-Installationsablauf'
  bash "$REPO_DIR/scripts/check-raspberry-setup.sh" >/dev/null 2>&1 || warn 'Vorabcheck meldet offene Punkte. Das Setup läuft trotzdem weiter.'

  install_system_packages
  ensure_nodejs
  prepare_repository

  if [ "$MODE" = 'update-app' ]; then
    prepare_application
    run_root systemctl restart "$SERVICE_NAME"
    verify_installation
    return
  fi

  disable_network_manager_if_present
  prepare_application
  configure_systemd
  configure_sudoers
  configure_access_point
  start_services
  verify_installation
}

main "$@"
