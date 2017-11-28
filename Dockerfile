FROM matthewma7/girder-2.4.0-ubuntu-16.04
RUN add-apt-repository ppa:ubuntugis/ppa
RUN apt update
RUN apt install -y python-gdal libgdal-dev
ENV CPLUS_INCLUDE_PATH=/usr/include/gdal
ENV C_INCLUDE_PATH=/usr/include/gdal

ADD minerva /girder/plugins/minerva
ADD database_assetstore /girder/plugins/database_assetstore
ADD girder_ktile /girder/plugins/girder_ktile
ADD ansible/bsve /girder/plugins/bsve
ADD gaia /girder/gaia
ADD gaia_minerva /girder/plugins/gaia_minerva

RUN girder-install plugin /girder/plugins/database_assetstore
RUN girder-install plugin /girder/plugins/girder_ktile
RUN girder-install plugin /girder/plugins/minerva
RUN girder-install plugin /girder/plugins/gaia_minerva
RUN pip install -e /girder/gaia -r /girder/gaia/requirements.txt

RUN rm -fr /girder/plugins/*/.git /girder/gaia/*/.git
RUN girder-install web --dev --plugins minerva,gaia_minerva,bsve
