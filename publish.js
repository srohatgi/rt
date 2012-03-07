var redis = require('redis');

var Publish = function(publish_db) {
  var port = publish_db.substring(publish_db.indexOf(':')+1);
  var host = publish_db.substring(0,publish_db.indexOf(':'));
  var pub = redis.createClient(port,host);
    
  return {
      publishFeed: function(channel,unread_items) {
      var key = 'feed:'+channel;
      console.log("publishing "+unread_items+" to key:"+key);      
      pub.publish(key,unread_items);
    }
    , quit: function() {
      pub.quit();
    }    
  };
};

exports.Publish = Publish;

setInterval(function() {
  var publisher = Publish(process.env.PUBLISH_DB);
  publisher.publishFeed(process.env.PERCENT_COLLAB,'5');
  publisher.quit();
}, parseInt(process.env.PUBLISH_INTERVAL_SECS)*1000);
