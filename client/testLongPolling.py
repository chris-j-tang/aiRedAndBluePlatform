from rbc_modules import Listener

import httplib, errno

listener = None

def main():

    server = init()

    print 'Type "?" for a list of commands'

    command = ['dummy']

    while command[0] != 'quit':
        command = raw_input('> ').split()
        while len(command) == 0:
            command = raw_input('> ').split()
        if command[0] == 'listen':
            if len(command) == 1:
                listen(server, 'GET', '/listen', '', {}, 0)
            elif len(command) == 2:
                listen(server, 'GET', '/listen', '', {}, int(command[1]))
            else:
                print 'Error: invalid number of arguments (need 1 or 2)'
        elif command[0] == 'poke':
            if len(command) == 1:
                poke(server, {})
            else:
                print 'Error: No arguments needed'
        elif command[0] == 'quit':
            print 'Bye'
        else:
            print 'Error: Unknown command -', ' '.join(command)
            usage()

def init():
    server = config()
    return server

def config():
    host_default = '127.0.0.1'
    port_default = '4039'

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
# and returns the response object and response body in a tuple. Not intended for
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

# Listen for a response after making a request to the given URL. Syntax matches the
# sendRequest function with the exception of an additional parameter, iterations,
# which states how many times the listener will reactivate after receiving a reply.
# If this number is 0 or below, the listener will run forever.
def listen(server, method, url, body, headers, iterations):
    global listener
    if listener and not listener.stopped():
        print 'stopping listener'
        listener.stop()
        listener = None
    else:
        if listener:
            listener.stop()
        if iterations > 1:
            print 'listening', iterations, 'times (stop by typing listen again)'
        elif iterations == 1:
            print 'listening', iterations, 'time (stop by typing listen again)'
        else:
            print 'listening forever (stop by typing listen again)'
        conn = httplib.HTTPConnection(server)
        listener = Listener.Listener(conn, method, url, body, headers, iterations)
        listener.start()

def usage():
    print '-- listen <ITERATIONS>'
    print '-- quit'

if __name__ == "__main__":
    main()
