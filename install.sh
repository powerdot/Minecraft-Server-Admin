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
apt-get -qq update
apt-get -qq upgrade
# ok

echo "Installing: nodejs"
apt-get -qq install nodejs -y
# ok

echo "Updating: nodejs"
curl -sL https://deb.nodesource.com/setup_12.x | sudo -E bash -
apt-get -qq install nodejs -y
#ok

echo "Installing: npm"
apt-get -qq install npm -y
# ok

echo "Installing: npm pm2"
npm i pm2 -g --silent
# ok

echo "Installing: git"
apt-get -qq install git -y
# ok

echo "Installing: openjdk-8-jre-headless"
apt-get -qq install openjdk-8-jre-headless -y

echo "Cloning git repo to path /mcadmin"
git clone https://github.com/powerdot/Minecraft-Server-Admin /mcadmin
cd /mcadmin

read -p "What password for admin do you want to use?: " password
echo "{\"password\":\"$password\"}" > /mcadmin/config.json
# set on startup

# pm
echo "Deploing: npm i"
npm i --silent

echo "Deploing: pm2 start"
pm2 start index.js --name mcadmin

echo "Setting up ports: 2020 and 25565"
ufw allow 2020
ufw allow 25565

echo "Setting server to launch after startup"
pm2 startup upstart
echo "####### CONGRATULATIONS! ###################################################"
echo "# Now it's ready to go! Just go to http://<youripaddress>:2020/ and login! #"
echo "############################################################################"
echo "####### Your IP address looks like: ########################################"
hostname -I | cut -d' ' -f1
echo "############################################################################"

exit 0