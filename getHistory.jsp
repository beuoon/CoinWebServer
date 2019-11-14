<%@ page contentType = "text/html;charset=utf-8" %>
<%@ page trimDirectiveWhitespaces="true" %>

<%@ page import="java.sql.Connection" %>
<%@ page import="java.sql.DriverManager" %>
<%@ page import="java.sql.ResultSet" %>
<%@ page import="java.sql.ResultSetMetaData" %>
<%@ page import="java.sql.SQLException" %>
<%@ page import="java.sql.Statement" %>

<%@ page import="org.json.simple.JSONObject" %>
<%@ page import="org.json.simple.JSONArray" %>
<%@ page import="org.json.simple.parser.JSONParser" %>
<%@ page import="org.json.simple.parser.ParseException" %>

<%@ page import="java.text.SimpleDateFormat" %>
<%@ page import="java.System.*" %>

<%
	request.setCharacterEncoding("UTF-8");
	
	String startDatetime = request.getParameter("startDatetime");
	String endDatetime = request.getParameter("endDatetime");
	if (startDatetime == null) return ;
	
	String recvStr = "";
	
	String driverName = "com.mysql.jdbc.Driver";
	String dbURL = "jdbc:mysql://localhost:3306/bitcoin?useUnicode=true&characterEncoding=utf8";
	String user = "root";
	String password = "root";
	
	SimpleDateFormat dateFormat = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
	String query = "";
	if (endDatetime != null)
		query = String.format("select * from history where datetime >= '%s' and datetime < '%s'", startDatetime, endDatetime);
	else
		query = String.format("select * from history where datetime >= '%s'", startDatetime);
	
	Connection connection = null;
	
	try {
		Class.forName(driverName);
		
		connection = DriverManager.getConnection(dbURL, user, password);
		
		Statement statement = connection.createStatement();
		ResultSet rs = statement.executeQuery(query);
		ResultSetMetaData rsmd = rs.getMetaData();
		
		// Array로 만들어야지!!
		JSONObject data = new JSONObject();
		
		JSONArray dataArr = new JSONArray();
		
		int numColumns = rsmd.getColumnCount();
		while (rs.next()) {
			JSONObject obj = new JSONObject();
			
			obj.put("datetime", dateFormat.format(rs.getTimestamp("datetime")));
			obj.put("value", rs.getDouble("trans_ask_min"));
			
			dataArr.add(obj);
		}
		rs.close();
		
		data.put("status", "succeed");
		data.put("data", dataArr);
		recvStr = data.toJSONString();
		
		System.out.println(recvStr);
		
	} catch (Exception e) {
		recvStr = e.getMessage();
	} finally{
		try {
			if (connection != null && !connection.isClosed())
				connection.close();
		} catch (SQLException e) {
			recvStr = e.getMessage();
		}
	}
	
	System.out.println(recvStr);
%>
<%= recvStr %>