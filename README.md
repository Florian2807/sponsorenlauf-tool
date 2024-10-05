# Sponsorenlauf-Tool

### Prinzip:
Dieses Tool dient für eine moderne/digitale Alternative zu Stempelkarten bei einem Sponsorenlauf. 

Jeder Schüler hat seine eigene ID, welche in der Datenbank eingepflegt wird. Diese wird ausgedruckt an jeden Schüler ausgeteilt. 

### Stempelstation: 
- Raspberry Pi als WLAN Router + gestartetes Script
- Mindestens ein Laptop mit jeweils einem Barcode-Scanner
- Laptop muss mit WLAN des Raspberrys verbunden sein

# Installation: 

## Node.js + NPM Installation

Aktualisiere das System
```bash
sudo apt update
sudo apt upgrade
```

Installation:
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
```
```bash
sudo apt install -y nodejs
```

## Repository Setup

**Clone** Respository:

```bash
git clone https://github.com/Florian2807/sponsorenlauf-tool.git
```

**Kopiere** die Dateien aus exampleData/ in data/
```bash
cp exampleData/* data/
```

**Erstelle** .env im Repository:
```bash
OUTLOOK_MAIL="Outlook Versender-Mail Adresse"
OUTLOOK_PASSWORD="Outlook Passwort"
OUTLOOK_SENDERNAME="Name des Absenders der Mails"
```

**Installiere alle Packages**:
```bash
npm install
````

## PM2

Verwende PM2 um diesen Service dauerhaft laufen zu lassen

**Installiere** PM2

```bash
npm install pm2 -g
```

**Aktiviere Autostart** von PM2:
```bash
pm2 startup
```
Führe nun den Befehl aus, welcher dort genannt wird.

**Run Build**:
```bash
npm run build
```

**Start Tool for PM2**
```bash
pm2 start "npm start --name Sponsorenlauf"
```

<details>
  <summary><b>Weitere wichtige PM2 Befehle</b></summary>

Liste aller PM2 Services
```bash
pm2 ls
```

Logs der einzelnen PM2 Services
```bash
pm2 logs [id|name|namespace]
```
---
</details>

---

# Konfiguriere Accesspoint 

Als nächstes wird der Raspberry in ein Router umfunktioniert.

Dazu werden folgende Schritte benötigt:

