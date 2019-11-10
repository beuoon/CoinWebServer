<%@ page contentType = "text/html;charset=utf-8" %>

<html>
	<head>
		<script src="js/jquery-3.4.1.min.js"></script>
		<link rel="stylesheet" href="css/toggle.css"/>
		<style>
			div.toggle { position: relative; width: 210px; height: 36px; }
			p.toggle { font-size:18px; font-weight: bold; position: absolute; border-radius: 15px / 50%; margin: 0; padding: 4px; width: 160px; height: 26px; background: #ece6e6; }
			label.toggle { left : 130px; }
		</style>
		<script type="text/javascript" language="javascript">
			$(document).ready(function () {
				$.ajax({
					type : "GET",
					url : "getStatus.jsp",
					dataType : 'json',
					error : function(){
						alert("통신 실패!!!!");
					},
					success : function(obj){
						if (obj["status"] == "succeed") {
							document.getElementById('train').checked = obj["data"]["train"];
							document.getElementById('train').checked = obj["data"]["train"];
						}
					}
				});
			});
		
			function switchFunc(cb) {
				let prevCheck = !cb.checked;
				
				let func = cb.id;
				let power = (cb.checked) ? "on" : "off";
				
				$.ajax({
					type : "POST",
					url : "switchFunc.jsp",
					data: {
						func: func,
						power: power
					},
					dataType : "json",
					error : function(){
						alert("통신 실패!!!!");
					},
					success : function(obj){
						if (obj["status"] != "succeed") {
							alert(obj["data"]);
							cb.checked = prevCheck;
						}
					}
				});
			}
		</script>
	</head>
	<body>
		<div class="toggle">
			<p class="toggle">데이터 축적</p>
			<input type="checkbox" name="saveData" id="saveData" onclick="switchFunc(this);" checked>
			<label class="toggle" for="saveData"><span></span></label>
		</div>
		<div class="toggle">
			<p class="toggle">신경망 학습</p>
			<input type="checkbox" name="train" id="train" onclick="switchFunc(this);" checked>
			<label class="toggle" for="train"><span></span></label>
		</div>
	</body>
	
</html>