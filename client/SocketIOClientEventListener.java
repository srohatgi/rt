import java.io.IOException;


public interface SocketIOClientEventListener {

	public void onError(IOException e);
	public void onMessage(String message);
	public void onClose(Boolean abnormal);
	public void onOpen();
	public void messageArrivedWithRoundtrip(long roundtripTime);
	
}
