# Lingua

Lingua is a middleware for the Express.js framework that helps you to internationalise your webapp easily. It determines the language of the user agent and pushs the i18n resources to your views.

## Installation

    $ npm install lingua

## Quick Start

Using lingua comes down with three simple steps:

1. **Grab lingua**
    ```javascript

    var express = require('express'),
        lingua  = require('lingua');

    ...
    // Express init code goes here
    ...    

    // Express app configuration code and lingua init.
    app.configure(function(){
        ...
        app.register(".html", require("jqtpl").express);
        app.set('views', __dirname + '/views');
        app.set("view engine", "html");

        // Lingua configuration
        app.use(lingua(app, {
            defaultLocale: 'en',
            path: __dirname + '/i18n'
        }));

        app.use(express.bodyParser());
        app.use(express.methodOverride());
        app.use(app.router);
        app.use(express.static(__dirname + '/public'));

        ...
    });
    ```

2. **Create i18n resource files** - Note that you have to create a resource file for your default language. (In this example: './i18n/de-de.json').

    ```javascript
    // en.json
        {
            title": "Hello World",
            content": {
                "description": "A little description."
            }
        }

    // de-de.json
        {
            title": "Hallo Welt",
            content": {
                "description": "Eine kleine Beschreibung."
            }
        }
    ```

3. **Use lingua in your views** - Note that the syntax depends on your template engine. In this example it is: [jqtpl](https://github.com/kof/node-jqtpl) and the request comes from a browser which sends 'en' with the HTTP header.

    <h1>${lingua.title}</h1> <!-- out: <h1>Hello World</h1> -->
    <p>${lingua.content.description}</h1> <!-- out: <p>A little description.</p> -->

## Example Application

There is an example application at [./example](https://github.com/akoenig/express-lingua/tree/master/example)

To run it:

    $ cd example
    $ node app.js

## License

[MIT License](http://www.opensource.org/licenses/mit-license.php)

Copyright (c) 2011, André König (andre.koenig -[at]- gmail [*dot*] com)

## Author

[André König](http://lochkartenstanzer.de) ([Google+](http://gplus.name/andrekoenig))