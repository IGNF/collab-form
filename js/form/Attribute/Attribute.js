const ign_collab_form = {
    ignoreReadOnly: false    
}

class Attribute {
    constructor(id, name, formId, options = {}) {
        let readOnly = ign_collab_form.ignoreReadOnly ? false : ('readOnly' in options) ? options.readOnly : false;

        this.id = "attr-"+id,
        this.name = name;
        this.formId = formId;
        this.nullable = ('nullable' in options) ? options.nullable : (('mandatory' in options) ? !options.mandatory : true); //contrainte en bd
        this.required =  ('required' in options) ? options.required : false; //contrainte de validation cliente
        this.readOnly = readOnly;
        this.description = ('description' in options) ? options.description : '';
        this.title = ('title' in options) ? options.title : name;
        this.automatic = ('automatic' in options) ? options.automatic : false;
        this.computed = ('computed' in options) ? options.computed : false;
        this.defaultValue = options.default_value ? options.default_value : options.default;
        this.conditionField = options.condition_field;
        this.constraint = options.constraint;
        this.jeuxAttributs = options.jeux_attributs;
        this.error = null;
    }

    /**
     * 
     * @return {JQuery object}
     */
    getDOM(value) {
        let $input = $(`<input class="feature-attribute" id="${this.id}" type="text" data-form-ref="${this.formId}" name="${this.name}"/>`);

        if (value !== null) $input.val(value);
        if (this.readOnly) $input.prop('disabled', true);
        if (this.defaultValue) $input.data('defaultValue', this.defaultValue);
        if (this.min) $input.attr('min', this.min);
        if (this.max) $input.attr('max', this.max);
        return $input;
    }

    /**
     *
     * @returns {JQuery object}
     */
    getDOMLabel() {
        var str = '<label for="' + this.id + '" class="control-label"';
        if (this.description) {
            str += ' data-toggle="tooltip" title="' + this.description + '"';
        }
        str += '>' + this.title + '</label>';
        var $label = $(str);
        if (!this.nullable || this.required) {
            $label.addClass('required');
        }
        return $label;
    }

    init() {
        if (this.computed || this.automatic) {
            $("#"+this.id).prop('disabled', true);
        }
        if (this.custom_id) {
            $("#"+this.id).prop('disabled', true);
        }
        if (this.min){
            let $td = $("#"+this.id).closest("td");
            $("#"+this.id).prop('min', this.min);
        }
        if (this.max){
            let $td = $("#"+this.id).closest("td");
            $("#"+this.id).prop('max', this.max);
        }
        if (!this.nullable || this.required){
            $("#"+this.id).data('required', true);
        }
        if (this.mime_types){
            $("#"+this.id).attr('accept', this.mime_types);
        }
    }

    validateDependant(value) {
        let $el = $("#"+this.id);
        if($el.hasClass('dependent')      //champ dépendant
            && $el.data('required')       //caractere obligatoire : ne peut pas avoir la valeur par defaut
            && !$el.prop('disabled')) {   // si disabled : ne doit pas etre rempli
            // ne doit pas avoir la valeur par défaut si required
            var valdef = ($el.data('defaultValue') === undefined) ? '' : $this.data('defaultValue');
            if ($el.val() === valdef || !value) {
                this.error = 'Valeur obligatoire' + (valdef!=='' ? ' et différente de '+valdef : '');
                return false;
            }
        }
        return true;
    }

    getNormalizedValue(value) {
        let $el = $("#"+this.id);
        return this.normalize($el.val());
    }

    normalize(value) {
        return value;
    }
}

export { Attribute, ign_collab_form };

