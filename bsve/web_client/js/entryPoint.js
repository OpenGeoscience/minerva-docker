minerva.events.on('g:appload.after', function () {
    function bsve_search_handler() {
        /*
         * Create a search submit handler.
         * The provided callback function will be executed when a fed search is performed.
         */
        BSVE.api.search.submit(function(query) {
            // There are several problems here that will need to be rethought.
            // 1) We may get this search callback before the Minerva app is ready
            // 2) Due to polling, we may have a pollSearch callback executed after
            // the time that an additional search has been done, so that pollSearch should
            // do nothing.
            // 3) The search GeoJson doesn't appear to behave correctly.  There can
            // be a response with 'Successfully processed' but that doesn't have any geojson,
            // also all geojson is returned at once, rather than per source type, then the geojson
            // needs to be split apart into geojson specific to source types.
            //
            // query object will include all of the search params including the requestId which can be used to make data requests
            console.log('GeoViz submitted search');
            console.log(query);
            // There is a problem trying to trigger the federated search here, as the
            // Minerva app may not be ready to listen yet.
            //
            var dataSources = null;
            // Store DataSource features that have already been processed.
            var sourceTypeFeatures = {};
            var finishedCurrentRequest = false;

            // Store most recent and previous requestId.
            var currentRequestId = false;
            var previousRequestId = false;

            currentRequestId = query.requestId;

            function pollSearch(query) {
                // Need to wait somehow for the Minerva app to be ready before triggering.
                if (currentRequestId !== previousRequestId) {
                    // This must be a new query that we haven't yet triggered.
                    minerva.events.trigger('m:federated_search', query);
                    previousRequestId = currentRequestId;
                    // This could probably be combined with the logic below to
                    // stop polling, but there wasn't time to think it through.
                }
                BSVE.api.get('/api/search/result?requestId=' + query.requestId, function(response)
                {
                    // Store available data source types for reference.
                    if ( !dataSources ) {
                        dataSources = response.availableSourceTypes;
                    }

                    for ( var i = dataSources.length - 1; i >= 0; i-- )
                    {
                        // Check each data source in the result.

                        if ( response.sourceTypeResults[dataSources[i]].message == "Successfully processed." )
                        {
                            // Supposedly this source type is done, but it may not actually be.
                            // Fetch updated geoJSON and remove this data source from list.
                            var dataSource = dataSources.splice(i,1);
                            getGeoJSON(query, dataSource[0]);
                        }
                    }

                    if (dataSources.length)
                    {
                        if (currentRequestId != query.requestId || finishedCurrentRequest) {
                            if(currentRequestId != query.requestId) {
                                console.log('stop polling bc of requestId');
                            } else {
                                console.log('stop polling bc of finished');
                            }
                        } else {
                            // continue polling since there are still in progress sources
                            setTimeout(function(){ pollSearch(query); }, 2000);
                        }
                    }
                });
            }

            function getGeoJSON(query, dataSourceName)
            {
                console.log('GeoViz calling getGeoJSON');
                BSVE.api.get('/api/search/util/geomap/geojson/' + query.requestId + '/all', function(response)
                {
                    console.log('Geojson response for '+dataSourceName);
                    if (response.features && response.features.length > 0) {
                        var groupedBySourceType = _.groupBy(response.features, function (feature) {
                            return feature.properties.SourceType;
                        });
                        // Create a Dataset for each SourceType features array.
                        var sourceTypesWithFeatures = _.keys(groupedBySourceType);
                        _.each(sourceTypesWithFeatures, function (sourceType) {
                            if (groupedBySourceType[sourceType] && groupedBySourceType[sourceType].length > 0) {
                                if (_.has(sourceTypeFeatures, sourceType)) {
                                    console.log('Already created a dataset for ' + sourceType);
                                } else {
                                    var geojsonData = {
                                        'type': 'FeatureCollection'
                                    };
                                    geojsonData.features = groupedBySourceType[sourceType];
                                    console.log('Creating a dataset for ' + sourceType + ' of length ' + geojsonData.features.length);
                                    var gjObj = {
                                        'geojson': geojsonData,
                                        'name': sourceType + ' - ' + geojsonData.features.length
                                    }
                                    sourceTypeFeatures[sourceType] = geojsonData.features.length;
                                    minerva.events.trigger('m:add_external_geojson', gjObj);
                                }
                                // Assume this means we got some request data back.
                                finishedCurrentRequest = true;
                            } else {
                                console.log('No features for '+ sourceType);
                            }
                        });
                    } else {
                        console.log(dataSourceName + ' response is missing features');
                    }
                });
            }

            // Start polling.
            pollSearch(query);
        }, true, true, true); // set all 3 flags to true, which will hide the searchbar altogether
    }

    function start_session(resp) {
        var user = resp.user;
        var folder;
        var session = new minerva.models.SessionModel();
        // get the minerva folder id
        girder.restRequest({
            path: 'minerva_session/folder',
            data: {
                userId: user._id
            }
        }).then(function (resp) {
            folder = resp.folder;

            // get the default session, if it exists
            return girder.restRequest({
                path: 'minerva_session',
                data: {
                    userId: user._id,
                    limit: 1
                }
            });
        }).then(function (resp) {
            // I really wish girder model methods returned promises...
            var defer = new $.Deferred();
            if (resp.length) {
                return resp[0];
            }

            // no session exists, create it
            session.set({
                folderId: folder._id,
                name: 'default',
                description: 'Default session for the BSVE'
            });
            session.createSessionMetadata();
            session.on('g:saved', function () {
                defer.resolve(session.attributes);
            });
            return defer.promise();
        }).then(function (resp) {
            session.set(resp);
            console.log(resp);
        });
    }

    function error_handler(resp) {
        console.error('Minerva login failed with:');
        console.error(resp);
    }

    if (typeof BSVE !== 'undefined') {
        console.log('BSVE JS object exists');
        BSVE.init(function() {
            console.log('BSVE.init callback');
            console.log(BSVE.api.user());

            // in the ready callback function, access to workbench vars are now available.
            var user = BSVE.api.user(), // current logged in user
                authTicket = BSVE.api.authTicket(), // harbinger-auth-ticket
                tenancy = BSVE.api.tenancy(), // logged in user's tenant
                dismissed = false; // used for dismissing modal alert for tagging confirmation
            console.log('GeoViz 0.0.46');
            console.log(user);

            // log in to minerva using bsve credentials
            girder.restRequest({
                path: 'bsve/authentication',
                data: {
                    apiroot: 'https://qa.bsvecosystem.net/api'
                }
            }).then(
                start_session
            ).then(
                bsve_search_handler
            ).catch(error_handler);
        });
    } else {
        console.log('No BSVE object defined');
    }

});
