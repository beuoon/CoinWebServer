
var Graph = function (canvasId) {
	this.CANVAS_SIZE = {width: 400, height: 200};	
	this.canvas = document.getElementById(canvasId);
	this.canvas.width = this.CANVAS_SIZE.width;
	this.canvas.height = this.CANVAS_SIZE.height;
	this.context = this.canvas.getContext('2d');
	
	this.FRAME_DELAY_TIME = 1000/60; // 60 FPS
	this.UPDATE_DELAY_TIME = 60000; // 1분
	this.MAX_TRY_NUM = 10;
	this.GRAPH_HEIGHT = this.CANVAS_SIZE.height*2/3;
	this.GRAPH_POS_Y = this.CANVAS_SIZE.height/3/2;
	
	this.shownHistory = null;
	this.history = []; // {time, value, pr(predictResult)} 
	
	this.minCost, this.maxCost;
	this.historyGraphNode = [];
	this.selectedIndex = null;
	
	this.fetchList = [];
	this.startedFetch = [];
	this.predictList = [];
	this.startedPredict = [];
	
	this.mouseX = null;
	this.graphMoveAccel = 0;
	
	this.nodeNum = 240;
	this.GRAPH_X_INTERVAL = this.CANVAS_SIZE.width/this.nodeNum;
	
	// Init
	this.init();
}
Graph.prototype = {
	init: function () {
	},
	start: function () {
		let self = this;
		setInterval(function () { self.frame.call(self); }, this.FRAME_DELAY_TIME);
		setInterval(function () { self.updateHistory.call(self); }, this.UPDATE_DELAY_TIME);
		
		this.fetchList.push(new Date().getTime());
	},
	
	frame: function () {
		this.update();
		this.draw();
	},
	
	update: function () {
		this.graphMoveAccel *= 0.8;
		this.moveGraph(this.graphMoveAccel);
		
		for (let i = this.startedPredict.length; this.predictList.length > 0 && i < this.MAX_TRY_NUM; i++) {
			let time = this.predictList.shift();
			this.predict(time);
			this.startedPredict.push(time);
		}
		
		for (let i = this.startedFetch.length; this.fetchList.length > 0 && i < this.MAX_TRY_NUM; i++) {
			let time = this.fetchList.shift();
			this.fetchHistory(new Date(time), this.nodeNum);
			this.startedFetch.push(time);
		}
	},
	updateHistory: function () {
		this.fetchList.push(new Date().getTime());
	},
	checkValue: function () {
		// history value 0 처리
		while (this.history.length > 0 && this.history[0].value == 0)
			this.history.shift();
		
		for (let i = 1; i < this.history.length; i++) {
			if (this.history[i].value == 0)
				this.history[i].value = this.history[i-1].value;
		}
	},
	moveGraph: function () {
		let index = this.history.length;
		if (this.shownHistory != null)
			index = this.history.indexOf(this.shownHistory);
		
		index = Math.round(index + this.graphMoveAccel);
		
		if (index < 0)
			index = 0;
		
		if (index >= this.history.length)
			this.shownHistory = null;
		else {
			this.shownHistory = this.history[index];
			this.fetchList.push(this.shownHistory.time);
		}
		
		this.updateGraph();	
	},
	updateGraph: function () {
		if (this.history.length == 0) return ;
		
		let startIndex = ((this.shownHistory == null) ? this.history.length : this.history.indexOf(this.shownHistory)) - this.nodeNum;
		if (startIndex < 0) startIndex = 0;
		
		// 최소, 최대값 구하기
		this.minCost = this.history[startIndex].value;
		this.maxCost = this.history[startIndex].value;
		for (let i = startIndex+1, j = 0; i < this.history.length && j < this.nodeNum; i++, j++) {
			if (this.minCost > this.history[i].value)
				this.minCost = this.history[i].value;
			
			if (this.maxCost < this.history[i].value)
				this.maxCost = this.history[i].value;
		}
		
		// 그래프 노드 생성
		let costGap = (this.maxCost-this.minCost);
		this.historyGraphNode = [];
		this.historyDivisions = [];
		for (let i = startIndex, j = 0; i < this.history.length && j < this.nodeNum; i++, j++)
			this.historyGraphNode.push({hData: this.history[i], y: (1-(this.history[i].value-this.minCost)/costGap) * this.GRAPH_HEIGHT + this.GRAPH_POS_Y});
	},
	
	draw: function () {
		var context = this.context;
		
		context.save();
        context.fillStyle = "#FFFFFF";
		context.fillRect(0, 0, this.CANVAS_SIZE.width, this.CANVAS_SIZE.height);
        context.restore();

		// History
		context.save();
		for (let i = 1; i < this.historyGraphNode.length; i++) {
			let prevTime = this.historyGraphNode[i-1].hData.time;
			let time = this.historyGraphNode[i].hData.time;
			
			if (time - prevTime > 60000) { // Division
				let x = (i-0.5)*this.GRAPH_X_INTERVAL;
				
				context.lineWidth = 1;
				context.strokeStyle = "#621010";
				
				context.beginPath();
				context.moveTo(x, 0);
				context.lineTo(x, this.CANVAS_SIZE.height);
				context.stroke();
			}
			else { // Line
				let pr = this.historyGraphNode[i-1].hData.pr;
				if (pr == null)
					context.strokeStyle = "#000000";
				else if (pr == true)
					context.strokeStyle = "#FF0000";
				else
					context.strokeStyle = "#0000FF";
				context.lineWidth = 2;
				
				context.beginPath();
				context.moveTo((i-1)*this.GRAPH_X_INTERVAL, this.historyGraphNode[i-1].y);
				context.lineTo(i*this.GRAPH_X_INTERVAL, this.historyGraphNode[i].y);
				context.stroke();
			}
		}
        context.restore();
		
		// Selected Index
		if (this.selectedIndex != null && this.selectedIndex < this.historyGraphNode.length) {
			let i = this.selectedIndex;
			let x = i * this.GRAPH_X_INTERVAL, y = this.historyGraphNode[i].y;
			let valueText = this.historyGraphNode[i].hData.value, timeText = new Date(this.historyGraphNode[i].hData.time).format("yyyy-MM-dd HH:mm:00");
			let valueWidth = context.measureText(valueText).width;
			let timeWidth = context.measureText(timeText).width;
			
			context.save();
			context.beginPath();
			
			context.fillStyle = "#00FF00";
			context.arc(x, y, 2, 0, Math.PI*2);
			context.fill();
			
			context.fillStyle = "#000000";
			context.fillText(valueText, x - valueWidth/2, y-2);
			context.fillText(timeText, x - timeWidth/2, y-12);
			
			context.restore();
		}
	},
	
	fetchHistory: function (time, dataNum) {
		let datetime = new Date(time).format("yyyy-MM-dd HH:mm:00");
		
		let self = this;
		$.ajax({
			type: "POST",
			url: "getHistory.jsp",
			data: {
				datetime: datetime,
				dataNum: dataNum
			},
			dataType: "json",
			error: function() {
				console.log("fetchHistory - 통신 실패");
			},
			success: function(obj) {
				if (obj["status"] != "succeed")
					console.log(obj["data"]);
				else {
					let data = obj["data"];
					
					for (let i = 0; i < data.length; i++) {
						let dataTime = new Date(data[i].datetime).getTime();
						let value = data[i].value;
						let hData = {time: dataTime, value: value, pr: null};
						
						
						let index = self.history.findIndex(h => h.time >= hData.time);
						if (index == -1)
							self.history.push(hData);
						else if (self.history[index].time == hData.time)
							continue;
						else
							self.history.splice(index, 0, hData);
						
						self.predictList.push(hData.time);
					}
					
					self.checkValue();
					self.updateGraph();
				}
			},
			complete: function() {
				let index = self.startedFetch.indexOf(time);
				self.startedFetch.splice(index, 1);
			}
		});
	},
	predict: function (time) {
		let datetime = new Date(time).format("yyyy-MM-dd HH:mm:00");
		
		let self = this;
		$.ajax({
			type: "POST",
			url: "predict.jsp",
			data: {
				datetime: datetime
			},
			dataType: "json",
			error: function(){
				console.log("predict - 통신 실패");
				self.predictList.push(time);
			},
			success: function(obj){
				if (obj["status"] != "succeed")
					console.log("predict - " + obj["data"]);
				else {
					let data = obj["data"];
					
					let hData = self.history.find(h => h.time == time);
					if (hData != null)
						hData.pr = data[0].value > data[1].value;
				}
			},
			complete: function() {
				let index = self.startedPredict.indexOf(time);
				self.startedPredict.splice(index, 1);
			}
		});
	},
	
	setNodeNum: function(nodeNum) {
		this.nodeNum = nodeNum;
		this.GRAPH_X_INTERVAL = this.CANVAS_SIZE.width/this.nodeNum;
	},
	
	mouseDown: function(e) {
		this.mouseX = e.layerX;
	},
	mouseUp: function(e) {
		this.mouseX = null;
	},
	mouseMove: function(e) {
		if (e.target.tagName == "CANVAS") {
			let x = e.layerX;
			
			this.selectedIndex = Math.round(x/this.GRAPH_X_INTERVAL);
			if (this.selectedIndex < 0 || this.selectedIndex >= this.nodeNum)
				this.selectedIndex = null;

			if (this.mouseX != null) {
				let delta = (this.mouseX-x) / 5;
				this.mouseX = x;
				
				this.graphMoveAccel += delta;
			}
		}
		else
			this.selectedIndex = null;
	},
	mouseWheel: function(e) {
		if (e.target.tagName != "CANVAS") return true;
		let delta = e.wheelDelta / 50;
		
		this.graphMoveAccel += delta;
		
		return false;
	}
};

var graph = new Graph("graphCanvas");
document.addEventListener('mousedown',	function (e) { graph.mouseDown(e);	});
document.addEventListener('mousemove',	function (e) { graph.mouseMove(e);	});
document.addEventListener('mouseup',	function (e) { graph.mouseUp(e); 	});
document.addEventListener('mousewheel',	function (e) { graph.mouseWheel(e);	});

function touchHandler(event) {
	// 출처: https://j07051.tistory.com/463 [흘러간다...]
	var touches = event.changedTouches,
		first = touches[0],
		type = "";
		
	switch (event.type) {
    case "touchstart": type = "mousedown"; break;
    case "touchmove":  type="mousemove"; break;       
    case "touchend":   type="mouseup"; break;
    default: return;
	}
	
	var simulatedEvent = document.createEvent("MouseEvent");
	simulatedEvent.initMouseEvent(type, true, true, window, 1,
							  first.screenX, first.screenY,
							  first.clientX, first.clientY, false,
							  false, false, false, 0/*left*/, null);
	 
	first.target.dispatchEvent(simulatedEvent);
}

document.addEventListener("touchstart", touchHandler, true);
document.addEventListener("touchmove", touchHandler, true);
document.addEventListener("touchend", touchHandler, true);

graph.start();