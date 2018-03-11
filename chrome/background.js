console.log("background.js: begin");

var config = {
    base_url: "localhost:8000/",
    ws_address: "websocketserver",
    is_secure: false
}

var hybridge = null;

function HyBridge(config) {
    this.ws_url = "ws" + (config.is_secure ? "s" : "") + "://" +
        config.base_url + config.ws_address;
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

