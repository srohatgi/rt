/* SETUP SCRIPT for generating a runnable shell script
 */
var util = require('util'),
    path = require('path');

// server config
var push_js = path.join(__dirname, 'push.js'),
    rundir = process.env.RUNDIR || path.join(__dirname,'logs'),
    publish_db = process.env.PUBLISH_DB || 'localhost:6379',
    device_db = process.env.DEVICE_DB || 'localhost:6379',
    percent_collab = process.env.PERCENT_COLLAB || '30',
    push_port_range = process.env.PORT_RANGE_PUSH || '3000',
    push_children = process.env.SPAWN_PUSH || '1',
    redis_conf_loc = process.env.REDIS_CONF_FILE || '/Users/sumeet/Downloads/redis-2.4.8/redis.conf',
    push_cluster_uri = process.env.PUSH_CLUSTER_URI || 'localhost:3000';

// client config
var forever_exe = path.join(__dirname, '/node_modules/forever/bin/forever')
var publish_js = path.join(__dirname, 'publish.js');
var publish_interval = process.env.PUBLISH_INTERVAL_SECS || '2';
var start_script = rundir+'/start.sh';
var stop_script = rundir+'/stop.sh';

// datastore - redis start
spawn_datastore(rundir,publish_db,device_db,redis_conf_loc,start_script,stop_script);
// push - node.js start
spawn_push(push_js,rundir,push_children,push_port_range,forever_exe,publish_db,device_db,percent_collab,start_script,stop_script);
// publish - node.js script
trigger_publisher(publish_js,rundir,forever_exe,publish_db,publish_interval,start_script,stop_script);
// client - java program
trigger_client(rundir,start_script,stop_script);

function spawn_datastore(rundir,publish_addr,device_addr,redis_conf_loc,start_script,stop_script) {
  var port = publish_addr.substring(publish_addr.indexOf(':')+1);
  var publishdb_conf = rundir+'/publishdb.conf';
  var publishdb_pid = rundir+'/publishdb.pid';
  util.puts(util.format('sed -e "s#pidfile /var/run/redis.pid#pidfile %s#g" -e "s/6379/%s/g" -e "s#dir \./#dir %s#g" -e "s/daemonize no/daemonize yes/g" -e "s#logfile stdout#logfile %s/publishdb.log#g" %s > %s'
              ,publishdb_pid,port,rundir,rundir,redis_conf_loc,publishdb_conf));
  util.puts(util.format('echo redis-server %s >> %s',publishdb_conf,start_script));
  util.puts(util.format('echo kill -9 \\`cat %s\\` >> %s',publishdb_pid,stop_script));
  
  if ( publish_addr !== device_addr ) {
    port = device_addr.substring(device_addr.indexOf(':')+1);
    var devicedb_conf = rundir+'/devicedb.conf';
    var devicedb_pid = rundir+'/devicedb.pid';
    util.puts(util.format('sed -e "s#pidfile /var/run/redis.pid#pidfile %s#g" -e "s/6379/%s/g" -e "s#dir \./#dir %s#g" -e "s/daemonize no/daemonize yes/g" -e "s#logfile stdout#logfile %s/publishdb.log#g" %s > %s'
                ,devicedb_pid,port,rundir,rundir,redis_conf_loc,devicedb_conf));
    util.puts(util.format('echo redis-server %s >> %s',devicedb_conf,start_script));
    util.puts(util.format('echo kill -9 \\`cat %s\\` >> %s',devicedb_pid,stop_script));
  }
}

function spawn_push(script,rundir,children,port_range,forever_exe,publish_addr,device_addr,percent_collab,start_script,stop_script) {
  for (var i=0;i<children;i++) {
    var port = parseInt(port_range) + parseInt(i);
    var env_vars = 'PUBLISH_DB='+publish_addr+' DEVICE_DB='+device_addr+' PERCENT_COLLAB='+percent_collab+' PUSH_PORT='+port;
    var forever_opts = ' start --logFile '+rundir+'/forever_push.log --outFile '+rundir+'/push_out.log --errFile '+rundir+'/push_err.log ';
    var cmd_line = env_vars+' '+forever_exe+forever_opts+script;
    util.puts(util.format('echo %s >> %s',cmd_line,start_script));
    util.puts(util.format('echo %s stop %s >> %s',forever_exe,script,stop_script));
  }
}

function trigger_publisher(script,rundir,forever_exe,publish_addr,interval,start_script,stop_script) {
  env_vars = 'PUBLISH_DB='+publish_addr+' PUBLISH_INTERVAL_SECS='+interval+' PERCENT_COLLAB='+percent_collab;
  var forever_opts = ' start --logFile '+rundir+'/forever_publish.log --outFile '+rundir+'/publish_out.log --errFile '+rundir+'/publish_err.log ';
  cmd_line = env_vars+' '+forever_exe+forever_opts+script;
  util.puts(util.format('echo %s >> %s',cmd_line,start_script));
  util.puts(util.format('echo %s stop %s >> %s',forever_exe,script,stop_script));
}

function trigger_client(rundir,start_script,stop_script) {
  var ws_jar = path.join(__dirname, 'client/lib/WebSocket.jar');
  var cm_jar = path.join(__dirname, 'client/lib/commons-math-2.2.jar');
  var json_jar = path.join(__dirname, 'client/lib/gson-2.1.jar');
  var cp = path.join(__dirname, 'client/classes');
  
  cmd_line = 'echo PUSH_CLUSTER_URI='+push_cluster_uri+' java -cp '+[ws_jar,cm_jar,json_jar,cp].join(':')+' SocketIOLoadTester';
  util.puts(util.format('echo %s >> %s',cmd_line,start_script));
}