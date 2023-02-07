import { FillConstraint } from "./fill-constraint";
import { Attribute, ign_collab_form } from './Attribute/Attribute';
import { AttributeFactory } from './AttributeFactory';
require('../jeux-attributs.js');

class Form {
    constructor(containerSelector, id, ignoreReadOnly = false) {
        this.id = id;
        this.attributes = [];
        this.fillConstraints = new FillConstraint(this.id);
        this.containerSelector = containerSelector ? containerSelector : "#fiche";

        ign_collab_form.ignoreReadOnly = ignoreReadOnly;
    }

    getAttribute(id) {
        return this.attributes[id];
    }

    /**
     * @return Object{attribute_id: error}
     */
    getErrors() {
        let errors = [];
        for (const name in this.attributes) {
            let attribute = attributes[name];
            if (attribute.error) {
                errors[attribute.id] = attribute.error;
            }
        }

        return errors;
    }

    initFillConstraints() {
        for (const name in this.attributes) {
            let attribute = this.attributes[name];
            if (attribute.conditionField) {
                this.fillConstraints.add(attribute.name, attribute.conditionField, attribute.constraint);
            }
        }
        this.fillConstraints.init($(this.containerSelector));
    }

    // Champs dependants de type regex
    // Les champs dependants de type mapping sont traites dans initCombobox
    initRegexDependants() {
        let attributes = this.attributes;
        var self = this;
        $(`.has-dependents[data-form-ref=${self.id}]`).not(':file').on('change', function() {
            let id = $(this).attr('id');
            let value = attributes[id].getNormalizedValue();
            
            let dependents = $(this).data('dependents');
            if (!dependents) return;

            $.each(dependents, function(index, dependent) {
                let $attribute = $(`[name="${dependent}"][data-form-ref=${self.id}]`);
                
                let constraint = $attribute.data('constraint');
                if (constraint.type !== 'regex') {
                    return true;
                }

                self.checkRegexConstraint($attribute, value, constraint.regex);
            });
        });
    }

    checkRegexConstraint($attribute, value, regex) {
        let cbb = $attribute.data('customCombobox');
        if (String(value) && String(value).match(regex)) {
            // combobox
            if (cbb) $attribute.combobox("setDisabled", false);
            else $attribute.prop('disabled', false);
        } else {
            if (cbb) {
                // combobox
                $attribute.combobox('setDisabled', true);
                $attribute.combobox("setDefaultOption");
            } else {
                $attribute.prop('disabled', true);
                $attribute.val($attribute.data('default-value'));
            }
        }
    }

    initJeuxAttributs() {
        let containerId =`${this.id}`;
        $(`.jeux-attributs[data-form-ref=${this.id}]`).each(function() {
            let config = $(this).data('jeuxAttributs');
            $(this).jeuxAttributs({ containerId: containerId, config: config });
        });
    }

    initCombobox() {
        let self = this;
        $(`select.combobox[data-form-ref=${self.id}]`).each(function() {
            let options = {
                appendTo: self.containerSelector,
                defaultValue:$(this).data('defaultValue')   
            };
            
            let dependency = $(this).data('dependency');
            
            let disabled = false;
            if (dependency) {
                let value = $(`[name="${dependency}"][data-form-ref=${self.id}]`).val();

                let constraint = $(this).data('constraint');
                if (constraint.type === 'mapping') {
                    let filter = (value in constraint.mapping) ? constraint.mapping[value] : null;
                    options['filter'] = filter;
                    disabled = value ? false : true;
                } else if (constraint.type === 'regex') {
                    disabled = ! (new RegExp(constraint.regex).test(value));
                }
            }

            $(this).combobox(options);
            $(this).combobox("setDisabled", disabled);
            $(this).combobox().on('comboboxselect', function(event, item) {
                let value = item.item.value;

                let dependents = $(this).data('dependents');
                if (! dependents)   return;

                $.each(dependents, function(index, dependent) {
                    let $attribute = $(`[name="${dependent}"][data-form-ref=${self.id}]`);
                    
                    let constraint = $attribute.data('constraint');
                    if (constraint.type === 'mapping') {                            
                        let disabled = value ? false : true;                            
                        let filter = null;
                        if (value) {
                            filter = (value in constraint.mapping) ? constraint.mapping[value] : null;
                        }
    
                        $attribute.combobox("setDisabled", disabled);
                        $attribute.combobox("setFilter", filter);
                        $attribute.combobox("setDefaultOption"); // Declenche en cascade
                    } else if ('regex' === constraint.type) {
                        self.checkRegexConstraint($attribute, value, constraint.regex);
                    }
                });
            });
        });
    }

