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
    document.getElementById("apptest").addEventListener(
        "click",
        function() {
            run_command('apptest', 'window_open');
            console.log("Fire a command to command page");
        }
    );
    document.getElementById("ipt").addEventListener(
        "click",
        function() {
            run_command('ipt', 'window_open');
            console.log("Fire a command to command page");
        }
    );

    document.getElementById("ipt_send").addEventListener(
        "click",
        function() {
            run_command('ipt', 'set_cells', 'arg-one', 'arg-two');
            console.log("Fire a command to command page");
        }
    );

    document.getElementById("taxtweb").addEventListener(
        "click",
        function() {
            run_command('taxtweb', 'window_open');
            console.log("Fire a command to command page");
        }
    );
    document.getElementById("taxtweb_send").addEventListener(
        "click",
        function() {
            run_command('taxtweb', 'set_cells', 'arg-ein', 'arg-zwei');
            console.log("Fire a command to command page");
        }
    );

    document.getElementById("taxonomy").addEventListener(
        "click",
        function() {
            run_command('taxonomy', 'window_open');
            console.log("Fire a command to command page");
        }
    );
    document.getElementById("taxonomy_send").addEventListener(
        "click",
        function() {
            run_command('taxonomy', 'set_cells', 'arg-uno', 'arg-due');
            console.log("Fire a command to command page");
        }
    );
}
console.log("command.js: end");
