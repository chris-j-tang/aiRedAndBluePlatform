const assert = require('assert');
const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const path = require('path');

const hidgen = require('human-readable-ids').hri.random;

const RateLimiter = require('express-rate-limit');
const Game = require('./game');
const Graph = require('./graph');

let games = {};

app.use(express.json());

app.use(bodyParser.urlencoded({
    extended: true,
	strict: true
}));
app.use(bodyParser.json());

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.use('/', express.static(path.join(__dirname, './../../public')))

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
	  console.log("Attempting to start a new game...");
	  
	  if(typeof req.body.nodes === 'string' || req.body.nodes instanceof String) {
		req.body.nodes = parseInt(req.body.nodes);  
	  }
	  if(typeof req.body.rounds === 'string' || req.body.rounds instanceof String) {
		req.body.rounds = parseInt(req.body.rounds);  
	  }
	  if(typeof req.body.time === 'string' || req.body.time instanceof String) {
		req.body.time = parseInt(req.body.time);  
	  }
	  if('prob' in req.body && (typeof req.body.prob === 'string' || req.body.prob instanceof String)) {
		req.body.prob = parseFloat(req.body.prob);  
	  }
	  if('seed' in req.body && (typeof req.body.seed === 'string' || req.body.seed instanceof String)) {
		req.body.seed = parseInt(req.body.seed);  
	  }
	  console.log(req.body);
	  
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
	  console.log(id);
	  //res.json(id);
      res.location('/game/' + id).sendStatus(201);
    } catch (error) {
	  console.log("error");
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
	console.log("Player, " + player + ", joined the game");
    if (game) {
      if (!game.hasPlayers() && !game.isPlayer(player)) {
        game.join(player);
        game.getState().then(state => res.status(200).send(state));
      } else res.sendStatus(423);
    } else res.sendStatus(404);
  })
  // Observing a game
  .get(function (req, res) {
    let game = games[req.params.gameId];
    if (game) {
      game.getState().then(state => res.status(200).send(state));
    } else res.sendStatus(404);
  })
  // Removing a game
  .delete(function (req, res) {
    let game = games[req.params.gameId];
    if (game) {
      if (game.isDone()) {
        game.getState().then(state => res.status(200).send(state));
        delete games[req.params.gameId];
      } else res.sendStatus(400);
    } else res.sendStatus(404);
  });
  
app.route('/game/:gameId/:playerId/')
  // Requesting a turn
  .get(function (req, res) {
    let game = games[req.params.gameId];
    if (game && game.isPlayer(req.params.playerId)) {
      game.request(req.params.playerId).then(diff => res.status(200).send(diff));
    } else res.sendStatus(404);
  })
  // Submitting a move
  .post(function(req, res) {
    let game = games[req.params.gameId];
    if (game && game.isPlayer(req.params.playerId)) {
      let diff = game.submit(req.params.playerId, req.body.node);
      res.status(200).send(diff);
    } else res.sendStatus(404);
  });
  
app.listen(4040, () => console.log('Listening on port 4040!'));