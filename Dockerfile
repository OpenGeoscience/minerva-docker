FROM girder/girder:1.7.0

ADD minerva /girder/plugins/minerva
ADD bsve /girder/plugins/bsve
RUN pip install -r /girder/plugins/minerva/requirements.txt

RUN rm -fr /girder/plugins/*/.git
RUN npm install --only=prod --unsafe-perm
