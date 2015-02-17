/*
 * Unbox server
 */
'use strict';
var express         = require('express');
var _               = require('underscore');
var cons            = require('consolidate');
var bodyParser      = require('body-parser');
var jwt             = require('express-jwt');

var portals         = require('./portals');
var db              = require('./db')

db.connect(function(err) {
  if (err) {
    console.log('Error from postgres connection db.connect ' + err);
  }
});

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

function handleError(err, res) {
  console.log(err);
  res.status(err).end();
  return;
}

app.use('/api/products', jwtCheck);
app.get('/api/products', function(req, res) {
  db.getDevices(req.user.sub, function(err, devices) {
    if (err) {
      handleError(err, res);
    }
    var deviceRIDs = _.map(devices, function(device) {
      //return {rid: device.DeviceRID, model: 'TODO: Model', sn: 'TODO: sn'};
      return device.devicerid;
    });
    portals.devicesGet(host, admin, deviceRIDs, function(err, devices) {
      res.send(JSON.stringify({products: devices})).end();
    });
  });
});

app.post('/api/products', function(req, res) {
  var device = req.body;
  portals.deviceCreate(host, admin, portalId, device, function(err, createdDevice) {
    if (err) { return handleError(err, res); }
    db.putDevice(req.user.sub, createdDevice, function(err) {
      if (err) { return handleError(err, res); }
      res.send(JSON.stringify(createdDevice))
    });
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
