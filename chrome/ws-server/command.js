console.log("command.js: begin");

window.onload = function() {
    document.getElementById("app_one").addEventListener(
        "click",
        function() {
            console.log("Fire a command to command page");
        }
    );
}
console.log("command.js: end");
