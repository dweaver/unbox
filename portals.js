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

/**
 * Handle errors from Portals API
 */
function handleError(err, response, body, callback) {
  if (err) {
    return callback(err);
  }
  if (response.statusCode >= 300) {
    var e = new Error(response.statusCode + ' ' + body);
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
  var options = {
    url: url,
    auth: auth
  };
  request.get(options, function (err, response, body) {
    if (hasError(err, response)) {
      return handleError(err, response, body, callback);
    }
    var devices = JSON.parse(body);
    callback(null, devices);
  });
};
