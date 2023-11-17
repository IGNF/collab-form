let FillConstraint = function(formId) {
	this._dependents = {};
	this.formId = formId;
	
	this._getDependentsName = function(conditionField) {
		let names = [];
		if (conditionField in this._dependents) {
			$.each(this._dependents[conditionField], function(index, dependent) {
				names.push(dependent.name);
			});
		}
		return names;
	}
};

FillConstraint.prototype.add = function(name, conditionField, constraint) {
	let c = {name: name, constraint: constraint};
	if (conditionField in this._dependents) {
		this._dependents[conditionField].push(c);
	} else this._dependents[conditionField] = [c];
};

FillConstraint.prototype.init = function($parent) {
	let self = this;
	
	$.each(this._dependents, function(conditionField, dependents) {
		let names = self._getDependentsName(conditionField);
		
		let $field = $(`.feature-attribute[name="${conditionField}"][data-form-ref="${self.formId}"]`, $parent);
		$field.addClass('has-dependents')
			.attr('data-dependents', JSON.stringify(names)); 
		
		$.each(dependents, function(index, dependent) {
			let attribute 	= dependent.name;
			let constraint 	= dependent.constraint;
			
			let $attribute 	= $(`[name="${attribute}"][data-form-ref="${self.formId}"]`, $parent);
			$attribute.addClass('dependent')
				.attr('data-constraint', JSON.stringify(dependent.constraint))
				.attr('data-dependency', conditionField);
			
			let value = $field.val();
			if (constraint.type === 'document') {
				$attribute.prop('disabled', true);
			} else if (constraint.type === 'regex') {
				if (value && value.match(constraint.regex)) {
					$attribute.prop('disabled', false);
				} else {
					$attribute.prop('disabled', true);
					$attribute.val($attribute.data('default-value'));
				}
			}
		});
	});
};

module.exports = {
    FillConstraint: FillConstraint
};