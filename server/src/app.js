const assert = require('assert');
const express = require('express');
const app = express();

const RateLimiter = require('express-rate-limit');
const Manager = require('./manager');

let manager = new Manager();

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
      if ('seed' in req.body)
        assert(Number.isInteger(req.body.seed), 'Optional field "seed" must be an integer');
      let id = manager.makeGame(req.body.nodes, req.body.rounds, req.body.time, req.body.seed);
      res.location('/game/' + id).sendStatus(201);
    } catch (error) {
      res.status(400).send(error.stack);
    }
  })
  .get(function(req, res) {
    res.status(200).send(manager.getIds());
  });

app.route('/game/:gameId/')
  // Observing a game
  .get(function (req, res) {
    gameId = req.params.gameId;
    game = manager.getGame(gameId);
    if (game) {
      res.status(201).send(game.state);
    } else res.sendStatus(404);
  })
  // Removing a game
  .delete(function (req, res) {
    // TODO: Check if game is in progress
    game = manager.removeGame(req.params.gameId);
    if (game)
      res.status(200).send(game.state);
    else res.sendStatus(404);
  });

//for testing
app.route('/print/:gameId/').get(function(req, res) {
    gameId = req.params.gameId;
    game = manager.getGame(gameId);
    if (game) {
      res.status(201).send(game.printNodes() + game.printMatrix());
    }
});

app.route('/select/:gameId/').post(function (req,res) {
      try {
      assert(Number.isInteger(req.body.node), 'Required field "node" must be an integer');
      gameId = req.params.gameId;
      game = manager.getGame(gameId);
      if (game) {
        game.selectNode(req.body.node);
        res.location('/game/' + gameId).sendStatus(201);
      }
    } catch (error) {
      res.status(400).send(error.stack);
    }
})

app.listen(4040, () => console.log('Listening on port 4040!'));
