
var Graph = function (canvasId) {
	this.CANVAS_SIZE = {width: 200, height: 200};
	
	this.canvas = document.getElementById(canvasId);
	this.canvas.width = this.CANVAS_SIZE.width;
	this.canvas.height = this.CANVAS_SIZE.height;
	this.context = this.canvas.getContext('2d');
	
	this.DRAW_DELAY_TIME = 1000/60; // 60 FPS
	this.UPDATE_DELAY_TIME = 60000; // 1분
	this.MAX_NODE_NUM = 120;
	this.PREDICT_OUTPUT_NUM = 5
	this.GRAPH_HEIGHT = this.CANVAS_SIZE.height*2/3;
	this.GRAPH_POS_Y = this.CANVAS_SIZE.height/3/2;
	this.GRAPH_X_INTERVAL = this.CANVAS_SIZE.width/this.MAX_NODE_NUM;
	
	this.lastHistoryTime;
	this.history = [];
	this.predictList = []; // {date, value, index, graph}
	
	this.minCost, this.maxCost;
	this.historyGraphNode = [];
	this.historyDivisions = [];
	this.selectedIndex = null;
	
	// Init
	this.init();
}
Graph.prototype = {
	init: function () {
	},
	start: function () {
		let self = this;
		setInterval(function () { self.draw.call(self); }, this.DRAW_DELAY_TIME);
		setInterval(function () { self.updateData.call(self); }, this.UPDATE_DELAY_TIME);
		
		let fetchDate = new Date();
		fetchDate.setMinutes(fetchDate.getMinutes()-this.MAX_NODE_NUM);
		this.lastHistoryTime = fetchDate.getTime();
		this.fetchHistory();
		
		let predictDate = new Date();
		predictDate.setSeconds(0);
		predictDate.setMilliseconds(0);
		while (predictDate >= fetchDate) {
			predictDate.setMinutes(predictDate.getMinutes()-5);
			this.predict(new Date(predictDate));
		}
	},
	
	frame: function () {
		this.draw();
	},
	
	updateData: function () {
		this.fetchHistory();
		let predictDate = new Date(this.lastHistoryTime);
		// predictDate.setMinutes(predictDate.getMinutes()-this.PREDICT_OUTPUT_NUM);
		this.predict(predictDate);
	},
	updateValue: function () {
		// 이전 기록 지우기
		if (this.history.length > this.MAX_NODE_NUM)
			this.history = this.history.splice(this.history.length - this.MAX_NODE_NUM);
		
		// history value 0 처리
		while (this.history.length > 0 && this.history[0].value == 0)
			this.history.shift();
		
		for (let i = 1; i < this.history.length; i++) {
			if (this.history[i].value == 0)
				this.history[i].value = this.history[i-1].value;
		}
		
		// 최소, 최대값 구하기
		this.minCost = this.history[0].value;
		this.maxCost = this.history[0].value;
		for (let i = 1; i < this.history.length; i++) {
			if (this.minCost > this.history[i].value)
				this.minCost = this.history[i].value;
			
			if (this.maxCost < this.history[i].value)
				this.maxCost = this.history[i].value;
		}
		
		// 예측값 처리
		for (let i = 0; i < this.predictList.length; i++) {
			let pv = this.predictList[i];
			pv.index = -1;
			for (let j = 0; j < this.history.length; j++) {
				if (pv.time == this.history[j].time) {
					pv.index = j;
					break;
				}
			}
			
			if (pv.index == -1) { // 지난 데이터 삭제
				this.predictList.splice(i--, 1);
				continue;
			}
			else if (pv.graph != null)
				continue;
			
			// 예측값 변환
			let prevValue = this.history[pv.index].value;
			let rate = pv.value;
			pv.value = [prevValue];
			
			for (let i = 0; i < rate.length; i++) {
				prevValue *= rate[i].rate;
				pv.value.push(prevValue);
				
				if (this.minCost > prevValue)
					this.minCost = prevValue;
				
				if (this.maxCost < prevValue)
					this.maxCost = prevValue;
			}
		}
		
		// 그래프 노드 생성
		let costGap = (this.maxCost-this.minCost);
		this.historyGraphNode = [];
		this.historyDivisions = [];
		for (let i = 0; i < this.history.length; i++) {
			this.historyGraphNode.push((1-(this.history[i].value-this.minCost)/costGap) * this.GRAPH_HEIGHT + this.GRAPH_POS_Y);
			if (i == 0) continue;
			
			// 구분선
			let continTime = this.history[i-1].time + 60000;
			if (this.history[i].time != continTime)
				this.historyDivisions.push(i);
		}
		
		for (let i = 0; i < this.predictList.length; i++) {
			let pv = this.predictList[i];
			
			pv.graph = [];
			for (let i = 0; i < pv.value.length; i++)
				pv.graph[i] = (1-(pv.value[i]-this.minCost)/costGap) * this.GRAPH_HEIGHT + this.GRAPH_POS_Y;
		}
	},
	
	draw: function () {
		var context = this.context;
		
		context.save();
        context.fillStyle = "#FFFFFF";
		context.fillRect(0, 0, this.CANVAS_SIZE.width, this.CANVAS_SIZE.height);
        context.restore();

		// History
		context.save();
		context.beginPath();
		
		context.moveTo(0, this.historyGraphNode[0]);
		for (let i = 1; i < this.historyGraphNode.length; i++)
			context.lineTo(i*this.GRAPH_X_INTERVAL, this.historyGraphNode[i]);
		
		context.stroke();
        context.restore();
		
		// History Division
		context.save();
        context.strokeStyle = "#621010";
		for (let i = 0; i < this.historyDivisions.length; i++) {
			let x = (this.historyDivisions[i]-0.5)*this.GRAPH_X_INTERVAL;
			context.beginPath();
			context.moveTo(x, 0);
			context.lineTo(x, this.CANVAS_SIZE.height);
			context.stroke();
		}
        context.restore();
		
		// Predict
		for (let i = 0; i < this.predictList.length; i++) {
			let pv = this.predictList[i];
			if (pv.graph == null) continue;
			
			context.save();
			context.beginPath();
			
			context.strokeStyle = "#FF0000";
			
			context.moveTo(pv.index*this.GRAPH_X_INTERVAL, pv.graph[0]);
			for (let i = 1, x = pv.index+1; i < pv.graph.length; i++, x++)
				context.lineTo(x*this.GRAPH_X_INTERVAL, pv.graph[i]);
			
			context.stroke();
			context.restore();
		}
		
		// Selected Index
		if (this.selectedIndex != null && this.selectedIndex < this.historyGraphNode.length) {
			let i = this.selectedIndex;
			let x = i * this.GRAPH_X_INTERVAL, y = this.historyGraphNode[i];
			let valueText = this.history[i].value, timeText = new Date(this.history[i].time).format("yyyy-MM-dd HH:mm:00");
			let valueWidth = context.measureText(valueText).width;
			let timeWidth = context.measureText(timeText).width;
			
			context.save();
			context.beginPath();
			
			context.fillStyle = "#0000FF";
			context.arc(x, y, 2, 0, Math.PI*2);
			context.fill();
			
			context.fillStyle = "#000000";
			context.fillText(valueText, x - valueWidth/2, y-2);
			context.fillText(timeText, x - timeWidth/2, y-12);
			
			context.restore();
		}
	},
	
	fetchHistory: function () {
		let datetime = new Date(this.lastHistoryTime).format("yyyy-MM-dd HH:mm:00");
		
		let self = this;
		$.ajax({
			type : "POST",
			url : "getHistory.jsp",
			data: {
				startDatetime: datetime,
			},
			dataType : "json",
			error : function(){
				console.log("fetchHistory - 통신 실패");
			},
			success : function(obj){
				if (obj["status"] != "succeed")
					console.log(obj["data"]);
				else {
					let data = obj["data"];
					
					for (let i = 0; i < data.length; i++) {
						let time = new Date(data[i].datetime).getTime();
						let value = data[i].value;
						
						if (self.history.find(h => h.time == time) == null)
							self.history.push({time: time, value: value});
					}
					
					self.lastHistoryTime = self.history[self.history.length-1].time + 60000;
					self.updateValue();
				}
			}
		});
	},
	getPrevHistory: function (startDatetime, endDateTime) {
		let self = this;
		
		$.ajax({
			type : "POST",
			url : "getHistory.jsp",
			data: {
				startDatetime: startDatetime,
				endDatetime: endDateTime
			},
			dataType : "json",
			error : function(){
				console.log("getPrevHistory - 통신 실패");
			},
			success : function(obj){
				if (obj["status"] != "succeed")
					console.log(obj["data"]);
				else {
					let data = obj["data"];
				}
			}
		});
	},
	
	predict: function (date) {
		let datetime = date.format("yyyy-MM-dd HH:mm:00");
		
		let self = this;
		$.ajax({
			type : "POST",
			url : "predict.jsp",
			data: {
				datetime: datetime
			},
			dataType : "json",
			error : function(){
				console.log("predict - 통신 실패");
			},
			success : function(obj){
				if (obj["status"] != "succeed")
					console.log("predict - " + obj["data"]);
				else {
					let data = obj["data"];
					let time = date.getTime();
					if (self.predictList.find(pv => pv.time == time) == null) {
						self.predictList.push({time: time, value: data, index: null, graph: null});
						self.updateValue();
					}
				}
			}
		});
	},
	
	mouseMove: function(e) {
		if (e.target.tagName == "CANVAS")
			this.selectedIndex = Math.round(e.layerX/this.GRAPH_X_INTERVAL);
	}
};

var graph = new Graph("graphCanvas");

// document.addEventListener('keydown',		function (e) { graph.keyDown(e); });
// document.addEventListener('keypress',	function (e) { graph.keyPress(e); });
// document.addEventListener('keyup',		function (e) { graph.keyUp(e); });
// document.addEventListener('mousedown',	function (e) { graph.mouseDown(e); });
document.addEventListener('mousemove',	function (e) { graph.mouseMove(e); });
// document.addEventListener('mouseup',		function (e) { graph.mouseUp(e); });

graph.start();