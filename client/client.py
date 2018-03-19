from rbc_modules import Listener

import httplib, errno

listener = None
gameId = ''
gameUid = ''

def main():

    server = init()

    command = ['dummy']

    while command[0] != 'quit':
        command = raw_input('> ').split()
        while len(command) == 0:
            command = raw_input('> ').split()
        if command[0] == 'config':
            if len(command) == 1:
                config()
            else:
                print 'Error: No arguments are allowed'
        elif command[0] == 'start':
            if len(command) == 1:
                startGame(server, {'nodes': 20, 'rounds': 5, 'time': 10, 'seed': None})
            elif len(command) == 4:
                startGame(server, {'nodes': command[1], 'rounds': command[2],
                    'time': command[3], 'seed': None})
            elif len(command) == 5:
                startGame(server, {'nodes': command[1], 'rounds': command[2],
                    'time': command[3], 'seed': command[4]})
            else:
                print 'Error: Invalid number of arguments (need 0, 3, or 4)'
        elif command[0] == 'join':
            if len(command) == 2:
                joinGame(server, {'game_id': command[1]})
            else:
                print 'Error: Need one argument (game id)'
        elif command[0] == 'move':
            if len(command) == 2:
                makeMove(server, {'node': command[2]})
            else:
                print 'Error: Need one argument (node id)'
        elif command[0] == 'delete':
            if len(command) == 2:
                deleteGame(server, {'game_id': command[1]})
            else:
                print 'Error: Need one argument (game id)'
        elif command[0] == 'quit':
            print 'Bye'
        # elif command[0] == 'listen':
        #     if len(command) == 2:
        #         listen(server, 'GET', command[1], '', {}, 0, False)
        #     elif len(command) == 3:
        #         listen(server, 'GET', command[1], '', {}, int(command[2]), False)
        #     else:
        #         print 'Error: invalid number of arguments (need 1 or 2)'
        else:
            print 'Error: Unknown command -', ' '.join(command)
            usage()

def usage():
    print 'Available commands:'
    print '-- config'
    print '-- start'
    print '-- start NODES ROUNDS TIME <SEED>'
    print '-- join GAME_ID'
    print '-- move NODE_ID'
    print '-- delete GAME_ID'
    print '-- quit'

# Wrapper function for any tasks that should only run on startup
def init():
    server = config()
    
    print 'Type "?" for a list of commands'
    return server

# TODO: Stop any active listeners if server is reconfigured
def config():
    host_default = '127.0.0.1'
    port_default = '4040'

    host = raw_input('Enter the server (no port) [' + host_default + ']: ')
    port = raw_input('Enter the port [' + port_default + ']: ')

    if not host.strip():
        host = host_default
    if not port.strip():
        port = port_default

    server = host + ':' + str(port)

    print 'Set connection URL to', server

    return server

# Makes a request to the given server + URL with the given method, body, and headers,
# and returns the response object and response body in a tuple. The body is returned
# as well so that the connection can be closed as soon as possible. Not intended for
# long polling.
def sendRequest(server, method, url, body, headers):
    try:
        conn = httplib.HTTPConnection(server)
        conn.request(method, url, body, headers)
        response = conn.getresponse()
        responseBody = response.read()
        conn.close()
        return (response, responseBody)
    except httplib.InvalidURL, err:
        print 'Error: ', err.message # usually means invalid/nonnumeric port
    except IOError, err:
        if (errno.errorcode[err.errno] == 'ENOEXEC'):
            print 'Error: Cannot reach the given URL. It may be incorrect, or your internet may be down.'
        elif (errno.errorcode[err.errno] == 'ECONNREFUSED'):
            print 'Error: Connection refused. Your URL may be incorrect, or the server may be down.'
        else:
            print IOError, err
    except Exception, err:
        return None
        raise

def listen(server, method, url, body, headers, iterations, debug):
    global listener
    if listener and not listener.stopped():
        if debug:
            print 'stopping listener'
        listener.stop()
        listener = None
    else:
        if listener:
            listener.stop()
        if debug:
            if iterations > 1:
                print 'listening', iterations, 'times (stop by typing listen again)'
            elif iterations == 1:
                print 'listening', iterations, 'time (stop by typing listen again)'
            else:
                print 'listening forever (stop by typing listen again)'
        conn = httplib.HTTPConnection(server)
        listener = Listener.Listener(conn, method, url, body, headers, iterations)
        listener.start()

def startGame(server, details):
    S_GAME_STARTED = 201
    S_PARAM_ERROR = 400
    S_RATE_LIMIT = 406

    try:
        reqBody = '{"nodes":' + str(int(details['nodes']))
        reqBody += ', "rounds":' + str(int(details['rounds']))
        reqBody += ', "time":' + str(int(details['time']))
        if details['seed']:
            reqBody += ', "seed":' + str(int(details['seed']))
        reqBody += '}'
    except ValueError, err:
        print ValueError, err
        return
    except Exception, err:
        print Exception, err
        raise

    reqHeaders = {'Content-type': 'application/json', 'Accept': 'text/plain'}
    response = sendRequest(server, 'POST', '/game/', reqBody, reqHeaders)

    if not response:
        return

    resHeaders = response[0].getheaders()
    resStatus = response[0].status
    resBody = response[1]

    if resStatus == S_GAME_STARTED:
        for (key, value) in resHeaders:
            if key == 'location':
                newGameId = value.split('/')[2]
                print 'Game with id "' + newGameId +'" created, joining...'
                joinGame(server, {'game_id': newGameId})
    elif resStatus == S_PARAM_ERROR:
        print resBody.split('\n', 1)[0]
    elif resStatus == S_RATE_LIMIT:
        print 'Error: too many requests (Enhance Your Calm)'
    else:
        print 'Unexpected error:', resStatus, response[0].reason
        raise Exception

