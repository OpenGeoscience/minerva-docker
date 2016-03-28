FROM girder/girder

ADD romanesco /girder/plugins/romanesco
RUN pip install -e /girder/plugins/romanesco

ADD minerva /girder/plugins/minerva
RUN pip install -r /girder/plugins/minerva/requirements.txt

RUN rm -fr /girder/plugins/*/.git
RUN npm install --only=prod --unsafe-perm
