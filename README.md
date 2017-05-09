## minerva-docker

This repo provides Docker and Ansible-Container files to run [Minerva](https://github.com/Kitware/minerva) inside a Docker container.  Two containers actually, one for Minerva and one for Mongo.

## Up and running

These instructions were tested on Ubuntu 14.04 with `docker` version 1.11.0 and `docker-compose` version 1.7.0.

Clone this repo.  Either initialize the git submodules for Minerva and Romanesco after cloning like `git submodule update --init`, or else clone recursive like the below instructions.

    git clone https://github.com/OpenGeoscience/minerva-docker.git --recursive
    cd minerva-docker

## Option 1: Deploy with docker-compose
Set the three BSVE environment variables in docker-compose.yml to the correct values for a
set of working BSVE credentials.  This will be the account that Minerva uses to connect with
the BSVE.

    docker-compose build
    docker-compose up

Now that Minerva is running, load the page.  At this point you can register an admin user with Girder, the
software that powers Minerva.  Now that you are logged in with the admin user, go to the Admin console,
then the Plugins page, enable the Minerva plugin and restart the server.  Once the server is restarted, return to the root page in the browser address bar and refresh the page.  You should see the Minerva application at this point, and you will still be logged in as the admin user you created for Girder.


## Option 2: Deploy with ansible-container
Set the three Girder environment variables in ansible/variables.yml to the correct values for a
set of working Girder credentials.  This will be the account that Minerva uses to connect with
Girder.

    pip install ansible-container==0.3.0
    export DOCKER_CLIENT_TIMEOUT=600
    ansible-container build
    ansible-container run

Now that Minerva is running, load the page.



#### License

Copyright 2016 Kitware Inc.

Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
