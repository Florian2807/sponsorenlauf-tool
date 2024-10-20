# Sponsorenlauf-Tool

Currently this tool is german only. If you want to use this tool in english or have special wishes, please write a commit. I would love do that!

Also if you want a demo version of this tool, you can hit me up and i'll give you access.

### Prinzip
Dieses Tool dient für eine moderne/digitale Alternative zu Stempelkarten bei einem Sponsorenlauf. 

Jeder Schüler hat seine eigene ID, welche in der Datenbank eingepflegt wird. Diese wird ausgedruckt an jeden Schüler ausgeteilt. 

### Stempelstation
- Raspberry Pi als WLAN Router + gestartetes Script
- Mindestens ein Laptop mit jeweils einem Barcode-Scanner
- Laptop muss mit WLAN des Raspberrys verbunden sein

# Installation

### Raspberry Setup
[Anleitung](/raspberrySetup.md), wie du den Raspberry Pi installieren musst. 


## Node.js + NPM Installation

Verbinde mit Raspberry mit SSH:
- Öffne Terminal und schreibe `ssh <benutzer>@raspberry.local`

Aktualisiere das System
```bash
sudo apt update && sudo apt upgrade
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
cd sponsorenlauf-tool
```

> [!NOTE]  
> Falls `git` nicht installiert ist, installiere dies mit `sudo apt install git`

**Kopiere** die Dateien aus exampleData/ in data/
```bash
mkdir data
cp exampleData/* data/
```

**Erstelle** .env im Repository:
```bash
nano .env
```
Füge folgende Zeilen ein und ersetze die Platzhalter:
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
sudo npm install pm2 -g
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
pm2 start "npm start" --name Sponsorenlauf
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

Restart Service
```bash
pm2 restart [id|name|namespace]
```

---
</details>

---

# Konfiguriere Accesspoint 

Als nächstes wird der Raspberry in ein Router umfunktioniert.

Dazu werden folgende Schritte benötigt:

Installiere alle dependencies
```bash
sudo apt install hostapd dnsmasq iptables-persistent dhcpcd
```
- Wähle bei dem pop-up IPv4 Ja und bei IPv6 Nein.

Deaktiviere NetworkManager
```bash
sudo systemctl stop NetworkManager && sudo systemctl disable NetworkManager
```

Konfiguriere hostapd
```bash
sudo nano /etc/hostapd/hostapd.conf
```
Füge folgendes in die Datei ein:
```bash
interface=wlan0
driver=nl80211
ssid=Sponsorenlauf Backend
hw_mode=g
channel=7
wmm_enabled=0
macaddr_acl=0
auth_algs=1
ignore_broadcast_ssid=0
wpa=2
wpa_passphrase=Sponsorenlauf!
wpa_key_mgmt=WPA-PSK
rsn_pairwise=CCMP
```
- Du kannst SSID (Netzwerk Name) und Passwort beliebig ändern

Aktiviere hostapd
```bash
sudo nano /etc/default/hostapd
```

Füge diese Spalte in die Datei hinzu:
```bash 
DAEMON_CONF="/etc/hostapd/hostapd.conf"
```

Konfiguriere dnsmasq:
```bash
sudo nano /etc/dnsmasq.conf
```
Füge diese Zeilen in die Datei ein: 
```bash
interface=wlan0
dhcp-range=10.0.0.5,10.0.0.200,255.255.255.0,24h
```

Konfiguriere dhcpcd:
```bash
sudo nano /etc/dhcpcd.conf
```
Füge folgende Zeilen hinzu:
```bash
interface wlan0
    static ip_address=10.0.0.1/24
    nohook wpa_supplicant
```
Konfiguriere iptables Weiterleitung:
```bash
sudo nano /etc/sysctl.conf
```
Finde die Zeile `#net.ipv4.ip_forward=1` und entferne das #, sodass es so aussieht:
```bash
net.ipv4.ip_forward=1
```

Setze nun die iptables-Regeln:
```bash
sudo iptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE && sudo iptables -A FORWARD -i eth0 -o wlan0 -m state --state RELATED,ESTABLISHED -j ACCEPT && sudo iptables -A FORWARD -i wlan0 -o eth0 -j ACCEPT
```
Speichere diese iptbales-Regeln:
```bash
sudo sh -c "iptables-save > /etc/iptables/rules.v4"
```
Aktiviere alle dependencies:
```bash
sudo systemctl unmask dhcpcd && sudo systemctl enable dhcpcd && sudo systemctl start dhcpcd
```
```bash
sudo systemctl unmask hostapd && sudo systemctl enable hostapd && sudo systemctl start hostapd
```

```bash
sudo systemctl enable dnsmasq && sudo systemctl start dnsmasq
```

Restarte den Raspberry:
```bash
sudo reboot
```
