import {Attribute} from './Attribute';
require('combobox');
import {errors} from '../../messages';

class ChoiceAttribute extends Attribute {
    constructor(id, name, formId, options = {}) {
        super(id, name, formId, options);
        let listOfValues = options.listOfValues;

        if (Array.isArray(listOfValues)) {
            this.listOfValues = {};
            for (let index in listOfValues) {
                let val = listOfValues[index];
                this.listOfValues[val] = val;
            }
        } else if (listOfValues instanceof Object && listOfValues.constructor === Object) {
            this.listOfValues = listOfValues;
        } else {
            throw new Error('listOfValues is not correctly defined')
        }
    }

    /**
     * @returns {JQuery object}
     */
    getDOM(value) {
        var $input = $(`<select id="${this.id}" name="${this.name}" class="feature-attribute combobox" data-form-ref="${this.formId}">`);

        for(let key in this.listOfValues) {
            let item = this.listOfValues[key] ? this.listOfValues[key] : "";
            key = (key && key != "null") ? key : "";
            
            let $option = $(`<option value="${item}">${key}</option>`);
            if (value === key) {
                $option.prop('selected', true);
            }
            $input.append($option);
        };

        if (this.readOnly) $input.prop('disabled', true);
        if (this.defaultValue) $input.data('defaultValue', this.defaultValue);

        return $input;
    }

    getNormalizedValue() {
        let $el = $("#"+this.id);
        return this.normalize($el.val());
    }

    normalize(value) {
        value = value ? value.trim() : null;
        if ([null, ''].indexOf(value) !== -1) return null;
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

        return true;
    }

    init() {
        super.init();
        if (this.automatic) {
            $("#"+this.id).prop('disabled', true);
        }
    }
};

export {ChoiceAttribute};