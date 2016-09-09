#!/bin/bash
docker stop minervadocker_minerva_1
docker rm minervadocker_minerva_1
docker rmi minervadocker_minerva
/usr/local/bin/docker-compose up -d
