var hybridge_id = "cjgpdcodlpoonjhgljcikndlgodgpdfb";
var port = null;

function HyBridge(app_name, on_msg_cb)
{
    this.name = app_name;
    this.on_msg_cb = on_msg_cb;
    this.connect();
}

HyBridge.prototype = {
    hybridge_id: "cjgpdcodlpoonjhgljcikndlgodgpdfb",
    name: null,
    port: null,
    pending: {},

    connect: function() {
        var _this = this;
        if (this.port != null) {
            // FIXME close previous
        }
        this.port = chrome.runtime.connect(
            this.hybridge_id, {name: "app_one"});
        this.port.onMessage.addListener(function(msg) { return _this.receive_cb(msg)});
    },

    receive_cb: function(api_msg) {
        console.log("receive_cb");
        console.log(api_msg);
        if ('uuid' in api_msg && api_msg['uuid'] in this.pending &&
            'reply' in api_msg && 'complete' in api_msg['reply']) {
            // reply from a command

            console.log('Reply received!');
            var uu = api_msg['uuid'];
            var reply = api_msg['reply'];
            if (this.pending[uu].cb) {
                console.log('reply cb fired!');
                this.pending[uu].cb(uu, reply);
            }
            if (reply['complete']) {
                console.log('pending removed!');
                delete this.pending[uu];
            }
        }
        else {
            // not a reply or malformed msg, use user defined cb
            this.on_msg_cb(api_msg);
        }
    },

    // { 'msg': {'command', 'args', [ ]}, uuid: <UUID> }
    send: function(msg, on_reply_cb) {
        var uu = uuid();
        var api_msg = { 'msg': msg,
                        'uuid': uu
                        // maybe the time
                      };
        this.port.postMessage(api_msg);
        this.pending[uu] = { 'msg': api_msg, 'cb': on_reply_cb };
        return uu;
    }
}

function on_message_cb(msg) {
        console.log("client app_one received:");
        console.log(msg);
    }

function on_cmd_cb(uu, msg)
{
    console.log('MSG rec: ');
    console.log(uu);
    console.log(msg);
}

window.onload = function window_onload() {
    hb = new HyBridge("app_one", on_message_cb);

    document.getElementById("to-hybridge-btn").addEventListener(
        "click",
        function() {
            console.log('send msg');
            var arg = document.getElementById("to-hybridge-txt").value;
            var uu = hb.send({'command': 'ext_app_open', 'args': [arg]},
                             on_cmd_cb);
            console.log("FIRED CMD WITH UUID: " + uu);
        }
    );
}

