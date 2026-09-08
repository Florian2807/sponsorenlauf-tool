#!/usr/bin/env bash
set -uo pipefail

REPO_DIR="${SPONSORENLAUF_REPO_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}"
MAINTENANCE_DIR="${SPONSORENLAUF_MAINTENANCE_DIRECTORY:-/var/lib/sponsorenlauf/maintenance}"
MAINTENANCE_GROUP="${SPONSORENLAUF_MAINTENANCE_GROUP:-1000}"
PRODUCTION_ENV_FILE="${SPONSORENLAUF_PRODUCTION_ENV:-$REPO_DIR/deployment/production.env}"
STATUS_FILE="$MAINTENANCE_DIR/status.json"
PROGRESS_FILE="$MAINTENANCE_DIR/progress.log"
RAW_LOG_FILE="$MAINTENANCE_DIR/update.log"
LOCK_FILE="$MAINTENANCE_DIR/operation.lock"

append_progress() {
  printf '%s %s\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$1" >> "$PROGRESS_FILE"
}

run_logged() {
  printf '\n$ %s\n' "$1" >> "$RAW_LOG_FILE"
  shift
  "$@" >> "$RAW_LOG_FILE" 2>&1
}

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
  chown root:"$MAINTENANCE_GROUP" "$temporary"
  chmod 0660 "$temporary"
  mv -f "$temporary" "$STATUS_FILE"
  append_progress "$message"
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

verify_running_app() {
  run_logged 'Prüfe Anwendung und Datenbank' docker_compose exec -T app node -e "Promise.all([fetch('http://127.0.0.1:3000/api/setupStatus').then(r=>{if(!r.ok)throw new Error('setupStatus HTTP '+r.status)}),import('./src/utils/database.js').then(({dbGet})=>dbGet('PRAGMA integrity_check')).then(r=>{if(r.integrity_check!=='ok')throw new Error('database integrity: '+r.integrity_check)})]).then(()=>console.log('Anwendung und Datenbank sind betriebsbereit'))"
}

preflight_update() {
  local free_kb
  command -v docker >/dev/null 2>&1 || { append_progress 'Docker ist nicht installiert.'; return 1; }
  command -v git >/dev/null 2>&1 || { append_progress 'Git ist nicht installiert.'; return 1; }
  command -v sudo >/dev/null 2>&1 || { append_progress 'sudo ist nicht installiert.'; return 1; }
  [ -r "$PRODUCTION_ENV_FILE" ] || { append_progress 'Die Produktions-Konfiguration fehlt oder ist nicht lesbar.'; return 1; }
  docker info >/dev/null 2>> "$RAW_LOG_FILE" || { append_progress 'Der Docker-Dienst ist nicht erreichbar.'; return 1; }
  docker_compose config --quiet >> "$RAW_LOG_FILE" 2>&1 || { append_progress 'Die Docker-Compose-Konfiguration ist ungültig.'; return 1; }
  free_kb="$(df -Pk "$REPO_DIR" | awk 'NR==2 {print $4}')"
  [ "${free_kb:-0}" -ge 2097152 ] || { append_progress 'Für ein sicheres Update werden mindestens 2 GB freier Speicher benötigt.'; return 1; }
}

image_version() {
  docker image inspect --format '{{range .Config.Env}}{{println .}}{{end}}' "$1" 2>/dev/null \
    | sed -n 's/^SPONSORENLAUF_VERSION=//p' | tail -n 1
}

refresh_maintenance_service() {
  local template="$REPO_DIR/deployment/templates/sponsorenlauf-maintenance.service.template" temporary
  [ -f "$template" ] || return 0
  temporary="$(mktemp)"
  sed "s|__REPO_DIR__|$REPO_DIR|g" "$template" > "$temporary" \
    && install -m 0644 "$temporary" /etc/systemd/system/sponsorenlauf-maintenance.service
  local result=$?
  rm -f "$temporary"
  return "$result"
}

production_image_tag() {
  sed -n 's/^SPONSORENLAUF_IMAGE_TAG=//p' "$PRODUCTION_ENV_FILE" | tail -n 1
}

