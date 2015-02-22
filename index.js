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
    AUTH0_CLIENT_ID: process.env.AUTH0_CLIENT_ID,
    host: process.env.PORTALS_HOST
  });
});

function handleError(err, res) {
  console.log(err);
  if (typeof err === 'number') {
    res.status(err).end();
  } else {
    var status = typeof err.status === 'number' ? err.status : 500;
    res.status(status);
    res.write(err.message);
    res.end();
  }
  return;
}

app.use('/api/products', jwtCheck);
app.get('/api/products', function(req, res) {
  var latest = req.query.latest === 'true';
  var options = {
    latest: latest
  };

  db.getDevices(req.user.sub, function(err, devices) {
    if (err) {
      handleError(err, res);
    }
    var deviceRIDs = _.map(devices, function(device) {
      return device.devicerid;
    });
    if (deviceRIDs.length === 0) {
      return res.send(JSON.stringify({products: []})).end();
    }
    portals.devicesGet(host, admin, deviceRIDs, function(err, devices) {
      if (err) {
        return handleError(err, res);
      }
      // This excludes devices that are in the Unbox app
      // database but Portals can't find them (e.g. because
      // they're deleted)
      var existentDevices = _.filter(devices, function(device) {
        return device.info !== false;
      });

      if (options.latest) {
        // get latest datasource data for each device
        var dataSourceRIDs = [];
        _.each(existentDevices, function (device) {
          _.each(device.dataSources, function (dataSourceRID) {
            dataSourceRIDs.push(dataSourceRID);
          });
        });
        portals.dataSourcesGet(host, admin, dataSourceRIDs, function (err, dataSources) {
          if (err) {
            return handleError(err, res);
          }
          // inject data source responses into
          var resultIdx = 0;
          _.each(existentDevices, function (device) {
            device.dataSourceObj = {};
            _.each(device.dataSources, function (dataSourceRID) {
              device.dataSourceObj[dataSourceRID] = dataSources[resultIdx];
              resultIdx++;
            });
          });
          res.send(JSON.stringify({products: existentDevices})).end();
        });
      } else {
        // just send back the devices, without datasource data
        res.send(JSON.stringify({products: existentDevices})).end();
      }
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
