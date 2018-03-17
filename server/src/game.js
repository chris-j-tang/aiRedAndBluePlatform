const assert = require('assert');

const Colors = require('./colors');
const DeferredPromise = require('./deferred-promise');

class Player {
  constructor(color) {
    this.color = color;
    this.score = 0;
  }
}

const colors = [Colors.RED, Colors.BLUE];

class Game {
  constructor(rounds, time, graph) {
    this.rounds = rounds;
    this.time = time;
    this.graph = graph;

    this.turn = 0;
    this.players = {};
    this.order = [];

    this.promises = {};
    this.promises.begin = new DeferredPromise();
  }

  getPlayerCount() {
    return Object.keys(this.players).length;
  }

  hasPlayers() {
    return this.getPlayerCount() == 2;
  }

  isPlayer(player) {
    return player in this.players;
  }

  isTurn(player) {
    return player == this.order[this.turn % this.order.length];
  }

  getColor(player) {
    return this.players[player].color;
  }

  getScore(player) {
    return this.players[player].score;
  }

  getOpponent(player) {
    return Object.keys(this.players).find(c => c != player);
  }

  getRound() {
    return Math.floor(this.turn / 2);
  }

  isDone() {
    return this.round == this.rounds || this.graph.getNodesColored(Colors.NONE).length == 0;
  }

  join(player) {
    assert(!this.hasPlayers(), 'Game is already full');
    assert(!this.isPlayer(player), 'Player ' + player + ' has already joined');
    this.players[player] = new Player(colors[this.getPlayerCount()]);
    this.order.push(player);
    if (this.hasPlayers())
      this.promises.begin.resolve();
  }

  submit(player, node) {
    assert(this.hasPlayers(), 'Game has not started');
    assert(!this.isDone(), 'Game is done');
    assert(this.isTurn(player), 'Wrong player');
    assert(this.graph.getColor(node) == Colors.NONE, 'Node is already colored');
    const color = this.getColor(player);
    this.graph.color(node, color);
    let diff = [node];
    for (let n of this.graph.getNeighbors(node))
      if (this.graph.getColor(n) != color) {
        if (this.graph.getColor(n) != Colors.NONE)
          this.players[this.getOpponent(player)].score -= 1;
        this.graph.color(n, color);
        diff.push(n);
      }
    this.players[player].score += diff.length;
    ++this.turn;
    return diff;
  }

  getState() {
    return this.promises.begin.then(() => new Object({
      static: {
        rounds: this.rounds,
        time: this.time,
        graph: this.graph.getAdjacencyLists(),
      },
      colors: this.graph.getColors()
    }));
  }
}

module.exports = Game;
