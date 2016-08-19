FROM girder/girder

ADD minerva /girder/plugins/minerva
ADD bsve /girder/plugins/minerva/bsve
RUN pip install -r /girder/plugins/minerva/requirements.txt

RUN rm -fr /girder/plugins/*/.git
RUN npm install --only=prod --unsafe-perm
