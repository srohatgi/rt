rm -f classes/*.class
javac -classpath lib/WebSocket.jar:lib/commons-math-2.2.jar:lib/gson-2.1.jar -d classes SocketIOClient.java LoadTester.java SocketIOClientEventListener.java
