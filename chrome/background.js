console.log("background.js: begin");
chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    console.log("inside message !: [" + message.msg + "]");
    sendResponse({'reply': message.msg});
});

chrome.runtime.onMessageExternal.addListener(
  function(request, sender, sendResponse) {
      console.log("background.js: received msg: " + request.msg);
      sendResponse({'reply': request.msg});
  });


console.log("background.js: end");
