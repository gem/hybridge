#!/usr/bin/env python

import tornado.httpserver
import tornado.websocket
import tornado.ioloop
import tornado.web


home_content = open('index.html').read()
home_js = open('index.js').read()


class MyHomePage(tornado.web.RequestHandler):
    def get(self):
        self.write(home_content)


class MyHomeJS(tornado.web.RequestHandler):
    def get(self):
        self.write(home_js)


class MyWebSocketServer(tornado.websocket.WebSocketHandler):
    def open(self):
        # metodo eseguito all'apertura della connessione
        print('Nuova connessione')

    def on_message(self, message):
        # metodo eseguito alla ricezione di un messaggio
        # la stringa 'message' rappresenta il messaggio
        print('Messaggio ricevuto: %s' % message)

    def on_close(self):
        # metodo eseguito alla chiusura della connessione
        print('Connessione chiusa')

    def check_origin(self, origin):
        return True

application = tornado.web.Application([
    (r'/websocketserver', MyWebSocketServer),
    (r'/index.js', MyHomeJS),
    (r'/', MyHomePage)
])


if __name__ == "__main__":
    http_server = tornado.httpserver.HTTPServer(application)
    http_server.listen(8000)

    tornado.ioloop.IOLoop.instance().start()
