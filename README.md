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
There are three classes of servers: `Push` & `Publish` servers. There are two data stores: `DeviceDB` & `PublishDB`. `DeviceDB` contains lookup information on connected devices. `PublishDB` publishes and subscribes information to/ from `Push` servers (which in turn send this info on to `Clients` using `socket.io`)

1. Users authenticate their `Client` to a `Push` server
1. `Push` server spawns listener on `PublishDB`
1. `Push` server also updates `Client` info to `DeviceDB`
1. `Publish` server looks up `Client` info in `DeviceDB` to publish unread feed items

<img src="https://github.com/srohatgi/rt/raw/master/push_eval_test.png" alt="Logical Architecture" width="242" height="400" />

----
Design
======

1. `Push` & `Publish` servers are Node.js scripts
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
* **Publish** is `Done`

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