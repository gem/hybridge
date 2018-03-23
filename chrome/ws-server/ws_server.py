#!/usr/bin/env python

import sys, os
import subprocess
import tornado.httpserver
import tornado.websocket
import tornado.ioloop
import tornado.web
from uuid import uuid4
import json

#
#  Remote Server emulation
#
home_content = open('index.html').read()
home_js = open('index.js').read()
uuid_js = open('uuid-random.min.js').read()
app_one_content = open('app_one.html').read()
app_one_js = open('app_one.js').read()
app_two_content = open('app_two.html').read()
app_three_content = open('app_three.html').read()

apps = {}


class HomePage(tornado.web.RequestHandler):
    def get(self):
        self.write(home_content)


class HomeJS(tornado.web.RequestHandler):
    def get(self):
        self.write(home_js)


class UuidJS(tornado.web.RequestHandler):
    def get(self):
        self.write(uuid_js)


class AppOnePage(tornado.web.RequestHandler):
    def get(self):
        self.write(app_one_content)


class AppOne:
    def __init__(self):
        self.name = 'app_one'
        self.allowed_apps = ['ext_app_open']
        self.pending = {}

    def ext_app_open(self, *args):
        print("ext_app_open: begin")
        print(args)
        if len(args) != 1:
            return False
        print("ext_app_open: 2")

        cmd = ["xclock", "-geometry", "%sx%s" % (args[0], args[0])]
        print("CMD FIRED: [%s]" % cmd)
        subprocess.Popen(cmd)

        return {'complete': True, 'success': True}

    def send(self, api_msg):
        hyb_msg = {'app': self.name, 'msg': api_msg}
        in_loop = False
        for k, v in ws_conns.items():
            in_loop = True
            v['socket'].write_message(hyb_msg)
        if not in_loop:
            print('Send failed! No connections')

    def receive(self, api_msg):
        api_uuid = api_msg['uuid']
        if 'reply' in api_msg:
            app_msg = api_msg['reply']
            uuid = api_msg['uuid']
            if uuid in self.pending:
                print("Command pending found [%s]" % uuid)
                # FIXME: call CB
                if ('complete' not in app_msg or
                        app_msg['complete'] is True):
                    print("Command pending deleted [%s]" % uuid)
                    del self.pending[uuid]
            return
        else:
            app_msg = api_msg['msg']
            command = app_msg['command']
            if command not in self.allowed_apps:
                api_reply = {'uuid': api_uuid, 'reply': {
                    'success': False, 'msg': 'method not found'}}
                self.send(api_reply)

            args = app_msg['args']
            meth = getattr(self, command)

            # FIXME: manage command exception
            ret = meth(*args)

            api_reply = {'uuid': api_uuid, 'reply': ret}
            self.send(api_reply)


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


class CommandPage(tornado.web.RequestHandler):
    def get(self):
        self.write(command_page)

    def post(self):
        print("pass from POST")
        print(self.request.arguments)

        args = []
        if 'app' not in self.request.arguments:
            return False

        app_name = self.request.arguments['app'][0]
        app = apps[app_name]

        if 'command' in self.request.arguments:
            command = self.request.arguments['command'][0]
        if 'arg' in self.request.arguments:
            args = self.request.arguments['arg']

        uuid = uuid4().get_urn()[9:]
        hyb_msg = {
            'app': app.name, 'msg': {
                'uuid': uuid, 'msg': {
                    'command': command, 'args': args
                }
            }
        }
        app.pending[uuid] = hyb_msg['msg']

        print(hyb_msg)
        # broadcast message
        # FIXME: add callback
        for k, v in ws_conns.items():
            v['socket'].write_message(hyb_msg)

        # TODO: fix reply
        self.write("200")


class CommandJS(tornado.web.RequestHandler):
    def get(self):
        self.write(command_js)


class WebSocketServer(tornado.websocket.WebSocketHandler):
    def open(self):
        self.id = uuid4()
        ws_conns[self.id] = {'id': self.id, 'socket': self}
        print('New connection')

    def on_message(self, message):
        print('\nNew message: %s' % message)
        hyb_msg = json.loads(message)
        if ('app' not in hyb_msg or hyb_msg['app'] not in apps or
                'msg' not in hyb_msg):
            print('Malformed msg: [%s]' % message)
            return

        app_name = hyb_msg['app']
        api_msg = hyb_msg['msg']
        app = apps[app_name]

        app.receive(api_msg)

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
            (r'/websocketserver', WebSocketServer),
            (r'/command.html', CommandPage),
            (r'/command.js', CommandJS),
        ])
        server_port = 8010
    elif sys.argv[1] == '--application':
        application = tornado.web.Application([
            (r'/uuid-random.min.js', UuidJS),
            (r'/app_one.html', AppOnePage),
            (r'/app_one.js', AppOneJS),
            (r'/app_two.html', AppTwoPage),
            (r'/app_three.html', AppThreePage),
            (r'/index.js', HomeJS),
            (r'/', HomePage),
        ])
        server_port = 8000
    else:
        usage(2)

    http_server = tornado.httpserver.HTTPServer(application)
    http_server.listen(server_port)

    tornado.ioloop.IOLoop.instance().start()
