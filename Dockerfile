FROM matthewma7/girder-2.3.0-ubuntu-16.04
RUN add-apt-repository ppa:ubuntugis/ppa
RUN apt update
RUN apt install -y python-gdal libgdal-dev
ENV CPLUS_INCLUDE_PATH=/usr/include/gdal
ENV C_INCLUDE_PATH=/usr/include/gdal

ADD minerva /girder/plugins/minerva
ADD girder_db_items /girder/plugins/database_assetstore
ADD ansible/bsve /girder/plugins/bsve
ADD gaia /girder/gaia
ADD gaia_minerva /girder/plugins/gaia_minerva

RUN pip install -r /girder/plugins/minerva/requirements.txt
RUN pip install -r /girder/plugins/database_assetstore/requirements.txt
RUN pip install -e /girder/gaia -r /girder/gaia/requirements.txt
RUN pip install -e /girder/plugins/gaia_minerva

RUN rm -fr /girder/plugins/*/.git /girder/gaia/*/.git
RUN girder-install web --dev --plugins minerva,gaia_minerva,bsve
