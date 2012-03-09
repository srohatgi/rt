[ -f /Users/sumeet/github/rt/logs/publish.pid ] && kill -9 `cat /Users/sumeet/github/rt/logs/publish.pid`
[ -f /Users/sumeet/github/rt/logs/push.pid ] && kill -9 `cat /Users/sumeet/github/rt/logs/push.pid`
[ -f /Users/sumeet/github/rt/logs/publishdb.pid ] && kill -9 `cat /Users/sumeet/github/rt/logs/publishdb.pid`
rm -f /Users/sumeet/github/rt/logs/*.log /Users/sumeet/github/rt/logs/*.pid /Users/sumeet/github/rt/logs/*.rdb
