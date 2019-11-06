<%@ page contentType = "text/html;charset=utf-8" %>
<%@ page import="java.io.*" %>
<%@ page import="java.net.Socket" %>
<%
	String sendStr = "";
	String recvStr = "";
	
	try {
		Socket socket = new Socket("localhost", 4000);
		
		OutputStream output = socket.getOutputStream();
		InputStream input = socket.getInputStream();
		DataOutputStream dataOutput = new DataOutputStream(output);
		DataInputStream dataInput = new DataInputStream(input);
		
		sendStr = "end";
		byte buffer[] = sendStr.getBytes();
		dataOutput.write(buffer, 0, buffer.length);
		
		buffer = new byte[100];
		for (int i = 0; i < buffer.length; i++) {
			if ((buffer[i] = dataInput.readByte()) == 0)
				break;
		}
		recvStr = new String(buffer);
		
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

<html>
	<head>
	</head>
	<body>
        시작<br>
        <%%>
		송신: <%= sendStr %><br>
		<%= String.format("수신: %s", recvStr) %><br>
		끝<br>
	</body>
</html>