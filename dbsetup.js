var db = require('./db');

console.log('got here 1');
db.connect(function(err) {
  console.log('got here 2');
  db.setup(function(err) {
    console.log('got here 3');
    if (err) {
      console.log(err);
      process.exit(1);
    } else {
      process.exit(0);
    }
  });
})
