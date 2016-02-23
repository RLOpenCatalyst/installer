#!/bin/bash

#Get the value from the Operating System
OS=$(awk '/DISTRIB_ID=/' /etc/*-release | sed 's/DISTRIB_ID=//' | tr '[:upper:]' '[:lower:]')
PWD=$(pwd)
PWD1=$(realpath ..)

if [ -z "$OS" ];
then
    OS=$(awk '{print $1}' /etc/redhat-release | tr '[:upper:]' '[:lower:]')
fi

catalystdeploy()
{
    #Install the Catalyst
    cd ~
    sudo git clone https://github.com/RLOpenCatalyst/core.git /opt/core
    sudo mv /opt/core /opt/rlcatalyst
    cd /opt/rlcatalyst/server
    if [ -d "/opt/rlcatalyst/server/node_modules"]
    then
      rm -rf /opt/rlcatalyst/server/node_modules
    else
      sudo npm install
    fi
    sudo node install --seed-data
    sudo forever start app.js
}

puppet() {
	sudo git clone https://github.com/RLOpenCatalyst/puppet-cookbook /opt/rlcatalyst/server/puppet-cookbook
}

vmware() {
	cd ~
	sudo gpg --keyserver hkp://keys.gnupg.net --recv-keys 409B6B1796C275462A1703113804BB82D39DC0E3
	sudo curl -sSL https://get.rvm.io | bash
	sudo rvm install 2.1.0
	sudo rvm use 2.1.0 --default
	sudo git clone https://github.com/RLOpenCatalyst/vmware /opt/vmware
	cd /opt/vmware
	sudo gem install bundler
	sudo bundle
	sudo chmod +x startup.sh
	sh startup.sh
}

if [ "$OS" == "ubuntu" ] || [ "$OS" == "debian" ]
then
        #Install the MongoDB
        mongo1=$(dpkg-query -l | grep mongodb-org | awk '{print $2}' | head -1)
        if [ $mongo1 -eq "mongodb-org"];
        then
                echo "MongoDB is already installed..."
        else
                sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv EA312927
                echo "deb http://repo.mongodb.org/apt/ubuntu trusty/mongodb-org/3.2 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-3.2.list
                sudo apt-get update
                sudo apt-get install -y mongodb-org
        fi

        #Install dependant packages
        sudo apt-get install -y g++ make libkrb5-dev curl git

        #Install the Nodejs
        node1=$(dpkg-query -l | grep nodejs | awk '{print $2}')
        if [ "$node1" == "nodejs" ]
        then
                echo "nodejs is already installed"
        else
                curl -sL https://deb.nodesource.com/setup_4.x | sudo -E bash -
                sudo apt-get update
                sudo apt-get install -y nodejs
                sudo npm install npm -g
                sudo npm install -g forever
                sudo npm install -g kerberos
        fi

	#install chef-client
        chef1=$(dpkg-query -l | grep chef | awk '{print $2}'|head -1)
        if [ "$chef1" == "chef"]
        then
                echo "Chef-Client has been installed"
        else
                sudo curl -L https://www.opscode.com/chef/install.sh | sudo bash
        fi


        #Deploy The Catalyst
        catalystdeploy
	puppet
	vmware
fi

if [ "$OS" == "centos" ] || [ "$OS" == "redhat" ]
then
    sudo cat << EOF >> /etc/yum.repos.d/mongodb.repo
[MongoDB]
name=MongoDB Repository
baseurl=http://downloads-distro.mongodb.org/repo/redhat/os/x86_64/
gpgcheck=0
enabled=1
EOF

    #cp mongodb.repo /etc/yum.repos.d/mongodb.repo
    sudo yum update -y
    sudo yum install -y mongodb-org

    if [ -d "/data/db" ]
    then
        echo "Directory is already available"
    else
        sudo mkdir -p /data/db
    fi

    sudo service mongod start

    #Install Git and dependant packages
    sudo yum install -y git gcc-c++ gcc-g++

    #Install the Node, npm and npm modules
    sudo rpm -Uvh https://rpm.nodesource.com/pub_4.x/el/7/x86_64/nodesource-release-el7-1.noarch.rpm
    sudo yum install -y nodejs
    sudo npm install -y npm -g
    sudo npm install -g forever
    sudo npm install -g kerberos

    #Install the Chef-Client
    sudo curl -L https://www.opscode.com/chef/install.sh | sudo bash

    #Deploy The Catalyst
    catalystdeploy
    puppet
    vmware

fi