from girder import events
from . import bsve_wms
from .feature import callBsveFeatureInfo
from .twofishes import autocomplete, get_geojson

from .auth import Authentication
from .test import TestEndpoint


def get_layer_info(event):
    # if a baseUrl is present, this is not a bsve data source
    if event.info.get('baseUrl'):
        return

    event.preventDefault()
    response = callBsveFeatureInfo(event.info['params'],
                                   event.info['layers'])
    event.addResponse(response)

def get_autocomplete_result(event):
    if 'bsve' not in event.info['twofishes']:
        return

    event.preventDefault()
    response = autocomplete(event.info)
    event.addResponse(response)

def get_geojson_result(event):
    if 'bsve' not in event.info['twofishes']:
        return

    event.preventDefault()
    response = get_geojson(event.info)
    event.addResponse(response)


def load(info):

    urls = ['//dev-developer.bsvecosystem.net/sdk/api/BSVE.API.js']
    events.trigger('minerva.additional_js_urls', urls)

    info['apiRoot'].bsve = Authentication()

    # Add an endpoint for bsve wms dataset
    info['apiRoot'].bsve_datasets_wms = bsve_wms.BsveWmsDataset()

    # Add test endpoints
    info['apiRoot'].test = TestEndpoint()

    events.bind('minerva.get_layer_info', 'bsve', get_layer_info)
    events.bind('minerva.autocomplete', 'bsve', get_autocomplete_result)
    events.bind('minerva.get_geojson', 'bsve', get_geojson_result)
