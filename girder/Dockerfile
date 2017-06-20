FROM ubuntu:16.04
MAINTAINER Kitware, Inc. <kitware@kitware.com>

EXPOSE 8080

RUN apt-get update && apt-get install -qy software-properties-common python-software-properties && \
  apt-get update && apt-get install -qy \
    build-essential \
    git \
    libffi-dev \
    libpython-dev \
    curl \
    openssl \
    libcurl4-openssl-dev \
    libssl-dev \
    libxml2-dev \
    libxslt1-dev \
    libjpeg8-dev \
    zlib1g-dev \
    python-pip \
    nodejs-legacy \
    npm

RUN git clone https://github.com/girder/girder.git && cd girder && git checkout v1.7.1 && rm -fr .git
WORKDIR /girder

RUN pip install -e .[plugins]

RUN npm install -g grunt-cli && npm cache clear
RUN npm install --production --unsafe-perm && npm cache clear
ENTRYPOINT ["python", "-m", "girder"]
