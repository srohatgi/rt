/* SETUP SCRIPT for generating a runnable shell script
 */
var util = require('util'),
    path = require('path');

// server config
var push_js = path.join(__dirname, 'push.js'),
    publish_db = process.env.PUBLISH_DB || 'localhost:6379',
    device_db = process.env.DEVICE_DB || 'localhost:6379',
    percent_collab = process.env.PERCENT_COLLAB || '30',
    push_port_range = process.env.PORT_RANGE_PUSH || '3000',
    push_children = process.env.SPAWN_PUSH || '1',
    redis_conf_loc = process.env.REDIS_CONF_FILE || '/Users/sumeet/Downloads/redis-2.4.8/redis.conf';

// client config
var forever_exe = path.join(__dirname, '/node_modules/forever/bin/forever')
var publish_js = path.join(__dirname, 'publish.js');
var publish_interval = process.env.PUBLISH_INTERVAL_SECS || '2';
var client_class = path.join(__dirname, 'Client.class');

// datastore - redis start
spawn_datastore(publish_db,device_db,redis_conf_loc);
// push - node.js start
spawn_push(push_js,push_children,push_port_range,forever_exe,publish_db,device_db,percent_collab);
// publish - node.js script
trigger_publisher(publish_js,forever_exe,publish_db,publish_interval);

function spawn_datastore(publish_addr,device_addr,redis_conf_loc) {
  var port = publish_addr.substring(publish_addr.indexOf(':')+1);
  util.puts('redis-server - <<!');
  util.puts('`sed "s/6379/'+port+'/g" '+redis_conf_loc+'`');
  util.puts('!');
  
  if ( publish_addr !== device_addr ) {
    port = device_addr.substring(device_addr.indexOf(':')+1);
    util.puts('redis-server - <<!');
    util.puts('`sed "s/6379/'+port+'/g" '+redis_conf_loc+'`')
    util.puts('!');
  }
}

function spawn_push(script,children,port_range,forever_exe,publish_addr,device_addr,percent_collab) {
  for (var i=0;i<children;i++) {
    var port = parseInt(port_range) + parseInt(i);
    env_vars = 'PUBLISH_DB='+publish_addr+' DEVICE_DB='+device_addr+' PERCENT_COLLAB='+percent_collab+' PUSH_PORT='+port;
    cmd_line = env_vars+' '+forever_exe+' '+script;
    util.puts(cmd_line);
  }
}

function trigger_publisher(script,forever_exe,publish_addr,interval) {
  env_vars = 'PUBLISH_DB='+publish_addr+' PUBLISH_INTERVAL_SECS='+interval;
  cmd_line = env_vars+' '+forever_exe+' '+script;
  util.puts(cmd_line);
}

function trigger_client() {
  
}