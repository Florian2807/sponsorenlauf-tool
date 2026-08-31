# Raspberry Setup Script Plan

## Ziel
Die bestehende Raspberry-Installation aus der `README.md` und `raspberrySetup.md` soll in ein robustes Setup-Script überführt werden, damit die Inbetriebnahme für unerfahrene Nutzer deutlich einfacher wird.

Der Zielzustand bleibt bewusst nah an der aktuellen README:

- Raspberry Pi OS Lite (64-bit), Debian Bookworm
- App läuft per `systemd`
- Access Point über `hostapd` + `dnsmasq`
- Routing über `iptables`
- App-Start über `scripts/start-with-update.sh`

## Wichtige Anforderung
Vor dem eigentlichen Shell-Script soll geprüft werden, ob Internet vorhanden ist.

Der Grund:

- Repository-Klonen oder `git pull` brauchen Internet
- NodeSource-Setup für Node.js braucht Internet
- `npm ci` braucht Internet
- ein halbfertiger Lauf ohne Internet wäre unnötig fehleranfällig

## Empfohlene Script-Struktur

### 1. Bootstrap-Check vor dem Setup-Script
Ein kleiner Einstiegsschritt prüft zuerst Internet und startet **danach** erst das eigentliche Setup-Script.

Beispielidee:

```bash
curl -I --max-time 5 https://github.com >/dev/null 2>&1 || {
  echo "Keine Internetverbindung. Setup wird nicht gestartet."
  exit 1
}

bash ./scripts/install-raspberry.sh
```

Wenn das Script später per `curl | bash` geladen werden soll, muss dieser Check in einem kleinen Bootstrapper sitzen, der den Download des Hauptscripts nur bei funktionierendem Internet ausführt.

### 2. Hauptscript
Geplanter Dateiname:

`scripts/install-raspberry.sh`

### 3. Reiner Prüfmodus
Geplanter Dateiname:

`scripts/check-raspberry-setup.sh`

Der Prüfmodus ändert nichts, sondern validiert nur Voraussetzungen und zeigt verständliche Hinweise an.

## Unterstützter Zielzustand
Das Script soll nicht jede beliebige Linux-Konfiguration unterstützen, sondern nur klar definierte Fälle:

- Raspberry Pi OS Lite 64-bit
- Debian Bookworm
- WLAN-Interface vorhanden
- LAN/Uplink-Interface vorhanden
- `hostapd`, `dnsmasq`, `dhcpcd`, `iptables` als Host-Komponenten

Wenn diese Voraussetzungen nicht erfüllt sind, soll das Script klar abbrechen statt halb zu konfigurieren.

## Konfigurierbare Werte
Das Script soll eine kleine Konfigurationsdatei laden oder interaktiv danach fragen.

Empfohlene Variablen:

- `PI_USER=pi`
- `APP_DIR=/home/pi/sponsorenlauf-tool`
- `REPO_URL=https://github.com/Florian2807/sponsorenlauf-tool.git`
- `REPO_BRANCH=main`
- `AP_SSID=Sponsorenlauf Backend`
- `AP_PASSPHRASE=Sponsorenlauf!`
- `AP_DOMAIN=sponsorenlauf.de`
- `WLAN_INTERFACE=wlan0`
- `UPLINK_INTERFACE=eth0`
- `AP_IP=10.0.0.1`
- `DHCP_RANGE_START=10.0.0.5`
- `DHCP_RANGE_END=10.0.0.200`
- `SERVICE_NAME=sponsorenlauf`

Geplante Beispiel-Datei:

`deployment/install.example.env`

## Ablauf des Setup-Scripts

### Phase 1: Preflight
Vor jeder Änderung prüfen:

1. Linux-System erkannt
2. Debian Bookworm / Raspberry Pi OS erkannt
3. `sudo` verfügbar
4. WLAN-Interface vorhanden
5. Uplink-/LAN-Interface vorhanden
6. genügend freier Speicherplatz
7. schreibbare Konfigurationsziele vorhanden

Wenn etwas fehlt:

- klare Fehlermeldung
- Exit-Code ungleich 0
- keine Teilkonfiguration

### Phase 2: Backups
Vor Änderungen automatisch Backups anlegen:

- `/etc/dnsmasq.conf`
- `/etc/dhcpcd.conf`
- `/etc/default/hostapd`
- `/etc/systemd/system/sponsorenlauf.service`
- vorhandene iptables-Regeln

Format:

