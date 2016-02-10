#!/bin/bash

#Get the value from the Operating System
OS=$(awk '/DISTRIB_ID=/' /etc/*-release | sed 's/DISTRIB_ID=//' | tr '[:upper:]' '[:lower:]')
PWD=$(pwd)
PWD1=$(realpath ..)

if [ -z "$OS" ];
then
    OS=$(awk '{print $1}' /etc/redhat-release | tr '[:upper:]' '[:lower:]')
fi

seeddataloader()
{
        echo "Provide the URL for the Chef Server"
        read chef_url
        echo "Path for the User pem file"
        read user_pem
        userpemfile=$(echo $user_pem | rev |cut -d/ -f1 | rev)
        nodename=$(echo $userpemfile |cut -d. -f1)
        echo "Path for the Organization pem file"
        read org_pem
        orgpemfile=$(echo $org_pem | rev |cut -d/ -f1 | rev)
        clientname=$(echo $orgpemfile |cut -d. -f1)
        sudo sed -i "s/abc/$nodename/g" knife.rb
        sudo sed -i "s/def/$clientname/g" knife.rb
        sudo sed -i "s|ghi|$chef_url|g" knife.rb

        sudo cp $user_pem $PWD/../seeddata/Newfiles/
        sudo cp $org_pem $PWD/../seeddata/Newfiles/
        sudo cp knife.rb $PWD/../seeddata/Newfiles/knife.rb
	
	sudo sed -i "s|ghi|$chef_url|g" $PWD/../seeddata/EvalSetup.json
	sudo sed -i "s/abc/$nodename/g" $PWD/../seeddata/EvalSetup.json
	sudo sed -i "s/aaac/$userpemfile/g" $PWD/../seeddata/EvalSetup.json
	sudo sed -i "s/aaad/$orgpemfile/g" $PWD/../seeddata/EvalSetup.json
	sudo sed -i "s|aaap|$PWD1|g" $PWD/../seeddata/EvalSetup.json
		
        sudo npm install --prefix $PWD../seeddata/
        sudo node $PWD/../seeddata/seedData.js $PWD/../seeddata/EvalSetup.json
}



catalystdeploy()
{
    #Install the Catalyst
    sleep 5
    cd $PWD/../server
    sudo npm install
    sudo node install --seed-data
    sudo forever start app.js
}

#chefserver()
#{
#    sudo chef-server-ctl reconfigure
#    sudo chef-server-ctl user-create catadmin cat admin cat@example.com 'cat@123' --filename /opt/catadmin.pem
#    sudo chef-server-ctl org-create phoenix "Phoenix, Inc." --association_user catadmin --filename /opt/phoenix-validator.pem
#}

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
                sudo apt-get install -y mongodb-org curl git
        fi

        #Install dependant packages
        sudo apt-get install g++ make libkrb5-dev

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
		
	#install the git and chef-client
        chef1=$(dpkg-query -l | grep chef | awk '{print $2}'|head -1)
        if [ "$chef1" == "chef"]
        then
                echo "Chef-Client has been installed"
        else
                sudo curl -L https://www.opscode.com/chef/install.sh | sudo bash
        fi

        #Install the Chef-Server
        wget https://packagecloud.io/chef/stable/packages/ubuntu/trusty/chef-server-core_12.3.1-1_amd64.deb/download
        sudo dpkg -i download
        echo "$ip	$name" >> /etc/hosts
        /etc/init.d/networking restart
        chefserver

        #Deploy The Catalyst
        catalystdeploy
	echo "Do you want to provide the information of Your Chef Server and load the seed data"
	read input
	if [ $input == "yes" ]
	then
		seeddataloader
	else
		echo "Please configure the Chef Server details manually once you logged in to the Catalyst"
	fi	

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
    #cat /etc/mongod.conf | grep smallfiles
    #if ["$?" = "0"]
    #then
    #    echo "Small File is already enabled"
    #else
    #    echo "smallfiles = true" >> /etc/mongod.conf
    #fi
    sudo service mongod start

    #Install Git and dependant packages
    sudo yum install -y git gcc-c++ gcc-g++

    #Install the Node and npm
    sudo rpm -Uvh https://rpm.nodesource.com/pub_4.x/el/7/x86_64/nodesource-release-el7-1.noarch.rpm
    sudo yum install -y nodejs
    sudo npm install -y npm -g
    sudo npm install -g forever
    sudo npm install -g kerberos

    #Install the Chef-Client and Chef Server
    sudo curl -L https://www.opscode.com/chef/install.sh | sudo bash
  
    #Deploy The Catalyst
    catalystdeploy
    echo "Do you want to provide the information of Your Chef Server and load the seed data:"
    read input
    if [ $input == "yes" ]
    then
    	seeddataloader
    else
        echo "Please configure the Chef Server details manually once you logged in to the Catalyst"
    fi

fi

