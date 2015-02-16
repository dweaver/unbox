/**
 * provision API endpoints
 */
'use strict';

var request = require('request');
var _ = require('underscore');

var OPTIONS = {
  host: 'm2.exosite.com',
  agent: 'node-onep',
  https: false
};

/**
 * Set options for provisioning
 */
exports.setOptions = function(options) {
  _.extend(OPTIONS, options);
};

/**
 * List models for a vendor
 */
exports.listModels = function(token, callback) {
  var options = {
    url: (OPTIONS.https ? 'https://' : 'http://') + OPTIONS.host + '/provision/manage/model/',
    headers: {
      'User-Agent': OPTIONS.agent,
      'X-Exosite-Token': token
    }
  };
  request(options, function (err, response, body) {
    if (err) {
      return callback(err);
    }
    if (response.statusCode >= 300) {
      return callback(response.statusCode);
    }
    var models = body.trim().split('\n');
    callback(null, models);
  });
};

