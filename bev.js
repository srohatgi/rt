var redis = require('redis');
var pub = redis.createClient();

var BEV = function(collab,feed,uid) {
  var getCollab = function(fn) {
    var key = collab+':'+uid;
    pub.smembers(key,function(err,others) {
      if ( err ) console.log('error trying to fetch members:'+key);
      else {
        console.log('lets publish feed to collaborators:'+JSON.stringify(others));
        fn(others);
      }
    });
  };
  
  return {
    addCollab: function(others) {
      var key = collab+':'+uid;
      for (var i=0;i<others.length;i++) {
        pub.sadd(key,others[i]);
      }
    },
    
    getCollab: getCollab,
    
    publishFeed: function(msg) {
      getCollab(function(others) {
        for (var i=0;i<others.length;i++) {
          var key = feed+':'+others[i];
          pub.publish(key,msg);
        }
      });
    },
    
    subscribeFeed: function(otherid) {
      var sub = redis.createClient();
      var key = feed+':'+otherid;
      sub.subscribe(key, function(err, reply) {
        if ( err ) console.log('error: while trying to subscribe to:'+key);
        else {
          console.log(key+':subscribed:success');
        }
      });
      sub.on('message', function(channel, message) {
        console.log(channel+':recieved:'+message);
      });
    }
  };
};

exports.BEV = BEV;
/*
var bev = new BEV('folders','feed',1);

bev.subscribeFeed(2);
bev.subscribeFeed(3);
bev.subscribeFeed(4);

bev.addCollab([3,4]);
bev.publishFeed('hello guys');
*/

