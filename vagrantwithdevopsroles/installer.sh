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


java() {
	wget --no-check-certificate --no-cookies --header "Cookie: oraclelicense=accept-securebackup-cookie" http://download.oracle.com/otn-pub/java/jdk/7u79-b15/jdk-7u79-linux-x64.tar.gz
	mkdir /usr/local/java; tar zxvf jdk-7u79-linux-x64.tar.gz -C /usr/local/java --strip 1
}

nexus() {

	cd /opt
	sudo wget http://download.sonatype.com/nexus/oss/nexus-2.12.0-01-bundle.tar.gz
	sudo tar zxf nexus-2.12.0-01-bundle.tar.gz
	sudo rm nexus-2.12.0-01-bundle.tar.gz
	sudo cp /vagrant/nexus /etc/init.d/
	sudo chown -R vagrant:vagrant /opt/nex* /opt/son*
  sleep 10
	sudo /etc/init.d/nexus start
}

jenkins() {

  	wget -q -O - https://jenkins-ci.org/debian/jenkins-ci.org.key | sudo apt-key add -
    	sudo sh -c 'echo deb http://pkg.jenkins-ci.org/debian binary/ > /etc/apt/sources.list.d/jenkins.list'
      	sudo apt-get update
        sudo apt-get install -y jenkins
	sudo /etc/init.d/jenkins restart
}

chefserver() {

	cd /tmp
	wget https://packagecloud.io/chef/stable/packages/ubuntu/trusty/chef-server-core_12.3.1-1_amd64.deb/download
	sudo dpkg -i download
	sudo chef-server-ctl reconfigure
	sudo chef-server-ctl user-create catadmin cat admin cat@example.com 'cat@123' --filename /opt/catadmin.pem
	sudo chef-server-ctl org-create phoenix "Phoenix, Inc." --association_user catadmin --filename /opt/phoenix-validator.pem
	sudo cp /opt/catadmin.pem /vagrant/seeddata/Newfiles/catadmin.pem
	sudo cp /opt/phoenix-validator.pem /vagrant/seeddata/Newfiles/phoenix-validator.pem
	cd /vagrant/seeddata
	sudp npm install
	sudo node seedData.js EvalSetup.json
	sudo /opt/chef/embedded/bin/gem install knife-windows
}

cookbookupload() {

        cd /opt/rlcatalyst/server/catdata/catalyst/chef-repos/46d1da9a-d927-41dc-8e9e-7e926d927537/catadmin/.chef/
        sudo git clone https://github.com/RLOpenCatalyst/automationlibrary.git
        sudo /opt/chef/embedded/bin/gem install berkshelf
        sudo ln -s /opt/chef/embedded/bin/berks /usr/bin/berks
        cd automationlibrary
        sudo ruby cookbooks_upload.rb
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
	sudo ln -s /usr/local/rvm/rubies/ruby-2.1.0/bin/rails /usr/bin/rails
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
	chefserver
	cookbookupload
        #seeddataloader
	java
	nexus
	jenkins
        sudo service nexus start	
        echo "Installation of Catalyst has been Completed. please login to http://<vagrantip>/<hostip>:vagrantport/hostport"
fi
