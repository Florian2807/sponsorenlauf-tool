# Automatische Updates beim Raspberry-Start

Der systemd-Service startet `scripts/start-with-update.sh`. Dieses Skript führt vor `npm start` den Wartungs-Runner aus.

## Ablauf

1. Ein eventuell durch Stromausfall unterbrochenes Update wird zurückgesetzt.
2. Die SQLite-Datenbank wird gesichert und geprüft.
3. Migrationen der lokal installierten Version werden immer ausgeführt – auch offline.
4. Bei Internetzugang wird der konfigurierte GitHub-Branch abgerufen.
5. Nur bei einem neuen Fast-Forward-Commit werden Anwendung, Abhängigkeiten und Build aktualisiert.
6. Migrationen aus dem neuen Commit werden in einem separaten Node-Prozess ausgeführt.
7. Erst nach erfolgreichem Build startet Next.js.

Vor dem Git-Wechsel werden `.next`, `node_modules`, der alte Commit und eine Datenbanksicherung unter `.update-rollback/` vermerkt. Bei Fehler oder Stromausfall wird dieser Stand wiederhergestellt. Automatische Datenbanksicherungen liegen in `backups/`; standardmäßig werden 20 Generationen behalten.

## Konfiguration

Die systemd-Unit kann folgende Variablen setzen:

```ini
Environment=SPONSORENLAUF_UPDATE_REMOTE=origin
Environment=SPONSORENLAUF_UPDATE_BRANCH=main
Environment=SPONSORENLAUF_MAX_BACKUPS=20
```

Die Anwendung aktualisiert nur einen sauberen Git-Arbeitsbaum. Lokale Änderungen an versionierten Dateien oder ein abweichender Git-Verlauf führen dazu, dass das Update übersprungen wird.

## Einmalige Aktivierung auf bestehenden Geräten

Geräte, deren systemd-Service noch direkt `npm start` verwendet, benötigen einmalig die neue Startkonfiguration. Vorher sollte der aktuelle Stand kontrolliert ausgerollt werden:

```bash
cd /home/pi/sponsorenlauf-tool
git pull --ff-only origin main
npm ci
npm rebuild sqlite3
npm run migrate
npm run build
chmod +x scripts/start-with-update.sh scripts/system-maintenance-runner.mjs
sudo systemctl daemon-reload
sudo systemctl restart sponsorenlauf
```

In `/etc/systemd/system/sponsorenlauf.service` muss anschließend stehen:

```ini
WorkingDirectory=/home/pi/sponsorenlauf-tool
ExecStart=/home/pi/sponsorenlauf-tool/scripts/start-with-update.sh
```

## Neue Datenbankmigration hinzufügen

Neue Schemaänderungen werden ausschließlich als nächste nummerierte Migration in `src/utils/migrationService.js` ergänzt. Eine veröffentlichte Migration darf später nicht verändert oder neu nummeriert werden. Jede Migration und ihr Eintrag in `schema_migrations` laufen in derselben SQLite-Transaktion.

Vor dem Release lokal prüfen:

```bash
npm test
npm run migrate
npm run build
```
