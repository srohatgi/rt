var redis = require('redis');

var Publish = function(publish_db) {
  var port = publish_db.substring(publish_db.indexOf(':')+1);
  var host = publish_db.substring(0,publish_db.indexOf(':'));
  var pub = redis.createClient(port,host);
    
  return {
      publishFeed: function(channel,unread_items,chg_id) {
      var key = 'feed:'+channel;
      var payload = {'chg_id': chg_id, 'items': unread_items };
      console.log("publishing payload "+JSON.stringify(payload)+" to key:"+key);      
      pub.publish(key,JSON.stringify(payload));
    }
    , quit: function() {
      pub.quit();
    }    
  };
};

exports.Publish = Publish;

var publisher = Publish(process.env.PUBLISH_DB);
setInterval(function() {
  publisher.publishFeed(process.env.PERCENT_COLLAB,'5',Date.now());
}, parseInt(process.env.PUBLISH_INTERVAL_SECS)*1000);
//publisher.quit();
