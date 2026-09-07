#!/usr/bin/env bash
set -uo pipefail

REPO_DIR="${SPONSORENLAUF_REPO_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}"
MAINTENANCE_DIR="${SPONSORENLAUF_MAINTENANCE_DIRECTORY:-/var/lib/sponsorenlauf/maintenance}"
PRODUCTION_ENV_FILE="${SPONSORENLAUF_PRODUCTION_ENV:-$REPO_DIR/deployment/production.env}"
STATUS_FILE="$MAINTENANCE_DIR/status.json"

docker_compose() {
  if docker compose version >/dev/null 2>&1; then
    docker compose --env-file "$PRODUCTION_ENV_FILE" -f "$REPO_DIR/compose.prod.yaml" "$@"
  else
    docker-compose --env-file "$PRODUCTION_ENV_FILE" -f "$REPO_DIR/compose.prod.yaml" "$@"
  fi
}

write_status() {
  local state="$1" action="$2" message="$3" request_id="$4" temporary
  temporary="$MAINTENANCE_DIR/.status-$$.tmp"
  printf '{\n  "state": "%s",\n  "action": "%s",\n  "message": "%s",\n  "requestId": "%s",\n  "updatedAt": "%s"\n}\n' \
    "$state" "$action" "$message" "$request_id" "$(date -u +%Y-%m-%dT%H:%M:%SZ)" > "$temporary"
  chmod 0660 "$temporary"
  mv -f "$temporary" "$STATUS_FILE"
}

wait_for_healthy_app() {
  local container health attempt
  container="$(docker_compose ps -q app)"
  [ -n "$container" ] || return 1
  for attempt in $(seq 1 45); do
    health="$(docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' "$container" 2>/dev/null || true)"
    [ "$health" = healthy ] && return 0
    { [ "$health" = unhealthy ] || [ "$health" = exited ]; } && return 1
    sleep 2
  done
  return 1
}

production_image_tag() {
  sed -n 's/^SPONSORENLAUF_IMAGE_TAG=//p' "$PRODUCTION_ENV_FILE" | tail -n 1
}

run_update() {
  local request_id="$1" container previous_image previous_commit backup_filename image_tag repo_owner tracked_changes
  write_status running update 'Erstelle Sicherheitsbackup.' "$request_id"
  container="$(docker_compose ps -q app)"
  [ -n "$container" ] || { write_status failed update 'Produktionscontainer wurde nicht gefunden.' "$request_id"; return 1; }
  previous_image="$(docker inspect --format '{{.Image}}' "$container")"
  backup_filename="$(docker_compose exec -T app node -e "import('./src/utils/backupService.js').then(({createDatabaseBackup}) => createDatabaseBackup({reason:'before-web-update'})).then(({filename}) => console.log(filename))" | tail -n 1 | tr -d '\r')" \
    || { write_status failed update 'Sicherheitsbackup konnte nicht erstellt werden.' "$request_id"; return 1; }

  write_status running update 'Lade Installationsdateien und Produktions-Image.' "$request_id"
  repo_owner="$(stat -c '%U' "$REPO_DIR")"
  tracked_changes="$(sudo -u "$repo_owner" git -C "$REPO_DIR" status --porcelain --untracked-files=no)"
  [ -z "$tracked_changes" ] \
    || { write_status failed update 'Update abgebrochen: Die Produktionsinstallation enthält lokale Änderungen.' "$request_id"; return 1; }
  previous_commit="$(sudo -u "$repo_owner" git -C "$REPO_DIR" rev-parse HEAD)" \
    || { write_status failed update 'Installierte Git-Version konnte nicht ermittelt werden.' "$request_id"; return 1; }
  sudo -u "$repo_owner" git -C "$REPO_DIR" pull --ff-only \
    || { write_status failed update 'Repository konnte nicht sicher aktualisiert werden.' "$request_id"; return 1; }
  docker_compose pull app \
    || {
      sudo -u "$repo_owner" git -C "$REPO_DIR" reset --hard "$previous_commit" || true
      write_status failed update 'Produktions-Image konnte nicht geladen werden; Installationsdateien wurden zurückgesetzt.' "$request_id"
      return 1
    }

  write_status running update 'Starte und prüfe die neue Version.' "$request_id"
  if docker_compose up -d --remove-orphans && wait_for_healthy_app; then
    write_status succeeded update 'Update erfolgreich installiert.' "$request_id"
    return 0
  fi

  write_status running update 'Neue Version ist fehlerhaft; vorheriger Stand wird wiederhergestellt.' "$request_id"
  sudo -u "$repo_owner" git -C "$REPO_DIR" reset --hard "$previous_commit" || true
  image_tag="$(production_image_tag)"
  docker tag "$previous_image" "ghcr.io/florian2807/sponsorenlauf-tool:${image_tag:-latest}" || true
  docker_compose up -d --force-recreate --remove-orphans || true
  if wait_for_healthy_app; then
    docker_compose exec -T app node -e "import('./src/utils/backupService.js').then(({restoreDatabaseBackup}) => restoreDatabaseBackup('/data/backups/${backup_filename}'))" || true
    write_status rolled_back update 'Update fehlgeschlagen; vorherige Version und Datenbank wurden wiederhergestellt.' "$request_id"
  else
    write_status failed update 'Update und automatische Wiederherstellung sind fehlgeschlagen. Terminal-Notfallhilfe erforderlich.' "$request_id"
  fi
  return 1
}

run_restart() {
  local request_id="$1"
  write_status running restart 'Anwendung wird neu gestartet.' "$request_id"
  if docker_compose restart app && wait_for_healthy_app; then
    write_status succeeded restart 'Anwendung wurde erfolgreich neu gestartet.' "$request_id"
    return 0
  fi
  write_status failed restart 'Anwendung konnte nicht erfolgreich neu gestartet werden.' "$request_id"
  return 1
}

mkdir -p "$MAINTENANCE_DIR"
if [ ! -f "$STATUS_FILE" ]; then
  write_status idle none 'Keine Systemaktion aktiv.' none
fi

while true; do
  request_file="$(find "$MAINTENANCE_DIR" -maxdepth 1 -type f -name '*.request' | sort | head -n 1)"
  if [ -z "$request_file" ]; then
    sleep 2
    continue
  fi

  request_name="$(basename "$request_file")"
  request_id="${request_name%.request}"
  action="$(tr -d '\r\n' < "$request_file")"
  if [[ ! "$request_id" =~ ^[0-9a-f-]{36}$ ]] || { [ "$action" != update ] && [ "$action" != restart ]; }; then
    write_status failed invalid 'Ungültige Wartungsanfrage wurde verworfen.' invalid
    rm -f "$request_file"
    continue
  fi

  if [ "$action" = update ]; then run_update "$request_id" || true; else run_restart "$request_id" || true; fi
  rm -f "$request_file"
done
