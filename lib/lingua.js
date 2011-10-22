/*
 * express-lingua
 * A i18n middleware for the Express.js framework.
 *
 * Licensed under the MIT:
 * http://www.opensource.org/licenses/mit-license.php
 *
 * Copyright (c) 2011, André König (andre.koenig -[at]- gmail [*dot*] com)
 *
 */
var Guru = require('./guru');
var Trainee = require('./trainee');

module.exports = function(app, options) {

    var _name = 'lingua';

    //
    // DOCME
    //
    var configuration = {
        storage: {
            key: 'language'
        },
        resources: {
            defaultLocale: options.defaultLocale,
            path: options.path,
            serialisation: '.json'
        }
    };

    //
    // Verify the given parameters.
    //
    // So the middleware init call should look like:
    //
    //     app.configure(function() {
    //         // Lingua configuration
    //         app.use(lingua(app, {
    //             defaultLocale: 'en',
    //             path: __dirname + '/i18n'
    //         }));
    //     });
    //
    // It is necessary to define the "default locale" and the "path"
    // where lingua finds the i18n resource files.
    //
    if (!configuration.resources.defaultLocale) {
        throw new Error(_name + ': Please define a default locale while registering the middleware.');
    }

    if (!configuration.resources.path) {
        throw new Error(_name + ': Please define a path where ' + _name +  ' can find your locales.');
    } else {
        if (configuration.resources.path[configuration.resources.path.length] !== '/') {
            configuration.resources.path = configuration.resources.path + '/';
        }
    }

    //
    // DOCME
    //
    var guru = new Guru(configuration);
    //
    // DOCME
    //
    var trainee = new Trainee(configuration);

    //
    // summary:
    //     Inits the view helper.
    //
    // description:
    //     To be able to access the defined i18n resource in
    //     the views, we have to register a dynamic helper. With
    //     this it is possible to access the text resources via
    //     the following directive. Be aware that it depends on
    //     the syntax of the used template engine. So for "jqtpl"
    //     it would look like:
    //
    //         ${lingua.attribute}
    //
    //     # Example #
    //     
    //     de-de.json:
    //         {
    //             "title": "Hallo Welt",
    //             "content": {
    //                 "description": "Eine kleine Beschreibung."
    //             }
    //         }
    //
    //     en.json:
    //         {
    //             "title": "Hello World",
    //             "content": {
    //                 "description": "A little description."
    //             }
    //         }
    //
    //     index.html (de-de in the HTTP request header):
    //         <h1>${lingua.title}</h1> <!-- out: <h1>Hallo Welt</h1> -->
    //         <p>${lingua.content.description}</h1> <!-- out: <p>Eine kleine Beschreibung.</p> -->
    //
    //
    app.dynamicHelpers({
        lingua: function(req, res){
            return res.lingua.content;
        }
    });

    //
    // summary:
    //     The middleware function.
    //
    // description:
    //     This function will be called on every single
    //     HTTP request.
    //
    return function lingua(req, res, next) {
        //
        // Determine the locale in this order:
        // 1. URL query string, 2. Cookie analysis, 3. header analysis
        //
        var locales = trainee.determineLocales(req, res);

        var resource = guru.ask(locales);
        var locale = resource.locale;

        trainee.persistCookie(req, res, locale);

        res.lingua = resource;

        next();
    };
};