run_update() {
  local request_id="$1" container previous_image previous_commit new_commit short_commit current_branch backup_filename image_tag image_reference repo_owner tracked_changes pulled_version
  write_status running update 'Prüfe Voraussetzungen für das Update.' "$request_id"
  preflight_update || { write_status failed update 'Die Update-Voraussetzungen sind nicht erfüllt. Details stehen im Protokoll.' "$request_id"; return 1; }
  write_status running update 'Erstelle Sicherheitsbackup.' "$request_id"
  container="$(docker_compose ps -q app)"
  [ -n "$container" ] || { write_status failed update 'Produktionscontainer wurde nicht gefunden.' "$request_id"; return 1; }
  previous_image="$(docker inspect --format '{{.Image}}' "$container")"
  backup_filename="$(docker_compose exec -T app node -e "import('./src/utils/backupService.js').then(({createDatabaseBackup}) => createDatabaseBackup({reason:'before-web-update'})).then(({filename}) => console.log(filename))" 2>> "$RAW_LOG_FILE" | tee -a "$RAW_LOG_FILE" | tail -n 1 | tr -d '\r')" \
    || { write_status failed update 'Sicherheitsbackup konnte nicht erstellt werden.' "$request_id"; return 1; }

  write_status running update 'Lade Installationsdateien und Produktions-Image.' "$request_id"
  repo_owner="$(stat -c '%U' "$REPO_DIR")"
  tracked_changes="$(sudo -u "$repo_owner" git -C "$REPO_DIR" status --porcelain --untracked-files=no)"
  [ -z "$tracked_changes" ] \
    || { write_status failed update 'Update abgebrochen: Die Produktionsinstallation enthält lokale Änderungen.' "$request_id"; return 1; }
  previous_commit="$(sudo -u "$repo_owner" git -C "$REPO_DIR" rev-parse HEAD)" \
    || { write_status failed update 'Installierte Git-Version konnte nicht ermittelt werden.' "$request_id"; return 1; }
  run_logged 'git pull --ff-only' sudo -u "$repo_owner" git -C "$REPO_DIR" pull --ff-only \
    || { write_status failed update 'Repository konnte nicht sicher aktualisiert werden.' "$request_id"; return 1; }
  if ! run_logged 'Prüfe aktualisierte Docker-Compose-Konfiguration' docker_compose config --quiet; then
    run_logged 'git reset --hard (Update zurücknehmen)' sudo -u "$repo_owner" git -C "$REPO_DIR" reset --hard "$previous_commit" || true
    write_status failed update 'Die neue Compose-Konfiguration ist mit dieser Installation nicht kompatibel; der vorherige Stand wurde wiederhergestellt.' "$request_id"
    return 1
  fi
  current_branch="$(sudo -u "$repo_owner" git -C "$REPO_DIR" branch --show-current)"
  new_commit="$(sudo -u "$repo_owner" git -C "$REPO_DIR" rev-parse HEAD)"
  short_commit="${new_commit:0:12}"

  if [ "$current_branch" = main ]; then
    write_status running update 'Lade das fertige Produktions-Image.' "$request_id"
    if run_logged 'docker compose pull app' docker_compose pull app; then
      image_tag="$(production_image_tag)"
      image_reference="ghcr.io/florian2807/sponsorenlauf-tool:${image_tag:-latest}"
      pulled_version="$(image_version "$image_reference")"
      if [ "$pulled_version" != "$new_commit" ]; then
        append_progress "Das Registry-Image gehört nicht zum erwarteten Commit ${short_commit}; verwende lokalen Build."
        pulled_version=''
      fi
    fi
    if [ "${pulled_version:-}" != "$new_commit" ]; then
      write_status running update 'Produktions-Image nicht verfügbar; baue die neue Version lokal.' "$request_id"
      if ! run_logged "docker compose build app (${short_commit})" docker_compose build --build-arg "APP_VERSION=${new_commit}" app; then
        image_tag="$(production_image_tag)"
        image_reference="ghcr.io/florian2807/sponsorenlauf-tool:${image_tag:-latest}"
        run_logged 'docker tag (bisheriges Image wiederherstellen)' docker tag "$previous_image" "$image_reference" || true
        run_logged 'git reset --hard (Update zurücknehmen)' sudo -u "$repo_owner" git -C "$REPO_DIR" reset --hard "$previous_commit" || true
        write_status failed update 'Image-Download und lokaler Ersatz-Build sind fehlgeschlagen; der vorherige Stand wurde wiederhergestellt.' "$request_id"
        return 1
      fi
    fi
  else
    append_progress "Verwende lokalen Build für Git-Branch: ${current_branch:-detached}"
    write_status running update 'Der aktuelle Entwicklungsbranch wird lokal gebaut, damit kein fremdes main-Image verwendet wird.' "$request_id"
    if ! run_logged "docker compose build app (${short_commit})" docker_compose build --build-arg "APP_VERSION=${new_commit}" app; then
      image_tag="$(production_image_tag)"
      image_reference="ghcr.io/florian2807/sponsorenlauf-tool:${image_tag:-latest}"
      run_logged 'docker tag (bisheriges Image wiederherstellen)' docker tag "$previous_image" "$image_reference" || true
      run_logged 'git reset --hard (Update zurücknehmen)' sudo -u "$repo_owner" git -C "$REPO_DIR" reset --hard "$previous_commit" || true
      write_status failed update 'Der lokale Build ist fehlgeschlagen; der vorherige Stand wurde wiederhergestellt.' "$request_id"
      return 1
    fi
  fi

  image_tag="$(production_image_tag)"
  image_reference="ghcr.io/florian2807/sponsorenlauf-tool:${image_tag:-latest}"
  if [ "$(image_version "$image_reference")" != "$new_commit" ]; then
    run_logged 'docker tag (bisheriges Image wiederherstellen)' docker tag "$previous_image" "$image_reference" || true
    run_logged 'git reset --hard (Update zurücknehmen)' sudo -u "$repo_owner" git -C "$REPO_DIR" reset --hard "$previous_commit" || true
    write_status failed update 'Das erstellte Image konnte dem erwarteten Commit nicht eindeutig zugeordnet werden; der vorherige Stand wurde wiederhergestellt.' "$request_id"
    return 1
  fi

  write_status running update 'Starte und prüfe die neue Version.' "$request_id"
  if run_logged 'docker compose up -d --remove-orphans' docker_compose up -d --remove-orphans && wait_for_healthy_app && verify_running_app; then
    write_status succeeded update 'Update erfolgreich installiert.' "$request_id"
    return 0
  fi

  write_status running update 'Neue Version ist fehlerhaft; vorheriger Stand wird wiederhergestellt.' "$request_id"
  run_logged 'git reset --hard (Rollback)' sudo -u "$repo_owner" git -C "$REPO_DIR" reset --hard "$previous_commit" || true
  image_tag="$(production_image_tag)"
  run_logged 'docker tag (vorheriges Image)' docker tag "$previous_image" "ghcr.io/florian2807/sponsorenlauf-tool:${image_tag:-latest}" || true
  run_logged 'docker compose stop app (Rollback)' docker_compose stop app || true
  if run_logged 'Datenbank-Backup wiederherstellen' docker_compose run --rm --no-deps --entrypoint node app -e "import('./src/utils/backupService.js').then(({restoreDatabaseBackup}) => restoreDatabaseBackup('/data/backups/${backup_filename}')).then(r=>{if(!r.restored)process.exit(1)})" \
    && run_logged 'docker compose up -d --force-recreate --remove-orphans (Rollback)' docker_compose up -d --force-recreate --remove-orphans \
    && wait_for_healthy_app; then
    if verify_running_app; then
      write_status rolled_back update 'Update fehlgeschlagen; vorherige Version und Datenbank wurden überprüft und wiederhergestellt.' "$request_id"
    else
      write_status failed update 'Rollback gestartet, aber die wiederhergestellte Anwendung hat die Abschlussprüfung nicht bestanden.' "$request_id"
    fi
  else
    write_status failed update 'Update und automatische Wiederherstellung sind fehlgeschlagen. Terminal-Notfallhilfe erforderlich.' "$request_id"
  fi
  return 1
}

