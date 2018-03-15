const seedrandom = require('seedrandom');

const Colors = require('./colors');

function makeRandomState(nodes, prob, seed) {
  if (seed == undefined) seed = Date.now();
  let rng = seedrandom(seed);
  if (prob == undefined) prob = rng();
  let state = {}
  state.nodes = [];
  state.colors = [];

  for (let i = 0; i < nodes; ++i) {
    state.nodes.push([]);
    state.colors.push(Colors.NONE);
  }

  for (let i = 0; i < nodes; ++i)
    for (let j = i + 1; j < nodes; ++j)
      if (rng() <= prob) {
        state.nodes[i].push(j);
        state.nodes[j].push(i);
      }
  return state;
}

class Game {
  constructor(rounds, time, state) {
    this.rounds = rounds;
    this.time = time;
    this.state = state;
    this.players = [];
    this.turn = 0;
  }

  hasPlayers() {
    return this.players.length == 2;
  }

  isPlayer(id) {
    return this.players.includes(id);
  }

  join(id) {
    assert(!this.hasPlayers(), 'Game is already full');
    assert(!this.isPlayer(id), 'Player with id ' + id + ' has already joined this match');
    this.players.push(id);
  }

  isTurn(id) {
    return this.players[this.turn % 2] == id;
  }

  getColor(id) {
    assert(this.isPlayer(id), 'Invalid player id: ' + id);
    return [Colors.RED, Colors.BLUE][this.players.indexOf(id)];
  }

  getScore(id) {
    let color = this.getColor(id);
    return this.state.colors.reduce((a, c) => a + (c == color? 1 : 0));
  }

  getRound() {
    return this.turn / 2;
  }

  isDone() {
    return this.getRound() == this.rounds || this.state.colors.every(c => c != Colors.NONE);
  }

  select(id, node) {
    assert(!this.isDone(), 'Game is already over');
    assert(this.hasPlayers(), 'Not enough players');
    assert(this.isTurn(id), 'Wrong player');
    assert(this.state.colors[node] == Colors.NONE, 'Node already colored');
    let color = this.getColor(id);
    this.state.colors[node] = color;
    let diff = [node];
    for (let x of this.state.nodes[node])
      if (this.state.colors[x] != color) {
        this.state.colors[x] = color;
        diff.push(x);
      }
    ++this.turn;
    return diff;
  }

}

module.exports = function makeGame(rounds, time, nodes, prob, seed) {
  return new Game(rounds, time, makeRandomState(nodes, prob, seed));
};