def joinGame(server, details):
    # <=== begin more testing ===>

    global gameId, gameUid # if set, player cannot join another game

    if gameUid or gameUid:
        print 'Error: You have already joined a game'
        # TODO: user can enter another command to leave the current game
        return

    # <=== end more testing ===>

    S_GAME_JOINED = 201 # will be 200 (spec doc definition)
    S_GAME_NOT_FOUND = 404
    S_GAME_FULL = 410 # not yet implemented on serverside

    # TODO: suffix poll url with 'join/'
    response = sendRequest(server, 'GET', '/game/' + details['game_id'] + '/', '', {})

    if not response:
        return

    resHeaders = response[0].getheaders()
    resStatus = response[0].status
    resBody = response[1]

    if resStatus == S_GAME_JOINED:

        # <=== begin more testing ===>

        gameId = details['game_id']
        # gameUid = resBody.uid # if uid is a field in the object returned when joining a game

        # <=== end more testing ===>

        gameUid = '<unimplemented>'
        print ('Game with id "' + gameId + '" joined, assigned UID "' +
                    gameUid + '"')

        # print resBody # dumps the game state, sent by server

        print 'You will be notified when it is your turn.'
    elif resStatus == S_GAME_NOT_FOUND:
        print 'Error: No game with id "' + details['game_id'] + '"'
    elif resStatus == S_GAME_FULL:
        print 'Error: Game with id "' + details['game_id'] + '" already full'
    else:
        print 'Unexpected error:', resStatus, response[0].reason
        raise Exception

    # <=== begin more testing ===>

    # automatically send a play request so we know when the first turn is ready
    listen(server, 'GET', '/game/' + gameId + '/' + gameUid + '/', '', {}, 1, False)

    # <=== end more testing ===>

# The below function hasn't been tested with the server API yet. 'details' contains one
# node ID that is to be selected in the move.
def makeMove(server, details):
    if not gameId or not gameUid:
        print 'Error: Haven\'t joined a game yet'
        return
    S_VALID_MOVE = 200
    S_INVALID_MOVE = 400
    S_GAME_NOT_FOUND = 404
    S_GAME_ALREADY_COMPLETED = 405
    S_TOO_MANY_REQUESTS = 429

    response = sendRequest(server, 'POST', '/game/' + gameId + '/' + gameUid + '/', details, {})

    # resHeaders = response[0].getheaders()
    resStatus = response[0].status
    resBody = response[1]

    if resStatus == S_VALID_MOVE:
        print 'Move submitted, waiting for other player...'
        state = resBody # TODO: save the state somethere

        # Start a new listener so we are told when to move next
        listen(server, 'GET', '/game/' + gameId + '/' + gameUid + '/', '', {}, 1, False)
    elif resStatus == S_INVALID_MOVE:
        print 'Error: Invalid move made, please try again'
    elif resStatus == S_GAME_NOT_FOUND:
        print 'Error: Game with id "' + gameId + '" could not be found'
    elif resStatus == S_GAME_ALREADY_COMPLETED:
        print 'Error: Game with id "' + gameId + '" is already completed'
    elif resStatus == S_TOO_MANY_REQUESTS:
        print 'Error: You have already submitted a valid move'
    else:
        print 'Unexpected error:', resStatus, response[0].reason
        raise Exception

# Unimplemented, though it would use the same listen() function as used above, just
# with an unlimited option set which always listens for changes in the game's state.
# Spectators start observing a game by giving its ID to this function as a parameter,
# and moves will intermittently show up in the console window / graphic window, when
# that is added. The listener could be stopped by using the stopobserve command.
def observeGame(server, details):
    return

def deleteGame(server, details):
    S_GAME_DELETED = 200
    S_GAME_NOT_FOUND = 404
    S_GAME_INCOMPLETE = 405 # not yet implemented

    response = sendRequest(server, 'DELETE', '/game/' + details['game_id'], '', {})

    if not response:
        return

    # resHeaders = response[0].getheaders()
    resStatus = response[0].status
    # resBody = response[1]

    if resStatus == S_GAME_DELETED:
        print 'Game with id "' + details['game_id'] + '" deleted'
    elif resStatus == S_GAME_NOT_FOUND:
        print 'Error: No game with id "' + details['game_id'] + '"'
    elif resStatus == S_GAME_INCOMPLETE:
        print 'Error: Game with id "' + details['game_id'] + '" is not complete yet'
    else:
        print 'Unexpected error:', resStatus, response[0].reason
        raise Exception

if __name__ == "__main__":
    main()
