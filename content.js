'use strict';
console.log('in hybridge content-script');

setTimeout(function () {
    chrome.runtime.sendMessage({'msg': 'here I am'}, function(response) { console.log(response); });
}, 3000);

if (0 == 1) {
    var port = chrome.runtime.connect({name: "knockknock"});
    port.postMessage({joke: "Knock knock"});
    port.onMessage.addListener(function(msg) {
        if (msg.question == "Who's there?")
            port.postMessage({answer: "Madame"});
        else if (msg.question == "Madame who?")
            port.postMessage({answer: "Madame... Bovary"});
    });


    // var port = chrome.runtime.connect();
    
    window.addEventListener("message", function(event) {
        // We only accept messages from ourselves
        if (event.source != window)
            return;
        
        if (event.data.type && (event.data.type == "FROM_PAGE")) {
            console.log("Content script received: " + event.data.text);
            //    port.postMessage(event.data.text);
        }
    }, false);
    
    document.body.style.border = "5px solid green";
    
    console.log('hyb end');
}
