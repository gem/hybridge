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
            var cmd = app[cmd_name], hyb_cmd = undefined;
            this.pendings[api_msg.uuid] = {'route': route, 'msg': hyb_msg};

            if (cmd_name === undefined || route === undefined) {
                if (cmd_name === undefined) {
                    console.log('unknown command: ' + cmd_name);
                }
                else if (route === undefined) {
                    console.log('route not specified for command: ' + cmd_name);
                }
                else {
                    console.log('unknown failure reason for command: ' + cmd_name);
                }
                console.log(hyb_msg);
                delete this.pendings[api_msg.uuid];
                return false;
            }
            console.log("CHECKPT");
            console.log(hyb_msg);
            console.log(route);
            if (route.to == 'bridge') {
                if (cmd === undefined) {
                    hyb_cmd = this.hybridge.routes[hyb_msg['frm']][cmd_name];
                    if (hyb_cmd === undefined) {
                        delete this.pendings[api_msg.uuid];
                        return false;
                    }
                }
                var app_msg = api_msg.msg;
                console.log(app_msg.command);

                var args = [];
                if ('args' in app_msg) {
                    args = app_msg.args;
                }

                if (hyb_cmd !== undefined) {
                    console.log("HERE RUN");
                    this.hybridge[app_msg.command].apply(this.hybridge, [hyb_msg]);
                    return;
                }
                else {
                    var ret = app[app_msg.command].apply(app, args);
                }
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
    for (var app_id in config.apps) {
        var app = config.apps[app_id];
        this.apps[app_id] = app;
        for (var dest in this.routes) {
            var cmds = this.routes[dest];
            for (var cmd in cmds) {
                if (app.routes[dest] === undefined) {
                    app.routes[dest] = {};
                }
                app.routes[dest][cmd] = cmds[cmd];
            }
        }

        app.register(this);
    }
}

HyBridge.prototype = {
    apps: {},
    router: null,
    routes: {'web': {'hybridge_track_status': {'to': 'bridge'}},
             'ext': {'hybridge_apptrack_status': {'to': 'bridge'}},
             'bridge': {}
            },
    ws_url: "",
    ws: null,
    ws_is_connect: false,
    ws_status_cbs: {},
    ws_appstatus_cbs: {},
    watchdog_handle: null,

    is_connected: function() {
        return this.ws_is_connect;
    },

    ws_connect: function() {
        var _this = this;

        console.log("ws_connect: begin");
        try {
            this.ws = new WebSocket(this.ws_url);
            this.ws.addEventListener('open', function (event) {
                console.log("WS OPEN fired");
                if (_this.ws_is_connect == false) {
                    _this.ws_is_connect = true;
                    for (var key in _this.ws_status_cbs) {
                        var ws_status_cb = _this.ws_status_cbs[key];
                        ws_status_cb(true);
                    }
                }
            });
            this.ws.addEventListener('close', function (event) {
                _this.ws = null;
                console.log("WS CLOSE fired");
                if (_this.ws_is_connect == true) {
                    _this.ws_is_connect = false;
                    for (var key in _this.ws_status_cbs) {
                        var ws_status_cb = _this.ws_status_cbs[key];
                        ws_status_cb(false);
                    }
                    _this.ws_appstatus_cbs = {};
                }
            });
            this.ws.addEventListener('error', function (event) {
                console.log("WS ERROR fired");
            });

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
    ws_send: function (app_name, api_msg) { // [, frm] NOTE: maybe not required, currently not used
        if (this.ws == null) {
            console.log('local app not connected');
            return false;
        }
        var hyb_msg = {'app': app_name, 'msg': api_msg};
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
    hybridge_track_status: function (hyb_msg) {
        var _this = this;
        console.log("TRACK_STATUS: from hybridge");
        function track_status_cb(is_conn) {
            _this.router.add_reply('bridge', hyb_msg.app, hyb_msg.msg,
                                   {'success': is_conn, 'complete': false});
        }
        this.ws_status_cbs[hyb_msg.msg.uuid] = track_status_cb;

        var app = this.apps[hyb_msg.app];

        app.port_close_cbs[hyb_msg.msg.uuid] = function ws_status_cbs_cleaner(uuid) {
            delete _this.ws_status_cbs[uuid];
        };
        track_status_cb(this.ws_is_connect);
    },
    hybridge_apptrack_status: function (hyb_msg) {
        var _this = this;
        console.log("APPTRACK_STATUS: from hybridge");
        function track_appstatus_cb(is_conn) {
            _this.router.add_reply('bridge', hyb_msg.app, hyb_msg.msg,
                                   {'success': is_conn, 'complete': false});
        }
        this.ws_appstatus_cbs[hyb_msg.app] = track_appstatus_cb;

        var app = this.apps[hyb_msg.app];

        var is_conn = app.port != null;
        track_appstatus_cb(is_conn);
    },
    run: function () {
        var _this = this;
        this.ws_connect();

        // run watchdog
        this.watchdog_handle = setInterval(function wd_func(obj) { obj.watchdog(); }, 1000, _this);
    }
}

var opts = {'base_url': '', 'is_deveĺ': 'false'};

function main(opts)
{
    config = config_apps(opts);

    hybridge = new HyBridge(config);
    hybridge.run()

    chrome.webRequest.onBeforeSendHeaders.addListener(
        function(details) {
            if (hybridge.is_connected()) {
                details.requestHeaders.push({'name': 'Gem--Qgis-Oq-Irmt',
                                             'value': '0.2.0'});
            }
            return {requestHeaders: details.requestHeaders};
        },
        {urls: ["*://localhost/*"]}, // URL FILTERS
        ["blocking", "requestHeaders"]);

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

            var appstatus = _this.ws_appstatus_cbs[port.name];
            if (appstatus != undefined) {
                appstatus(true);
            }

            app.port = port;
            app.port.onMessage.addListener(
                function(api_msg) {
                    console.log("NEW LIST ROUT");
                    var hyb_msg = {'frm': 'web', 'app': app.name, 'msg': api_msg};
                    return _this.router.add(hyb_msg);
                });
            app.port.onDisconnect.addListener(function(port) {
                for (var cb_idx in app.port_close_cbs) {
                    var cb = app.port_close_cbs[cb_idx];
                    cb(cb_idx);
                }
                app.port_close_cbs = {};
                var appstatus = _this.ws_appstatus_cbs[app.port.name];
                if (appstatus != undefined) {
                    appstatus(false);
                }
                app.port = null;
            });
        }
    });
}

function options_get(opts, cb) {
    chrome.storage.local.get(['base_url', 'is_devel'], function(ret) {
        if (ret.base_url === undefined)
            opts.base_url = base_url_default;
        else
            opts.base_url = decodeURI(ret.base_url);
        if (ret.is_devel === undefined)
            opts.is_devel = is_devel_default;
        else
            opts.is_devel = ret.is_devel;
        cb(opts);
    });
}

options_get(opts, main);

console.log("background.js: end");

