console.log("background.js: begin");

function lock(tout)
{
    this.tout = tout;
}

lock.prototype = {
    tout: 0,
    lck: false,
    lck_del: null,

    lock: function() {
        if (this.lck)
            return false;
        this.lck = true;
        return true;
    },
    delayed_unlock: function () {
        if (this.tout) {
            var _this = this;

            this.lck_del = window.setTimeout(function delayed_unlock_cb() {
                console.log('lock: unlock by timeout');
                _this.lck_del = null;
                _this.lck = false;
                console.log('hello');
            }, this.tout);
        }
    },
    lockt: function () {
        if (this.lck) {
            return false;
        }
        this.lck = true;
        if (this.tout) {
            var _this = this;
            this.lck_del = window.setTimeout(this.tout, function lock_tmp_cb() {
                console.log('lock: unlock by timeout');
                _this.lck_del = null;
                _this.lck = false;
            });
        }
        return true;
    },
    unlock: function () {
        if (this.lck_del) {
            window.clearTimeout(this.lck_del);
            this.lck_del = null;
        }
        this.lck = false;
    }
}

function window_feat(config, page, tout) {
    this.page = page;
    this.win_id = -1;
    this.win_lock = new lock(this.tout);
    this.config = config;
}

window_feat.prototype = {
    open: function() {
        var conf = this.config;
        var _this = this;

        console.log('window_feat::open');

        if (this.win_lock.lock()) {
            console.log("WIN HANDLE: " + this.win_id);
            if (this.win_id == -1) {
                this.win_lock.delayed_unlock();

                var app_url = "http" + (conf.is_secure ? "s" : "") + "://" + conf.server_url + this.page;
                chrome.windows.create({'url': [app_url], 'width': 800, 'height': 600},
                                      function window_create_cb(win) {
                                          _this.win_id = win.id;
                                          _this.on_removed = function window_on_removed_cb(win_id) {
                                              console.log("onRemoved");
                                              console.log(_this.win_id);
                                              console.log(win_id);
                                              _this.win_lock.lock()
                                              if (_this.win_id == win_id) {
                                                  console.log("onRemoved: reset window.id");
                                                  _this.win_id = -1;
                                              }
                                              chrome.windows.onRemoved.removeListener(
                                                  _this.on_removed);
                                              _this.win_lock.unlock()
                                          };
                                          chrome.windows.onRemoved.addListener(_this.on_removed);
                                          _this.win_lock.unlock();
                                      });
            }
            else {
                chrome.windows.update(this.win_id, {focused: true});
                // TODO put on top
                console.log('PUT ON TOP HERE');
                this.win_lock.unlock();
            }
        }
        else {
            console.log('WIN LOCK ENABLED, TRY LATER');
        }
    }
}

function app_one(config) {
    console.log('app_one initialization');
    console.log(config);
    this.window = new window_feat(config, "app_one.html", 5000);
    this.config = config;
}

app_one.prototype = {
    window_open: function() {
        this.window.open();
    }
}

var config = {
    application_url: "localhost:8010/",
    server_url: "localhost:8000/",
    ws_address: "websocketserver",
    is_secure: false,
}

config.apps = {'app_one': new app_one(config)};


var hybridge = null;

function HyBridge(config) {
    this.ws_url = "ws" + (config.is_secure ? "s" : "") + "://" +
        config.application_url + config.ws_address;
}

HyBridge.prototype = {
    ws_url: "",
    ws: null,
    watchdog_hande: null,
    ws_connect: function() {
        var _this = this;

        console.log("ws_connect: begin");
        try {
            this.ws = new WebSocket(this.ws_url);
            this.ws.addEventListener('open', function (event) {
                console.log("WS OPEN fired");
            });
            this.ws.addEventListener('close', function (event) {
                console.log("WS CLOSE fired");
                _this.ws = null;
            });
            this.ws.addEventListener('error', function (event) {
                console.log("WS ERROR fired");
                this.close();
                _this.ws = null;
            });
            this.ws.addEventListener('message', function (event) {
                console.log("WS MESSAGE fired");
                console.log(event.data);
                var data = JSON.parse(event.data);

                if (data.app == undefined || data.command == undefined) {
                    console.log('malformed command, rejected' + data);
                    return;
                }

                if (! data.app in config.apps) {
                    console.log('app ' + data.app + ' not found');
                    return;
                }

                app = config.apps[data.app];
                if (! data.command in app) {
                    console.log('command '+ data.command + ' not found');
                    return;
                }

                app[data.command].apply(app, data.args);

            });
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

        // run watchdog to monitorize websocket
        this.watchdog_hande = setInterval(function wd_func(obj) { obj.watchdog(); }, 1000, _this);
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
        console.log("first step");
        console.assert(port.name == "web_page");
        console.log("second step");
        port.onMessage.addListener(function(msg) {
            console.log("port msg received");
            if (msg.joke == "Knock knock")
                port.postMessage({question: "Who's there?"});
            else if (msg.answer == "Madame")
                port.postMessage({question: "Madame who?"});
            else if (msg.answer == "Madame... Bovary") {
                port.postMessage({question: "I don't get it."});
                console.log("last msg");
            }
        });
    });
}

main();

console.log("background.js: end");

