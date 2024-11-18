# Sponsorenlauf-Tool

🚀 **Modernes Sponsorenlauf-Management**  
Eine innovative digitale Lösung als Alternative zu herkömmlichen Stempelkarten bei Sponsorenläufen.

🌍 The tool is currently only available in German. If you want an English version or have special requirements, please create an issue or pull request! I'm happy to help. If you want to test a demo version, just write to me and I'll give you access.

---

## 💡 Prinzip
Jeder Schüler erhält eine eindeutige ID, die in der Datenbank hinterlegt ist. Diese ID wird ausgedruckt und verteilt. Beim Sponsorenlauf können die Schüler ihre ID an verschiedenen Stempelstationen (mit Barcode-Scannern) einlesen lassen.

### 🏁 Stempelstationen
- Raspberry Pi fungiert als WLAN-Router mit einem laufenden Script.
- Mindestens ein Laptop mit angeschlossenem Barcode-Scanner.
- Laptop muss mit dem WLAN des Raspberry Pi verbunden sein.

---

## 📸 Screenshots

<details>
  <summary><b>Screenshots anzeigen</b></summary>

  ### Scan-Ansicht:
  ![Dashboard Runden zählen](./screenshots/runden_zaehlen.png)

  ### Daten eines Schülers abrufen
  ![Dashboard Schüler anzeigen](./screenshots/schueler_anzeigen.png)

  ### Schüler-Management:
  ![Schüler-Management Screenshot](./screenshots/schueler_verwalten.png)

  ### Einzelne Schüler bearbeiten:
  ![Einzelne Schüler verwalten](./screenshots/schueler_verwalten_edit.png)

  ### Statistiken:
  ![Statistiken](./screenshots/statistiken.png)

  ### Setup:
  ![Setup](./screenshots/setup.png)

</details>

---

## 🚀 Installation

### 🖥️ Raspberry Pi Setup
Schau dir die [Anleitung](/raspberrySetup.md) an, wie du den Raspberry Pi installieren musst. 

### ⚙️ Node.js + NPM Installation
1. Verbinde dich per SSH mit deinem Raspberry:
    ```bash
    ssh <benutzer>@raspberry.local
    ```
2. Aktualisiere dein System:
    ```bash
    sudo apt update && sudo apt upgrade
    ```
3. Installiere Node.js:
    ```bash
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt install -y nodejs
    ```

### 📁 Repository Setup
1. **Klone das Repository**:
    ```bash
    git clone https://github.com/Florian2807/sponsorenlauf-tool.git
    cd sponsorenlauf-tool
    ```
> [!NOTE]
> Falls `git` noch nicht installiert ist, installiere es mit:
> ```bash
> sudo apt install git
> ```

2. **Kopiere die Beispieldaten**:
    ```bash
    mkdir data
    cp exampleData/* data/
    ```

3. **Installiere alle benötigten Pakete**:
    ```bash
    npm install
    ```

---

## ⏩ PM2 - Prozessmanagement
Verwende **PM2**, um das Tool dauerhaft im Hintergrund laufen zu lassen.

1. **Installiere PM2**:
    ```bash
    sudo npm install pm2 -g
    ```

2. **Aktiviere den PM2 Autostart**:
    ```bash
    pm2 startup
    ```
    Führe den angezeigten Befehl aus.

3. **Erstelle den Build**:
    ```bash
    npm run build
    ```

4. **Starte das Tool mit PM2**:
    ```bash
    pm2 start "npm start" --name Sponsorenlauf
    ```

<details>
  <summary><b>Weitere wichtige PM2 Befehle</b></summary>
  
  - Liste aller PM2 Services anzeigen:
    ```bash
    pm2 ls
    ```
  
  - Logs anzeigen:
    ```bash
    pm2 logs [id|name|namespace]
    ```
  
  - Service neustarten:
    ```bash
    pm2 restart [id|name|namespace]
    ```
</details>

---

## 📶 Raspberry Pi als Access Point konfigurieren
Um den Raspberry Pi als Router zu nutzen, folge diesen Schritten:

1. **Installiere benötigte Pakete**:
    ```bash
    sudo apt install hostapd dnsmasq iptables-persistent dhcpcd
    ```

2. **Deaktiviere den NetworkManager**:
    ```bash
    sudo systemctl stop NetworkManager && sudo systemctl disable NetworkManager
    ```

3. **Hostapd konfigurieren**:
    - Öffne die Datei:
      ```bash
      sudo nano /etc/hostapd/hostapd.conf
      ```
    - Füge folgendes hinzu:
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

4. **Hostapd aktivieren**:
    ```bash
    sudo nano /etc/default/hostapd
    ```
    Füge diese Zeile hinzu:
    ```bash
    DAEMON_CONF="/etc/hostapd/hostapd.conf"
    ```

5. **dnsmasq konfigurieren**:
    - Bearbeite die Datei:
      ```bash
      sudo nano /etc/dnsmasq.conf
      ```
    - Füge diese Zeilen hinzu:
      ```bash
      interface=wlan0
      dhcp-range=10.0.0.5,10.0.0.200,255.255.255.0,24h
      address=/sponsorenlauf.de/10.0.0.1
      ```

6. **dhcpcd konfigurieren**:
    ```bash
    sudo nano /etc/dhcpcd.conf
    ```
    Füge diese Zeilen hinzu:
    ```bash
    interface wlan0
        static ip_address=10.0.0.1/24
        nohook wpa_supplicant
    ```

7. **iptables für Routing einrichten**:
    - Aktiviere die Weiterleitung:
      ```bash
      sudo nano /etc/sysctl.conf
      ```
    - Entferne das `#` vor der Zeile `net.ipv4.ip_forward=1`.

    - Setze die iptables-Regeln:
      ```bash
      sudo iptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE && sudo iptables -A FORWARD -i eth0 -o wlan0 -m state --state RELATED,ESTABLISHED -j ACCEPT && sudo iptables -A FORWARD -i wlan0 -o eth0 -j ACCEPT && sudo chmod 644 /etc/iptables/rules.v4 && sudo iptables -t nat -A PREROUTING -p tcp --dport 80 -j REDIRECT --to-port 3000
      ```

    - Speichere die iptables-Regeln:
      ```bash
      sudo sh -c "iptables-save > /etc/iptables/rules.v4" && sudo sh -c iptables-restore < /etc/iptables/rules.v4
      ```

8. **Alle Dienste aktivieren**:
    ```bash
    sudo systemctl unmask dhcpcd && sudo systemctl enable dhcpcd && sudo systemctl start dhcpcd
    sudo systemctl unmask hostapd && sudo systemctl enable hostapd && sudo systemctl start hostapd
    sudo systemctl enable dnsmasq && sudo systemctl start dnsmasq
    ```

9. **Raspberry Pi neu starten**:
    ```bash
    sudo reboot
    ```

---

### Fertig! Dein Sponsorenlauf-Tool sollte nun einsatzbereit sein. 🎉