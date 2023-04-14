import {Attribute} from './Attribute';
import {Error} from '../Error';

class StringAttribute extends Attribute {
    constructor(id, name, formId, options = {}) {
        super(id, name, formId, options);
        this.minLength = options.min_length;
        this.maxLength = options.max_length;
        this.pattern = options.pattern;
        this.custom_id = options.custom_id;
        this.type = "text";
    }

    getDOM(value) {
        let $input = super.getDOM(value);
        
        if (this.minLength) $input.attr('minlength', this.minLength);
        if (this.maxLength) $input.attr('maxlength', this.maxLength);
        if (this.pattern) $input.data('pattern', this.pattern);
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

        if (!value && (!this.nullable || this.required) && !this.custom_id && !this.conditionField) {
            let error = new Error("mandatory");
            this.error = error.getMessage();
            return false;
        }
        
        if (!this.validateDependant(value)) {
            return false;
        }

        if (!value) return true;

        if (this.maxLength && value.length > this.maxLength) {
            let error = new Error("max_length", [this.maxLength]);
            this.error = error.getMessage();
            return false;
        }
        if (this.minLength && value.length < this.minLength) {
            let error = new Error("min_length", [this.minLength]);
            this.error = error.getMessage();
            return false;
        }

        if (this.pattern === '_URL_') {
            try {
                let url = new URL(value);
            } catch(e) {
                let error = new Error("invalid_url");
                this.error = error.getMessage();
                return false;
            }
        } else if (this.pattern) {
            let regex = new RegExp(this.pattern);
            if (!regex.exec(value)) {
                let error = new Error("invalid_regex", this.pattern);
                this.error = error.getMessage();
                return false;
            }
        }

        return true;
    }

    init() {
        super.init();
        if (this.custom_id) {
            let $b = $('<button class="btn-edit"><i class="fa fa-edit"></i></button>');
            let $label = $(`label[for='${this.id}']`);
            $label =  $label.prepend($b);
            $b.on('click', {input_id: '#' + this.id},function(event) {
                let $element = $(event.data.input_id);
                
                let disabled = $element.is(':disabled');
                disabled = !disabled;
                $element.prop( "disabled", disabled);
                if (disabled) $element.val('');
            });
        }
    }
};

export {StringAttribute};