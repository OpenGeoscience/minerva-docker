minerva.events.on('g:appload.after', function () {

    function init_reference_data(collection) {

        var wmsSource = new minerva.models.BsveDatasetModel({});
        wmsSource.on('m:wmsDatasetAdded', function (datasets) {
            _.each(datasets, function (dataset) {
                collection.add(dataset, {silent: true});
                collection.trigger('add');
            });
            minerva.events.trigger('m:updateDatasets');
            remove_spinner();
        }).createBsveDataset({
            name: 'Reference',
        });
    }

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
                BSVE.api.get('/api/search/result?requestId=' + query.requestId, function(response) {
                    var status;
                    // Store available data source types for reference.
                    if ( !dataSources ) {
                        dataSources = response.availableSourceTypes;
                    }

                    for ( var i = dataSources.length - 1; i >= 0; i-- ) {
                        // Check each data source in the result.
                        status = response.sourceTypeResults[dataSources[i]].status;
                        if ( status === 4 || status === 12)
                        {
                            // Supposedly this source type is done, but it may not actually be.
                            // Fetch updated geoJSON and remove this data source from list.
                            var dataSource = dataSources.splice(i,1);
                            getGeoJSON(query, dataSource[0]);
                        }
                    }

                    if (dataSources.length) {
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

            function getGeoJSON(query, dataSourceName) {
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
                                    minerva.events.trigger('m:addExternalGeoJSON', {
                                        name: gjObj.name,
                                        data: gjObj.geojson
                                    });
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

    function data_exchange_handler() {
        BSVE.api.exchange.receive(function (data) {
            minerva.events.trigger('m:addExternalGeoJSON', {
                name: 'Imported',
                data: data
            });
        });
    }

    function start_session(resp) {
        var user = resp;
        var folder;

        girder.currentUser = new girder.models.UserModel(user);
        girder.currentToken = user.authToken.token;
        girder.events.trigger('g:login.success', user);
        girder.events.trigger('g:login', user);

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
            }).once('g:saved', function () {
                // disable job and analysis panels
                session.metadata({
                    'layout': {
                        'm-analysis-panel': {
                            'disabled': true
                        },
                        'm-jobs-panel': {
                            'disabled': true
                        }
                    }
                });
                session.once('m:session_saved', function () {
                    defer.resolve(session.attributes);
                }).createSessionMetadata();
            }).save();
            return defer.promise();
        }).then(function (resp) {
            session.set(resp);
            girder.events.once('g:navigateTo', function (view, obj) {
                var datasets = obj.datasetsCollection;
                var needReference = true;
                datasets.each(function (dataset) {
                    var mm = dataset.attributes.meta.minerva;
                    if (mm.source && mm.source.layer_source === 'Reference') {
                        needReference = false;
                    }
                });
                if (needReference) {
                    init_reference_data(datasets);
                } else {
                    remove_spinner();
                }
            });
            minerva.router.navigate('session/' + session.id, {trigger: true});
        });
    }

    function remove_bsve_css() {
        $('link').each(function (i, el) {
            var $el = $(el);
            if ($el.prop('href').search('harbinger') >= 0) {
                $el.remove();
            }
        });
    }

    function error_handler(resp) {
        console.error('Minerva login failed with:');
        console.error(resp);
    }

    function hide_body() {
        $('#g-app-body-container').hide();
    }

    function show_body() {
        $('#g-app-body-container').show();
    }

    var spinner;
    function show_spinner() {
        spinner = $(
            '<i class="icon-spin3 animate-spin"/>'
        ).css({
            position: 'absolute',
            top: '50%',
            left: '50%',
            'z-index': 10000,
            'font-size': '40px'
        }).appendTo('body');
    }

    function remove_spinner() {
        spinner.remove();
    }

    if (typeof BSVE !== 'undefined') {
        console.log('BSVE JS object exists');

        BSVE.init(function() {
            remove_bsve_css();

            show_spinner();

            console.log('BSVE.init callback');
            console.log(BSVE.api.user());

            // in the ready callback function, access to workbench vars are now available.
            var user = BSVE.api.user(), // current logged in user
                authTicket = BSVE.api.authTicket(), // harbinger-auth-ticket
                tenancy = BSVE.api.tenancy(), // logged in user's tenant
                dismissed = false; // used for dismissing modal alert for tagging confirmation
            console.log('GeoViz 0.0.49');
            console.log(user);

            // set auth cookie for bsve proxy endpoints
            document.cookie = 'minervaHeaders=' + encodeURIComponent(JSON.stringify({
                'harbinger-auth-ticket': authTicket
            }));

            // set bsve api root cookie
            document.cookie = 'bsveRoot=' + encodeURIComponent('https://' + BSVE.api.appRoot());

            var auth = 'Basic ' + window.btoa(user + ':' + authTicket);

            // log in to minerva using bsve credentials
            girder.restRequest({
                path: 'bsve/authentication',
                data: {
                    apiroot: 'https:' + BSVE.api.appRoot() + '/api'
                },
                headers: {
                    'Authorization': auth
                }
            }).then(
                start_session
            ).then(
                bsve_search_handler
            ).then(
                data_exchange_handler
            ).then(undefined , function () {
                remove_spinner();
                error_handler();
            });
        });
    } else {
        console.log('No BSVE object defined');
    }
});

// we don't want a header so remove the header element on the main app
girder.wrap(minerva.App, 'render', function (render) {
    render.call(this);
    this.$('#m-app-header-container').remove();
});

// also remove the session header from the session view
// this happens async so we need to do it on the pre-render
// event
girder.events.on('m:pre-render-panel-groups', function () {
    $('.m-session-header').remove();
});

// remove the button to remove panels from the session
girder.wrap(minerva.views.LayersPanel, 'render', function (render) {
    render.call(this);
    this.$('.m-remove-panel').remove();
});

girder.wrap(minerva.views.DataPanel, 'render', function (render) {
    render.call(this);
    this.$('.m-remove-panel').remove();
});
