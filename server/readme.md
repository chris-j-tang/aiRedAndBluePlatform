#### Starting a game:
You can start a game by sending a `POST` request to `/game/<id>`, where `<id>` is the id you wish to give the game.
The server will return `409 Conflict` if a game under that name already exists.
Otherwise, the server returns `201 Created` with an empty body.

You may also specify a seed, via query string, to use for the game's RNG.

For example, to start a game named `FINALS` with seed `SUPER_HARD`, the full route would be:
```
/game/FINALS?seed=SUPER_HARD
```

**TODO**
Only allow authorized users to create games.
Consider using passport.js for authentification.


#### Joining a game:
After a game is created, two clients must connect in order for the game to begin.
They can connect by sending a `GET` request to the game's join url:
```
/game/<game id>/join/
```

The server will respond with `200 OK` for the first two connections it receives.
The body of these two responses will contain a single `uid` field, which contains a unique identifier that the client should use to submit moves to the game server.

Any further requests will be met with `410 Gone`.


#### Playing a game:
After joining a game, the clients should initiate long polling the game server with their unique ids:
```
/game/<game id>/<uid>/
```

The long polling process begins by issuing an empty `GET` request to the above URL.
The server won't respond until it is the issuing player's turn.
Note that this means no client will receive a response until two clients have joined the game.
The first player to join is given the first turn.

To signify the beginning of a player's turn, the server will send a `200 OK` response.
The body of this response will contain the game state.

After deciding its move, the player should send a `POST` request to the same URL.
The body of this request should contain the id of the node they have chosen.

If the move is invalid, the server will respond with `400 Bad Request`.
Otherwise, the server will respond with a `200 OK` response that contains the game state after the move.

If the client sends multiple move requests, only the first is accepted.
Subsequent `POST` requests are rejected with `429 Too Many Requests`.

This process should be repeated until the game is complete.
Once the game has completed, any further `GET` requests will yield `200 OK` along with the completed game state.
Any further `POST` requests will be rejected with `405 Method Not Allowed`.

**TODO**
Create a time window for clients to make a move on their turn.
Note that node.js has a default timeout of 2 minutes.

#### Observing a game:
The status of any game can be polled via a `GET` request to the game URL:
```
/game/<game id>/
```
If the game id is not valid, the server responds with a `404 Not Found`.
Otherwise, the server will respond with `200 OK` with the game state in the body.


#### Removing a game:
After a game is completed, it can be removed from the server with a `DELETE` request to the game URL:
```
/game/<game id>/
```

If this request is sent before the game is completed, the server responds with `405 Method Not Allowed`.

Otherwise, if deletion is successful, the server responds with `200 OK`. The body of the response will contain the final game state.

**TODO**
Only allow authorized users to remove games.
