import threading, sys, httplib, errno

# Implemented from https://stackoverflow.com/a/325528
class Listener(threading.Thread):
    """Thread class with a stop() method. The thread itself has to check
    regularly for the stopped() condition."""

    def __init__(self, conn, method, url, body, headers, maxMsgs):
        self.conn = conn
        self.method = method
        self.url = url
        self.body = body
        self.headers = headers
        self.max = maxMsgs
        super(Listener, self).__init__(None, self.listen, 'listener', (), {})
        self._stop_event = threading.Event()

    def listen(self):
        try:
            self.conn.request(self.method, self.url, self.body, self.headers)
            response = self.conn.getresponse()
            data = response.read()
            if self.stopped():
                return
            else:
                print '\n' + data
                self.printSecondaryPrompt()
                self.max -= 1
                if not self.max:
                    # print '\nReached message limit, stopping listener'
                    # self.printSecondaryPrompt()
                    self.stop()
                else:
                    self.listen()
        except httplib.InvalidURL, err:
            print 'Error:', err.message # usually means invalid/nonnumeric port
            self.printSecondaryPrompt()
            self.stop()
        except IOError, err:
            if (errno.errorcode[err.errno] == 'ENOEXEC'):
                print 'Error: Cannot reach the given URL. It may be incorrect, or your internet may be down.'
            elif (errno.errorcode[err.errno] == 'ECONNREFUSED'):
                print 'Error: Connection refused. Your URL may be incorrect, or the server may be down.'
            else:
                print IOError, err
            self.printSecondaryPrompt()
            self.stop()
        except httplib.BadStatusLine, err:
            print 'Error: Connection lost. The server may be down.'
            self.printSecondaryPrompt()
            self.stop()
        except Exception, err:
            print Exception, err
            self.printSecondaryPrompt()
            self.stop()

    def printSecondaryPrompt(self):
        sys.stdout.write('>> ')
        sys.stdout.flush()

    def stop(self):
        self.conn.close()
        self._stop_event.set()

    def stopped(self):
        return self._stop_event.is_set()
