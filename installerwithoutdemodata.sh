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

UID=$(id -u)
USER=$(id -u -n)

catalystdeploy()
{
    #Install the Catalyst
    cd ~
    if [ $UID -eq 0 ];
    then
        git clone https://github.com/RLOpenCatalyst/core.git
        mv core rlcatalyst
        cd rlcatalyst/client/cat3
        npm install --production
        npm run-script build-prod
        cd ../../server
        npm install
        node install --seed-data 
        forever start app/app.js
    else
        sudo git clone https://github.com/RLOpenCatalyst/core.git
        sudo mv core rlcatalyst
	    cd rlcatalyst/client/cat3
        sudo npm install --production
        sudo npm run-script build-prod
        cd ../../server
        sudo npm install
        sudo node install --seed-data 
        sudo forever start app/app.js
    fi
}

vmware() {
        if [ $UID -eq 0 ];
        then    
            gpg --keyserver hkp://keys.gnupg.net --recv-keys 409B6B1796C275462A1703113804BB82D39DC0E3
            curl -sSL https://get.rvm.io | bash
            /usr/local/rvm/bin/rvm install 2.1.4
            ln -s  /usr/local/rvm/rubies/ruby-2.1.4/bin/ruby /usr/bin/ruby
            /usr/local/rvm/bin/rvm reload
            /usr/local/rvm/bin/rvm use 2.1.4 --default
            git clone https://github.com/RLOpenCatalyst/vmware /opt/vmware
            cd /opt/vmware
            /usr/local/rvm/rubies/ruby-2.1.4/bin/gem install bundler
            /opt/vmware/bin/bundle
            chmod +x startup.sh
            /bin/bash startup.sh
            ln -s /usr/local/rvm/rubies/ruby-2.1.4/bin/gem /usr/bin/gem
            gem install sass
            ln -s /usr/local/rvm/rubies/ruby-2.1.4/bin/sass /usr/bin/sass
            sed -i 's/ruby_executable_hooks/ruby/g' /usr/bin/sass
        else      
            sudo gpg --keyserver hkp://keys.gnupg.net --recv-keys 409B6B1796C275462A1703113804BB82D39DC0E3
            sudo curl -sSL https://get.rvm.io | bash
            sudo source /home/ubuntu/.rvm/bin/rvm
            sudo /home/$USER/.rvm/bin/rvm install 2.1.4
            sudo ln -s  /home/$USER/.rvm/rubies/ruby-2.1.4/bin/ruby /usr/bin/ruby
            sudo /home/$USER/.rvm/bin/rvm use 2.1.4 --default
            sudo git clone https://github.com/RLOpenCatalyst/vmware /opt/vmware
            cd /opt/vmware
            sudo /home/$USER/.rvm/rubies/ruby-2.1.4/bin/gem install bundler
            sudo /opt/vmware/bin/bundle
            sudo chmod +x startup.sh
            /bin/bash startup.sh
		    sudo ln -s /home/$USER/.rvm/rubies/ruby-2.1.4/bin/gem /usr/bin/gem
		    sudo gem install sass
            sudo ln -s /home/$USER/.rvm/rubies/ruby-2.1.4/bin/sass /usr/bin/sass
            sudo sed -i 's/ruby_executable_hooks/ruby/g' /usr/bin/sass
        fi
}   

nodejs() {
        if [ $UID -eq 0 ];
        then    
            cd /opt
            wget https://nodejs.org/dist/v4.4.4/node-v4.4.4-linux-x64.tar.gz
            tar zxvf node-v4.4.4-linux-x64.tar.gz
            mv node-v4.4.4-linux-x64 node
            ln -s /opt/node/bin/node /usr/bin/node
            ln -s /opt/node/bin/npm /usr/bin/npm
            npm install -g npm@3.5.2
            npm install -g forever
            npm install -g kerberos
            npm install -g grunt-cli
            ln -s /opt/node/bin/forever /usr/bin/forever
            ln -s /opt/node/bin/grunt /usr/bin/grunt
        else
            cd /opt
            sudo wget https://nodejs.org/dist/v4.4.4/node-v4.4.4-linux-x64.tar.gz
            sudo tar zxvf node-v4.4.4-linux-x64.tar.gz
            sudo mv node-v4.4.4-linux-x64 node
            sudo ln -s /opt/node/bin/node /usr/bin/node
            sudo ln -s /opt/node/bin/npm /usr/bin/npm
            sudo npm install -g npm@3.5.2
            sudo npm install -g forever
            sudo npm install -g kerberos
            sudo npm install -g grunt-cli
            sudo ln -s /opt/node/bin/forever /usr/bin/forever
            sudo ln -s /opt/node/bin/grunt /usr/bin/grunt
        fi
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
        nodejs

        #install chef-client
        chef1=$(dpkg-query -l | grep chef | awk '{print $2}'|head -1)
        if [ "$chef1" == "chef"]
        then
                echo "Chef-Client has been installed"
        else
                sudo curl -L https://www.opscode.com/chef/install.sh | sudo bash
                sudo /opt/chef/embedded/bin/gem install knife-windows
        fi


        #Deploy Catalyst
		vmware
        catalystdeploy $1
        echo "Installation of Catalyst has been Completed. please login to http://<vagrantip>/<hostip>:vagrantport/hostport"
fi

if [ "$OS" == "centos" ] || [ "$OS" == "redhat" ]
then
    sudo cat << EOF >> /etc/yum.repos.d/mongodb.repo
[MongoDB]
name=MongoDB Repository
baseurl=http://repo.mongodb.org/yum/redhat/6Server/mongodb-org/3.2/x86_64/
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
    nodejs

    #Install the Chef-Client
    sudo curl -L https://www.opscode.com/chef/install.sh | sudo bash
    sudo /opt/chef/embedded/bin/gem install knife-windows

    #Deploy The Catalyst
    vmware
    catalystdeploy
    echo "Installation of Catalyst has been Completed. please login to http://<vagrantip>/<hostip>:vagrantport/hostport"
fi
