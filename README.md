# collab-form

Module javascript permettant la création et la gestion de formulaires provenant de l'api collaboratif. 


## Dépendances

Le module fonctionnant avec JQuery, la variable globale $ doit être définie dans le projet

Autres dépendances:

    moment

    tempusdominus-bootstrap-4

    ajv-i18n

    combobox

## Exemple d'utilisation

html:

<pre>
    &lt;div id="#my-form-container">&lt;/div>
</pre>

script: 

<pre>

    import {createForm} from collab-form;
    
    let theme = mon_theme_recupere_via_api;
    let form = createForm($("#my-form-container"), "my-first-form", theme);
    
    form.init() //lorsque le dom est completement charge
    
    let validate = function() {
        let valid = true;
        for (var i in form.attributes) {
            if (!form.attributes[i].validate()) {
                alert(attribute.error);
                valid = false;
            }
        }
    }

</pre>

## Evenements

Lors de l' ajout d un nouvel objet Json dans le champs JsonAttribute, un evenement new_json_object_event est déclenché sur l element dom du formulaire, avec en paramètre l identifiant de la nouvelle div cree contentant le formulaire de l'objet json.
Cet évènement est utilisé afin de pouvoir gérer plus facilement l initialisation différente des champs selon le cas où l'on utilise le module sur le web ou le mobile.

## Attention

Les traductions restent à faire.

Intégrer proprement les icônes du json attribute

