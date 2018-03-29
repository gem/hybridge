/**
 *
 * @source: hybridge (chrome) background.js
 * @author: Matteo Nastasi <nastasi@alternativeoutout.it>
 * @link: https://github.com/nastasi/hybridge
 *
 * @licstart  The following is the entire license notice for the
 *  JavaScript code in this page.
 *
 * Copyright (C) 2018 Matteo Nastasi
 *
 *
 * The JavaScript code in this page is free software: you can
 * redistribute it and/or modify it under the terms of the GNU
 * General Public License (GNU GPL) as published by the Free Software
 * Foundation, either version 3 of the License, or (at your option)
 * any later version.  The code is distributed WITHOUT ANY WARRANTY;
 * without even the implied warranty of MERCHANTABILITY or FITNESS
 * FOR A PARTICULAR PURPOSE.  See the GNU GPL for more details.
 *
 * As additional permission under GNU GPL version 3 section 7, you
 * may distribute non-source (e.g., minimized or compacted) forms of
 * that code without the copy of the GNU GPL normally required by
 * section 4, provided you include this license notice and a URL
 * through which recipients can access the Corresponding Source.
 *
 * @licend  The above is the entire license notice
 * for the JavaScript code in this page.
 *
 */

// Router msg syntax
// -----------------
// hyb_msg = {'app':<app_name> , 'frm': <from>, 'msg':<api_msg>}
// api_msg = {'msg'|'reply': <app_msg>, 'uuid':<uuid> }
// app_msg = {<('command', 'args':[])|('result': <obj|bool>, complete: <True|False>)>}

// Ext msg syntax
// hyb_msg = {'app':<app_name> , 'msg':<api_msg>}
// api_msg = {'msg'|'reply': <app_msg>, 'uuid':<uuid> }
// app_msg = {<('command', 'args':[])|('result': <obj|bool>, complete: <True|False>)>}

// Web msg syntax
// --------------
// hyb_msg = n.a.
// api_msg = {'msg'|'reply': <app_msg>, 'uuid':<uuid> }
// app_msg = {<('command', 'args':[])|('result': <obj|bool>, complete: <True|False>)>}

// The missing parts of hyb_msg in web and ext messages is integrated or removed by Router

console.log("background.js: begin");

var hybridge = null;

function Router(hybridge)
{
    this.hybridge = hybridge;
}

Router.prototype = {
    hybridge: null,
    pendings: {},

    add_reply: function(frm, app_name, api_msg, app_msg)
    {
        var hyb_msg = {
            'frm': frm,
            'app': app_name,
            'msg': {
                'uuid': api_msg.uuid,
                'reply': app_msg}};

        this.add(hyb_msg);
    },

    add: function(hyb_msg)
    {
        console.log("Router add");
        console.log(hyb_msg);

        var app = this.hybridge.apps[hyb_msg.app];
        var api_msg = hyb_msg['msg'];

        if (app === undefined || api_msg == false) {
            console.log('malformed add message:');
            console.log(hyb_msg);
            return;
        }

        if ('msg' in api_msg) {
            var cmd_name = api_msg['msg']['command'];
            var route = app.routes[hyb_msg['frm']][cmd_name];
            var cmd = app[cmd_name];
            this.pendings[api_msg.uuid] = {'route': route, 'msg': hyb_msg};

            if (cmd_name === undefined || route === undefined) {
                console.log('malformed message ' + cmd_name);
                console.log(hyb_msg);
                delete this.pendings[api_msg.uuid];
                return false;
            }
            console.log("CHECKPT");
            console.log(hyb_msg);
            if (route.to == 'bridge') {
                if (cmd === undefined) {
                    delete this.pendings[api_msg.uuid];
                    return false;
                }
                var app_msg = api_msg.msg;
                console.log(app_msg.command);

                var args = [];
                if ('args' in app_msg) {
                    args = app_msg.args;
                }
                console.log("APPLY HERE!");
                var ret = app[app_msg.command].apply(app, args);
                // FIXME: send feedback

                this.add_reply(route.to, app.name, api_msg, ret);

                return;
            }
            else if (route.to == 'web') {
                console.log("Route to web");
                if (app.port != null) {
                    app.port.postMessage(api_msg);
                }
                else {
                    console.log('port not available');
                }
                console.log(hyb_msg);
            }
            else if (route.to == 'ext') {
                console.log("Route to ext");
                this.hybridge.ws_send(app.name, api_msg);
            }
            else {
                console.log("Route to unknown");
                console.log(hyb_msg);
            }
        }
        else {
            // reply case
            console.log('reply case');
            console.log(hyb_msg);
            var pending = this.pendings[api_msg.uuid];
            if (pending === undefined) {
                console.log('not pending msg [' + api_msg.uuid + ']');
                return;
            }
            console.log(pending);

            var api_reply = {'uuid': api_msg.uuid, 'reply': api_msg.reply};

            // destination was bridge
            if (pending.msg.frm == 'ext') {
                // msg from external app
                if (this.hybridge.ws_send(app.name, api_reply) == false) {
                    console.log('Application [' + app.name + ']: port not available');
                }
            }
            else if (pending.msg.frm == 'web') {
                if (app.port != null) {
                    app.port.postMessage(api_reply);
                }
                else {
                    console.log('port not available');
                }
            }
            if (('complete' in api_msg.reply) == false ||
                api_msg.reply.complete == true) {
                console.log('REMOVE PENDING');
                delete this.pendings[api_msg.uuid];
            }
        }
    }
}

