/*
 * Unbox server
 */
'use strict';
var express         = require('express');
var _               = require('underscore');
var cons            = require('consolidate');
var bodyParser      = require('body-parser');
var portals         = require('./portals');
var jwt             = require('express-jwt');

var app = express();
app.use(bodyParser.json());

var jwtCheck = jwt({
  secret: new Buffer(process.env.AUTH0_CLIENT_SECRET, 'base64'),
  audience: process.env.AUTH0_CLIENT_ID
});

app.set('port', (process.env.PORT || 4040));

var admin = {
  user: process.env.PORTALS_ADMIN_EMAIL,
  pass: process.env.PORTALS_ADMIN_PASSWORD,
  sendImmediately: true
};

var host = process.env.PORTALS_HOST;
var secret = process.env.SESSION_SECRET;
var portalId = process.env.PORTAL_ID;

// use underscore for templates
app.engine('html', cons.underscore);
app.set('views', './views');
app.set('view engine', 'html');

app.use(express.static(__dirname + '/public'));

app.get('/', function (req, res) {
  res.render('index.html', {
    AUTH0_DOMAIN: process.env.AUTH0_DOMAIN,
    AUTH0_CLIENT_ID: process.env.AUTH0_CLIENT_ID
  });
});

app.use('/api/products', jwtCheck);
app.get('/api/products', function(req, res) {
  res.send(JSON.stringify({products: [{model: "dishwasher", sn: "abc-123"}]})).end();
});

function handleError(err, res) {
  console.log(err);
  res.status(err).end();
  return;
}

app.post('/api/products', function(req, res) {
  var device = req.body;
  console.log('deviceCreate', portalId, device, host, admin);
  portals.deviceCreate(host, admin, portalId, device, function(err, createdDevice) {
    if (err) { return handleError(err, res); }
    console.log('TODO: create product and save device RID')
    res.send(JSON.stringify(createdDevice))
  });
});

app.get('/api/models', function(req, res) {
  portals.modelsList(host, admin, function(err, models) {
    if (err) { return handleError(err, res); }
    // get only published models
    var publishedModels = _.filter(models, function(model) {
      return model[':published'] === true;
    });
    res.send(JSON.stringify({models: publishedModels})).end();
  });
});

app.listen(app.get('port'), function() {
  console.log("Node app is running at localhost:" + app.get('port'));
});
