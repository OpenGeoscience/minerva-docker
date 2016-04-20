## minerva-docker

This repo provides Docker files to run [Minerva](https://github.com/Kitware/minerva) inside a Docker container.  Two containers actually, one for Minerva and one for Mongo.

## Up and running

These instructions were tested on Ubuntu 14.04 with `docker` version 1.11.0 and `docker-compose` version 1.7.0.

Clone this repo.  Either initialize the git submodules for Minerva and Romanesco after cloning like `git submodule update --init`, or else clone recursive like the below instructions.

    git clone https://github.com/OpenGeoscience/minerva-docker.git --recursive
    cd minerva-docker
    docker-compose build
    docker-compose up

#### License

Copyright 2016 Kitware Inc.

Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
