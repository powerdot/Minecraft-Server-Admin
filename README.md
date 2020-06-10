# NodeJs Minecraft Admin

## To do
* Server online stats
* VPS stats
* Update api routing
* Map backups
* Change admin password
* Configure RAM for server (minecraft runner option)

## Easy deploy
Just enter this line:
```bash
wget https://raw.githubusercontent.com/powerdot/Minecraft-Server-Admin/master/install.sh && chmod +x install.sh && ./install.sh
```

Or try it:
Just enter this line:
```bash
wget https://raw.githubusercontent.com/powerdot/Minecraft-Server-Admin/master/install.sh && chmod +x install.sh
```
```bash
sudo ./install.sh
```

Press "Y" while installing.

## You can run server on
* Yandex Cloud
* Vscale
* DigitalOcean
* ... and any virtual hosting provider!

## Minimal configuration
* Ubuntu 18.04
* Public IP address
* Internet connection
* Server allocation: everywhere
* 5GB HDD
* 1GB RAM
* 1 CPU

## Configuration for good gameplay
* Ubuntu 18.04
* Public IP address
* Internet connection
* Server allocation: closest location (For example: city where you live)
* 20GB SSD
* 4GB RAM
* 4 CPU

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