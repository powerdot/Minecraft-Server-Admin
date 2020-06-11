[![Minecraft Admin Image](https://storage.yandexcloud.net/actid-storage/Minecraft-Server-Admin/mnjs.png)](https://github.com/powerdot/Minecraft-Server-Admin)

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

# Easy deploy

## Step 1: Get a server
Rent any server from any VPS/VDS provider: [Yandex Cloud](https://cloud.yandex.ru/), [Vscale](https://vscale.io/), [DigitalOcean](https://www.digitalocean.com/), [Selectel](https://selectel.ru/) and [etc](https://www.techradar.com/news/best-vps-hosting)...

Look for [best cofigurations](#for-good-gameplay) below.

## Step 2: Login to server via SSH
* On Windows by Pretty SSH Client.
* On MacOS/Linux by terminal.

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

Then we advice you to restart server to erase RAM usage by installing.  

After that you can access your Web Admin by: http://your.ip.address:2020 and your password!  
Hooray!

# Configurations

## Minimal
* Ubuntu 18.04
* Public IP address
* Internet connection
* Server allocation: everywhere
* 5GB HDD
* 1GB RAM
* 1 VCPU

## For good gameplay
* Ubuntu 18.04 and higher
* Public IP address
* Internet connection
* Server allocation: closest location (For example: city where you live)
* 20GB SSD
* 4GB RAM
* 4 VCPU

## Configurations that we are tried already

### DigitalOcean ($5)
* Ubuntu 18.04
* 1 VCPU
* 1GB RAM
* 25GB SSD  
Good for 3-6 players.  
Fast (SSD) and stable.

### Yandex Cloud (300RUB ~ $4,5)
* Platform: Intel Cascade Lake
* Ubuntu 18.04
* 5% CPU Garantee
* 2 VCPU
* 2GB RAM
* 13GB HDD  
Good for 7-10 players.  
But turns off every 24 hours.

### Vscale (400RUB ~ $6)
* Ubuntu 18.04
* 1 VCPU
* 1GB RAM
* 30GB HDD  
Good for 2-4 players.  
Works good, but slow.

### Selectel (620RUB ~ $9)
* Ubuntu 16.04
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
We are installed latest, but sometimes it can be too old to start our "super code".  
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
That's all about update your NodeJS version to latest.  

There is how you can update it:
```bash
curl -sL https://deb.nodesource.com/setup_12.x | sudo -E bash -
sudo apt-get install -y nodejs
```

# To do
* Server online stats
* VPS stats
* Update api routing
* Map backups
* Change admin password
* Configure RAM for server (minecraft runner option)
* Optimize SDF engine queries (too much in Network)