# Lingua

Lingua is a middleware for the Express.js framework that helps you to internationalise your webapp easily. It determines the language of the user agent and pushes the i18n resources to your views.

## Installation

    $ npm install lingua

## Quick Start

Using lingua comes down with four simple steps:

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

2. **Create i18n resource files** - Note that you have to create a resource file for your default language. (In this example: './i18n/en.json').

    ```javascript
    // en.json
        {
            "title": "Hello World",
            "content": {
                "description": "A little description."
            }
        }

    // de-de.json
        {
            "title": "Hallo Welt",
            "content": {
                "description": "Eine kleine Beschreibung."
            }
        }
    ```

3. **Use lingua in your views** - Note that the syntax depends on your template engine. In this example it is: [jqtpl](https://github.com/kof/node-jqtpl) and the request comes from a browser which sends 'en' with the HTTP request header.

    ```html
    <h1>${lingua.title}</h1> <!-- out: <h1>Hello World</h1> -->
    <p>${lingua.content.description}</h1> <!-- out: <p>A little description.</p> -->
    ```

4. **Let the user select a language** - Note that the user's selection is persisted within a cookie. This is an optional step. If you want to let lingua determine the user language from the browser configuration then leave this step out. Anyway, this is a very handy feature for switching the language by a user decision.

    ```html
    <a href="?language=de-DE">de-DE</a>
    <a href="?language=en-US">en-US</a>
    ```


## Example Application

There is an example application at [./example](https://github.com/akoenig/express-lingua/tree/master/example)

To run it:

    $ cd example
    $ node app.js

You can find a deployed version of this app [here](http://lingua-demoapp.lochkartenstanzer.de).

## License

[MIT License](http://www.opensource.org/licenses/mit-license.php)

## Author

Copyright (c) 2011, [André König](http://lochkartenstanzer.de) ([Google+](http://profile.lochkartenstanzer.de)) (andre.koenig -[at]- gmail [*dot*] com)
