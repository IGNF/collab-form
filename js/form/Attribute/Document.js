import {Attribute} from './Attribute';
import {errors} from '../../messages';
const bootbox = require('bootbox');

class DocumentAttribute extends Attribute {
    constructor(id, name, formId, options = {}) {
        super(id, name, formId, options);
        this.mimeTypes = options.mime_types;
    };

    getDOM(value) {
        let $dom = [];
        let $a = $(`<a id="a-${this.id}" href="#"></a>`);
        $a.attr('download', null);
        $a.attr('data-docid', value);
        $dom.push($a);
        let $input = $(`<input class="feature-attribute" id="${this.id}" type="file" name="${this.name}" data-form-ref="${this.formId}"/>`);
        if (this.defaultValue) $input.data('defaultValue', this.defaultValue);
        $input.css('display', 'none');
        $dom.push($input);

        if (!this.readOnly) {
            $dom.push($(`<button id="delete-btn-${this.id}" class="btn btn-default btn-xs document delete pull-right"><i class="fas fa-trash-alt no-trailing-space"></i></button>`));
            $dom.push($(`<button class='btn btn-primary btn-xs document pull-right' onclick="$('#${this.id}').click();"><i class='fas fa-folder-open no-trailing-space'></i></button>`));
        }

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

        this.updateLink(); //mise en place du lien vers le document existant
        
        //suppression du document
        $("#delete-btn-"+this.id).click(function() {
            self.onDelete();
        });

        //ajout ou changement de document
        $("#"+this.id).on('change', function() {
            self.onChange();
        });
    }

    /**
     * 
     * Ajout ou changement de document
     */
    onChange() {
        let $el = $('#'+this.id);

        // On récupère le fichier
        var file = $el[0].files[0];

        //si pas de fichier choisi
        if( file === undefined ){
            return;
        }

        var data = new FormData();
        data.append('fileToUpload', file);

        $el.parent().addClass('waiting');
        $.ajax({
            url: LinkUpdater.documentUrls_.add,
            type: "POST",
            data: data,
            processData: false,
            contentType: false
        }).done(function (result) {
            if (result.status !== 'OK') {
                if (bootbox) {
                    bootbox.alert({
                        className: 'modal-danger',
                        title: errors.title,
                        message: result.msg,
                        size: 'small'
                    });
                } else {
                    console.log(result.msg)
                }
                
                return;
            }

            var id = result.id;
            var href = LinkUpdater.documentUrls_.download.replace(/__ID__/, id);

            let $a = $el.siblings('a');
            $a.attr('data-docid', result.id).attr('href', href).attr('download', file.name);
            if (/jpg$|jpeg$|gif$|png$/i.test(file.name)) {
                $a.html('');
                $('<img>').attr('src', href).appendTo($a);
            } else {
                $a.text(file.name);
            }
            $el.parent().removeClass('waiting');
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
        }).fail(function (jqXHR) {
            $el.parent().removeClass('waiting');
            if (bootbox) {
                bootbox.alert({
                    className: 'modal-danger',
                    title: errors.title,
                    message: jqXHR.responseText,
                    size: 'small'
                });
            } else {
                console.log(jqXHR.responseText);
            }
        });
    }

    /**
     * 
     * Suppression du document
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

        var url = LinkUpdater.documentUrls_.remove.replace(/__ID__/g, id);
        $el.parent().addClass('waiting');
        fetch(url).then(function(){
            $a.attr('href', '#').attr('data-docid', '').attr('download', '').text('');
            let $input = $a.siblings('input.feature-attribute[type="file"]');
            $input.val('');
            $el.parent().removeClass('waiting');

            // Suppression de la valeur dans le champ dépendant
            if (! dependents)   return;
            $.each(dependents, function(index, dependent) {
                let $field = $(`[name="${dependent}"]`);
                
                let constraint = $field.data('constraint');
                if (constraint.type === 'document' && constraint.value.match(/(File\(\))$/)) {
                    $field.val(null);
                }
            });
        }).catch (error => {
            $el.parent().removeClass('waiting');
            if (bootbox) {
                bootbox.alert({
                    className: 'modal-danger',
                    title: errors.title,
                    message: error,
                    size: 'small'
                });
            } else {
                console.log(error);
            }
        });
    }

    updateLink() {
        let $el = $("#a-"+this.id);
        LinkUpdater.update($el);
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

class LinkUpdater {
    constructor() {
        this.documentUrls_ = null;
        //ex collaboratif
        // documentUrls_ = {
        //     'get': Routing.generate('gcms_ajax_document_get', {'id': '__ID__' }),
        //     'add': Routing.generate('gcms_ajax_document_add'),
        //     'remove' : Routing.generate('gcms_ajax_document_delete', {'id': '__ID__' }),
        //     'download' : Routing.generate('gcms_document_download', {'id': '__ID__' })
        // };
    }

    static update($el) {
        let id = $el.attr('data-docid');
        if (!id || !LinkUpdater.documentUrls_) {
            return;
        }

        var url = LinkUpdater.documentUrls_.get;
        url = url.replace(/__ID__/g, id);
        $el.parent().addClass('waiting');
        fetch(url).then(result => result.json()).then(response => {
            if (response && response.status === 'OK') {
                var link = LinkUpdater.documentUrls_.download.replace(/__ID__/g, id);
                var document = JSON.parse(response.document);
                $el.attr('href', link).attr('download', document.short_fileName);
                if ( response.isImage ) {
                    $el.html('');
                    $('<img>').attr('src', link).appendTo($el);
                } else {
                    $el.text(document.short_fileName);
                }
            }
            $el.parent().removeClass('waiting');
        }).catch(error => {
            $el.parent().removeClass('waiting');
        });
    }
}

export {DocumentAttribute, LinkUpdater};