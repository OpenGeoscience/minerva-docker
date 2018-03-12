import events from 'girder/events';
import template from '../templates/dossierItemCreator.pug';

var View = minerva.views.view;
const DossierItemCreator = View.extend({
    events: {
        'submit': function (e) {
            e.preventDefault();
            if (!this.title) {
                this.validation.titleRequired = true;
                this.render();
                return;
            }
            var image = new Image();
            image.src = this.image;
            var item = {
                dataSource: 'Geoviz',
                title: this.title,
                sourceDate: BSVE.api.dates.yymmdd(Date.now()),
                itemDetail: {
                    statusIconType: 'Graph',
                    Description: image.outerHTML,
                    What: this.disease,
                    When: this.occurence,
                    Where: this.location
                }
            }

            BSVE.api.tagItem(item, 'IOI', (itemId) => {
                events.trigger('g:alert', {
                    icon: 'ok',
                    text: 'Dossier item created.',
                    type: 'success',
                    timeout: 3500
                });
                this.$el.modal('hide');
            });
        },
        'change input.title': function (e) {
            this.title = e.target.value;
            this.validation.titleRequired = !this.title;
            this.render();
        },
        'change input.location': function (e) {
            this.location = e.target.value;
        },
        'change input.occurence': function (e) {
            this.occurence = e.target.value;
        },
        'change input.disease': function (e) {
            this.disease = e.target.value;
        }
    },
    initialize(options) {
        this.image = options.image;
        this.title = '';
        this.location = '';
        this.occurence = '';
        this.disease = '';
        this.validation = {
            titleRequired: false
        }
    },
    render() {
        if (!this.modalOpenned) {
            var el = this.$el.html(template(this));
            this.modalOpenned = true;
            var modal = el.girderModal(this);
            modal.trigger($.Event('ready.girder.modal', { relatedTarget: modal }));
        } else {
            this.$el.html(template(this));
        }
        return this;
    }
});

export default DossierItemCreator;
