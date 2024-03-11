/**
 * Classe de base pour formattage des erreurs pour les attributs de type JSON
 * https://json-schema.org/
 * https://ajv.js.org/
 */
class JsonAttributeErrors {
    constructor() {
        this._errors = null;
    }

    format(errors) {}
    _buildHtml() {}
}

/**
 * Classe pour le formattage des erreurs pour les attributs 
 * de type JSON (type = object voir https://json-schema.org/)
 */
class JsonAttributeObjectErrors extends JsonAttributeErrors {
    constructor() {
        super();
    }

    /**
     * Formattage des erreurs
     * @param Array errors 
     * @returns string
     */
    format(errors) {
        if (! errors.length) return null;

        let regex = /\.(.*)/;

        this._errors = {};
        errors.forEach(error => {
            let res = regex.exec(error.dataPath);
            let key = res[1];
            
            if (! (key in this._errors)) {
                this._errors[key] = [];
            }
            this._errors[key].push(error.message);
        });

        return this._buildHtml();
    }

    /**
     * Construit le HTML à partir de this._errors
     * @returns string
     */
    _buildHtml() {
        let $div = $('<div>');
        for (const [key, errs] of Object.entries(this._errors)) {
            $div.append(`${key} :<br>`);
            let $ul = $('<ul>', { class: 'small ml-1 mb-0 pl-1' });

            errs.forEach(err => {
                $ul.append($(`<li>${err}</li>`).css('list-style', 'square'))    
            })
            $div.append($ul);
        }
        return $div[0].outerHTML
    }
}

/**
 * Classe pour le formattage des erreurs pour les attributs 
 * de type JSON (type = array voir https://json-schema.org/)
 */
class JsonAttributeArrayErrors extends JsonAttributeErrors {
    constructor() {
        super();
    }

    /**
     * Formattage des erreurs
     * @param Array errors 
     * @returns string
     */
    format(errors) {
        if (! errors.length) return null;

        let regex = /\[(\d+)\]\.(.*)/;
        let regexWithoutKey = /\[(\d+)\]/;
        
        this._errors = {};
        errors.forEach(error => {
            
            let res = regex.exec(error.dataPath);
            if (!res) {
                res = regexWithoutKey.exec(error.dataPath);
                res[2] = 'global';
            }
            
            let num = res[1]; let key = res[2];
            if (! (num in this._errors)) {
                this._errors[num] = {};
                this._errors[num][key] = [];
            }
            if (! (key in this._errors[num])) {
                this._errors[num][key] = [] ;
            }
            this._errors[num][key].push(error.message);
        });

        return this._buildHtml();
    }

    /**
     * Construit le HTML à partir de this._errors
     * @returns string
     */
    _buildHtml() {
        let $maindiv = $('<div>');
        for (const [num, keyErrors] of Object.entries(this._errors)) {
            let index = parseInt(num, 10) + 1;

            let $div = $('<div>');
            $div.append(`[Objet ${index}]<br>`);
            for (const [key, errs] of Object.entries(keyErrors)) {
                $div.append(`${key} :<br>`);
                let $ul = $('<ul>', { class: 'small ml-1 mb-0 pl-1' });

                errs.forEach(err => {
                    $ul.append($(`<li>${err}</li>`).css('list-style', 'square'))    
                })
                $div.append($ul);
            }
            $maindiv.append($div);
        }
        return $maindiv[0].outerHTML
    }
}

/**
 * Factory pour la creation d'une classe heritee de JsonAttributeErrors
 * Depend du type (object|array de https://json-schema.org/)
 */
class JsonAttributeErrorsFactory {
    static create(type) {
        switch (type) {
            case 'object':
                return new JsonAttributeObjectErrors();
            case 'array':
                return new JsonAttributeArrayErrors();
            default:
                throw new Error(`${type} unknown. Choose one in [object, array]`);
        }
    }
};

export { JsonAttributeErrorsFactory };