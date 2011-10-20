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
var fs = require('fs'),
    url = require('url'),
    Cookies = require('cookies');

//
//
// summary:
//     A class associating language tags with quality values
//
// description:
//     A language tag identifies a language as described at
//     <http://www.w3.org/Protocols/rfc2616/rfc2616-sec3.html#sec3.10>
//     (e.g. 'en-us'). A quality value (qvalue) determines the
//     relative degree of preference for a language tag . Tags and
//     qvalues are present in the HTTP Accept-Language header
//     (http://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html#sec14.4)
//     (e.g. 'Accept-Language: en-gb,en-us;q=0.7,en;q=0.3')
//
var TagSet = function TagSet() {
    this.tagQvalues = {}; // associates 'q' values with language tags
};

//
//
// summary:
//     Associate a tag with a qvalue
//
// description:
//     More than one tag can be assigned to the same qvalue.
//
TagSet.prototype.addTag = function addTag(tag, qvalue) {
    try {
        this.tagQvalues[qvalue].push(tag);
    } catch (e) {
        if (!(e instanceof TypeError)) {
            throw e;
        }
        this.tagQvalues[qvalue] = [tag];
    }
};

//
//
// summary:
//     Associate multiple tags with a qvalue
//
// description:
//     A convenience method to save calling TagSet.addTag() multiple
//     times.
//
TagSet.prototype.addTags = function addTag(tags, qvalue) {
    try {
        this.tagQvalues[qvalue].push.apply(this.tagQvalues[qvalue], tag);
    } catch (e) {
        if (!(e instanceof TypeError)) {
            throw e;
        }
        this.tagQvalues[qvalue] = tags;
    }
};

//
//
// summary:
//     Get a list of all tags
//
// description:
//     The list of tags is ordered by the associated tag qvalue in
//     descending order.
//
TagSet.prototype.getTags = function getTags() {
    // get the reverse ordered list of qvalues e.g. -> [1, 0.8, 0.5, 0.3]
    var qvalues = [];
    for (var qvalue in this.tagQvalues) {
        if (this.tagQvalues.hasOwnProperty(qvalue)) {
            qvalues.push(qvalue);
        }
    }
    qvalues = qvalues.sort().reverse();

    // add the tags to the tag list, ordered by qvalue
    var tags = [];
    var self = this;
    qvalues.forEach(function(qvalue) {
        tags.push.apply(tags, self.tagQvalues[qvalue]);
    });

    return tags;
};

module.exports = function(app, options) {

    var _name = 'lingua';

    //
    // Constants
    //
    var CONSTANTS = {
        storagekey: 'language',
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
                    locale: file.replace(CONSTANTS.extension, ''),
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
                throw new Error(_name + ': Please create a resource file for your default locale: '+options.defaultLocale);
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
        ask : function(locales) {

            var resource, i;
            for (i = 0; i < locales.length; i++) {
                resource = resources.filter(function(resource) {
                    return (resource.locale === locales[i]);
                })[0];

                if (resource) {
                    break;
                }
            }

            if (!resource) {
                resource = resources.filter(function(resource) {
                    return (resource.locale === options.defaultLocale);
                })[0];
            }

            return resource;
        },

        //
        // summary:
        //     Determines the language by a given HTTP request header. If there is a cookie given,
        //     its value overrides the HTTP header. If there is a querystring 'lingua' given, it
        //     overrides the cookie.
        //
        // description:
        //     HTTP request header, cookie and querystring analysis and returns the first found iso
        //     language code.
        //
        // note:
        //     Based on connect-i18n: https://github.com/masylum/connect-i18n/blob/master/lib/connect-i18n.js
        //
        determine : function(querystring, cookies, headers) {
            var locales = [];

            var query = querystring.query[CONSTANTS.storagekey];
            var cookiecream = cookies.get(CONSTANTS.storagekey);

            if (query) {
                locales.push(query);

            } else if (cookiecream) {
                locales.push(cookiecream);

            } else {
                var acceptLanguage = headers['accept-language'];

                if (acceptLanguage) {
                    var tags = new TagSet();
                    var subtags = new TagSet();

                    // associate language tags by their 'q' qvalue (between 1 and 0)
                    acceptLanguage.split(',').forEach(function(lang) {
                        var parts = lang.split(';'); // 'en-GB;q=0.8' -> ['en-GB', 'q=0.8']
                        var tag = parts.shift().toLowerCase().trim(); // ['en-GB', 'q=0.8'] -> 'en-gb'
                        var primarySubtag = tag.split('-')[0].trimRight(); // 'en-gb' -> 'en'

                        // get the language tag qvalue: 'q=0.8' -> 0.8
                        var qvalue = 1; // default qvalue
                        for (var i = 0; i < parts.length; i++) {
                            var part = parts[i].split('=');
                            if (part[0] === 'q' && !isNaN(part[1])) {
                                qvalue = Number(part[1]);
                                break;
                            }
                        }

                        // add the tag and primary subtag to the qvalue associations
                        tags.addTag(tag, qvalue);
                        subtags.addTag(primarySubtag, qvalue);
                    });

                    // Add all the primary subtags to the tag set if
                    // required, using a default low qvalue for the
                    // primary subtags.
                    var subtagQvalue = (isNaN(options.subtagQvalue)) ? 0.1 : options.subtagQvalue;
                    if (subtagQvalue) {
                        tags.addTags(subtags.getTags(), subtagQvalue);
                    }

                    // add the ordered list of tags to the locales
                    locales.push.apply(locales, tags.getTags());

                } else {
                    locales.push(options.defaultLocale);
                }
            }

            return locales;
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
        throw new Error(_name + ': Please define a default locale while registering the middleware.');
    }

    if (!options.path) {
        throw new Error(_name + ': Please define a path where ' + _name +  ' can find your locales.');
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
        var query = url.parse(req.url, true);
        var cookies = new Cookies(req, res);
        var headers = req.headers;

        //
        // Determine the locale in this order:
        // 1. URL query string, 2. Cookie analysis, 3. header analysis
        //
        var locales = guru.determine(query, cookies, headers);
        var lingua = guru.ask(locales);
        var locale = lingua.locale;

        var expirationDate = new Date();
        expirationDate.setFullYear(expirationDate.getFullYear() + 1);
        cookies.set(CONSTANTS.storagekey, locale, { expires: expirationDate });

        res.lingua = lingua;

        next();
    };
};