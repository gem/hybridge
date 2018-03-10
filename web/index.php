<html>
<head>

<script>

var hybridge_id = "kdjkpdlpihbnpboinaapepakakkhajhf";

function main()
{
    
    console.log("web page: begin");
    document.getElementById("theButton").addEventListener(
        "click",
        function() {
            console.log("web page: click cb begin");
            
            chrome.runtime.sendMessage(hybridge_id,
            {'msg': 'from web page click'},
            function(response) {
                console.log(
                    "web page: listener_cb from background.js: " + response.reply);
            });
            console.log("web page: click cb end");
        });

    // to send message to content.js (simple and monodirectional
    document.getElementById("theButtonContent").addEventListener(
        "click",
        function() {
            window.postMessage({ type: "FROM_PAGE", msg: "Hello from the webpage!" }, "*");
        });




    
    console.log("web page: end");
}

window.onload = main;

</script>
</head>
<body>
<div>
<button type="button" id="theButton">Send a message to background.js</button><br><br>
<button type="button" id="theButtonContent">Send a message to content.js</button>
</div>
</body>
</html>

















    