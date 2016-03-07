#!/bin/bash

#Get the value from the Operating System
echo "Get the value from the Operating System"
OS=$(awk '/DISTRIB_ID=/' /etc/*-release | sed 's/DISTRIB_ID=//' | tr '[:upper:]' '[:lower:]')
PWD=$(pwd)
sleep 2
if [ -z "$OS" ];
then
    OS=$(awk '{print $1}' /etc/redhat-release | tr '[:upper:]' '[:lower:]')
        echo $OS
fi
export PATH="/usr/local/rvm/rubies/ruby-2.1.0/bin:$PATH"

seeddataloader() {
                
		cd /vagrant/seeddata/
                npm install
                /usr/bin/node /vagrant/seeddata/seedData.js  /vagrant/seeddata/EvalSetup.json > /tmp/seeddata.log
}

catalystdeploy()
{
    #Install the Catalyst
    cd ~
    sudo git clone https://github.com/RLOpenCatalyst/core.git /opt/core
    sudo mv /opt/core /opt/rlcatalyst
    cd /opt/rlcatalyst/server
    sudo npm install
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
        sudo /usr/local/rvm/bin/rvm install 2.1.0
	sudo unlink /usr/bin/ruby
        sudo ln -s  /usr/local/rvm/rubies/ruby-2.1.0/bin/ruby /usr/bin/ruby
        sudo git clone https://github.com/RLOpenCatalyst/vmware /opt/vmware
        cd /opt/vmware
        sudo /usr/local/rvm/rubies/ruby-2.1.0/bin/gem install bundler
        sudo /opt/vmware/bin/bundle
        sudo chmod +x startup.sh
        sudo /bin/bash startup.sh > /dev/null 2&>1
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

        #Install dependency packages
        sudo apt-get install -y g++ make libkrb5-dev curl git

        #Install the Nodejs
        cd /opt
        wget https://nodejs.org/dist/v4.2.2/node-v4.2.2-linux-x64.tar.gz
        sudo tar zxvf node-v4.2.2-linux-x64.tar.gz
        sudo mv node-v4.2.2-linux-x64 node
        sudo ln -s /opt/node/bin/node /usr/bin/node
        sudo ln -s /opt/node/bin/npm /usr/bin/npm
        sudo npm install -g npm@3.4.0
        sudo npm install -g forever
	sudo ln -s /opt/node/bin/forever /usr/bin/forever
        sudo npm install -g kerberos


        #install chef-client
        chef1=$(dpkg-query -l | grep chef | awk '{print $2}'|head -1)
        if [ "$chef1" == "chef"]
        then
                echo "Chef-Client has been installed"
        else
                sudo curl -L https://www.opscode.com/chef/install.sh | sudo bash
        fi


        #Deploy Catalyst
        catalystdeploy
        puppet
        vmware
        seeddataloader
        echo "Installation of Catalyst has been Completed. please login to http://<vagrantip>/<hostip>:vagrantport/hostport"
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
        cd /opt
        wget https://nodejs.org/dist/v4.2.2/node-v4.2.2-linux-x64.tar.gz
        tar zxvf node-v4.2.2-linux-x64.tar.gz
        mv node-v4.2.2-linux-x64 node
        ln -s /opt/node/bin/node /usr/bin/node
        ln -s /opt/node/bin/npm /usr/bin/npm
        sudo npm install -g npm@3.4.0
        sudo npm install -g forever
        sudo npm install -g kerberos

    #Install the Chef-Client
    sudo curl -L https://www.opscode.com/chef/install.sh | sudo bash

    #Deploy The Catalyst
    catalystdeploy
    puppet
    #vmware
    seeddataloader
    echo "Installation of Catalyst has been Completed. please login to http://<vagrantip>/<hostip>:vagrantport/hostport"
fi
