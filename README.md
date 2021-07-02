[![Minecraft Admin Image](https://storage.yandexcloud.net/actid-storage/Minecraft-Server-Admin/mnjs.png?v2)](https://github.com/powerdot/Minecraft-Server-Admin)


* [Easy deploy](#easy-deploy)
* [Configurations](#configurations)
* * [Minimal](#minimal)
* * [Good](#for-good-gameplay)
* * [Our experience](#configurations-that-we-are-tried-already)
* [Troubles](#troubles)
* * [Ports are closed](#ports-are-closed)
* * [Can't find maps](#minecraft-admin-cant-find-maps-selectbox-is-empty)
* [To do](#to-do)
* [Develover git@powerdot](https://github.com/powerdot/)
* [Donate us](https://patreon.com/minecraft_admin)  

Also look [Screenshots](https://github.com/powerdot/Minecraft-Server-Admin/blob/master/SCREENSHOTS.md)!

# Easy deploy

Create our own Minecraft Server on VPS/VDS and play with friends!

## Step 1: Get a server
Rent any server from any VPS/VDS provider: [Yandex Cloud](https://cloud.yandex.ru/), [Vscale](https://vscale.io/), [DigitalOcean](https://www.digitalocean.com/), [Selectel](https://selectel.ru/) and [etc](https://www.techradar.com/news/best-vps-hosting)...

Look for [best configurations](#for-good-gameplay) below.

## Step 2: Login to server via SSH
* Via Web SSH Console by your hosting provider (if possible).
* Via Windows by Pretty SSH Client.
* Via MacOS/Linux by terminal.

## Step 3: Install

Just enter this line:
```bash
wget https://raw.githubusercontent.com/powerdot/Minecraft-Server-Admin/master/install.sh && chmod +x install.sh && ./install.sh
```

Or try this one:  
Enter line:
```bash
wget https://raw.githubusercontent.com/powerdot/Minecraft-Server-Admin/master/install.sh && chmod +x install.sh
```
And then enter:
```bash
sudo ./install.sh
```

**Then we advise you to restart server to erase RAM usage by installing.**  

After that you can access your Web Admin by: http://your.ip.address:2020 and your password!  
Hooray!

Look for [tutorials](#video-tutorials)!

# Configurations

## Minimal
* Ubuntu 18.04 / 20.04 (for 1.7)
* Public IP address
* Internet connection
* Server allocation: everywhere
* 5GB HDD
* 1GB RAM
* 1 VCPU

## For good gameplay
* Ubuntu 18.04 / 20.04 (for 1.7)
* Public IP address
* Internet connection
* Server allocation: closest location (For example: city where you live)
* 20GB SSD
* 4GB RAM
* 4 VCPU

## Configurations that we are tried already

### DigitalOcean ($5)
* Ubuntu 18.04 / 20.04 (for 1.7)
* 1 VCPU
* 1GB RAM
* 25GB SSD  
Good for 3-6 players.  
Fast (SSD) and stable.

### Yandex Cloud (300RUB ~ $4,5)
* Platform: Intel Cascade Lake
* Ubuntu 18.04 / 20.04 (for 1.7)
* 5% CPU Garantee
* 2 VCPU
* 2GB RAM
* 13GB HDD  
Good for 7-10 players.  
But turns off every 24 hours.

### Vscale (400RUB ~ $6)
* Ubuntu 18.04 / 20.04 (for 1.7)
* 1 VCPU
* 1GB RAM
* 30GB HDD  
Good for 2-4 players.  
Works good, but slow.

### Selectel (620RUB ~ $9)
* Ubuntu 18.04 / 20.04 (for 1.7)
* 1 VCPU
* 1GB RAM
* 10GB HDD  
Good for 2-4 players.  
Works good, but slow.

# Troubles

## Ports are closed
If you can't access your server by web-browser, try to open ports:  
This one for Web Admin.
```bash
sudo iptables -I INPUT -p tcp -m tcp --dport 2020 -j ACCEPT
ufw allow 2020
```
... and this one for Minecraft Server.
```bash
sudo iptables -I INPUT -p tcp -m tcp --dport 25565 -j ACCEPT
ufw allow 25565
```

## Minecraft Admin can't find maps (selectbox is empty)
Check your NodeJS version on server.  
We installed the latest version, but sometimes it can be too old to start our "super code".  
```bash
node -v
```
You need version greater or equals 10. Not 8.

Now check out for errors on Web server:
```bash
pm2 logs mcadmin
```
If you see this:
```bash
TypeError: dirent.isDirectory is not a function
```
You should update NodeJS version to latest.  

There is how you can update it:
```bash
curl -sL https://deb.nodesource.com/setup_12.x | sudo -E bash -
sudo apt-get install -y nodejs
```
## Can't run version 1.7
Update JDK up to 16 version. *JDK16 need Ubuntu Server from 20.04.*
1. Install new VM with Ubuntu 20.04
3. Run `sudo apt-get -qq update`
4. Run `sudo apt-get -qq upgrade`
5. Run `sudo apt-get install openjdk-16-jre-headless`
6. Check version by running `java --version`. Must be 16.
7. Download Minecraft-Server-Admin Installer `wget https://raw.githubusercontent.com/powerdot/Minecraft-Server-Admin/master/install.sh && chmod +x install.sh`
8. Run Installer `sudo ./install.sh`

# To do
- [ ] Update API routing
- [ ] Recomendation system by VPS configuration
- [ ] Minecraft server stats
- [ ] Run multiple servers
- [ ] Change admin password
- [ ] Configure RAM for server (minecraft runner option)
- [ ] Server file manager
- [ ] Upgrade UI
- [x] Install multiple servers
- [ ] Install multiple servers of one version
- [x] Online players
- [x] Autostartup after system startup
- [x] Upload and download maps
- [ ] Map backups
- [ ] Download map from URL
- [x] Responsive web design
- [ ] Commandline tips
- [ ] VPS stats
- [ ] Blacklist managment
- [ ] Whitelist managment
- [ ] Interactive user managment
- [x] Update checking
- [ ] Bukkit support
- [ ] Bukkit mods support
- [ ] Free maps marketplace (waiting for Patrons to supply $ for architecture)
- [ ] Free accounts to store maps (waiting for Patrons to supply $ for architecture)

Project [patrons](https://www.patreon.com/minecraft_admin) have the opportunity to accelerate the development of new features!  

# Video Tutorials

English (by Natalie Burdenko): [https://www.youtube.com/watch?v=IlLuzq8MDY0](https://www.youtube.com/watch?v=IlLuzq8MDY0)  
Russian (by Илья Рычагов): [https://www.youtube.com/watch?v=Hvp5vb3RBA0](https://www.youtube.com/watch?v=Hvp5vb3RBA0)  

# Tags

How to easy install minecraft on ubuntu server?  
Easiest way to setup minecraft server!  
Minecraft server on ubuntu  
Minecraft java on ubuntu server  
Самый простой способ поставить Minecraft на сервер  
Как поставить Minecraft на Ubuntu Server
What hosting use for Minecraft Server?
How to host minecraft
Хостинг для майнкрафт сервера
Где хостить майнкрафт
Как сделать собственный майнкрафт сервер
Hot to make own minecraft server
