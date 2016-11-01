from girder import events
import bsve_wms

from auth import Authentication
from test import TestEndpoint


def get_layer_info(event):
    event.preventDefault()
    event.addResponse('BSVE layer info')


def load(info):
    urls = ['//developer.bsvecosystem.net/sdk/api/BSVE.API.js']
    events.trigger('minerva.additional_js_urls', urls)

    info['apiRoot'].bsve = Authentication()

    # Add an endpoint for bsve wms dataset
    info['apiRoot'].bsve_datasets_wms = bsve_wms.BsveWmsDataset()

    # Add test endpoints
    info['apiRoot'].test = TestEndpoint()

    events.bind('minerva.get_layer_info', 'bsve', get_layer_info)
