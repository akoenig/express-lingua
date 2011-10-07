/*
 * express-lingua 
 * Example application
 *
 * Licensed under the MIT:
 * http://www.opensource.org/licenses/mit-license.php
 *
 * Copyright (c) 2011, André König (andre.koenig -[at]- gmail [*dot*] com)
 *
 */
/**
 * Module dependencies.
 */

var express = require('express'),
    lingua = require('../lib/lingua');

var app = module.exports = express.createServer();

// Configuration

app.configure(function(){
    app.register(".html", require("jqtpl").express);
    app.set('views', __dirname + '/views');
    app.set("view engine", "html");

    // Lingua configuration
    app.use(lingua(app, {
        defaultLocale: 'de-de',
        path: __dirname + '/i18n'
    }));

    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(app.router);
    app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
    app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
});

app.configure('production', function(){
    app.use(express.errorHandler()); 
});

// Routes

app.get('/', function(req, res){
    res.render('index');
});

app.listen(3000);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
