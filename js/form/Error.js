import {errors} from '../messages';

class Error {
    /**
     * 
     * @param {String} key la cle de l erreur dans messages 
     * @param {Array} args un tableau d arguments dans l ordre de remplacement dans le message
     */
    constructor(key = 'unknown', args = []) {
        this.key = key;
        this.args = args;
    }

    getMessage() {
        let message = errors[this.key] ? errors[this.key] : errors['unknown'];
        for(var i in this.args) {
            message = message.replace(/\?/, this.args[i]);
        }
        return message;
    }
}

export {Error};