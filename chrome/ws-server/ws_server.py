#!/usr/bin/env python

import sys
import tornado.httpserver
import tornado.websocket
import tornado.ioloop
import tornado.web
import uuid

#
#  Remote Server emulation
#
home_content = open('index.html').read()
home_js = open('index.js').read()
app_one_content = open('app_one.html').read()
app_one_js = open('app_one.js').read()
app_two_content = open('app_two.html').read()
app_three_content = open('app_three.html').read()


class MyHomePage(tornado.web.RequestHandler):
    def get(self):
        self.write(home_content)


class MyHomeJS(tornado.web.RequestHandler):
    def get(self):
        self.write(home_js)


class AppOnePage(tornado.web.RequestHandler):
    def get(self):
        self.write(app_one_content)


class AppOneJS(tornado.web.RequestHandler):
    def get(self):
        self.write(app_one_js)


class AppTwoPage(tornado.web.RequestHandler):
    def get(self):
        self.write(app_two_content)

class AppThreePage(tornado.web.RequestHandler):
    def get(self):
        self.write(app_three_content)

#
#  External application simulation
#
ws_conns = {}

command_page = open('command.html').read()
command_js = open('command.js').read()


class MyCommandPage(tornado.web.RequestHandler):
    def get(self):
        self.write(command_page)

    def post(self):
        print("pass from POST")
        print(self.request.arguments)

        args = ""
        if 'app' in self.request.arguments:
            app = self.request.arguments['app'][0]
        if 'command' in self.request.arguments:
            command = self.request.arguments['command'][0]
        if 'arg' in self.request.arguments:
            args = self.request.arguments['arg']

        for k, v in ws_conns.items():
            msg = {'app': app, 'command': command}
            if args:
                msg['args'] = args

            v['socket'].write_message(msg)

        # TODO: fix reply
        self.write("200")


class MyCommandJS(tornado.web.RequestHandler):
    def get(self):
        self.write(command_js)


class MyWebSocketServer(tornado.websocket.WebSocketHandler):
    def open(self):
        self.id = uuid.uuid4()
        ws_conns[self.id] = {'id': self.id, 'socket': self}
        print('New connection')

    def on_message(self, message):
        print('New message: %s' % message)

    def on_close(self):
        if self.id in ws_conns:
            del ws_conns[self.id]
        print('Closed connection')

    def check_origin(self, origin):
        return True


def usage(ret):
    print("Usage:\n  %s <--server|--application>" % sys.argv[0])
    sys.exit(ret)

if __name__ == "__main__":
    if len(sys.argv) != 2:
        usage(1)

    if sys.argv[1] == '--server':
        application = tornado.web.Application([
            (r'/websocketserver', MyWebSocketServer),
            (r'/command.html', MyCommandPage),
            (r'/command.js', MyCommandJS),
        ])
        server_port = 8010
    elif sys.argv[1] == '--application':
        application = tornado.web.Application([
            (r'/app_one.html', AppOnePage),
            (r'/app_one.js', AppOneJS),
            (r'/app_two.html', AppTwoPage),
            (r'/app_three.html', AppThreePage),
            (r'/index.js', MyHomeJS),
            (r'/', MyHomePage),
        ])
        server_port = 8000
    else:
        usage(2)

    http_server = tornado.httpserver.HTTPServer(application)
    http_server.listen(server_port)

    tornado.ioloop.IOLoop.instance().start()
