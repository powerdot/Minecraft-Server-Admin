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

echo "Installing: nodejs"
apt install nodejs

echo "Installing: npm"
apt install npm

echo "Installing: npm pm2"
npm i pm2 -g

# set on startup

# pm
pm2 start index.js --name mcadmin

exit 0