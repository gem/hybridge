console.log("background.js: begin");
chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    console.log("inside message !: [" + message.msg + "]");
    sendResponse({farewell: "goodbye"});
});
console.log("background.js: end");
