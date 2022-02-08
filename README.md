# collab-form

Module javascript permettant la création et la gestion de formulaires provenant de l'api collaboratif. 

## Installation

npm install git+http://gitlab.dockerforge.ign.fr/collaboratif/collab-form.git

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

## Attention

Les traductions restent à faire.

Le champs document n'est pour le moment pas utilisable en dehors du site collaboratif. Les routes de gestions des documents n'étant pas exposées. (On peut le transformer en champs texte pour avoir le lien par exemple)