import { restRequest } from 'girder/rest';

import WmsDatasetModel from '../../minerva/web_external/models/WmsDatasetModel';


const BsveDatasetModel = WmsDatasetModel.extend({
    createBsveDataset: function (params) {
        restRequest({
            path: '/bsve_datasets_wms',
            type: 'POST',
            data: params,
            error: null
        }).done(_.bind(function (resp) {
            this.set(resp);
            this.trigger('m:wmsDatasetAdded');
        }, this)).error(_.bind(function (err) {
            this.trigger('m:error', err);
        }, this));

        return this;
    }
});
export default BsveDatasetModel;
