import { FillConstraint } from "./fill-constraint";
import { Attribute, ign_collab_form } from './Attribute/Attribute';
import { AttributeFactory } from './AttributeFactory';
require('../jeux-attributs.js');

class Form {
    /**
     * 
     * @param {String} containerSelector 
     * @param {String} id 
     * @param {Boolean} ignoreReadOnly lorsqu on travaille sur des signalements, meme si la table est en lecture seule l'attribut reste ouvert en écriture
     * cet attribut doit donc etre a true lorsqu'on crée le formulaire pour la saisie d'un signalement
     * @param {String} style web|mobile
     */
    constructor(containerSelector, id, ignoreReadOnly = false, style = 'web') {
        this.id = id;
        this.attributes = [];
        this.fillConstraints = new FillConstraint(this.id);
        this.containerSelector = containerSelector ? containerSelector : "#fiche";

        ign_collab_form.ignoreReadOnly = ignoreReadOnly;
        ign_collab_form.style = style
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
        const self = this;
        const isMobile = (ign_collab_form.style === 'mobile');
        if (isMobile) {
            $(`[data-type="checkbox"] select[data-form-ref=${self.id}]`, self.containerSelector).each(function() {
                let options = {
                    appendTo: self.containerSelector,
                    defaultValue: $(this).data('defaultValue')   
                };
                self.choice(this, options, v => onselect(this, v));
            })
        }

        $(`select.combobox[data-form-ref=${self.id}]`, self.containerSelector).each(function() {
            const sel = this;
            let options = {
                appendTo: self.containerSelector,
                defaultValue: $(this).data('defaultValue')   
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

            if (isMobile) {
                self.choice(sel, options, v => onselect(sel, v));
                $(sel).prop('disabled', disabled);
                self.setFilter(sel, options.filter)
                // Restet value
                $(sel).data('setDefault', function() {
                    sel.value = options.defaultValue || '';
                    onselect(sel, options.defaultValue);
                })
            } else {
                $(this).combobox(options);
                $(this).combobox("setDisabled", disabled);
                $(this).combobox().on('comboboxselect', function(event, item) {
                    onselect (sel, item.item.value);
                })
            }
        });

        // Select an option
        function onselect(sel, value) {
            let dependents = $(sel).data('dependents');
            if (! dependents) return;

            $.each(dependents, function(index, dependent) {
                let $attribute = $(`[name="${dependent}"][data-form-ref=${self.id}]`);
                
                let constraint = $attribute.data('constraint');
                if (constraint.type === 'mapping') {                            
                    let disabled = value ? false : true;                            
                    let filter = null;
                    if (value) {
                        filter = (value in constraint.mapping) ? constraint.mapping[value] : null;
                    }

                    if (isMobile) {
                        $attribute.prop('disabled', disabled);
                        self.setFilter($attribute, filter)
                        // Declenche en cascade
                        $attribute.data('setDefault')();
                    } else {
                        $attribute.combobox("setDisabled", disabled);
                        $attribute.combobox("setFilter", filter);
                        $attribute.combobox("setDefaultOption"); // Declenche en cascade
                    }
                } else if ('regex' === constraint.type) {
                    self.checkRegexConstraint($attribute, value, constraint.regex);
                }
            });
        };
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

    /** Display a choice dialog
     * @param {Element} sel input select
     */
    choice(sel, options, onselect) {
        const popup = $('<div>').addClass('select-popup').attr('aria-hidden', true).appendTo($(sel).parent());
        const form = $('<form>').addClass('visible').attr('data-role','dialog').appendTo(popup);
        $('<div>').addClass('title').text($(sel).parent().attr('data-title')).appendTo(form)
        // Search
        if ($('option', sel).length > 8) {
            $('<input>').attr('type', 'search')
                .attr('placeholder', 'rechercher...')
                .on('keyup', function() {
                    const rex = new RegExp(this.value, 'i')
                    $('li', ul).each(function() {
                        this.setAttribute('aria-hidden', !rex.test(this.innerText))
                    })
                })
                .appendTo(form)
        }
        // Options list
        const ul = $('<UL>').attr('data-role','select').appendTo(form);
        $('option', sel).each(function() {
            $('<li>')
                .text(this.value ? this.innerText : '<sans valeur>')
                .data('value', this.value)
                .appendTo(ul)
                .addClass($(sel).val() == this.value ? 'selected' : '')
                .click(e => {
                    const val = $(e.target).data('value');
                    popup.attr('aria-hidden', true);
                    $(sel).val(val)
                    $('li', ul).removeClass('selected')
                    e.target.className = 'selected';
                    onselect (val);
                })
        })
        // Cancel button
        $('<button>')
            .attr('data-role','dialogBt')
            .attr('type', 'button')
            .text('annuler')
            .appendTo(form)
            .click(e => {
                e.preventDefault();
                e.stopPropagation();
                popup.attr('aria-hidden', true);
            });
        // Remove interaction on select input
        $(sel).on('mousedown', e => e.preventDefault())
            // Show popup on click
            .on('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                popup.attr('aria-hidden', false);
            })
            .data('menu', popup);
    }

    /** Filter select options
     * @param {Element} sel
     * @param {*} filter
     */
    setFilter(sel, filter) {
        $(sel).data('filter', filter);
        // Reset options
        const li = sel.parentNode.querySelectorAll('li')
        Array.prototype.forEach.call(li, opt => {
            $(opt).removeClass('filtered')
        })
        // Filter options
        if (filter) {
            Array.prototype.forEach.call(li, opt => {
                if (filter.includes(opt.value)) {
                    $(opt).addClass('filtered')
                }
            })
        }
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
 * @param {Boolean} ignoreReadOnly lorsqu on travaille sur des signalements, meme si la table est en lecture seule l'attribut reste ouvert en écriture
 * ce parametre doit donc etre a true lorsqu'on crée le formulaire pour la saisie d'un signalement
 * @param {String} style web|mobile
 * @returns 
 */
function createForm($container, id, theme, values = {}, ignoreReadOnly = false, style = 'web') {
    if (!('attributes' in theme && theme.attributes.length)) return null;
    if (['web', 'mobile'].indexOf(style) == -1) throw new Error('style parameter must be web or mobile');

    let $div = $('<div class="feature-form"></div>');
    let selector = `theme-${id}`;
    let $table = $(`<table id=${selector} class="table"></table>`);

    let form = new Form($table, id, ignoreReadOnly, style);
    $div.append($table);
    $container.append($div);

    for (var i in theme.attributes) {
        let themeAttr = theme.attributes[i];
        let type = themeAttr.type.toLowerCase();
        if (typesIgnored.includes(type)) return true;
        let $row = $('<tr></tr>');
        $row.attr('data-type', type);
        let $td = $('<td></td>').attr('data-title', themeAttr.title || themeAttr.name);

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