console.log("background.js: begin");

ws = null;

try {
    ws = new WebSocket("ws://localhost:8000/websocketserver");
} catch (err) {
    console.log('WS connection failed: '+ err.message);
}

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
console.log("background.js: end");
