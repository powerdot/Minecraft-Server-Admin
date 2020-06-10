#!/bin/bash

# Smart Minecraft Admin Installer

# tw @power_dot 
# gh @powerdot
# 2020 (c) Ilya R., Moscow, Russia

# Check if user is root
if [ $(id -u) != "0" ]; then
    echo "Error: You must be root to run this script, use sudo sh $0"
    exit 1
fi

echo "System update"
apt-get update -y
apt-get upgrade –y
# ok

echo "Installing: nodejs"
apt install nodejs
# ok

echo "Installing: npm"
apt install npm
# ok

echo "Installing: npm pm2"
npm i pm2 -g
# ok

echo "Installing: git"
apt install git
# ok

echo "Installing: openjdk-8-jre-headless"
apt install openjdk-8-jre-headless

echo "Cloning git repo to path /mcadmin"
git clone https://github.com/powerdot/Minecraft-Server-Admin /mcadmin
cd /mcadmin

read -p "What password for admin do you want to use?: " password
echo "{\"password\":\"$password\"}" > /mcadmin/config.json
# set on startup

# pm
echo "Deploing: npm i"
npm i

echo "Deploing: pm2 start"
pm2 start index.js --name mcadmin --max-memory-restart=4000MB

echo "Now it's ready to go! Just go to http://<youripaddress>:2020/ and login!"

exit 0