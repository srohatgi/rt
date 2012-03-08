Real Time Communication
=======================
This project serves as an experimental area for developing, testing real time communication.

Following is the **primary use case**:

1. user `connects` device to push cloud
1. user's device/ app is `pushed` number of unread feeds (and change id/ timestamp)
1. user's app uses `rest api` for getting the unread feeds using the change id

----
Architecture
============

<img src="https://github.com/srohatgi/rt/raw/master/push_eval_test.png" alt="Logical Architecture" width="242" height="400" />

There are two publish-subscribe servers: `Push` & `Publisher` servers. There are also two memory data stores: `DeviceDB` & `PublishDB`. `DeviceDB` holds current information on connected devices. `PublishDB` holds transient publishing information for `Push` server `Clients`.

Mapping the use case to our architecture:

1. Users authenticate their `Client` to a given `Push` server
1. `Push` server spawns a subscription on `PublishDB` (using the user credentials)
1. `Push` server also updates `Client` info to `DeviceDB`
1. `Publisher` server looks up `Client` info in `DeviceDB` to publish any unread feed items

----
Design
======

1. `Push` & `Publisher` servers are Node.js scripts
1. `Client` is a multi threaded Java program
1. `DeviceDB` & `PublishDB` are Redis database servers

Stress Test
===========
The test aims to discover a maximum number of clients that can be subscribed to a PUSH server (at a given hardware configuration). 

A way to measure this is to track the latency between when a message is created by the PUBLISH server to when it is __actually__ received by the client. As more active subscriber clients to the mix, we expect this latency to increase, till it becomes intolerable. The number of active clients connected at that time is our maximum. Of course, not every client needs to be active - meaning they do not need to be receiving messages. In that case, we have a `PERCENT_COLLAB` factor which can be used (in the `PUBLISHER` & `PUSH` servers) to find a maximum client number based on a realistic mix of active clients vs clients that are just listeners.

More specific details of the test follow below:

1. Push server sends out message payload 
    1. `payload = {chg_id: <id of last known read item>, items: <unread items>, publish_ts: <timestamp> }`
1. Client monitors __message latency__ 
    1. `ReceivedTs = Calendar.getInstance().getTimeInMillis()`
    1. `ServerTs = payload.publish_ts`
    1. `Latency = ReceivedTs - ServerTs`
    1. `TOLERANCE = <client program input>`
1. For each given `concurrency` in `[1, 10, 100, 1000, 10000, 100000, 1000000 ]`
    1. Find `Median(Latency[concurrency])`
    1. `if Median(Latency[concurrency]) > TOLERANCE then stop the test and publish the concurrency#`
    
----
Status
======

Components
----------
* **Push server** is `Done`
* **PublishDB** is `Done`
* **DeviceDB** is `Done`
* Client is `WIP`
* **Publisher** is `Done`

Env Configuration
-----------------
* LOAD BALANCER: performs ssl termination and proxies http 1.1/ TCP traffic
* PUSH: Node.js/ Socket.IO servers machine
* CLIENT: java client machine
* PUBLISHER: Node.js machine
* DATA STORE: redis machine

Testing
-------
* Unit testing is `WIP`
* Perf testing is yet to started 