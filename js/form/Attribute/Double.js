import {Attribute} from './Attribute';
import {Error} from '../Error';

class DoubleAttribute extends Attribute {
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
        $input.addClass('mask_number');
        $input.attr('step', 0.001);
        
        return $input;
    }

    // a lancer apres creation dans le dom
    init() {
        super.init();

        $("#"+this.id).on("input", () => {
            let iniVal = $("#"+this.id).val()
            if (!iniVal) return; // pb sur cordova lorsqu on tape 2. la valeur est vide
            let value = parseFloat(iniVal);
            if (isNaN(value)) {
                value = null;
            }
            // pas plus de 3 decimales
            if (value*1000 - Math.floor(value*1000) != 0) {
                value = value.toFixed(3);
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
        return parseFloat(value);
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

        if (null === value) return true;

        let floatValue = parseFloat(value);
        if (isNaN(floatValue) || value != floatValue) {
            let error = new Error("invalid_double");
            this.error = error.getMessage();
        }
        
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

export {DoubleAttribute};