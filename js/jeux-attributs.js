/**
 * Ce plugin permet la mise à jour de champs qui lui sont liés
 * 
 * Ce plugin doit etre applique sur des elements de type "select" ou "input"
 * l'ideal est que containerId soir de type "form". Si rien n'est renseigne, on prend le parent comme container
 * 
 */
(function($) {
    const PLUGIN_NAME = 'jeuxAttributs';

    function jeuxAttributs(element, options) {
        let defaults = {
            'containerId': null,
            'config': {}
        };

        let $element = $(element);

        let plugin = this;
        plugin.settings = {};

        plugin.init = () => {
            plugin.settings = $.extend({}, defaults, options);
            
            try {
                // l'option formId est obligatoire
                if (! plugin.settings.containerId) {
                    throw("containerId is mandatory");
                }
                plugin.$container = $(plugin.settings.containerId);

                // l'element doit etre de type 'input' ou 'select'
                if (! $element.is('select') && ! $element.is('input')) {
                    throw("This element is not select or input type");
                }

                // l'option config
                if (! plugin.settings.config){
                    throw("config is mandatory");
                }

                if ("string" === typeof plugin.settings.config) {   // C'est une chaine
                    try {
                        plugin.settings.config = JSON.parse(plugin.settings.config);
                    } catch (e) { throw e; }  
                }

                if (plugin.settings.config !== Object(plugin.settings.config)) { // Ce n'est pas un objet
                    throw("config is not valid");
                }
            } catch(e) {
                console.warn(e);
                plugin.settings.config = {};
            }
        }

        plugin.init();

        let event = ($element.data('customCombobox')) ? "comboboxselect" : "change";
        $element.on(event, () => {
            let containerId = plugin.settings.containerId;

            let srcValue = $element.val();
            if (srcValue in plugin.settings.config) {
                $.each(plugin.settings.config[srcValue], (key, value) => {
                    let selector = `[data-form-ref="${containerId}"][name="${key}"]`;
                    let $target = $(selector);
                    if ($target.length) {
                        let cbb = $target.data('customCombobox');
                        cbb ? cbb.setOption(value) : $target.val(value);
                    }
                });
            }
        });
    }

    $.fn[PLUGIN_NAME] = function(options) {
        return this.each(function() {
            let key = `plugin-${PLUGIN_NAME}`;
            if (undefined == $(this).data( key)) {
                let plugin = new jeuxAttributs(this, options);
                $(this).data(key, plugin);
            }
        });
    }
})(jQuery);