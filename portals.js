/**
 * Portals API endpoints
 */
'use strict';

var request = require('request');
var _       = require('underscore');

var OPTIONS = {
};

/**
 * Set options
 */
exports.setOptions = function(options) {
  _.extend(OPTIONS, options);
};

/**
 * Detect an error from Portals API
 */
function hasError(err, response) {
  return err || response.statusCode > 300;
}

function PortalsError(status, message) {
  this.name = 'PortalsError';
  this.status = status;
  this.message = (message || '');
  var self = this;
  this.toString = function() {
    return self.name + ' ' + self.status + ' ' + self.message;
  }
}
PortalsError.prototype = new Error();

/**
 * Handle errors from Portals API
 */
function handleError(err, response, body, callback) {
  if (err) {
    return callback(err);
  }
  if (response.statusCode >= 300) {
    var e = new PortalsError(response.statusCode, body);
    return callback(e);
  }
}

/**
 * List models for a vendor
 */
exports.modelsList = function(host, auth, callback) {
  var options = {
    url: 'https://' + host + '/api/portals/v1/client-models',
    auth: auth
  };
  request(options, function (err, response, body) {
    if (hasError(err, response)) {
      return handleError(err, response, body, callback);
    }
    var models = JSON.parse(body);
    callback(null, models);
  });
};

/**
 * Create a device based on a model and serial number.
 */
exports.deviceCreate = function(host, auth, portalId, deviceObj, callback) {
  var options = {
    url: 'https://' + host + '/api/portals/v1/portals/' + portalId + '/devices',
    auth: auth,
    body: JSON.stringify(deviceObj)
  };
  request.post(options, function (err, response, body) {
    if (hasError(err, response)) {
      return handleError(err, response, body, callback);
    }
    var device = JSON.parse(body);
    callback(null, device);
  });
};

/**
 * Get devices for a user.
 */
exports.devicesGet = function(host, auth, deviceRIDs, callback) {
  var url = 'https://' + host + '/api/portals/v1/users/_this/devices/[' + deviceRIDs.join(',') + ']';
  var requestOptions = {
    url: url,
    auth: auth
  };
  request.get(requestOptions, function (err, response, body) {
    if (hasError(err, response)) {
      return handleError(err, response, body, callback);
    }
    try {
      var devices = JSON.parse(body);
      callback(null, devices);
    } catch(e) {
      callback(e + ' while parsing response from ' + url);
    }
  });
};

/**
 * Get data sources for a Portals user.
 */
exports.dataSourcesGet = function(host, auth, dataSourceRIDs, callback) {
  var url = 'https://' + host + '/api/portals/v1/users/_this/data-sources/[' + dataSourceRIDs.join(',') + ']';
  var requestOptions = {
    url: url,
    auth: auth
  };
  request.get(requestOptions, function (err, response, body) {
    if (hasError(err, response)) {
      return handleError(err, response, body, callback);
    }
    var devices = JSON.parse(body);
    callback(null, devices);
  });
};
