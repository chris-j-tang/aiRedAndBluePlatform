function setRedScore(score) {
	
}

function setBlueScore(score) {
	
}

function setRound(round) {
	
}

function setTimer(timeLeft) {
	
}

function generateRandomGraph() {
	var count = 100;
	var graph = new Graph(count);
	for(var i = 0; i < count; i++) {
		graph.nodes.push(new Node(i));
	}
	for(var i = 0; i < count; i++) {
		var set = [];
		for(var k = 0; k < count; k++) {
			if(i != k) {
				var p = Math.random();
				if(p < 0.1) {
					set.push(true);
				}
				else {
					set.push(false);
				}
			}
		}
		graph.matrix.push(set);
	}
}

var graph = function(nodeCount) {
	this.nodes = [];
	this.matrix = [];
}

var node = function(num) {
	this.num = num;
	this.radius = 10;
	this.x = 0;
	this.y = 0;
	this.contains = function(x, y) {
		if(Math.srqt(Math.pow(x - this.x, 2) + Math.pow(y - this.y, 2)) <= radius) {
			return true;
		}
		else {
			return false;
		}
	}
}

function updateGraph(graph) {
	
}