run_restart() {
  local request_id="$1"
  write_status running restart 'Anwendung wird neu gestartet.' "$request_id"
  if run_logged 'docker compose restart app' docker_compose restart app && wait_for_healthy_app && verify_running_app; then
    write_status succeeded restart 'Anwendung wurde erfolgreich neu gestartet.' "$request_id"
    return 0
  fi
  write_status failed restart 'Anwendung konnte nicht erfolgreich neu gestartet werden.' "$request_id"
  return 1
}

mkdir -p "$MAINTENANCE_DIR"
chown root:"$MAINTENANCE_GROUP" "$MAINTENANCE_DIR"
chmod 0770 "$MAINTENANCE_DIR"
if [ ! -f "$STATUS_FILE" ]; then
  write_status idle none 'Keine Systemaktion aktiv.' none
else
  chown root:"$MAINTENANCE_GROUP" "$STATUS_FILE"
  chmod 0660 "$STATUS_FILE"
fi

if [ -f "$LOCK_FILE" ] && ! find "$MAINTENANCE_DIR" -maxdepth 1 -type f -name '*.request' | grep -q .; then
  if grep -Eq '"state"[[:space:]]*:[[:space:]]*"(queued|running)"' "$STATUS_FILE" 2>/dev/null; then
    write_status failed unknown 'Eine unterbrochene Wartungsaktion hatte keine wiederaufnehmbare Anfrage. Die Sperre wurde sicher aufgehoben.' unknown
  fi
  rm -f "$LOCK_FILE"
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
    rm -f "$request_file" "$LOCK_FILE"
    continue
  fi

  if [ "$action" = update ]; then run_update "$request_id" || true; else run_restart "$request_id" || true; fi
  rm -f "$request_file" "$LOCK_FILE"
  if [ "$action" = update ]; then
    refresh_maintenance_service || append_progress 'Die systemd-Dienstdefinition konnte nicht aktualisiert werden.'
    systemctl daemon-reload >/dev/null 2>&1 || true
    systemctl restart --no-block sponsorenlauf-maintenance.service >/dev/null 2>&1 || true
    exit 0
  fi
done
