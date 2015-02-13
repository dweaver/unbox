'use strict';
var express = require('express');
var _ = require('underscore');
var cons = require('consolidate');
var app = express();
var provision = require('./provision');

app.set('port', (process.env.PORT || 4040));
app.use(express.static(__dirname + '/public'));

// use underscore for templates
app.engine('html', cons.underscore);
app.set('views', './views');
app.set('view engine', 'html');

app.get('/', function(request, response) {
  provision.listModels(process.env.VENDOR_TOKEN, function(err, models) {
    if (err) {
      console.log(err);
      response.write('Error: ' + err);
      return;
    }
    response.render('index.html', {models: models});
  });
});

app.listen(app.get('port'), function() {
  console.log("Node app is running at localhost:" + app.get('port'));
});