function HyBridge(config) {
    this.router = new Router(this);

    this.ws_url = "ws" + (config.is_secure ? "s" : "") + "://" +
        config.application_url + config.ws_address;
    for (app in config.apps) {
        this.apps[app] = config.apps[app];
        config.apps[app].register(this);
    }
}

HyBridge.prototype = {
    apps: {},
    router: null,
    ws_url: "",
    ws: null,
    watchdog_handle: null,
    ws_connect: function() {
        var _this = this;

        console.log("ws_connect: begin");
        try {
            this.ws = new WebSocket(this.ws_url);
            this.ws.addEventListener('open', function (event) {
                for (var app in this.apps) {
                    if ('on_hybridge_status' in app) {
                        app.on_hybridge_status(true);
                    }
                }
                console.log("WS OPEN fired");
            });
            this.ws.addEventListener('close', function (event) {
                console.log("WS CLOSE fired");
                for (var app in this.apps) {
                    if ('on_hybridge_status' in app) {
                        app.on_hybridge_status(false);
                    }
                }
                _this.ws = null;
            });
            this.ws.addEventListener('error', function (event) {
                console.log("WS ERROR fired");
                this.close();
                _this.ws = null;
            });
            var _this = this;
            this.ws.addEventListener(
                'message',
                function ws_receive(event) {
                    var hyb_msg = JSON.parse(event.data);
                    hyb_msg.frm = 'ext';
                    _this.router.add(hyb_msg);
                });
        }
        catch(err) {
            console.log('WS connection failed: '+ err.message);
        }
    },
    ws_send: function (app, api_msg) { // [, frm] NOTE: maybe not required, currently not used
        if (this.ws == null) {
            console.log('local app not connected');
            return false;
        }
        var hyb_msg = {'app': app, 'msg': api_msg};
        if (arguments.length > 2) {
            var frm =  arguments[2]
            hyb_msg.frm = frm;
        }
        this.ws.send(JSON.stringify(hyb_msg));
    },
    watchdog: function () {
        console.log("WD here " + this.ws);
        if (this.ws == null) {
            this.ws_connect();
        }
    },
    run: function () {
        var _this = this;
        this.ws_connect();

        // run watchdog
        this.watchdog_handle = setInterval(function wd_func(obj) { obj.watchdog(); }, 1000, _this);
    }
}

function main()
{
    hybridge = new HyBridge(config);
    hybridge.run()

    chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
        console.log("inside message !: [" + message.msg + "]");
        sendResponse({'reply': message.msg});
    });

    chrome.runtime.onMessageExternal.addListener(
        function(request, sender, sendResponse) {
            console.log("background.js: received msg: " + request.msg);
            sendResponse({'reply': request.msg});
        });

    chrome.runtime.onConnectExternal.addListener(function(port) {
        if (config.apps[port.name] !== undefined) {
            var app = config.apps[port.name];
            var _this = hybridge;

            app.port = port;
            app.port.onMessage.addListener(
                function(api_msg) {
                    console.log("NEW LIST ROUT");
                    var hyb_msg = {'frm': 'web', 'app': app.name, 'msg': api_msg};
                    return _this.router.add(hyb_msg);
                });
        }
    });
}

main();

console.log("background.js: end");

