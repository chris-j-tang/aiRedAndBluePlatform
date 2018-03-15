const idgen = require('human-readable-ids').hri.random;

const Game = require('./game');

class Manager {
  constructor() {
    this.games = {};
  }

  makeGame(nodes, rounds, time, seed) {
    let id = idgen();
    while (id in this.games) id = idgen();
    this.games[id] = new Game(id, seed, nodes, rounds, time, 0.5);
    return id;
  }

  getGame(id) {
    return this.games[id];
  }

  removeGame(id) {
    game = this.games[id];
    if (game) {
      delete this.games[id];
      return game.state;
    } else return undefined;
  }

  //for testing
  getIds() {
    return Object.keys(this.games);
  }

}

module.exports = Manager;
