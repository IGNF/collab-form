import {Attribute} from './Attribute';

/**
 * documents must be managed in each app separately.
 * this class watching for changes in input class to trigger action on dependants fields
 */
class DocumentAttribute extends Attribute {
    constructor(id, name, formId, options = {}) {
        super(id, name, formId, options);
        this.mimeTypes = options.mime_types;
        this.type = "document";
    };

    getDOM(value) {
        let $dom = [];
        let $a = $(`<a id="a-${this.id}" href="#"></a>`);
        $a.attr('download', null);
        $a.attr('data-docid', value);
        $a.attr('mime-types', this.mimeTypes);
        $dom.push($a);
        let $input = $(`<input class="feature-attribute" id="${this.id}" type="file" name="${this.name}" data-form-ref="${this.formId}"/>`);
        if (this.defaultValue) $input.data('defaultValue', this.defaultValue);
        $input.css('display', 'none');
        $dom.push($input);

        return $dom;
    };

    getNormalizedValue() {
        let $a = $("#a-"+this.id);
        let value = $a.attr('data-docid');

        return this.normalize(value);
    }

    normalize(value) {
        if ([null, ''].indexOf(value) !== -1) return null;
        return value;
    }

    init() {
        super.init();
        let self = this;
        if (this.automatic) {
            $("#"+this.id).prop('disabled', true);
        }

        //repercussions champs dependants lors ajout ou changement de document
        $("#"+this.id).on('change', function() {
            // On récupère le fichier
            var file = $(this)[0].files[0];
            if (file) {
                self.onChange();
            } else {
                self.onDelete();
            }
        });
    }

    /**
     * a faire apres ajout ou changement de document
     */
    onChange() {
        let $el = $("#"+this.id);
        let file = $el[0].files[0];
        $el.trigger("attribute-modified");

        // Ajout des renseignements du fichier dans les champs dépendants
        let dependents = $el.data('dependents');
        if (! dependents)   return;

        $.each(dependents, function(index, dependent) {
            let $field = $(`[name="${dependent}"]`);
            
            let constraint = $field.data('constraint');
            if (constraint.type === 'document' && constraint.value.match(/(File\(\))$/)) {
                switch (constraint.value){
                    case 'dateFile()':
                        setFileDate(file, $field);
                        break;
                    case 'nameFile()':
                        $field.val(file.name);
                        break;
                    case 'mimetypeFile()':
                        $field.val(file.type);
                        break;
                    case 'sizeFile()':
                        $field.val(file.size);
                        break;
                }

                $field.trigger("attribute-modified");
            }
        });
    }

    /**
     * a faire apres suppression du document
     */
    onDelete() {
        let $el = $('#'+this.id);
        let dependents = $('input', $el.parent()).data('dependents');

        // l'id du document se trouve sur le tag a
        var $a = $el.siblings('a');

        var id = $a.attr('data-docid');
        if (!id) {
            return;
        }

        // Suppression de la valeur dans le champ dépendant
        if (! dependents)   return;
        $.each(dependents, function(index, dependent) {
            let $field = $(`[name="${dependent}"]`);
            
            let constraint = $field.data('constraint');
            if (constraint.type === 'document' && constraint.value.match(/(File\(\))$/)) {
                $field.val(null);
            }
        });
    }

    validate(value) {
        value = value ? value : this.getNormalizedValue();
        this.error = null;

        if (!this.validateDependant(value)) {
            return false;
        }
        return true;
    }

    // fonction asynchrone
    setFileDate(file, field) {
        let date = new Date(file.lastModified);
        EXIF.getData(file, function() {
            if (this.exifdata.DateTimeOriginal) {   // Date de prise de vue
                var d = this.exifdata.DateTimeOriginal.split(' ');
                d = d[0].replace(/:/g,'-') + 'T' +d[1];
                d = new Date(d);
                if (d) date = d;
            }
            let year = date.getFullYear(), 
                month = (date.getMonth() + 1 < 10) ? '0' + (date.getMonth() + 1) : date.getMonth() + 1,
                day = (date.getDate() < 10) ? '0' + date.getDate() : date.getDate(),
                time = date.toLocaleTimeString();

            var value;
            if (field.hasClass('mask_datetime')) {
                value = `${year}-${month}-${day} ${time}`;
            } else if (field.hasClass('mask_year')){
                value = year;
            } else if (field.hasClass('mask_yearmonth')){
                value = `${year}-${month}`;
            } else {
                value = `${year}-${month}-${day}`;    
            }
            
            if (value)  field.val(value);
        });
    }
};

export {DocumentAttribute};