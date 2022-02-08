moment = require('moment');
require('tempusdominus-bootstrap-4/build/css/tempusdominus-bootstrap-4.css');
require('tempusdominus-bootstrap-4/build/js/tempusdominus-bootstrap-4.js');
import {Attribute} from './Attribute';
import {errors} from '../../messages';

class DateAttribute extends Attribute {
    constructor(id, name, mask = 'date', formId, options = {}) {
        super(id, name, formId, options);
        this.mask = mask;
        this.min = options.min_value;
        this.max = options.max_value;

        this.mainOptions = {
            locale: 'fr',
            format: 'YYYY-MM-DD',
            useCurrent: false,
            buttons: {
                showToday: true,
                showClear: true,
                showClose: true
            },
            ignoreReadonly: true
        };

        this.formats = {
            'date': 'YYYY-MM-DD',
            'year': 'YYYY',
            'yearmonth': 'YYYY-MM',
            'datetime': 'YYYY-MM-DD HH:mm:ss'
        };
    }

    /**
     * @returns {JQuery object}
     */
    getDOM(value) {
        let $input = super.getDOM(value);
        let mask = `mask_${this.mask}`;
        $input.addClass(mask)
            .addClass('datetimepicker-input')
            .attr('readonly', true)
            .attr('data-toggle', 'datetimepicker');

        return $input;
    }

    // a lancer apres creation dans le dom
    init() {
        super.init();
        let options = this.mainOptions;
        if (this.mask in this.formats) {
            options.format = this.formats[this.mask];
        }

        if (this.min) options.minDate = this.min;
        if (this.max) options.maxDate = this.max;
        
        let $el = $("#"+this.id);
        $el.datetimepicker(options);
        $el.parent("td").css('position', 'relative');

        if (this.automatic) {
            $("#"+this.id).prop('disabled', true);
        }
    }

    getNormalizedValue() {
        let $el = $("#"+this.id);
        return this.normalize($el.val());
    }

    normalize(value) {
        value = value ? value.trim() : null;
        if ([null, ''].indexOf(value) !== -1) return null;
        value = value.replace(/ 00:00:00/, '');
        // Enleve les millisecondes
        value = value.replace(/\.[0-9]+/, '');
        return value;
    }

    validate(value) {
        this.error = null;
        value = value ? value : this.getNormalizedValue();
        if (!value && (!this.nullable || this.required)) {
            this.error = errors.mandatory;
            return false;
        }

        if (!this.validateDependant(value)) {
            return false;
        }

        if (!value) return true;

        if (
            (this.max && Number(value) > Number(this.max))
            || (this.min && Number(value) < Number(this.min))
        ) {
            this.error = errors.min_max
            return false;
        }

        return true;
    }
};

export {DateAttribute};