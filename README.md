Real Time
=========
This project serves as an experimental area for developing, testing real time communication.

Following is the primary use case:

1. user connects device to push cloud
1. user receives number of unread feeds

Architecture
------------
There are three classes of servers: Load, Push & Publish servers.

1. Devices (users), authenticate to a central Load (Node.js/Redis server pair), and get an assigned to a Push (Node.js) server
1. Device connects to assigned Push (Node.js) server, and every connection spawns a subscription to a Redis server
1. Many Node.js servers connect to a single Redis server
1. Publish server reads device connectivity from Load server and publishes user feed updates to appropriate Redis server




