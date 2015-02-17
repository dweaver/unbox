var db = require('./db');

db.connect(function(err) {
  db.setup(function(err) {
    if (err) {
      console.log(err);
      process.exit(1);
    } else {
      process.exit(0);
    }
  });
})
