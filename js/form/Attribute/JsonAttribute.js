import Ajv from "ajv";
const localize = require("ajv-i18n")
import { Attribute } from './Attribute';
import { JsonAttributeErrorsFactory } from '../JsonAttributeErrors';
import {errors} from '../../messages';

class JsonValueFactory {
    static getComponent(definition) {
        let type;
        if ('type' in definition) {
            type = definition.type;   
        } else if ('enum' in definition) {
            type = 'list';
        }

        if (! type) return null;

        let $elt;
        switch(type) {
            case 'string':
                $elt = $('<input>', { type: "text" });
                if ('pattern' in definition) {
                    $elt.data('pattern', definition.pattern);   
                }
                if ('format' in definition && 'date' === definition.format) {
                    $elt.addClass("mask_date datetimepicker-input")
                        .attr('data-toggle', 'datetimepicker')
                        .prop('readonly', true);
                }
                break;
            case 'integer':
            case 'number':
                let mask = ('integer' === type) ? 'mask_int' : 'mask_number';
                $elt = $('<input>', { class: mask, type: "text" });
                break;
            case 'boolean':
                let strValue = Boolean(definition.value).toString();

                let options = {};
                $.extend(options, { 'Oui': 'true', 'Non': 'false'} );
                $elt = $('<select>');
                for (const [text, value] of Object.entries(options)) {
                    let $option = $('<option>', { text: text, value: value});
                    if (strValue === value) {
                        $option.prop('selected', true);    
                    }
                    $elt.append($option);
                }
                break;
            case 'list': 
                $elt = $('<select>');
                definition.enum.forEach(value => {
                    let $option = $('<option>', { text: value, value: value});
                    if (definition.value === value) {
                        $option.prop('selected', true);        
                    }
                    $elt.append($option);
                })
                break;
        }

        if ($elt && $elt.is('input') && definition.value) {
            $elt.val(definition.value);   
        }

        return $elt;
    }   
}

class JsonAttribute extends Attribute {
    constructor(id, name, formId, options = {}) {
        super(id, name, formId, options);
        
        this.jsonSchema = null;			
        this.JsonValue  = {};
        this.datepickerOptions = {
            locale: 'fr',
            format: 'YYYY-MM-DD',
            debug: true,
            useCurrent: false,
            buttons: {
                showToday: true,
                showClear: true,
                showClose: true
            },
            ignoreReadonly: true
        };
        this.required;
        this.next = 0;

        // Le schema est obligatoire et doit etre un object
        let schema = options['json_schema'];
        if (! schema || (schema !== Object(schema))) {
            console.warn('Schema obligatoire !!');
            return;
        }

        this.jsonSchema = schema;			
        try {
            if (this.jsonSchema.type === 'array') {
                this.required = this.jsonSchema.items.required || [];
            } else {
                this.required = this.jsonSchema.required || []; 
            }
        }  catch(e) {} 
    }

    /**
     * Creation du DOM (On cree une div avec le bouton d'ajout d'un objet. 
     * Les objets sont ajoutes dans la fonction init)
     * @param {string|null} value la valeur du champ json du feature
     * @returns 
     */
    getDOM(value = null) {
        if (value) {
            // Normalement value est un object JSON
            this.JsonValue = (typeof value === 'string') ? JSON.parse(value) : value;
        }

        if (! Array.isArray(this.JsonValue)) {
            this.JsonValue = [this.JsonValue];
        }

        let $div = $('<div>', { class: "feature-attribute", id: this.id }).prop('name', this.name);
        $div.append(this.getDOMLabel());
        let $addDiv = $('<div>', { class: "add-button" }).appendTo($div);
        if (this.type === 'object') {
            $addDiv.css('display', 'none');    
        }

        let $button = $('<button>', { class: "btn btn--ghost btn-add p-0", title: "Ajout d'un objet" })
            .html('<i class="far fa-plus-square no-trailing-space"></i>');

        $addDiv.append($button);
        $div.append($addDiv);
        
        return $div;
    }

    /**
     * On combine le schema et la valeur pour un objet json
     * @param {Object} jsonObject 
     * @returns 
     */
    bindValues(jsonObject) {
        let properties = (this.jsonSchema.type === 'array') ? this.jsonSchema.items.properties : this.jsonSchema.properties;

        let result = {};
        for (const [key, definition] of Object.entries(properties)) {
            let mandatory = this.required.includes(key);

            let value = null;
            if (key in jsonObject) {
                value = jsonObject[key];
            }
            
            let extDef = $.extend({}, definition, { 'mandatory': mandatory, 'value': value });
            result[key] = extDef;
        }
        return result;
    }

