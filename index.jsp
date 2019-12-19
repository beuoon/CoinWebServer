<%@ page contentType = "text/html;charset=utf-8" %>

<html>
	<head>
		<title>CoinPredict</title>
		<script src="js/jquery-3.4.1.min.js"></script>
		<link rel="stylesheet" href="css/toggle.css"/>
		<link rel="stylesheet" href="css/slider.css"/>
		<style>
			div.toggle { position: relative; width: 210px; height: 36px; }
			p.toggle { font-size:18px; font-weight: bold; position: absolute; border-radius: 15px / 50%; margin: 0; padding: 4px; width: 160px; height: 26px; background: #ece6e6; }
			label.toggle { left : 130px; }
			
			#graphCanvas { border: ridge; border-color: gray; }
		</style>
		<script type="text/javascript" language="javascript">
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
						console.log("switchFunc - 통신 실패");
					},
					success : function(obj){
						if (obj["status"] != "succeed") {
							alert(obj["data"]);
							cb.checked = prevCheck;
						}
					}
				});
			}
			
			// Date
			Date.prototype.format = function(f) {
				if (!this.valueOf()) return " ";
			 
				var weekName = ["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"];
				var d = this;
				 
				return f.replace(/(yyyy|yy|MM|dd|E|hh|mm|ss|a\/p)/gi, function($1) {
					switch ($1) {
						case "yyyy": return d.getFullYear();
						case "yy": return (d.getFullYear() % 1000).zf(2);
						case "MM": return (d.getMonth() + 1).zf(2);
						case "dd": return d.getDate().zf(2);
						case "E": return weekName[d.getDay()];
						case "HH": return d.getHours().zf(2);
						case "hh": return ((h = d.getHours() % 12) ? h : 12).zf(2);
						case "mm": return d.getMinutes().zf(2);
						case "ss": return d.getSeconds().zf(2);
						case "a/p": return d.getHours() < 12 ? "오전" : "오후";
						default: return $1;
					}
				});
			};
		 
			String.prototype.string = function(len){var s = '', i = 0; while (i++ < len) { s += this; } return s;};
			String.prototype.zf = function(len){return "0".string(len - this.length) + this;};
			Number.prototype.zf = function(len){return this.toString().zf(len);};
			
			// Status 갱신
			$(document).ready(function () {
				$.ajax({
					type : "GET",
					url : "getStatus.jsp",
					dataType : 'json',
					error : function(){
						console.log("getStatus - 통신 실패");
					},
					success : function(obj){
						if (obj["status"] == "succeed") {
							document.getElementById('train').checked = obj["data"]["train"];
							document.getElementById('train').checked = obj["data"]["train"];
						}
					}
				});
			});
		</script>
	</head>
	<body>
		<canvas id="graphCanvas"></canvas><br><br>
		
		<div class="slidecontainer">
			<input type="range" min="20" max="500" value="240" class="slider" id="nodeNum">
		</div>
		
		<br>
		
		<div class="toggle">
			<p class="toggle">데이터 축적</p>
			<input type="checkbox" class="toggle" name="saveData" id="saveData" onclick="switchFunc(this);" checked>
			<label class="toggle" for="saveData"><span></span></label>
		</div>
		<div class="toggle">
			<p class="toggle">신경망 학습</p>
			<input type="checkbox" class="toggle"name="train" id="train" onclick="switchFunc(this);" checked>
			<label class="toggle" for="train"><span></span></label>
		</div>
		
		<script src="js/graph.js"></script>
		<script>
			let slider = document.getElementById("nodeNum");
			slider.oninput = function() {
				graph.setNodeNum(this.value);
			}
		</script>
	</body>
	
</html>