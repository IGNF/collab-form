import {Attribute} from './Attribute';
import {errors} from '../../messages';

class StringAttribute extends Attribute {
    constructor(id, name, formId, options = {}) {
        super(id, name, formId, options);
        this.minLength = options.min_length;
        this.maxLength = options.max_length;
        this.pattern = options.pattern;
        this.custom_id = options.custom_id;
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

        if (!value && (!this.nullable || this.required) && !this.custom_id) {
            this.error = errors.mandatory;
            return false;
        }
        
        if (!this.validateDependant(value)) {
            return false;
        }

        if (!value) return true;

        if (
            (this.maxLength && value.length > this.maxLength)
            || (this.minLength && value.length < this.minLength)     
        ) {
            this.error = errors["min_max"];
            return false;
        }

        if (this.pattern === '_URL_') {
            try {
                let url = new URL(value);
            } catch(e) {
               this.error = errors["invalid_url"];
                return false;
            }
        } else if (this.pattern) {
            let regex = new RegExp(this.pattern);
            if (!regex.exec(value)) {
                this.error = errors["invalid regex"];
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