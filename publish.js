var redis = require('redis');

var Publish = function(publish_db,device_db) {
  var port = publish_db.substring(publish_db.indexOf(':')+1);
  var host = publish_db.substring(0,publish_db.indexOf(':'));
  var pub = redis.createClient(port,host);

  port = device_db.substring(device_db.indexOf(':')+1);
  host = device_db.substring(0,device_db.indexOf(':'));
  var dev = redis.createClient(port,host);
    
  return {
    publishFeed: function(channel,unread_items,chg_id,publish_ts) {
      dev.get('connected_devices',function(err,reply) {
        if ( err ) console.log("error connecting to device db");
        else if ( reply !== null && reply > 0 ) {
          var key = 'feed:'+channel;
          var payload = { 'chg_id': chg_id, 'items': unread_items, 'publish_ts': publish_ts };
          console.log("publishing payload "+JSON.stringify(payload)+" to key:"+key);      
          pub.publish(key,JSON.stringify(payload));
        }
      });
    }
    , quit: function() {
      pub.quit();
    }    
  };
};

exports.Publish = Publish;

var publisher = Publish(process.env.PUBLISH_DB,process.env.DEVICE_DB);
setInterval(function() {
  var ts = Date.now();
  publisher.publishFeed(process.env.PERCENT_COLLAB,'5',ts,ts);
}, parseInt(process.env.PUBLISH_INTERVAL_SECS)*1000);
//publisher.quit();
