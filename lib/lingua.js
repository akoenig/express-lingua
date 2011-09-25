/*
 * express-lingua
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
    // summary:
    //     DOCME
    //
    // description:
    //     DOCME
    //
    var DEFAULTS = {
        extension: '.json'
    };

    //
    // summary:
    //     DOCME
    //
    // description:
    //     DOCME
    //
    var resources = [];

    //
    // summary:
    //     DOCME
    //
    // description:
    //     DOCME
    //
    var guru = {

        //
        // summary:
        //     DOCME
        //
        // description:
        //     DOCME
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
        //     DOCME
        //
        // description:
        //     DOCME
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
        //     DOCME
        //
        // description:
        //     DOCME
        //
        // note:
        //     connect-i18n: https://github.com/masylum/connect-i18n/blob/master/lib/connect-i18n.js
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
        //     DOCME
        //
        // description:
        //     DOCME
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
    // DOCME
    //
    guru.learn();

    //
    // DOCME
    //
    guru.help();

    //
    // summary:
    //     DOCME
    //
    // description:
    //     DOCME
    //
    return function lingua(req, res, next) {
        var headers = req.headers;
        var locale = guru.determine(headers);

        res.lingua = guru.ask(locale);

        next();
    };
};