var express = require('express')
  , routes = require('./routes')
  , ua = require('./useragent')
  , redis = require('redis')
  , device = require('./device').Device(process.env.PUBLISH_DB,process.env.DEVICE_DB);
  
var app = module.exports = express.createServer();
var io = require('socket.io').listen(app);

// Configuration

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser());
  app.use(express.session({ secret: 'your secret here' }));
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
});

app.configure('production', function(){
  app.use(express.errorHandler()); 
});

app.get('/', function(req, res) {
  res.render('push.jade', {locals: {title: 'Activity Feeds' }});
});

io.configure(function () {
  // for the discards issue
  io.set('heartbeat timeout', 60);
  io.set('authorization', function (data, callback) {
    console.log("connection User-Agent:"+data.headers['user-agent']);
    device.connect(function(err,did) {
      if ( err ) { callback(err); return; }
      data['user'] = data.query.user;
      data['did'] = did;
      callback(null,true);
    });    
  });
});

function parse_port_host(name) {
  var port = name.substring(name.indexOf(':')+1);
  var host = name.substring(0,name.indexOf(':'));
  return {
      port: port
    , host: host
  };
}

var pair = parse_port_host(process.env.PUBLISH_DB);

// register with PUBLISH DB
var sub = redis.createClient(pair.port,pair.host);
io.sockets.on('connection', function (socket) {
  // generate random number...
  var r = Math.floor(Math.random()*101);
  if ( r <= process.env.PERCENT_COLLAB || socket.handshake['user'] === 'lucky' ) { 
    r = process.env.PERCENT_COLLAB;
  } else {
    r = 100;
  }
  var key = 'feed:'+r;
  sub.subscribe(key, function(err, reply) {
    if ( err ) console.log('error: while trying to subscribe to:'+key);
    else {
      console.log(key+':subscribed:success');
    }
  });
  sub.on('message', function(channel, message) {
    console.log(channel+':recieved:'+message);
    socket.emit('newfeed',JSON.parse(message));
  });
  socket.on('disconnect', function(){
    sub.quit();
    device.disconnect(socket.handshake['did']);
  });
});

app.listen(process.env.PUSH_PORT);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
