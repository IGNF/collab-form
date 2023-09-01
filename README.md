# collab-form

Module javascript permettant la création et la gestion de formulaires provenant de l'api collaboratif. 

## Installation

Dans le .npmrc global (dans le dossier utilisateur sur windows) ou dans celui du projet ajouter les lignes suivantes, en ajoutant votre token:

@ign-mut:registry=https://gitlab.gpf-tech.ign.fr/api/v4/packages/npm/

//gitlab.gpf-tech.ign.fr/api/v4/packages/npm/:_authToken=MON_TOKEN

//gitlab.gpf-tech.ign.fr/api/v4/projects/:_authToken=MON_TOKEN

puis:

<pre>
npm add @ign-mut/collab-form
</pre>

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
