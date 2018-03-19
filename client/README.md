#### Using the client:

Type `python client.py` to run the client (requires Python 2).

At the moment, the client uses a command line interface. Type '?' to show a list of commands that can be run.

When the client is launched, you will be asked to configure the host and port of the game
server. This URL will be used for all game communications.

#### Reconfiguring the server connection:

Type `config` to reconfigure the URL that you set when first launching the client.

#### Starting a game:

The format of the command used to start a game is as follows:

`start NODES ROUNDS TIME <SEED>`

You do not have to include the `SEED` parameter. In addition, just entering `start` will create a game with default values for each required parameter.

If a game is successfully started, you will automatically join it.

#### Joining a game:

To join a game that has been created by someone else, type: `join GAME_ID`.

If a game is successfully joined, you will get a notification when you can make your first move.

#### Making a move:

To make a move, evaluate the current game's state (as returned by the listner) and then type `move NODE_ID`. The `NODE_ID` is the node that you have decided to color.

If this move is successful, you will be notified when it is your turn again. Otherwise, you must rerun the command with a valid move.

#### Observing a game:

Unimplemented, please see the `observeGame` function in `client.py` for more details.

#### Deleting a game:

To delete a game, type `delete GAME_ID`. Only completed games may be deleted.
