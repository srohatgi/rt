Real Time
=========
This project serves as an experimental area for developing, testing real time communication.

Following is the primary use case:

1. user connects device to push cloud
1. user receives number of unread feeds (and change id/ timestamp)
1. user uses pull api for getting the unread feeds

Architecture
------------
There are three classes of servers: `DeviceDB`, `Push` & `PublishDB` servers.

1. Users authenticate their device to a `Push` server
1. `Push` server spawns listener on PublishDB
1. `Push` server updates device & self address info to `DeviceDB`
1. `Publish` server looks up info in `DeviceDB` to publish unread feed item message



