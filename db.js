var pg = require('pg');

var DB_NAME = 'unbox';
var client = null;

/**
 * Initialize database by creating it and creating tables.
 */
exports.setup = function() {
  var conStringPri = process.env.DATABASE_URL + '/postgres';
  var conStringPost = process.env.DATABASE_URL + '/' + DB_NAME;

  pg.connect(conStringPri, function (err, client, done) {
    if (err) {
      console.log('Error while connecting: ' + err);
    }
    client1.query('CREATE DATABASE ' + DB_NAME, function (err) {
      if (err) {
        console.log('ignoring the error: ', err); // ignore if the db is there
      }
      client.end();

      // now that we know the database existes, create table(s)
      pg.connect(conStringPost, function (err, clientOrg, done) {
        // create the table
        clientOrg.query('CREATE TABLE IF NOT EXISTS Device ' +
        '(UserID VARCHAR(255), DeviceRID VARCHAR(40), CreatedAt timestamp);', function (err) {
          if (err) {
            console.log('Error creating tables: ', err);
          }
          clientOrg.end();
        });
      });
    });
  });
}

/**
 * Connect to database. Do this before calling
 */
exports.connect = function(callback) {
  var conStringPost = process.env.DATABASE_URL + '/' + DB_NAME;
  pg.connect(conStringPost, function (err, newClient, done) {
    if (err) {
      return callback(err);
    }
    client = newClient;
    callback(null, client);
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