    init() {
        for (const name in this.attributes) {
            this.attributes[name].init();
        }

        this.initFillConstraints();
        this.initCombobox();
        this.initRegexDependants();
        this.initJeuxAttributs();
    }

    addAttributeFromFeatureAttributeType(id, attributeType) {
        let type = attributeType.type;
        let name = attributeType.name;

        try {
            let attribute = AttributeFactory.create(id, name, type, this.id, attributeType);
            this.attributes[attribute.id] = attribute;
            return attribute;
        } catch(e) {
            console.warn(e.message);
            return null;
        }
        
    }

    addAttributeFromTheme(id, themeAttribute) {
        // Gestion des listes de valeurs
        if ("values" in themeAttribute && themeAttribute["values"]) {
            if (typeof themeAttribute["values"] === "string") {
                themeAttribute["listOfValues"] = themeAttribute["values"].split("|");
            } else if (themeAttribute["values"] instanceof Object) {
                themeAttribute["listOfValues"] = themeAttribute["values"]
            }
        }

        if (themeAttribute["original"] && Object.keys(themeAttribute["original"]).length > 0) {
            themeAttribute = themeAttribute["original"];
        }

        return this.addAttributeFromFeatureAttributeType(id, themeAttribute);
    }

    addSimpleText(id, name) {
        let attribute = AttributeFactory.create(id, name, 'text');
        this.attributes[attribute.id] = attribute;
        return attribute;
    }

     /**
     * @param {Attribute} attribute
     * @param {mixed} value
     * @param {JQuery object} $parent
     * cree l element dom et l ajoute a son parent
     */
    append(attribute, $parent, value = null) {
        let $el = attribute.getDOM(value);
        if (!$el) return;
        if (attribute.automatic) {
            $parent.addClass('automatic');
            let $span = $('<span class="automatic fa fa-cog fa-spin"></span>');
            $span.css('display', 'none');
            $parent.append($span);
        }

        $parent.append($el)
    }
}

const typesIgnored = [
    'point', 'multipoint', 'linestring', 'multilinestring', 'polygon', 'multipolygon', 'geometry', 'geometrycollection', 'document'
];

/**
 * 
 * @param {Jquery element} $container la div dans laquelle on veut construire le formulaire 
 * @param {string} id un identifiant pour le formulaire 
 * @param {object} theme le theme tel que renvoyé par l'api
 * @param {object} values un table clé [le nom de l'attribut] valeur [la value de l'attribut]
 * @returns 
 */
function createForm($container, id, theme, values = {}) {
    if (!('attributes' in theme && theme.attributes.length)) return null;

    let $div = $('<div class="feature-form"></div>');
    let selector = `theme-${id}`;
    let $table = $(`<table id=${selector} class="table"></table>`);

    let form = new Form($table, id);
    $div.append($table);
    $container.append($div);

    for (var i in theme.attributes) {
        let themeAttr = theme.attributes[i];
        let type = themeAttr.type.toLowerCase();
        if (typesIgnored.includes(type)) return true;
        let $row = $('<tr></tr>');
        let $td = $('<td></td>');

        if (type === 'jsonvalue') {
            $td.attr('colspan', 2);
        }

        let attrId = "".concat(id, "-").concat(i);
        let attribute = form.addAttributeFromTheme(attrId, themeAttr);
        let value = values[attribute.name] ? values[attribute.name] : null;
        form.append(attribute, $td, value);

        if (type !== 'jsonvalue') {
            let $label = attribute.getDOMLabel();

            var $tdLabel = $('<td></td>').append($label);
            $row.append($tdLabel);
        }

        if (!$td.is(':empty')) {
            $row.append($td);
            $table.append($row);
        }
    }

    return form;
};

/**
 * 
 * @param {Jquery element} $container la div dans laquelle on veut construire le formulaire 
 * @param {string} id 
 * @param {Object} properties 
 */
 function createSimpleForm($container, id, properties) {
    let $div = $('<div>', {class: 'feature-form'});
    
    let selector = `properties-${id}`;
    let $table = $('<table>', {class: 'table', id: selector});

    let form = new Form($table, id);
    $div.append($table);
    $container.append($div);

    if (properties !== Object(properties)) {
        return form;
    }

    for (const [name, value] of Object.entries(properties)) {
        if (value === Object(value)) continue;  // geometrie par exemple

        let $row = $('<tr>');
        $('<td>').append($('<label>', { class: 'control-label', html: name })).appendTo($row);
        $('<td>', { html: value }).appendTo($row);
        $table.append($row);
    }

    return form;
};

export { Form, createForm, createSimpleForm };