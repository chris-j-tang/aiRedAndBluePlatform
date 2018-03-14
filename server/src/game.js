const seedrandom = require('seedrandom');

class Game {
  constructor(id, seed, nodes = 100, rounds = 10, time = 30, prob = -1, starting_player = -1) {
    this.id = id;
    this.seed = seed;
  	this.nodes = nodes;
  	this.max_rounds = rounds;
  	this.current_round = 0;
  	this.max_time = time;

  	//create the adjaceny list
  	this.adj_matrix = new Array(nodes);
  	for(let i = 0; i < nodes; i++) {
  		this.adj_matrix[i] = new Array(nodes);
  		for(let j = 0; j < nodes; j++) {
  			this.adj_matrix[i][j] = 0;
  		}
  	}

  	//colors: { 0 : "grey", 1 : "red", 2 : "blue"}
  	this.nodes_color = new Array(nodes);
  	for(let i = 0; i < nodes; i++) {
  		this.nodes_color[i] = 0;
  	}
    this.state = {};

    //starting player was not defined so choose one randomly
    if(starting_player == -1) {
    	if(Math.random() < 0.5) {
    		this.starting_player = 1;
    	} else {
    		this.starting_player = 2;
    	}
    } else {
    	this.starting_player = starting_player;
    }

    this.curent_player = this.starting_player;

    //generate the edges for the graph randomly
    let rng = seedrandom(this.seed);
    let p = 0;
    if (prob == -1) {
    	p = rng();
    } else {
    	p = prob;
    }
    for(let i = 0; i < nodes; i++) {
  		for(let j = 0; j < nodes; j++) {
  			if(i == j || this.adj_matrix[i][j] == 1) {
  				continue;
  			} else {
  				if (rng() < p) {
  					this.adj_matrix[i][j] = 1;
  					this.adj_matrix[j][i] = 1;
  				}
  			}
  		}
  	}
  }

  isDone() {
  	if(this.current_round == this.max_rounds) {
  		return true;
  	}
  	for(let i = 0; i < this.nodes; i++) {
  		if(this.nodes_color[i] == 0) {
  			return false;
  		}
  	}
  	return true;
  }

  selectNode(node) {
  	if(!this.isDone()) {
  		if(this.nodes_color[node] == 0) {
  			this.nodes_color[node] = this.curent_player;
  			for(let i = 0; i < this.nodes; i++) {
  				if(this.adj_matrix[node][i] == 1) {
  					this.nodes_color[i] = this.curent_player;
  				}
  			}

  			if(this.curent_player == 1) {
  				this.current_player = 2;
  			} else {
  				this.current_player = 1;
  			}

  			this.current_round++;
  		}
  	}
  }

  printNodes() {
  	let str = "";
  	for(let i = 0; i < this.nodes; i++) {
  		str += "node " + i + " : " + this.nodes_color[i];
  		str += "\n";
  	}
  	return str;
  }

  printMatrix() {
  	let str = "";
  	for(let i = 0; i < this.nodes; i++) {
  		str += "node " + i + " : ";
  		for(let j = 0; j < this.nodes; j++) {
  			str += this.adj_matrix[i][j] + " ";
  		}
  		str += "\n";
  	}
  	return str;
  }
}

module.exports = Game;
