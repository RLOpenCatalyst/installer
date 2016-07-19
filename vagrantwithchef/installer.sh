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
    cd $PWD
    sudo git clone https://github.com/RLOpenCatalyst/core.git
    sudo mv core rlcatalyst
    cd rlcatalyst/client/cat3
    sudo npm install --production
    sudo npm run-script build-prod
    cd ../../server
    sudo npm install
    sudo node install --seed-data 
    sudo forever start app/app.js
}

puppet() {
    sudo git clone https://github.com/RLOpenCatalyst/puppet-cookbook /opt/rlcatalyst/server/puppet-cookbook
}

vmware() {
     cd /opt
     sudo gpg --keyserver hkp://keys.gnupg.net --recv-keys 409B6B1796C275462A1703113804BB82D39DC0E3
     sudo curl -sSL https://get.rvm.io | bash
     sudo /usr/local/rvm/bin/rvm install 2.1.4
     sudo unlink /usr/bin/ruby
     sudo ln -s  /usr/local/rvm/rubies/ruby-2.1.4/bin/ruby /usr/bin/ruby
     sudo git clone https://github.com/RLOpenCatalyst/vmware /opt/vmware
     cd /opt/vmware
     sudo /usr/local/rvm/rubies/ruby-2.1.4/bin/gem install bundler
     sudo /opt/vmware/bin/bundle
     sudo chmod +x startup.sh
     /bin/bash startup.sh
     sudo ln -s /usr/local/rvm/rubies/ruby-2.1.4/bin/gem /usr/bin/gem
     sudo gem install sass
     sudo ln -s /usr/local/rvm/rubies/ruby-2.1.4/bin/sass /usr/bin/sass
     sudo sed -i 's/ruby_executable_hooks/ruby/g' /usr/bin/sass
     cd -
}

nodejs() {
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
        catalystdeploy
        puppet
        seeddataloader
        echo "Installation of Catalyst has been Completed. please login to http://<vagrantip>/<hostip>:vagrantport/hostport"
fi
