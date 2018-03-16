#### Starting a game:
You can start a game by sending a `POST` request to `/game`.
The body of the request must contain a `json` object with the following fields:

Field Name | Type | Description
-|-|-
`nodes` | `int` | The number of nodes in the game graph.
`rounds` | `int` | The maximum number of rounds the game will run for.
`time` | `int` | The amount of time, in milliseconds, that each player will have to submit a move.
`prob` | `int` | An *optional* parameter for graph creation that specifies the probability that any given edge will exist.
`seed` | `int` | An *optional* seed used to construct the randomized game graph.

Upon successful creation of the game, the server responds with `201 Created`. The location of the game is returned via the `Location` header. It is of the form `/game/{id}`, where `{id}` denotes the game's unique identifier.

If the server cannot create the game, `400 Bad Request` is returned, the body of which is a string describing why the request failed.

Furthermore, if the client has requested too many games to be created, then the server returns `429 Too Many Requests`.

#### Joining a game:
After a game is created, two clients must connect in order for the game to begin.
They can connect by sending a `POST` request to the game's url:
```
/game/<game id>
```
The request must contain a `json` object with a single field `id` field. This field must hold a string containing an identifier for the participant.

The server will respond with `200 OK` for the first two connections it receives. The body of the response contains the full game state.
The response occurs when both clients have connected, so that both clients get to see the game state at the same time.

Any further requests will be met with `423 Locked`.
Note that if the same `id` is provided over multiple requests, only the first may be accepted. Further requests will also be met with `423 Locked`.


#### Playing a game:
After joining a game, the clients should initiate long polling the game server with their unique ids:
```
/game/<game id>/<player id>/
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

Any request that occurs before the start of the game will be suspended until the game begins (that is, two players have joined).
This is to keep the game state secret from clients until the game actually begins.

#### Removing a game:
After a game is completed, it can be removed from the server with a `DELETE` request to the game URL:
```
/game/<game id>/
```

If this request is sent before the game is completed, the server responds with `405 Method Not Allowed`.

Otherwise, if deletion is successful, the server responds with `200 OK`. The body of the response will contain the final game state.

**TODO**
Only allow authorized users to remove games.
