import {Attribute} from './Attribute';
import {Error} from '../Error';

class BooleanAttribute extends Attribute {    
    constructor(id, name, formId, options = {}) {
        super(id, name, formId, options);

        this.type = "checkbox";
        this.list = {
            'true': 'Oui',
            'false': 'Non'
        };

        this.trueValues  = ["1", "true", "t", "vrai", "oui"];
        this.falseValues = ["0", "false", "f", "faux", "non"];
    }

    getDOM(value = null) {
        let val = (null === value) ? '' : value.toString();
    
        let self = this;
        let $input = $(`<select class="feature-attribute" id="${this.id}" name="${this.name}" data-form-ref="${this.formId}"></select>`);
        $.each(self.list, function(key, item) {
            let $option = $(`<option value="${key}">${item}</option>`);
            if (self.normalize(val) === self.normalize(key)) {
                $option.prop('selected', true);
            }
            $input.append($option);
        });
        if (this.nullable) {
            let $option = $("<option value=''></option>");
            if (null === value) $option.prop('selected', true);
            $input.prepend($option);
        }
        if (this.readOnly) $input.prop('disabled', true);
        if (this.defaultValue) $input.data('defaultValue', this.defaultValue);

        return $input;
    }

    getNormalizedValue() {
        let $el = $("#"+this.id);
        return this.normalize($el.val());
    }

    normalize(value) {
        let result = undefined;
        if (typeof value == "boolean") result = value
        if (typeof value === "string") {
            value = value.trim().toLowerCase();
            if (this.trueValues.indexOf(value) !== -1) result = true;
            else if (this.falseValues.indexOf(value) !== -1) result = false;
        }

        return result;
    }

    validate(value) {
        value = value ? value : this.getNormalizedValue();
        this.error = null;
        if (!this.validateDependant(value)) {
            return false;
        }
        if (undefined === value && (!this.nullable || this.required) && !this.conditionField) {
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


export {BooleanAttribute};