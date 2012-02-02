var express = require('express')
  , routes = require('./routes');

var app = module.exports = express.createServer();
var io = require('socket.io').listen(app);
var ua = require('./useragent');

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
  res.render('index.jade', {locals: {title: 'Activity Feeds' }});
  //res.sendfile(__dirname + '/feed.html');
});

var devices = {};
var feed = new Array();

io.configure(function (){
  io.set('authorization', function (handshakeData, callback) {

    console.log("connection User-Agent:"+handshakeData.headers['user-agent']);
    
    handshakeData['parsed_user_agent'] = ua.parse(handshakeData.headers['user-agent']);
    
    console.log('conn query:'+JSON.stringify(handshakeData.query));
    
    callback(null,true);
    /*
    // findDatabyip is an async example function
    findDatabyIP(handshakeData.address.address, function (err, data) {
      if (err) return callback(err);

      if (data.authorized) {
        handshakeData.foo = 'bar';
        for(var prop in data) handshakeData[prop] = data[prop];
        callback(null, true);
      } else {
        callback(null, false);
      }
    });
    */ 
  });
});

io.sockets.on('connection', function (socket) {
  
  socket.on('sendfolderaction', function (feeditem) {
      var msg = socket.username + ':'+ feeditem;
      feed.push(msg);
      io.sockets.emit('updatefeed', msg);
  });
    
  socket.on('adddevice', function(token){
    var a = socket.handshake['parsed_user_agent'];
    token = token+"'s "+a.platform.name+' '+a.browser.name+' '+a.engine.name;
    
    socket.username = token;
    devices[token] = token;
      
    // tell the client about stuff they might have missed
    if ( feed.length > 10 ) {
      // only last 10 feed-items are important
      feed.splice(1,feed.length-10);
    }
    
    feed.push(socket.username+': connected!');          
    socket.emit('initialfeed', feed);

    io.sockets.emit('updatedevices', devices);
  });
    
  socket.on('disconnect', function(){
    // remove the username from global usernames list
    delete devices[socket.username];
    var msg = socket.username + ': disconnected!';
    feed.push(msg);
    io.sockets.emit('updatefeed', msg);      
    io.sockets.emit('updatedevices', devices);
  });
});

app.listen(3000);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
