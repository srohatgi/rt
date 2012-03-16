import java.io.BufferedWriter;
import java.io.FileNotFoundException;
import java.io.FileWriter;
import java.io.IOException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.apache.commons.math.stat.descriptive.SummaryStatistics;

public class LoadTester extends Thread implements SocketIOClientEventListener {

  public static final long MESSAGES_RECEIVED_PER_CLIENT = 5;

  // main thread variables
  protected Set<SocketIOClient> clients = new HashSet<SocketIOClient>();
  //protected int[] concurrencyLevels = {1, 10, 25, 50, 75, 100, 200, 300, 400, 500, 750, 1000, 1250, 1500, 2000};
  protected int[] concurrencyLevels = {1, 10, 100, 500};

  // per test variables
  protected long messages_recieved_so_far;
  protected int concurrency;
  protected boolean lostConnection = false;
  protected Integer numConnectionsMade = 0;
  protected List<Long> roundtripTimes;

  private boolean testRunning;
  
  protected LoadTester(List<Integer> concurrencies) {
    if(concurrencies.size() > 0) {
      System.out.print("Using custom concurrency levels: ");
      this.concurrencyLevels = new int[concurrencies.size()];
      int i=0; 
      for(Integer c : concurrencies) {
        this.concurrencyLevels[i] = c.intValue();
        i++;
        System.out.print(c + " ");
      }
      System.out.println();
    }
  }
  
  public synchronized void run() {    
    // open result file
    BufferedWriter f = null;
    try {
      f =  new BufferedWriter(new FileWriter(System.currentTimeMillis() + ".log"));
      f.write("CONCURRENCY,MESSAGES,MIN_LATENCY,MEAN_LATENCY,MAX_LATENCY,STD_DEV_LATENCY\n");
    } catch (FileNotFoundException e) {
      e.printStackTrace();
    } catch (IOException e) {
      e.printStackTrace();
    }
    
    for(int i=0; i<concurrencyLevels.length; i++) {
      this.concurrency = concurrencyLevels[i];

      // Reset the failure switches.
      this.lostConnection = false;
      System.out.println("---------------- CONCURRENCY " + this.concurrency + " ----------------");
      this.numConnectionsMade = 0;
      this.roundtripTimes = new ArrayList<Long>();
      
      this.makeConnections(this.concurrency);
      
      Map<Integer, SummaryStatistics> summaryStats = this.performLoadTest();
      
      // shutdown all the clients
      for(SocketIOClient c : this.clients) {
        try {
          c.close();
        } catch (Exception e) {
          System.out.println("error closing client!");
          e.printStackTrace();
        }
      }
            
      for(Integer  c : summaryStats.keySet()) {
        SummaryStatistics stats = summaryStats.get(c);
        try {
          f.write(String.format("%d,%d,%f,%f,%f,%f\n",
            this.concurrency, stats.getN(), stats.getMin(), stats.getMean(), stats.getMax(), stats.getStandardDeviation()));
          System.out.println("Wrote results of run to disk.");
        } catch (IOException e) {
          e.printStackTrace();
        }
      }
    }
    
    // close result file
    try {
      f.close();
    } catch (IOException e) {
      e.printStackTrace();
    }
    
    System.out.println("closing main testing thread!");
    return;
  }
  
  protected void makeConnections(int numConnections) {
    // Start the connections. Wait for all of them to connect then we go.
    this.clients.clear();
    
    for(int i=0; i<this.concurrency; i++) {
      SocketIOClient client = new SocketIOClient(SocketIOClient.getNewSocketURI(System.getenv("PUSH_CLUSTER_URI")), this);
      this.clients.add(client);
      client.connect();
    }
    
    try {
      this.wait();
    } catch (InterruptedException e) {
      System.out.println("Interrupted!");
    }
    System.out.println("Woken up - time to start load test!");
  }
  
  protected Map<Integer, SummaryStatistics> performLoadTest() {
    // Actually run the test.
    Map<Integer, SummaryStatistics> statisticsForThisConcurrency = new HashMap<Integer, SummaryStatistics>();
    this.testRunning = true;
    System.out.println(concurrency + " connections waiting for "+(MESSAGES_RECEIVED_PER_CLIENT*this.concurrency)+" feeds");
    try {
      this.wait();
    } catch (InterruptedException e) {
      e.printStackTrace();
    }
    
    this.testRunning = false;
    statisticsForThisConcurrency.put(concurrency, this.processRoundtripStats());      
    return statisticsForThisConcurrency;
  }
  
  
  protected SummaryStatistics processRoundtripStats() {
    SummaryStatistics stats = new SummaryStatistics();    
    for(Long roundtripTime : this.roundtripTimes) {
      stats.addValue(roundtripTime);
    }    
    System.out.format(" n: %5d e: %5d f: %5d min: %8.0f  mean: %8.0f   max: %8.0f   stdev: %8.0f\n", 
      stats.getN(),(MESSAGES_RECEIVED_PER_CLIENT*this.concurrency),(concurrency-numConnectionsMade),
      stats.getMin(), stats.getMean(), stats.getMax(), stats.getStandardDeviation());    
    return stats;
  }
  
  public static void main(String[] args) {
    List<Integer> concurrencies = new ArrayList<Integer>();

    if(args.length > 0) {
      for(String arg : args) concurrencies.add(new Integer(arg));
    }    
    LoadTester tester = new LoadTester(concurrencies);
    tester.start();
  }

  @Override
  public void onError(IOException e) {
    synchronized(this) {
      System.out.println("recieved error:"+e);
    }
  }

  @Override
  public void onMessage(String message) {
    //    System.out.println("message: " + message);
  }
  
  

  @Override
  public void onClose(Boolean abnormal) {
    synchronized(this) {
      if( this.testRunning ) {
        lostConnection = true;
        System.out.println(abnormal?"Buggy WebSocket!":""+" failed! Lost a connection. Shutting it down.");
        numConnectionsMade--;
      }
    }
  }

  @Override
  public void onOpen() {
    synchronized(this) {
      numConnectionsMade++;
      if(numConnectionsMade.compareTo(concurrency)==0) {
        System.out.println("All " + concurrency + " clients connected successfully.");
        // Turn the main testing thread back on. We don't want to accidentally
        // be executing on some clients main thread.
        this.notifyAll();
      }
    }
  }

  @Override
  public void messageArrivedWithRoundtrip(long roundtripTime) {
    synchronized(this) {
      if ( (messages_recieved_so_far++) >= (MESSAGES_RECEIVED_PER_CLIENT*this.concurrency) ) 
        this.notifyAll();
      else {
        if ( roundtripTimes == null ) {
          System.out.println("how can this be??");
        }
        else this.roundtripTimes.add(roundtripTime);
      }
    }
  }
}
