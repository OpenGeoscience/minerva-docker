from girder import events

def load(info):
    urls = ['//developer.bsvecosystem.net/sdk/api/BSVE.API.js']
    events.trigger('minerva.additional_js_urls', urls)
