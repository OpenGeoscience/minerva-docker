FROM girder/girder:1.7.0
RUN apt update
RUN apt install -y python-gdal libgdal-dev
ENV CPLUS_INCLUDE_PATH=/usr/include/gdal
ENV C_INCLUDE_PATH=/usr/include/gdal

ADD minerva /girder/plugins/minerva
ADD bsve /girder/plugins/bsve
ADD gaia /girder/plugins/gaia
RUN pip install -r /girder/plugins/minerva/requirements.txt
RUN pip install -r /girder/plugins/gaia/requirements.txt

RUN rm -fr /girder/plugins/*/.git
RUN grunt --debug-js=true init default
