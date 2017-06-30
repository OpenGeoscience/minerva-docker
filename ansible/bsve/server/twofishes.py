from girder.plugins.minerva.utility.cookie import getExtraHeaders
from girder.plugins.minerva.twofishes import Twofishes
from . import logged_requests as requests
from .cookie import bsveRoot


def autocomplete(params):
    """Call twofishes instance that runs inside bsve for autocomplete"""

    twofishesUrl = bsveRoot() + "/geocoder"
    headers = getExtraHeaders()

    req = requests.get(twofishesUrl,
                       params={'autocomplete': True,
                               'query': params['location'],
                               'maxInterpretations': 10,
                               'autocompleteBias': None},
                       headers=headers)

    return req.content

def get_geojson(params):
    """Call twofishes instance that runs inside bsve for getting a geojson"""

    twofishesUrl = bsveRoot() + "/geocoder"
    headers = getExtraHeaders()
    locations = json.loads(params['locations'])

    geojson = TwoFishes.createGeojson(twofishesUrl, locations,
                                      headers=headers)

    return geojson
