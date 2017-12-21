// import from base Minerva should be used carefully because currently the imported script and its dependancy will be duplicated into this plugin
import registry from '../../minerva/web_external/views/adapters/registry';
import MapRepresentation from '../../minerva/web_external/views/adapters/MapRepresentation';

class BSVERepresentation extends MapRepresentation {
    /**
     * Async function to define a rendered GeoJs wms layer for the passed in dataset.
     *
     * @param {Object} container - An implementor of the MapContainer interface
     * @param {DatasetModel} dataset - The dataset to be rendered
     * @fires 'm:map_layer_renderable' event upon successful layer render definition
     * @fires 'm:map_layer_error' event upon an error defining the layer rendering
     */
    init(container, dataset) {
        var bsveapi = bsve_root();
        this.geoJsLayer = container.createLayer('osm', {
            attribution: null,
            keepLower: false
        });
        container.addFeatureInfoLayer(this.geoJsLayer);
        var minervaMetadata = dataset.metadata();
        this.geoJsLayer.layerName = minervaMetadata.type_name;
        var baseUrl = bsveapi + '/data/v2/sources/geotiles/data/result'
        this.geoJsLayer.baseUrl = '/wms_proxy/' + encodeURIComponent(baseUrl);
        var projection = 'EPSG:3857';

        this.geoJsLayer.url(
            _.bind(function (x, y, zoom) {
                var bb = this.geoJsLayer.gcsTileBounds({ x: x, y: y, level: zoom }, projection);
                var bbox_mercator = bb.left + ',' + bb.bottom + ',' + bb.right + ',' + bb.top;
                var filter = [
                    'names eq',
                    minervaMetadata.type_name,
                    'and tiled eq false',
                    'and geo.bbox eq',
                    bbox_mercator,
                    'and width eq 256',
                    'and height eq 256',
                    'and projection eq',
                    projection
                ].join(' ');

                // There is a lot of repeated code here. It can be easily refactored
                // but expecting much more complex vis options so for now keep them
                // separate

                var sld_body = null;
                var min = null;
                var max = null;
                var nodata = null;
                var ramp = null;
                var count = null;
                var seq = null;
                var colorMapTemplate = null;
                var colorValuePairs = null;
                var attribute = null;
                if (minervaMetadata.sld_params) {
                    minervaMetadata.sld_params.typeName = minervaMetadata.type_name;
                    if (minervaMetadata.sld_params.subType === 'multiband') {
                        sld_body = multiband_template({
                            typeName: minervaMetadata.sld_params.typeName,
                            redChannel: minervaMetadata.sld_params.redChannel.split(':')[0].toString(),
                            greenChannel: minervaMetadata.sld_params.greenChannel.split(':')[0].toString(),
                            blueChannel: minervaMetadata.sld_params.blueChannel.split(':')[0].toString()
                        });
                    } else if (minervaMetadata.sld_params.subType === 'singleband') {
                        min = parseFloat(minervaMetadata.sld_params.min);
                        max = parseFloat(minervaMetadata.sld_params.max);
                        nodata = parseFloat(minervaMetadata.sld_params.nodata);
                        // If nodata is greater than max it has to be added
                        // to the end, otherwise it has to be added to the
                        // begining
                        var nodataMin = min - 1;
                        var nodataMax = max + 1;
                        if (nodata > max) {
                            nodataMax = nodata;
                        } else if (nodata < min) {
                            nodataMin = nodata;
                        }
                        ramp = minervaMetadata.sld_params['ramp[]'];
                        count = ramp.length;
                        seq = generate_sequence(min, max, count);
                        colorValuePairs = seq.map(function (num, i) {
                            return [num, ramp[i]];
                        });
                        colorMapTemplate = _.template('<ColorMapEntry color="<%= color %>" quantity="<%= value %>" />');
                        var colorMapEntry = _.map(colorValuePairs, function (pair) {
                            return colorMapTemplate({
                                color: pair[1],
                                value: pair[0]
                            });
                        }).join('');
                        sld_body = singleband_template({
                            typeName: minervaMetadata.sld_params.typeName,
                            colorMapEntry: colorMapEntry,
                            nodataMin: nodataMin,
                            nodataMax: nodataMax
                        });
                    } else {
                        min = parseFloat(minervaMetadata.sld_params.min);
                        max = parseFloat(minervaMetadata.sld_params.max);
                        ramp = minervaMetadata.sld_params['ramp[]'];
                        count = ramp.length;
                        attribute = minervaMetadata.sld_params.attribute;
                        seq = generate_sequence(min, max, count);
                        colorValuePairs = seq.map(function (num, i) {
                            return [num, ramp[i]];
                        });
                        colorMapTemplate = _.template('<ogc:Literal><%= value %></ogc:Literal><ogc:Literal><%= color %></ogc:Literal>');
                        var colorValueMapping = _.map(colorValuePairs, function (pair) {
                            return colorMapTemplate({
                                color: pair[1],
                                value: pair[0]
                            });
                        }).join('');

                        if (minervaMetadata.sld_params.subType === 'point') {
                            var marker = minervaMetadata.sld_params.marker;
                            sld_body = point_template({
                                typeName: minervaMetadata.sld_params.typeName,
                                colorValueMapping: colorValueMapping,
                                attribute: attribute,
                                marker: marker
                            });
                        } else if (minervaMetadata.sld_params.subType === 'line') {
                            sld_body = line_template({
                                typeName: minervaMetadata.sld_params.typeName,
                                colorValueMapping: colorValueMapping,
                                attribute: attribute
                            });
                        } else {
                            sld_body = polygon_template({
                                typeName: minervaMetadata.sld_params.typeName,
                                colorValueMapping: colorValueMapping,
                                attribute: attribute
                            });
                        }
                    }
                    filter += " and sld_body eq '" + sld_body + "'";
                }
                return this.geoJsLayer.baseUrl + '?' + escape('$filter') + '=' + escape(filter);
            }, this)
        );
        this.trigger('m:map_layer_renderable', this);
    };
}

registry.register('bsve', BSVERepresentation);

export default BSVERepresentation;
