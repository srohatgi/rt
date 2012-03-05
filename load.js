var redis = require('redis');

var Device = function(push_server_id,redis_port,redis_host) {
  var store = redis.createClient(redis_port,redis_host);
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
          store.set(key,push_server_id,redis.print);
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

var Dev = new Device(1,process.env.DEVICE_PORT,process.env.DEVICE_HOST);
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