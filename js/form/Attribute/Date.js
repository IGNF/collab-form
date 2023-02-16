import moment from 'moment';
import {Attribute} from './Attribute';
import {errors} from '../../messages';

class DateAttribute extends Attribute {
    constructor(id, name, mask = 'date', formId, options = {}) {
        super(id, name, formId, options);
        this.mask = mask;
        this.min = options.min_value;
        this.max = options.max_value;

        this.formats = {
            'date': 'YYYY-MM-DD',
            'year': 'YYYY',
            'yearmonth': 'YYYY-MM',
            'datetime': 'YYYY-MM-DD HH:mm:ss'
        };

        this.datetimeInputFormat = 'YYYY-MM-DDTHH:mm';
    }

    /**
     * @returns {JQuery object}
     */
    getDOM(value) {
        let inputType = 'date';
        switch (this.mask) {
            case 'datetime':
                inputType = 'datetime-local';
                break;
            case 'yearmonth':
                inputType = 'month';
                break;
            case 'year':
                inputType = 'number';
                break;
        }

        let $input = $(`<input class="feature-attribute" id="${this.id}" type="${inputType}" data-form-ref="${this.formId}" name="${this.name}"/>`);
        
        let mask = `mask_${this.mask}`;
        $input.addClass(mask); // pour le style

        if (value !== null) {
            if (this.mask == 'datetime') {
                value = moment(value, this.formats[this.mask]).format(this.datetimeInputFormat);
            }
            $input.val(value);
        }
        if (this.readOnly) $input.prop('disabled', true);
        if (this.defaultValue) $input.data('defaultValue', this.defaultValue);
        if (this.mask == 'year') {
            if (!this.min) this.min = 1900;
            if (!this.max) this.max = 2100;
            $input.prop('step', 1);
        }
        
        return $input;
    }

    // a lancer apres creation dans le dom
    init() {
        super.init();
        
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
        
        // le format du input et celui attendu par le serveur est different pour le datetime
        if (this.mask == 'datetime') {
            try {
                return moment(value, this.datetimeInputFormat).format(this.formats[this.mask]);
            } catch (e) {
                return value;
            }
        }
        
        return value;
    }

    validate(value) {
        this.error = null;
        value = value ? value : this.getNormalizedValue();
        if (!value && (!this.nullable || this.required) && !this.conditionField) {
            this.error = errors.mandatory;
            return false;
        }

        if (!this.validateDependant(value)) {
            return false;
        }

        if (!value) return true;

        let date = moment(value, this.formats[this.mask], true);
        if (!date.isValid()) {
            this.error =  errors.invalid_date;
            return false;
        }

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