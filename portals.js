/**
 * Portals API endpoints
 */
'use strict';

var request = require('request');
var _ = require('underscore');

var OPTIONS = {
};

/**
 * Set options
 */
exports.setOptions = function(options) {
  _.extend(OPTIONS, options);
};

/**
 * List models for a vendor
 */
exports.modelsList = function(host, auth, callback) {
  var options = {
    url: 'https://' + host + '/api/portals/v1/client-models',
    auth: auth
  };
  request(options, function (err, response, body) {
    if (err) {
      return callback(err);
    }
    if (response.statusCode >= 300) {
      return callback(response.statusCode);
    }
    var models = JSON.parse(body);
    callback(null, models);
  });
};
