<%@ page contentType = "text/html;charset=utf-8" %>
<%@ page trimDirectiveWhitespaces="true" %>

<%@ page import="java.io.*" %>
<%@ page import="java.net.Socket" %>
<%@ page import="org.json.simple.JSONObject" %>
<%@ page import="org.json.simple.parser.JSONParser" %>
<%@ page import="org.json.simple.parser.ParseException" %>

<%@ page import="java.System.*" %>

<%
	request.setCharacterEncoding("UTF-8");
	
	String datetime = request.getParameter("datetime");
	if (datetime == null) return ;
	
	String sendStr = "";
	String recvStr = "";
	
	byte buffer[];
	
	try {
		Socket socket = new Socket("localhost", 4000);
		
		OutputStream output = socket.getOutputStream();
		InputStream input = socket.getInputStream();
		DataOutputStream dataOutput = new DataOutputStream(output);
		DataInputStream dataInput = new DataInputStream(input);
		
		//＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊//
		// Send
		JSONObject methodData = new JSONObject();
		methodData.put("datetime", datetime);
			
		JSONObject data = new JSONObject();
		data.put("method", "predict");
		data.put("data", methodData);
		
		sendStr = data.toJSONString();
		System.out.println(sendStr);
		
		buffer = sendStr.getBytes();
		dataOutput.write(buffer, 0, buffer.length);
		
		//＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊//
		// Recv
		buffer = new byte[2000];
		for (int i = 0; i < buffer.length; i++) {
			if ((buffer[i] = dataInput.readByte()) == 0)
				break;
		}
		recvStr = new String(buffer).trim();
		
		//＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊//
		input.close();
		dataInput.close();
		output.flush();
		output.close();
		dataOutput.flush();
		dataOutput.close();
		socket.close();
		
	} catch (Exception e) {
		recvStr = e.getMessage();
	}
%>
<%= recvStr %>