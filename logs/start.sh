redis-server /Users/sumeet/github/rt/logs/publishdb.conf
PUBLISH_DB=localhost:6379 DEVICE_DB=localhost:6379 PERCENT_COLLAB=100 PUSH_PORT=3000 NODE_ENV=production nohup node /Users/sumeet/github/rt/push.js > /Users/sumeet/github/rt/logs/push_out.log 2>&1 &
echo $! > push.pid
PUBLISH_DB=localhost:6379 DEVICE_DB=localhost:6379 PUBLISH_INTERVAL_SECS=2 PERCENT_COLLAB=100 NODE_ENV=production nohup node /Users/sumeet/github/rt/publish.js > /Users/sumeet/github/rt/logs/publish_out.log 2>&1 &
echo $! > publish.pid
echo PUSH_CLUSTER_URI=localhost:3000 java -cp /Users/sumeet/github/rt/client/lib/WebSocket.jar:/Users/sumeet/github/rt/client/lib/commons-math-2.2.jar:/Users/sumeet/github/rt/client/lib/gson-2.1.jar:/Users/sumeet/github/rt/client/classes LoadTester
