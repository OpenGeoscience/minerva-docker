minerva.models.BsveDatasetModel = minerva.models.WmsDatasetModel.extend({
    createBsveDataset: function (params) {
        girder.restRequest({
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
