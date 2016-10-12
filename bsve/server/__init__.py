from girder import events
import bsve_wms

from auth import Authentication


def load(info):
    urls = ['//developer.bsvecosystem.net/sdk/api/BSVE.API.js']
    events.trigger('minerva.additional_js_urls', urls)

    info['apiRoot'].bsve = Authentication()

    # Add an endpoint for bsve wms dataset
    info['apiRoot'].bsve_datasets_wms = bsve_wms.BsveWmsDataset()
