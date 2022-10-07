import {Attribute} from './Attribute';
import {errors} from '../../messages';

class DoubleAttribute extends Attribute {
    constructor(id, name, formId, options = {}) {
        super(id, name, formId, options);
        this.min = options.min_value;
        this.max = options.max_value;
    }

    /**
     * @returns {JQuery object}
     */
     getDOM(value) {
        let $input = super.getDOM(value);
        $input.addClass('mask_number');
        
        return $input;
    }

    // a lancer apres creation dans le dom
    init() {
        super.init();
        $("#"+this.id).numericMask(true);

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
            this.error = errors.mandatory;
            return false;
        }

        if (!this.validateDependant(value)) {
            return false;
        }

        if (null === value) return true;
        
        if (
            (this.max && Number(value) > Number(this.max))
            || (this.min && Number(value) < Number(this.min))
        ) {
            this.error = errors.min_max;
            return false;
        }

        return true;
    }
};

export {DoubleAttribute};