    /**
     * Creation du formulaire pour un objet json
     * @param {Object} jsonObject 
     * @returns 
     */
    buildJsonForm(jsonObject) {
        let identifier = `json-form-${this.next}`;

        let $div = $('<div>', { class: "json-form", id: identifier });

        let $toolDiv = $('<div>', { class: "json-tool" }).appendTo($div);
        let $button = $('<button>', { class: "btn btn--ghost btn-remove p-0", title: "Suppression d'un objet" })
            .data('json-form-ref', identifier)
            .html('<i class="far fa-trash-alt no-trailing-space"></i>');
        $toolDiv.append($button);
        $div.append($toolDiv);

        let $divObject = $('<div>', { class: "json-object border" }).appendTo($div);
        for (const [key, definition] of Object.entries(jsonObject)) {            
            let $divRow = $('<div>', { class: "json-row" }).appendTo($divObject);
            
            let jskey = key;
            if (this.required.includes(key)) jskey += '&nbsp;*';
            $divRow.append($('<div>', { class: "json-key" }).data('key', key).html(jskey));
            
            let $divJsonValue = $('<div>', { class: "json-value" });
            $divJsonValue.append(JsonValueFactory.getComponent(definition));
            $divRow.append($divJsonValue);
        }

        return $div;
    }

    /**
     * Ajout d'un formulaire json avec le callback du bouton remove
     * @param {Object} jsonObject 
     */
    add(jsonObject = {}) {
        // Pas de schema associe
        if (! this.jsonSchema) {
            return;
        }

        /* Creation du formulaire */
        let jsobj = this.bindValues(jsonObject);
        let jsform = this.buildJsonForm(jsobj);

        // Ajout dans la div
        $(`#${this.id}`).append(jsform);
        let jsformId = jsform.attr('id');

        /* Ajout du callback click sur le bouton remove */
        $(`#${this.id} #${jsformId} .btn-remove`).on('click', (e) => {
            this.handleRemove(e);
        });

        // Ajout des plugins (masques)
        $(`#${this.id} #${jsformId} .mask_int`).numericMask();
        $(`#${this.id} #${jsformId} .mask_number`).numericMask(true);

        let $dateElts = $(`#${this.id} #${jsformId} .mask_date`);
        $dateElts.datetimepicker(this.datepickerOptions);
        $dateElts.on('show.datetimepicker', (e) => {
            // Pas tres beau, on decale a gauche de 15px
            $(e.currentTarget).next().css('left', '-15px');
        });
        $dateElts.parent().css('position', 'relative');
    
        /* On ne peut ajouter qu'un seul objet pour un schema de type 'object' */
        if ('object' === this.jsonSchema.type) {
            $(`#${this.id} .add-button`).hide();    
        }
        this.next++;
    }

    /**
     * Suppression d'un objet json
     * @param {string} jsformId 
     */
    remove(jsformId) {
        $(`#${this.id} #${jsformId}`).remove();

        let type = this.jsonSchema.type;
        let num = $(`#${this.id} .json-form`).length;
        if (type === 'object') {
            let $divAdd = $(`#${this.id} .add-button`);
            (0 == num) ? $divAdd.show() : $divAdd.hide();
        }
    }

    /**
     * Reaction au click sur un bouton remove
     * @param {Event} e 
     */
    handleRemove(e) {
        let jsform = $(e.currentTarget).data('json-form-ref');
        this.remove(jsform);
    }

    /**
     * Initialisation des callbacks onclick sur le bouton add
     * Les callbacks onclick sur les boutons remove sont definis dans la fonction add
     */
    initCallbacks() {
        /* add */
        $(`#${this.id} .btn-add`).on('click', () => {
            this.add();
        });
    }

    init() {
        super.init();

        this.JsonValue.forEach(jsonObject => {
            this.add(jsonObject);
        });
        this.initCallbacks();
    }

    getNormalizedValue() {
        let properties = (this.jsonSchema.type === 'array') ? this.jsonSchema.items.properties : this.jsonSchema.properties;
       
        let values = [];
        $(`#${this.id} .json-form`).each((idx0, jsForm) => {
            let jsObject = {};
            $(jsForm).find('.json-row').each((idx1, jsRow) => {
                let $jsRow = $(jsRow);
                
                let key = $jsRow.find('.json-key').data('key');
                let value = $jsRow.find('.json-value :input').val();
                
                if ("" === value) {
                    jsObject[key] = null;  
                    return;     
                }

                switch(properties[key].type) {
                    case 'boolean':
                        value = (value === 'true') ? true : false;
                        break;
                    case 'integer':
                        value = parseInt(value, 10);
                        break;
                    case 'number':
                        value = parseFloat(value);
                        break;
                }

                jsObject[key] = value;   
            });
            if (Object.keys(jsObject).length) {
                values.push(jsObject);
            }
        });
        if (! values.length) return null;
        return ('object' === this.jsonSchema.type) ? values[0] : values;
    }

    normalize(value) {}

    formatErrors(errors) {
        let jsErrors = JsonAttributeErrorsFactory.create(this.jsonSchema.type);
        this.error = jsErrors.format(errors);
    }

    validate(value) {
        this.error = null;

        // valeur null mais pas nullable => erreur
        if (!value && (!this.nullable || this.required) && !this.conditionField) {
            this.error = errors.mandatory;
            return false;
        }
        if (! value) return true;

        if (typeof value === 'string') {
            value = JSON.parse(value);
        }

        const ajv = Ajv({allErrors: true, messages: false})
        const validate = ajv.compile(this.jsonSchema);
        const valid = validate(value);

        if (! valid) {
            localize.fr(validate.errors);
            this.formatErrors(validate.errors);
        }
        
        return valid;
    }
}

export {JsonAttribute};