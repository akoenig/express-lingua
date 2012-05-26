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
        app.set('views', __dirname + '/views');
        app.set('view engine', 'ejs');

        // Lingua configuration
        app.use(lingua(app, {
            defaultLocale: 'en',
            path: __dirname + '/i18n'
        }));

        app.use(express.bodyParser());
        app.use(express.methodOverride());
        app.use(express.static(__dirname + '/public'));
        app.use(app.router);

        ...
    });
    ```
    _Note:_ Please ensure that the call: "app.use(app.router);" is the last entry in your configuration section.

2. **Create i18n resource files** - Note that you have to create a resource file for your default language. (In this example: './i18n/en.json' and './i18n/de-de.json').

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

3. a) **Use lingua in your views - Static output** - Note that the syntax depends on your template engine. In this example it is: [ejs](http://embeddedjs.com/) and the request comes from a browser which sends 'en' with the HTTP request header.

    ```html
    <h1><%= lingua.title %></h1> <!-- out: <h1>Hello World</h1> -->
    <p><%= lingua.content.description %></h1> <!-- out: <p>A little description.</p> -->
    ```

3. b) **Use lingua in your views - Dynamic output** - Sometimes it is necessary to handle dynamic data within your express route and to pass it to the template. What if your text i18n resource is able to keep placeholders within a string where you can include your dynamic data? Well, it is possible. First of all, look at this i18n resource file:

    ```javascript
    // de.json
    {
    "greeting": "Hallo {name}. Dieser Schlüssel {code} wurde für Dich generiert."
    }
    ```

    Now it is possible to transfer an object from your route into your template:

    ```javascript
    app.get('/', function(req, res) {
        var names = ['Valentina', 'Sarah', 'Thomas', 'Claudia'];

        res.render('index', {
            person: {
                name: names[Math.floor(Math.random()*names.length)],
                code: Math.round(Math.random()*100)
            }
        });
    });
    ```

    And finally you can use the "lingua compiler" -> "linguac" in your template:

    ```html
    <p><%= linguac(lingua.greeting, person) %></p>
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

You can find a deployed version of this app [here](http://express-lingua-demo.herokuapp.com).

## License

[MIT License](http://www.opensource.org/licenses/mit-license.php)

## Author

Copyright (c) 2012, [André König](http://lochkartenstanzer.de) ([Google+](http://profile.lochkartenstanzer.de)) (andre.koenig -[at]- gmail [*dot*] com)
