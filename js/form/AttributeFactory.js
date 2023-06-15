import {DateAttribute} from "./Attribute/Date"; 
import {BooleanAttribute} from "./Attribute/Boolean";
import {ChoiceAttribute} from "./Attribute/Choice";
import {DocumentAttribute} from "./Attribute/Document";
import {DoubleAttribute} from "./Attribute/Double";
import {IntegerAttribute} from "./Attribute/Integer";
import {LikeAttribute} from "./Attribute/Like";
import {StringAttribute} from "./Attribute/String";
import {JsonAttribute} from "./Attribute/JsonAttribute";


class AttributeFactory {
    static create(id, name, type, formId, options = {}) {
        const canBeSelect = ['date', 'datetime', 'year', 'yearmonth', 'string', 'integer', 'double'];
        const typel = type.toLowerCase();
        
        let hasList = false;
        if (options.listOfValues && !options.enum) options.enum = options.listOfValues;
        if (Array.isArray(options.enum) && options.enum.length != 0) {
            hasList = true;
        } else if (options.enum instanceof Object && Object.keys(options.enum).length){
            hasList = true;
        }
        if (canBeSelect.indexOf(typel) != -1 && hasList) {
            return new ChoiceAttribute(id, name, formId, options)
        }

        switch (typel) {
            case 'date':
            case 'datetime':
            case 'year':
            case 'yearmonth':
                return new DateAttribute(id, name, typel, formId, options);
            case 'document':
                return new DocumentAttribute(id, name, formId, options);
            case 'string':
            case 'text':
                return new StringAttribute(id, name, formId, options);
            case 'boolean':
            case 'checkbox':
                return new BooleanAttribute(id, name, formId, options);
            case 'integer':
            case 'int':
                return new IntegerAttribute(id, name, formId, options);
            case 'double':
            case 'number':
                return new DoubleAttribute(id, name, formId, options);
            case 'like':
                return new LikeAttribute(id, name, formId, options);
            case 'list':
                return new ChoiceAttribute(id, name, formId, options);
            case 'jsonvalue':
                return new JsonAttribute(id, name, formId, options);
            default:
                throw new Error(`Attribute type ${type} unknown. Choose one in [date, datetime, year, yearmonth, document, string, integer, double, boolean, like]`);
        }
    }
};

export {AttributeFactory};