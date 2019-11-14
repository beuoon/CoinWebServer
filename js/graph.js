
var Graph = function (canvasId) {
	this.canvasSize = {width: 200, height: 200};
	
	this.canvas = document.getElementById(canvasId);
	this.canvas.width = this.canvasSize.width;
	this.canvas.height = this.canvasSize.height;
	this.context = this.canvas.getContext('2d');
	
	this.FRAME_DELAY_TIME = 60000; // 1분
	
	this.lastHistoryDate;
	this.history = [];
	
	this.predictDate = null;
	this.predictRate = null, this.predictValue = null;
	
	this.maxNodeNum = 120;
	this.graphXInterval;
	this.graphHeight = this.canvasSize.height*2/3;
	this.graphBaseY = this.canvasSize.height/3/2;
	
	this.minCost, this.maxCost;
	this.historyGraphNode = [];
	this.predictGraphNode = null;
	this.predictGraphX;
	
	// Init
	this.init();
}
Graph.prototype = {
	init: function () {
	},
	start: function () {
		let self = this;
		setInterval(function () { self.frame.call(self) }, this.FRAME_DELAY_TIME);
		
		let date = new Date();
		date.setMinutes(date.getMinutes()-this.maxNodeNum);
		
		this.lastHistoryDate = date;
		this.fetchHistory();
	},
	
	frame: function () {
		this.update();
		this.draw();
	},
	
	update: function (frameInterval) {
		this.fetchHistory();
		this.predict(this.lastHistoryDate);
		
		// history value 0 처리
		while (this.history.length > 0 && this.history[0].value == 0)
			this.history.shift();
		
		for (let i = 1; i < this.history.length; i++) {
			if (this.history[i].value == 0)
				this.history[i].value = this.history[i-1].value;
		}
		
		// 그래프 노드
		if (this.history.length > 0) {
			let startIndex = this.history.length-this.maxNodeNum;
			if (startIndex < 0) startIndex = 0;
			
			// 최소, 최대값 구하기
			this.minCost = this.history[startIndex].value;
			this.maxCost = this.history[startIndex].value;
			for (let i = startIndex+1; i < this.history.length; i++) {
				if (this.minCost > this.history[i].value)
					this.minCost = this.history[i].value;
				
				if (this.maxCost < this.history[i].value)
					this.maxCost = this.history[i].value;
			}
			
			// 예측값 처리
			if (this.predictDate != null) {
				let prevDataIndex = this.history.length - (this.lastHistoryDate - new Date(this.predictDate))/60000 - 1;
				if (prevDataIndex < 0) this.predictDate = null; // 예외처리
				else {
					// 예측값 변환
					let prevValue = this.history[prevDataIndex].value;
					
					this.predictValue = [prevValue];
					for (let i = 0; i < this.predictRate.length; i++) {
						prevValue *= this.predictRate[i].rate; // 나중에 make하면 value로 바꿔야 됨
						this.predictValue.push(prevValue);
						
						if (this.minCost > prevValue)
							this.minCost = prevValue;
						
						if (this.maxCost < prevValue)
							this.maxCost = prevValue;
					}
					
					// 예측값 x 좌표 구하기
					this.predictGraphX = prevDataIndex - startIndex;
				}
			}
			
			// 그래프 노드 생성
			let gap = (this.maxCost-this.minCost);
			
			this.historyGraphNode = [];
			for (let i = startIndex; i < this.history.length; i++)
				this.historyGraphNode.push((1-(this.history[i].value-this.minCost)/gap) * this.graphHeight + this.graphBaseY);
			
			if (this.predictDate != null) {
				this.predictGraphNode = [];
				for (let i = 0; i < this.predictValue.length; i++)
					this.predictGraphNode[i] = (1-(this.predictValue[i]-this.minCost)/gap) * this.graphHeight + this.graphBaseY;
			}
			else
				this.predictGraphNode = null;
		}
		
		this.graphXInterval = this.canvasSize.width/(this.maxNodeNum+30);
	},
	draw: function () {
		var context = this.context;
		
		context.save();
        context.fillStyle = "#FFFFFF";
		context.fillRect(0, 0, context.canvas.width, context.canvas.height);
        context.restore();

		context.save();
		context.beginPath();
		
		context.moveTo(0, this.historyGraphNode[0]);
		for (let i = 1; i < this.historyGraphNode.length; i++)
			context.lineTo(i*this.graphXInterval, this.historyGraphNode[i]);
		
		context.stroke();
        context.restore();
		
		if (this.predictGraphNode != null) {
			context.save();
			context.beginPath();
			
			context.strokeStyle = "#FF0000";
			
			context.moveTo(this.predictGraphX*this.graphXInterval, this.predictGraphNode[0]);
			for (let i = 1, x = this.predictGraphX+1; i < this.predictGraphNode.length; i++, x++)
				context.lineTo(x*this.graphXInterval, this.predictGraphNode[i]);
			
			context.stroke();
			context.restore();
		}
	},
	
	fetchHistory: function () {
		let datetime = this.lastHistoryDate.format("yyyy-MM-dd HH:mm:00");
		
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
					
					if (data.length > 0) {
						self.history = self.history.concat(data);
						
						let date = new Date(data[data.length-1].datetime);
						date.setMinutes(date.getMinutes()+1);
						self.lastHistoryDate = date;
					}
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
				if (obj["status"] != "succeed") {
					console.log("predict - " + obj["data"]);
				}
				else {
					let data = obj["data"];
					self.predictDate = datetime;
					self.predictRate = data;
				}
			}
		});
	},
	
	keyDown: function (e) {
	},
	keyPress: function (e) {
	},
	keyUp: function (e) {
	},
	mouseDown: function (e) {
	}
};

var graph = new Graph("graphCanvas");

document.addEventListener('keydown',	function (e) { graph.keyDown(e); });
document.addEventListener('keypress',	function (e) { graph.keyPress(e); });
document.addEventListener('keyup',		function (e) { graph.keyUp(e); });
document.addEventListener('mousedown',	function (e) { graph.mouseDown(e); }); // mousedown, mousemove, mouseup

graph.start();