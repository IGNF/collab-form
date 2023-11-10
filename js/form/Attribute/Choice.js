import {Attribute} from './Attribute';
import jquery from "jquery";
export default (window.$ = window.jQuery = jquery);
require('combobox');
import {Error} from '../Error';

class ChoiceAttribute extends Attribute {
    constructor(id, name, formId, options = {}) {
        super(id, name, formId, options);
        
        this.type = "list";
        let listOfValues = options.enum;
        this.multiple = ('multiple' in options) ? options.multiple : false;

        if (Array.isArray(listOfValues)) {
            this.listOfValues = new Map();  // Pour garder l'ordre des cles
			listOfValues.forEach(val => {
				if (null === val) val = "";
				this.listOfValues.set(val, val);
			});
        } else if (listOfValues instanceof Object && listOfValues.constructor === Object) {
            this.listOfValues = listOfValues;
        } else throw new Error('enum is not correctly defined');
    }

    /**
     * @returns {JQuery object}
     */
    getDOM(value) {
        let val = (null === value) ? "" : value;
        var $input = $(`<select id="${this.id}" name="${this.name}" class="feature-attribute combobox" data-form-ref="${this.formId}">`);

        let list;
		if (this.listOfValues instanceof Map) {	// Issu d'un tableau (mis sous forme de Map pour conserver l'ordre des cles)
		  list = this.listOfValues;
		} else list = Object.entries(this.listOfValues);

		for (const [key, value] of list) {
			let v = (null === value) ? "" : value;
			let $option = $(`<option value="${v}">${key}</option>`);
            //on ne prend pas en compte le type pour avoir le match entre int/string
			if (v == val) {
				$option.prop('selected', true);
			}
			$input.append($option);
		}

        if (this.readOnly) $input.prop('disabled', true);
        if (this.defaultValue) $input.data('defaultValue', this.defaultValue);
        if (this.jeuxAttributs) $input.addClass('jeux-attributs').data('jeuxAttributs', this.jeuxAttributs);
        
        if (this.multiple) {
            $input.prop('multiple', true);
            $input.removeClass('combobox');
        }

        return $input;
    }

    getNormalizedValue() {
        let $el = $("#"+this.id);
        return this.normalize($el.val());
    }

    normalize(value) {
        if (Array.isArray(value)) return value;
        // la liste est toujours fournie sous forme de string, on force le type.
        value = value ? String(value) : null;
        value = value ? value.trim() : null;
        if ([null, ''].indexOf(value) !== -1) return null;
        return value;
    }

    validate(value) {
        this.error = null;
        value = value ? value : this.getNormalizedValue();

        if (Array.isArray(value) && !this.multiple) {
            let error = new Error("unexpected_type");
            this.error = error.getMessage();
            return false;
        }

        if (this.multiple) {
            return this.validateMultiple(value);
        }

        if (!value && (!this.nullable || this.required) && !this.conditionField) {
            let error = new Error("mandatory");
            this.error = error.getMessage();
            return false;
        }

        if (!this.validateDependant(value)) {
            return false;
        }

        return true;
    }

    validateMultiple(value) {
        if (!Array.isArray(value)) {
            let error = new Error("unexpected_type");
            this.error = error.getMessage();
            return false;
        }
        
        if (value.length < 1 && (!this.nullable || this.required)) {
            let error = new Error("mandatory");
            this.error = error.getMessage();
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