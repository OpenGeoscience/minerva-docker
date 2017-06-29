from girder.plugins.minerva.utility.cookie import getExtraHeaders
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
