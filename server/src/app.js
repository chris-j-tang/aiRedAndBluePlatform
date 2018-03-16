const assert = require('assert');
const express = require('express');
const app = express();
const hidgen = require('human-readable-ids').hri.random;

const RateLimiter = require('express-rate-limit');
const Game = require('./game');
const Graph = require('./graph');

let games = {};

app.use(express.json());

app.route('/game')
  // Starting a game
  .post(new RateLimiter({
    // Limit the rate at which game creation requests may be made
    // Track requests for 1 minute
    windowMs: 60*1000,
    // Limit to 2 requests per tracking window
    max: 3,
    // Disable successive request delays
    delayMs: 0,
    // Don't count failed requests
    skipFailedRequests: true

  }), function (req, res) {
    try {
      assert(Number.isInteger(req.body.nodes), 'Required field "nodes" must be an integer');
      assert(Number.isInteger(req.body.rounds), 'Required field "rounds" must be an integer');
      assert(Number.isInteger(req.body.time), 'Required field "time" must be an integer');
      if ('prob' in req.body) {
        assert(!Number.isNaN(req.body.prob), 'Optional field "prob" must be a float');
        assert(req.body.prob >= 0 && req.body.prob <= 1, 'Optional field "prob" is out of bounds');
      }
      if ('seed' in req.body)
        assert(Number.isInteger(req.body.seed), 'Optional field "seed" must be an integer');
      let id = hidgen();
      while (id in games) id = hidgen();
      games[id] = new Game(req.body.rounds, req.body.time, Graph.makeRandom(req.body.nodes, req.body.prob, req.body.seed));
      res.location('/game/' + id).sendStatus(201);
    } catch (error) {
      res.status(400).send(error.stack);
    }
  })
  .get(function(req, res) {
    res.status(200).send(Object.keys(games));
  });

app.route('/game/:gameId/')
  // Joining a game
  .post(function (req, res) {
    let game = games[req.params.gameId];
    let player = req.body.id;
    if (game) {
      if (!game.hasPlayers() && !game.isPlayer(player)) {
        game.join(player);
        res.sendStatus(200);
      } else res.sendStatus(423);
    } else res.sendStatus(404);
  })
  // Observing a game
  .get(function (req, res) {
    let game = games[req.params.gameId];
    if (game) {
      res.status(200).send(game.getState());
    } else res.sendStatus(404);
  })
  // Removing a game
  .delete(function (req, res) {
    // TODO: Check if game is in progress
    let game = games[req.params.gameId];
    if (game) {
      res.status(200).send(game.getState());
      delete games[req.params.gameId];
    } else res.sendStatus(404);
  });

app.listen(4040, () => console.log('Listening on port 4040!'));
