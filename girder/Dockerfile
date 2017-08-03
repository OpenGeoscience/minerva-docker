FROM ubuntu:16.04
MAINTAINER Kitware, Inc. <kitware@kitware.com>

EXPOSE 8080

RUN apt-get update
RUN apt-get install -qy curl
RUN curl -sL https://deb.nodesource.com/setup_6.x | bash -
RUN apt-get install -qy nodejs
RUN nodejs --version
RUN node --version
RUN npm --version

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
    libsasl2-dev \
    libxml2-dev \
    libxslt1-dev \
    libjpeg8-dev \
    zlib1g-dev \
    python-pip \
    libldap2-dev

RUN git clone https://github.com/girder/girder.git && cd girder && git checkout 2.3.0 && rm -fr .git
WORKDIR /girder

RUN pip install -e .[plugins]

RUN npm install -g grunt-cli && npm cache clear
RUN npm install --production --unsafe-perm && npm cache clear
ENTRYPOINT ["python", "-m", "girder"]