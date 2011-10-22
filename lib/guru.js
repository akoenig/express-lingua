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

var fs = require('fs');

module.exports = (function() {

    var _name = 'lingua:Guru';

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
    var Guru = function(configuration) {
        if (!configuration) {
            throw new Error(_name + ': Please pass the configuration to the constructor.');
        } else {
            this.configuration = configuration;
        }

        var that = this;

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
        this.resources = [];

        var path = configuration.resources.path;
        var files = fs.readdirSync(path);

        files.forEach(function(file) {
            if (fs.statSync(path + file).isFile()) {
                var content = fs.readFileSync(path + file);

                var resource = {
                    locale: file.replace(that.configuration.resources.serialisation, ''),
                    content: JSON.parse(content)
                };

                that.resources.push(resource);
            }
        });

        // Check if the resource for the default
        // locale is available. If not, well, ERROR!
        var available = false;
        this.resources.forEach(function(resource) {
            if (resource.locale === that.configuration.resources.defaultLocale) {
                available = true;
            }
        });

        if (!available) {
            throw new Error(_name + ': Please create a resource file for your default locale: '+this.configuration.resources.defaultLocale);
        }
    };

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
    Guru.prototype.ask = function(locales) {
        var that = this;

        var resource, i;
        
        var _filter = function(filter) {
            return that.resources.filter(function(resource) {
                return (resource.locale === filter);
            })[0];            
        };

        for (i = 0; i < locales.length; i++) {
            resource = _filter(locales[i]);

            if (resource) {
                break;
            }
        }

        if (!resource) {
            resource = _filter(that.configuration.resources.defaultLocale);
        }

        return resource;
    };

    return Guru;
}());