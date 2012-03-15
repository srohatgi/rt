import java.io.BufferedReader;
import java.io.DataOutputStream;
import java.io.IOException;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URI;
import java.net.URL;
import java.util.Calendar;
import java.util.HashMap;
import java.util.Map;

import org.java_websocket.WebSocketClient;
import org.java_websocket.handshake.ServerHandshake;

import com.google.gson.Gson;

/* {"name":"newfeed","args":["{\"chg_id\":1331220941674,\"items\":\"5\"}"]} */

class Feed {
  long chg_id;
  long publish_ts;
  String items;

  public Feed() { }

  public Feed(long chg_id,long publish_ts,String items) {
    this.chg_id = chg_id;
    this.publish_ts = publish_ts;
    this.items = items;
  }
}

class Event {
  String name;
  Feed[] args;

  public Event() {
  }

  public Event(String name,Feed[] bb) {
    this.name = name;
    this.args = bb;
  }

  public static Event parseSocketIOEvent(String eventStr) {
    Gson g = new Gson();
    return g.fromJson(eventStr,Event.class);
  }
  
  public static void main(String[] args) {
    Feed[] bb = new Feed[1];
    bb[0] = new Feed(12321,12321,"5");
    Event aa = new Event("newfeed",bb);

    Gson gson = new Gson();
    String json = gson.toJson(aa);

    System.out.println("json="+json);
  }
}
    


public class SocketIOClient extends WebSocketClient {
  protected SocketIOClientEventListener listener;
  protected Map<String, Long> requests = new HashMap<String, Long>();
  protected static int nextId = 0;
  protected int id;
  
  public SocketIOClient(URI server, SocketIOClientEventListener listener) {
    super(server);
    this.listener = listener;
    id = nextId;
    nextId++;
  }

  @Override
  public void onClose(int code, String reason, boolean remote) {
    System.out.println("closing client!");
    this.listener.onClose();
  }

  @Override
  public void onError(Exception arg0) {
    System.out.println("error: " + arg0);
  }

  @Override
  public void onMessage(String message) {
    long messageArrivedAt = Calendar.getInstance().getTimeInMillis();
    Event e;
    
    switch(message.toCharArray()[0]) {
    case '2':
      this.heartbeat();
      break;
    case '5':
      e = Event.parseSocketIOEvent(message.substring(4));
      long roundtripTime = messageArrivedAt - e.args[0].publish_ts;
      System.out.println("messageArrivedAt:"+messageArrivedAt+" publish_ts:"+e.args[0].publish_ts);
      this.listener.messageArrivedWithRoundtrip(roundtripTime);
      this.listener.onMessage(e.args[0].items);
      break;
    }
  }

  @Override
  public void onOpen(ServerHandshake handshakedata) {
    this.listener.onOpen();
  }
  
  public void heartbeat() {
    try {
      this.send("2:::");
    } catch (InterruptedException i) {
      i.printStackTrace();
    }
  }
 
  public static URI getNewSocketURI(String server) {
    try {
      URL url = new URL("http://" + server + "/socket.io/1/"); 
      HttpURLConnection connection = (HttpURLConnection) url.openConnection();           
      connection.setDoOutput(true);
      connection.setDoInput(true);
      connection.setRequestMethod("POST"); 

      DataOutputStream wr = new DataOutputStream(connection.getOutputStream ());
      wr.flush();
      wr.close();
      
      BufferedReader rd = new BufferedReader(new InputStreamReader(connection.getInputStream()));
      String line = rd.readLine();
      String hskey = line.split(":")[0];
      System.out.println("Getting Websocket Params:["+line+"]");
      String uri = "ws://" + server + "/socket.io/1/websocket/" + hskey;
      System.out.println("WebsocketURI="+uri);
      return new URI(uri);
    } catch (Exception e) {
      System.out.println("error: " + e);
      return null;
    }
  }
}
