console.log("command.js: begin");

function run_command(app, command)
{
    var xhr = new XMLHttpRequest();
    var args = "";
    xhr.onload = function reqListener() {
        console.log(this);
    }
    xhr.open("POST", "command.html");
    xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
    if (arguments.length > 2) {
        for (var i = 2 ; i < arguments.length ; i++) {
            args += "&arg=" + arguments[i];
        }
    }
    xhr.send("app=" + app + "&command=" + command + args);
}


window.onload = function() {
    document.getElementById("app_one").addEventListener(
        "click",
        function() {
            run_command('app_one', 'window_open');
            console.log("Fire a command to command page");
        }
    );

    document.getElementById("app_one_send").addEventListener(
        "click",
        function() {
            run_command('app_one', 'send', 'arg-one', 'arg-two');
            console.log("Fire a command to command page");
        }
    );

    document.getElementById("app_two").addEventListener(
        "click",
        function() {
            run_command('app_two', 'window_open');
            console.log("Fire a command to command page");
        }
    );
    document.getElementById("app_two_send").addEventListener(
        "click",
        function() {
            run_command('app_two', 'send', 'arg-one', 'arg-two');
            console.log("Fire a command to command page");
        }
    );

    document.getElementById("app_three").addEventListener(
        "click",
        function() {
            run_command('app_three', 'window_open');
            console.log("Fire a command to command page");
        }
    );
    document.getElementById("app_three_send").addEventListener(
        "click",
        function() {
            run_command('app_three', 'send', 'arg-one', 'arg-two');
            console.log("Fire a command to command page");
        }
    );
}
console.log("command.js: end");
