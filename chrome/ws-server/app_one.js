var hybridge_id = "cjgpdcodlpoonjhgljcikndlgodgpdfb";
var port = null;

window.onload = function window_onload() {
    port = chrome.runtime.connect(hybridge_id, {name: "app_one"});
    port.onMessage.addListener(function(msg) {
        document.getElementById("arg-a").innerHTML = msg.a;
        document.getElementById("arg-b").innerHTML = msg.b;
        
        console.log("client app_one received:");
        console.log(msg); 
    });


    document.getElementById("to-hybridge-btn").addEventListener(
        "click",
        function() {
            var arg = document.getElementById("to-hybridge-txt").value;
            port.postMessage({'command': 'ext_app_open', 'args': [arg]});
        }
    );
}

