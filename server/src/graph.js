const seedrandom = require('seedrandom');
const assert = require('assert');

const Colors = require('./colors');

class Graph {
  constructor(nodes) {
    this.nodes = new Array(nodes).fill().map(() => new Set());
    this.colors = new Array(nodes).fill(Colors.NONE);
  }

  link(i, j) {
    assert(0 <= i && i < this.nodes.length, 'Invalid node: ' + i);
    assert(0 <= j && j < this.nodes.length, 'Invalid node: ' + j);
    this.nodes[i].add(j);
    this.nodes[j].add(i);
  }

  color(node, color) {
    this.colors[node] = color;
  }

  getColor(node) {
    return this.colors[node];
  }

  getNeighbors(node) {
    return Array.from(this.nodes[node]);
  }

  getAdjacencyLists() {
    return this.nodes.map(adj => Array.from(adj));
  }

  getColors() {
    return this.colors;
  }

  getNodesColored(color) {
    return this.colors.map((c, i) => i).filter(i => this.colors[i] == color);
  }

  static makeRandom(nodes, prob, seed) {
    // Use the unix timestamp if no seed provided
    if (seed == undefined) seed = Date.now();
    let rng = seedrandom(seed);
    // Generate a random probability if none provided
    if (prob == undefined) prob = rng();
    let graph = new Graph(nodes);

    // Each edge should only be considered once
    for (let i = 0; i < nodes; ++i)
      for (let j = i + 1; j < nodes; ++j)
        if (rng() < prob) graph.link(i, j);

    return graph;
  }

}

module.exports = Graph;
