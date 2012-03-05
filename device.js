var redis = require('redis');

var Device = function(publish_db,device_db) {
  // parse port and host of device db
  var store = redis.createClient(device_db.substring(device_db.indexOf(':')+1),device_db.substring(0,device_db.indexOf(':')));
  var connected_devices = 0;
  return {
    connect: function(cb) {
      // save device info to db
      store.incr('connected_devices',function (err, reply) {
        if ( err ) {
          console.log("error: trying to update connected device counter");
          cb(err);
        }
        else {
          console.log("connected device# "+reply+" connected!");
          connected_devices = did = reply;
          var key = 'device:'+did;
          store.set(key,publish_db,redis.print);
          cb(null,did);
        }
      });
    }
    , disconnect: function(did) {
      // store in redis hash
      var key = 'device:'+did;
      store.decr('connected_devices');
      store.set(key,'-1',redis.print);      
    }
    , devices: function() {
      return connected_devices;
    }
    , quit: function() {
      store.quit();
    }
  }; 
};

exports.Device = Device;

/*
var Dev = Device(1,process.env.DEVICE_PORT,process.env.DEVICE_HOST);
Dev.connect(function(err,did) { 
  if (err) return;
  Dev.connect(function(err,did1) { 
    if (err) return;
    Dev.connect(function(err,did2) { 
      if (err) return;
      Dev.disconnect(did2);
      Dev.disconnect(did1);
      Dev.disconnect(did);
      Dev.quit();
    });
  });
});
*/