- `datei.bak-YYYYMMDD-HHMMSS`

### Phase 3: Systempakete installieren
Stark an der README orientiert:

- `git`
- `curl`
- `nodejs`
- `hostapd`
- `dnsmasq`
- `iptables-persistent`
- `dhcpcd`
- `build-essential`
- `python3`

Node.js weiter wie in der README über NodeSource 20.x.

### Phase 4: Repository und App vorbereiten
1. Repository klonen, falls nicht vorhanden
2. Falls vorhanden: auf den gewünschten Branch wechseln und aktualisieren
3. `npm ci`
4. `npm rebuild sqlite3 --build-from-source`
5. `node initDB.js`
6. `npm run build`
7. Skripte ausführbar machen:
   - `scripts/start-with-update.sh`
   - `scripts/system-maintenance-runner.mjs`

### Phase 5: systemd einrichten
Analog zur README, aber nicht mehr manuell per Editor.

Geplante Template-Datei:

`deployment/templates/sponsorenlauf.service.template`

Wichtige Inhalte:

- `WorkingDirectory=/home/pi/sponsorenlauf-tool`
- `ExecStart=/home/pi/sponsorenlauf-tool/scripts/start-with-update.sh`
- `Restart=always`
- `Environment=NODE_ENV=production`

Danach:

- `systemctl daemon-reload`
- `systemctl enable sponsorenlauf`

### Phase 6: Frontend-Wartung freischalten
Analog zur README:

- `/etc/sudoers.d/sponsorenlauf-maintenance` anlegen
- Inhalt für `systemctl restart sponsorenlauf`
- anschließend per `visudo -cf` validieren

Geplante Template-Datei:

`deployment/templates/sudoers-maintenance.template`

### Phase 7: Access Point konfigurieren
Direkt auf Basis der README:

1. `NetworkManager` deaktivieren, falls aktiv
2. `hostapd.conf` erzeugen
3. `/etc/default/hostapd` setzen
4. `dnsmasq.conf` schreiben
5. `dhcpcd.conf` ergänzen
6. IP-Forwarding aktivieren
7. `iptables`-Regeln setzen
8. Regeln persistent speichern

Geplante Template-Dateien:

- `deployment/templates/hostapd.conf.template`
- `deployment/templates/dnsmasq.conf.template`
- `deployment/templates/dhcpcd.conf.append.template`
- `deployment/iptables/rules.v4.template`

### Phase 8: Dienste starten
Wie in der README:

- `dhcpcd`
- `hostapd`
- `dnsmasq`
- `sponsorenlauf`

### Phase 9: Verifikation
Am Ende automatisch prüfen:

1. `systemctl is-active sponsorenlauf`
2. `systemctl is-active hostapd`
3. `systemctl is-active dnsmasq`
4. `ip addr show <wlan-interface>`
5. `curl -I http://127.0.0.1:3000`
6. optional `curl -I http://10.0.0.1:3000`

## Empfohlene Script-Modi

### `check`
Nur prüfen, nichts ändern.

### `install`
Vollständige Erstinstallation inklusive Netzwerkkonfiguration.

### `repair`
Fehlende Komponenten nachziehen, bestehende Installation wiederherstellen.

### `update-app`
Nur App-seitig:

- `git pull`
- `npm ci`
- `npm rebuild sqlite3 --build-from-source`
- `npm run build`
- `systemctl restart sponsorenlauf`

## Sicherheits- und Robustheitsregeln

1. Vor dem Hauptscript immer Internet prüfen
2. Vor Host-Konfigurationsänderungen immer Backups anlegen
3. Nur unterstützte OS-/Netzwerk-Konfigurationen automatisch ändern
4. Bei unbekannten Konfigurationen sauber abbrechen
5. Keine stillen Teilkonfigurationen hinterlassen
6. Idempotent bauen, damit ein zweiter Lauf keinen Schaden anrichtet

## Empfohlene Umsetzungsreihenfolge

1. `scripts/check-raspberry-setup.sh`
2. `deployment/install.example.env`
3. `deployment/templates/*`
4. `scripts/install-raspberry.sh` für App + systemd
5. AP-/Routing-Teil ergänzen
6. `repair`-Modus ergänzen

## Ergebnis für Nutzer
Statt der heutigen vielen manuellen Schritte aus der README soll der Zielablauf langfristig so aussehen:

1. Raspberry Pi OS Lite flashen
2. per SSH verbinden
3. Internet prüfen
4. ein Setup-Script ausführen
5. fertig
