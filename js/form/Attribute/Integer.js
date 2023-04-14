import {Attribute} from './Attribute';
import {Error} from '../Error';

class IntegerAttribute extends Attribute {
    constructor(id, name, formId, options = {}) {
        super(id, name, formId, options);
        this.min = options.min_value;
        this.max = options.max_value;
        this.type = "number";
    }

    /**
     * @returns {JQuery object}
     */
    getDOM(value) {
        let $input = super.getDOM(value, this.type);
        $input.addClass('mask_int');
        $input.attr('step', 1);
        
        return $input;
    }

    // a lancer apres creation dans le dom
    init() {
        super.init();

        $("#"+this.id).on("input", () => {
            let iniVal = $("#"+this.id).val();
            let value = parseInt(iniVal);
            if (isNaN(value)) {
                value = null;
            }
            if (value != iniVal) {
                $("#"+this.id).val(value);
            }
        });

        if (this.automatic) {
            $("#"+this.id).prop('disabled', true);
        }
    }

    getNormalizedValue() {
        let $el = $("#"+this.id);
        return this.normalize($el.val());       
    }

    normalize(value) {
        if ([null, ''].indexOf(value) !== -1) return null;
        return parseInt(value);
    }

    validate(value) {
        this.error = null;
        value = value ? value : this.getNormalizedValue();
        if (!value && (!this.nullable || this.required) && !this.conditionField) {
            let error = new Error("mandatory");
            this.error = error.getMessage();
            return false;
        }

        if (!this.validateDependant(value)) {
            return false;
        }

        if (!value) return true;

        if (this.max && Number(value) > Number(this.max)) {
            let error = new Error("max", [this.max]);
            this.error = error.getMessage();
            return false;
        }
        if (this.min && Number(value) < Number(this.min)) {
            let error = new Error("min", [this.min]);
            this.error = error.getMessage();
            return false;
        }

        return true;
    }
};

export {IntegerAttribute};