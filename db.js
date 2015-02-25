/**
 * Postgres Database access module
 */
var pg = require('pg');

var client = null;
var conString = process.env.DATABASE_URL;


/**
 * Connect to database. Do this before calling functions below this one
 */
exports.connect = function(callback) {
  pg.connect(conString, function (err, newClient, done) {
    if (err) {
      return callback(err);
    }
    client = newClient;
    callback(null, client);
  });
}

/**
 * Initialize database by creating it and creating tables.
 */
exports.setup = function(callback) {
  // create the table
  client.query('CREATE TABLE IF NOT EXISTS Device ' +
    '(UserID VARCHAR(255), DeviceRID VARCHAR(40), CreatedAt timestamp);', function (err) {
    if (err) {
      console.log('Error creating tables: ', err);
      return callback(err);
    }
    callback(null);
  });
}

/**
 * Get a user's registered devices.
 * @param userId - id of user
 * @param callback - called with err, records
 */
exports.getDevices = function(userId, callback) {
  client.query('SELECT * FROM Device WHERE UserID=$1;',
      [userId],
      function(err, result) {
        if (err) {
          return callback(err);
        }
        callback(null, result.rows);
  });
};

/**
 * Get all devices.
 * @param callback - called with err, records
 */
exports.getAllDevices = function(callback) {
  client.query('SELECT * FROM Device;',
      [],
      function(err, result) {
        if (err) {
          return callback(err);
        }
        callback(null, result.rows);
  });
};

/**
 * Add a device for a user
 * @param userId - id of user
 * @param deviceObj - device properties
 * @param callback - called with err, records
 */
exports.putDevice = function(userId, deviceObj, callback) {
    // create the table
    console.log('INSERT ', userId, deviceObj.rid);
    client.query(
      'INSERT INTO Device (UserID, DeviceRID, CreatedAt) VALUES ($1, $2, now());',
      [userId, deviceObj.rid],
      function(err, results) {
        if (err) {
          return callback(err);
        }
        callback(null);
    });
};
