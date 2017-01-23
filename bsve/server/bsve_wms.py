from base64 import b64encode
import json
from urllib import quote

from girder.api import access
from girder.api.describe import Description
from girder.plugins.minerva.rest.dataset import Dataset
from girder.plugins.minerva.utility.cookie import getExtraHeaders


from . import logged_requests as requests
from .bsve_wms_styles import BsveWmsStyle
from .cookie import bsveRoot


class BsveWmsDataset(Dataset):

    def __init__(self):
        self.resourceName = 'bsve_datasets_wms'
        self.route('POST', (), self.createBsveSource)

    def _get_category(self, dataset):
        """Get the category from available layer information"""

        category = [k for k in dataset['keywords']
                    if k.startswith('category:')]
        if not category:
            return "Other"
        else:
            return category[0].split(":")[1]

    @access.user
    def createBsveSource(self, params):
        """ Hits the bsve urls """

        # Bsve geoserver (wms get capabilities url)
        root = bsveRoot()
        wms = root + "/data/v2/sources/geotiles/meta/list"

        resp = requests.get(wms, headers=getExtraHeaders())
        data = json.loads(resp.text)

        layers = []

        for d in data['tiles']:
            wms_params = {}
            wms_params['type_name'] = d['name']
            wms_params['name'] = d['styles'][0]['title']
            wms_params['abstract'] = d['abstract']
            wms_params['source'] = {'layer_source': 'Reference',
                                    'source_type': 'wms'}
            wms_params['geo_render'] = {'type': 'wms'}
            wms_params['category'] = self._get_category(d)
            layer_type = 'raster' if 'WCS' in d['keywords'] else 'vector'
            dataset = self.createBsveDataset(wms_params, layer_type)
            layers.append(dataset)

        return layers

    @access.user
    def createBsveDataset(self, params, layer_type):
        typeName = params['type_name']

        headers = getExtraHeaders()

        try:
            layer_info = BsveWmsStyle(typeName).get_layer_info(layer_type)
        except TypeError:
            layer_info = ""

        # TODO: Add the legend url here once it is
        # ready on bsve side
        self.requireParams(('name'), params)
        name = params['name']

        params['layer_info'] = layer_info
        params['adapter'] = 'bsve'

        root = bsveRoot()
        legend_url = root + "/data/v2/sources/geotiles/data/result?"
        legend_qs = quote("$filter=name eq {} and request eq getlegendgraphic and height eq 20 and width eq 20".format(typeName), safe='= ').replace(' ', '+')

        r = requests.get(legend_url + legend_qs, headers=headers)
        legend = b64encode(r.content)
        params['legend'] = legend
        dataset = self.constructDataset(name, params)
        return dataset

    createBsveSource.description = (
        Description('Create bsve datasets from bsve geoserver')
    )
