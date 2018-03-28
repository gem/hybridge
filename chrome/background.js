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

console.log("background.js: begin");

var hybridge = null;

function HyBridge(config) {
    this.ws_url = "ws" + (config.is_secure ? "s" : "") + "://" +
        config.application_url + config.ws_address;
    for (app in config.apps) {
        this.apps[app] = config.apps[app];
        config.apps[app].register(this);
    }
}

HyBridge.prototype = {
    apps: {},
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
            this.ws.addEventListener('message', this.ws_receive_gen());
        }
        catch(err) {
            console.log('WS connection failed: '+ err.message);
        }
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
    },
    ws_send: function (app, msg) {
        if (this.ws == null) {
            console.log('local app not connected');
            return false;
        }
        // if (this.apps[app].port == null) {
        //     console.log('web app not connected');
        //     return false;
        // }
        var supermsg = {'app': app, 'msg': msg};
        this.ws.send(JSON.stringify(supermsg));
    },
    // hyb_msg = {'app':<app_name> , 'msg':<api_msg>}
    // api_msg = {'msg'|'reply': <app_msg>, 'uuid'}
    // app_msg = {'command', 'args':[], complete: <True|False>}
    ws_receive_gen: function () {
        var _this = this;
        function ws_receive(event) {
            console.log("WS2 MESSAGE fired");
            console.log(event.data);
            var hyb_msg = JSON.parse(event.data);

            if (hyb_msg.app == undefined)
                return;

            app = _this.apps[hyb_msg.app];

            if ('msg' in hyb_msg &&
                ('msg' in hyb_msg['msg'] || 'reply' in hyb_msg['msg'])) {
                var api_msg = hyb_msg['msg'];

                app.ws_receive(api_msg);

                return;
            }
            console.log('OUT OF CORRECT SCOPE!!!!!!');
            return;
            if (hyb_msg.command == undefined) {
                console.log('malformed command, rejected' + hyb_msg);
                return;
            }

            if (!hyb_msg.app in config.apps) {
                console.log('app ' + hyb_msg.app + ' not found');
                return;
            }

            app = config.apps[hyb_msg.app];
            if (!hyb_msg.command in app) {
                console.log('command '+ hyb_msg.command + ' not found');
                return;
            }

            app[hyb_msg.command].apply(app, hyb_msg.args);
        }
        return ws_receive;
    },

    // on message from web-app
    receive: function(app, api_msg) {
        console.log('message received by app:' + app.name);
        console.log(api_msg);

        if ('msg' in api_msg) {
            var app_msg = api_msg.msg;
            if ('command' in app_msg &&
                app.cmds.indexOf(app_msg.command) != -1) {
                var args = [];
                if ('args' in app_msg) {
                    args = app_msg.args;
                }
                var ret = app[app_msg.command].apply(this, args);
                // var api_reply = {'reply': ret, 'complete': false, 'uuid': api_msg.uuid};

                // this.port.postMessage(api_reply);
                return;
            }
        }
        this.ws_send(app.name, api_msg);
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
                function(msg) { console.log("NEW LIST"); return _this.receive(app, msg); });
        }
    });
}

main();

console.log("background.js: end");

