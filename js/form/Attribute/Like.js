import {Attribute} from './Attribute';

/**
 * userId doit etre ajoute dans les options du champs pour qu il puisse etre cree
 */
class LikeAttribute extends Attribute {
    constructor(id, name, formId, options) {
        super(id, name, formId, options);
        if (!('userId' in options)) {
            throw new Error('Need userId to create Like attribute');
        }
        this.userId = options.userId;
        this.type = "like";
    }

    getDefaultValue() {
        return {'cnt': 0, 'userid': this.userId, 'validDate': null};
    }

    getDOM(value) {
        let $input = $(`<input class="feature-attribute mask_date" id="${this.id}" type="text" name="${this.name}" readonly="readonly" disabled data-form-ref="${this.formId}"/>`);
        value = value ? value : this.getDefaultValue();
        if (value && value.validDate) {
            $input.val(value.validDate);
        }
        if (typeof value === "object") {
            value =  JSON.stringify(value);
        }
        if (this.defaultValue) $input.data('defaultValue', this.defaultValue);
        
        var $hiddenInput = $(`<input id='hidden-${this.id}' type='hidden' value='${value}' />`);
        return [$input, $hiddenInput];
    }

    getDOMLabel() {
        let $label = super.getDOMLabel();
        let $b= $("<button class='btn-like' name='likeBtn'  id='likeb-" + this.id +"'> <i class='fa fa-thumbs-up'></i></button>");
        $label =  $label.append($b);

        let $cnt = $("<label class='cnt-like' id='likeCnt-" + this.id +"'  />");
        $label =  $label.append($cnt);

        return $label;
    }

    getNormalizedValue() {
        let value= {};
        value['cnt'] = $("#likeCnt-"+ this.id).html();
        value['validDate'] = $("#"+this.id).val();
        value['userid'] = this.userId;
        return this.normalize(value);
        
    }

    normalize(value) {
        try {
            if (typeof value == 'object'){
                var result = value;
            } else {
                var result = JSON.parse(value);
            }
        } catch (e){
            var result = {};
            result['validDate'] = value;
            result['cnt'] = 0;
        }
        if (!result || !parseInt(result['cnt'])) return null;// en cas de 0 like on laisse la valeur nulle inchangee
        return result;
    }

    validate(value) {
        this.error = null;
        return true;        
    }

    init() {
        super.init();
        var self=this;

        let $hiddenInput = $("#hidden-"+this.id);    
        let likeValues = JSON.parse($hiddenInput.val());
        let $cnt = $("#likeCnt-" + this.id);
        $cnt.html(likeValues.cnt);

        let $b = $("#likeb-"+ this.id);
        $b.on('click', function(event){
            var val = $("#hidden-"+self.id).val();

            val = JSON.parse(val);

            if (val.validDate === null){
                val.validDate = $('#'+self.id).val();
            }
            if (val.cnt === null){
                val.cnt = 0;
            }

            var now = new Date();
            var date = now.getFullYear() + "-" + (now.getMonth()+1) + "-" + now.getDate();
            if (self.userId == val.userid && val.validDate == date){
                    return;
            }
            var n = '#likeCnt-'+ self.id;
            var v = $(n).html() === '' ? 1: parseInt($(n).html())+1;
            $(n).html(v);

            val.userid = self.userId;
            val.validDate = date;

            $('#'+self.id).val( val.validDate);
            $("#hidden-"+self.id).val('{"userid":'+val.userid+',"validDate":"'+val.validDate+'","cnt":'+val.cnt+'}');
        });
    }
};

export {LikeAttribute};