/*
 * express-lingua
 * A i18n middleware for the express.js framework.
 *
 * Licensed under the MIT:
 * http://www.opensource.org/licenses/mit-license.php
 *
 * Copyright (c) 2011, André König (andre.koenig -[at]- gmail [*dot*] com)
 *
 */
var fs = require('fs');

module.exports = function(app, options) {

    //
    // Constants
    //
    var DEFAULTS = {
        extension: '.json'
    };

    //
    //
    // summary:
    //     The i18n resource cache.
    //
    // description:
    //     The loaded resources. After booting the express.js
    //     application lingua will parse the complete resource
    //     directory and inserts every single i18n resource into
    //     this cache. That makes resolving the entries very fast.
    //     The flipside of the coin is that it is not possible to
    //     change the i18n resources while the application is running.
    //
    //     In further versions we will have a "i18n resource hot deployment".
    //     I promise it ... :)
    //
    var resources = [];

    //
    // summary:
    //     The mighty guru ...
    //
    // description:
    //     The guru is the helper object which encapsulates
    //     the complete lingua logic.
    //     
    //
    var guru = {

        //
        // summary:
        //     Guru learns the languages.
        //
        // description:
        //     Loads all i18n resource files, parses and persists
        //     them in the resource cache (see above).
        //
        // exception:
        //     If there is no i18n resource file for the configured
        //     default language the guru has to throw an error.
        //
        learn : function() {
            var path = options.path;

            var files = fs.readdirSync(path);

            files.forEach(function(file) {
                var content = fs.readFileSync(path + file);

                var resource = {
                    locale: file.replace(DEFAULTS.extension, ''),
                    content: JSON.parse(content)
                };

                resources.push(resource);
            });

            // Check if the resource for the default
            // locale is available. If not, well, ERROR!
            var available = false;
            resources.forEach(function(resource) {
                if (resource.locale === options.defaultLocale) {
                    available = true;
                }
            });

            if (!available) {
                throw new Error('lingua: Please create a resource file for your default locale: '+options.defaultLocale);
            }
        },

        //
        // summary:
        //     Shares his language knowledge.
        //
        // description:
        //     Returns the complete i18n object which was defined in
        //     the language file by the given language code.
        //     So if the "locale" is "de-de" then the guru will return
        //     the content which was defined in the "de-de.json" file.
        //
        ask : function(locale) {
            var resource = resources.filter(function(resource) {
                return (resource.locale === locale);
            })[0];

            if (!resource) {
                resource = resources.filter(function(resource) {
                    return (resource.locale === options.defaultLocale);
                })[0];
            }

            return resource;
        },

        //
        // summary:
        //     Determines the language by a given HTTP request header.
        //
        // description:
        //     HTTP request header analysis and returns the first found iso
        //     language code.
        //
        // note:
        //     Based on connect-i18n: https://github.com/masylum/connect-i18n/blob/master/lib/connect-i18n.js
        //
        determine : function(headers) {
            var accept_language = headers['accept-language'];
            var tokens = [];
            var locales = [];

            var result = null;

            if (accept_language) {
                accept_language.split(',').forEach(function (lang) {
                    locales.push(lang.split(';', 1)[0].toLowerCase());
                });

                result = locales;
            } else {
                result = [options.defaultLocale];
            }

            return result[0];            
        },

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
        help : function() {
            app.dynamicHelpers({
                lingua: function(req, res){
                    return res.lingua.content;
                }
            });
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
    if (!options.defaultLocale) {
        throw new Error('lingua: Please define a default locale while registering the middleware.');
    }

    if (!options.path) {
        throw new Error('lingua: Please define a path where lingua can find your locales.');
    } else {
        if (options.path[options.path.length] !== '/') {
            options.path = options.path + '/';
        }
    }

    //
    // Load all i18n resource files.
    //
    guru.learn();

    //
    // Init the view helper.
    //
    guru.help();

    //
    // summary:
    //     The middleware function.
    //
    // description:
    //     This function will be called on every single
    //     HTTP request.
    //
    return function lingua(req, res, next) {
        var headers = req.headers;
        var locale = guru.determine(headers);

        res.lingua = guru.ask(locale);

        next();
    };
};