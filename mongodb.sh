#!/bin/bash

mongodb() {
      sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv EA312927
      echo "deb http://repo.mongodb.org/apt/ubuntu trusty/mongodb-org/3.2 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-3.2.list
      sudo apt-get update
      sudo apt-get install -y mongodb-org
}

mongodb
sed -i 's/127.0.0.1/0.0.0.0/g' /etc/mongod.conf
service mongod restart

