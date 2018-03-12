console.log("command.js: begin");

function run_command(msg)
{
    var xhr = new XMLHttpRequest();

    xhr.onload = function reqListener() {
        console.log(this);
    }
    xhr.open("POST", "command.html");
    xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
    xhr.send('command=' + msg + '&' + 'arg=' + 'org');
}


window.onload = function() {
    document.getElementById("app_one").addEventListener(
        "click",
        function() {
            run_command('open_app_one');
            console.log("Fire a command to command page");
        }
    );
}
console.log("command.js: end");
