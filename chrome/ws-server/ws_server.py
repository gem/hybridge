#!/usr/bin/env python

import sys, os
import tornado.httpserver
import tornado.websocket
import tornado.ioloop
import tornado.web
import uuid
import json

#
#  Remote Server emulation
#
home_content = open('index.html').read()
home_js = open('index.js').read()
app_one_content = open('app_one.html').read()
app_one_js = open('app_one.js').read()
app_two_content = open('app_two.html').read()
app_three_content = open('app_three.html').read()

apps = {}

class MyHomePage(tornado.web.RequestHandler):
    def get(self):
        self.write(home_content)


class MyHomeJS(tornado.web.RequestHandler):
    def get(self):
        self.write(home_js)


class AppOnePage(tornado.web.RequestHandler):
    def get(self):
        self.write(app_one_content)


class AppOne:
    def __init__(self):
        pass

    def ext_app_open(self, *args):
        print("ext_app_open: begin")
        print(args)
        if len(args) != 1:
            return False
        print("ext_app_open: 2")
        if args[0] not in ["small", "medium", "big"]:
            return False

        print("ext_app_open: 3")
        cmd = "gnome-mines --%s" % args[0]
        print("CMD FIRED: [%s]" % cmd)
        os.system(cmd)


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
        print('\nNew message: %s' % message)
        supermsg = json.loads(message)
        print(apps[supermsg['app']])
        try:
            meth = getattr(apps[supermsg['app']], supermsg['msg']['command'])
            meth(*supermsg['msg']['args'])
            print("WE ARE HERE!")
        except Exception as e:
            print("command execution failed %s" % e.message)
            return False

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
        app_one = AppOne()

        apps = {'app_one': app_one}

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
