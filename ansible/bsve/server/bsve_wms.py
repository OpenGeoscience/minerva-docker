from base64 import b64encode
import json
from urllib import quote

from girder.api import access
from girder.api.describe import Description
from girder.plugins.minerva.utility.minerva_utility import findDatasetFolder
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

    def _get_metadata(self, dataset):
        """Get the layer metadata if exist"""

        metadata = [k for k in dataset['keywords']
                    if k.startswith('layer_info:')]
        if not metadata:
            return ""
        else:
            return json.loads(metadata[0].split("layer_info:")[1])

    @access.user
    def createBsveSource(self, params):
        """ Hits the bsve urls """

        # Bsve geoserver (wms get capabilities url)
        root = bsveRoot()
        wms = root + "/data/v2/sources/geotiles/meta/list"
        user = self.getCurrentUser()

        resp = requests.get(wms, headers=getExtraHeaders())
        data = json.loads(resp.text)

        existingLayers = self.getLayers(user)
        newLayers = set()

        for d in data['tiles']:
            typeName = d['name']
            newLayers.add(typeName)

            # For now skip updating layers that always exist.
            # When we have a reliable ingestion time stamp,
            # we should check the creation date and update
            # if the ingestion date is later.
            if typeName in existingLayers:
                continue

            wms_params = {}
            wms_params['type_name'] = typeName
            wms_params['name'] = d.get('title') or d['styles'][0]['title']
            wms_params['abstract'] = d['abstract']
            wms_params['source'] = {'layer_source': 'Reference',
                                    'source_type': 'wms'}
            wms_params['geo_render'] = {'type': 'wms'}
            wms_params['category'] = self._get_category(d)
            wms_params['metadata'] = self._get_metadata(d)
            layer_type = 'raster' if 'WCS' in d['keywords'] else 'vector'
            self.createBsveDataset(wms_params, layer_type)

        # delete layers that no longer exist on the server
        for typeName in existingLayers:
            if typeName not in newLayers:
                item = existingLayers[typeName]
                self.model('item').remove(item)

        # get all the bsve layers to return
        layers = self.getLayers(user)

        return list(layers.values())

    @access.user
    def createBsveDataset(self, params, layer_type):
        typeName = params['type_name']

        headers = getExtraHeaders()

        try:
            if params['metadata']:
                layer_info = params['metadata']
            else:
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

    def getLayers(self, user):
        folder = findDatasetFolder(
            user, user
        )
        if not folder:
            return []

        items = self.model('folder').childItems(folder)

        layers = {}
        for item in items:
            adapter = item.get('meta', {}).get('minerva', {}).get('adapter')
            name = item.get('meta', {}).get('minerva', {}).get('type_name')
            if adapter == 'bsve':

                # delete duplicates if they exist
                if name in layers:
                    self.model('item').remove(item)
                else:
                    layers[name] = item

        return layers