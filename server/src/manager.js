const idgen = require('human-readable-ids').hri.random;

const Game = require('./game');

class Manager {
  constructor() {
    this.games = {};
  }

  makeGame(nodes, rounds, time, seed) {
    let id = idgen();
    while (id in games) id = idgen();
    games[id] = new Game(id, seed);
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

}

module.exports = Manager;
