<html>
<head>

<script>

function main()
{
    console.log("ci siamo");
    /*
    if (unsafeWindow.mop_cont != undefined) {
        console.log('ARGO: ' + mop_cont.argo);
    }
    else {
        setTimeout(main, 1000);
    }
    */
    document.getElementById("theButton").addEventListener("click",
    function() {
        window.postMessage({ type: "FROM_PAGE", text: "Hello from the webpage!" }, "*");
    }, false);
}

window.onload = main;

</script>
</head>
<body>
<div>
<button type="button" id="theButton">The Button</button>
<button style="float: right;">Uno</button>
<button style="float: right;">Due</button>
<button style="float: right; clear: right;">Tre</button>
</div>
</body>
</html>