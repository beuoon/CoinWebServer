<%@ page contentType = "text/html;charset=utf-8" %>
<%@ page trimDirectiveWhitespaces="true" %>

<%@ page import="java.io.*" %>
<%@ page import="java.net.Socket" %>
<%@ page import="org.json.simple.JSONObject" %>
<%@ page import="org.json.simple.parser.JSONParser" %>
<%@ page import="org.json.simple.parser.ParseException" %>
<%
	request.setCharacterEncoding("UTF-8");
	
	String func = request.getParameter("func");
	String power = request.getParameter("power");
	
	String sendStr = "";
	String recvStr = "";
	
	if (func != null && power != null) {
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
			methodData.put("func", func);
			methodData.put("power", power);
			
			JSONObject data = new JSONObject();
			data.put("method", "control");
			data.put("data", methodData);
			
			sendStr = data.toJSONString();
			
			buffer = sendStr.getBytes();
			dataOutput.write(buffer, 0, buffer.length);
			
			//＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊//
			// Recv
			buffer = new byte[100];
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
	}
%>
<%= recvStr %>