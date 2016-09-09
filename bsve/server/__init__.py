from girder import events

from auth import Authentication


def load(info):
    urls = ['//developer.bsvecosystem.net/sdk/api/BSVE.API.js']
    events.trigger('minerva.additional_js_urls', urls)

    info['apiRoot'].bsve = Authentication()
