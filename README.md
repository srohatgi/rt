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
* Load Balancer for PUSH servers
* PUSH: Node.js/ Socket.IO servers machine
* CLIENT: java client machine
* PUBLISHER: Node.js machine
* DATA STORE: redis machine

Testing
-------
* Unit testing is `WIP`
* Perf testing is yet to started 