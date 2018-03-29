/**
 *
 * @source: hybridge (chrome) app_one.js
 * @author: Matteo Nastasi <nastasi@alternativeoutout.it>
 * @link: https://github.com/nastasi/hybridge
 *
 * @licstart  The following is the entire license notice for the
 *  JavaScript code in this page.
 *
 * Copyright (C) 2018 Matteo Nastasi
 *
 *
 * The JavaScript code in this page is free software: you can
 * redistribute it and/or modify it under the terms of the GNU
 * General Public License (GNU GPL) as published by the Free Software
 * Foundation, either version 3 of the License, or (at your option)
 * any later version.  The code is distributed WITHOUT ANY WARRANTY;
 * without even the implied warranty of MERCHANTABILITY or FITNESS
 * FOR A PARTICULAR PURPOSE.  See the GNU GPL for more details.
 *
 * As additional permission under GNU GPL version 3 section 7, you
 * may distribute non-source (e.g., minimized or compacted) forms of
 * that code without the copy of the GNU GPL normally required by
 * section 4, provided you include this license notice and a URL
 * through which recipients can access the Corresponding Source.
 *
 * @licend  The above is the entire license notice
 * for the JavaScript code in this page.
 *
 */

/* callback fired when when a web-app generated command is finished */
function on_cmd_cb(uu, msg)
{
    console.log('MSG rec: ');
    console.log(uu);
    console.log(msg);
}


function AppOne(name)
{
    this.name = name;
    this.hybridge = new HyBridge(this);

    // TODO: add to hybridge push pop of things to do on ext_app connect/disconnect

    console.log('before');

    // FIXME: REENABLE IT
    // this.track_uuid = this.hybridge.send(
    //     {'command': 'hybridge_track_status'},
    //     function (uuid, msg) { console.log('track status');
    //                            console.log(msg);
    //                          });

    // bg-side it register cb in on_open, on_close and fire back the current
    // connection status

    console.log('after');
}

AppOne.prototype = {
    name: null,
    hybridge: null,
    track_uuid: null,
    allowed_meths: ['set_cells'],

    register: function (hybridge) {
        this.hybridge = hybridge;
    },

    /* this function is called when a malformed message is received */
    on_notstd_msg_cb: function(msg) {
        console.log("client app_one received:");
        console.log(msg);
    },

    set_cells: function(arg_a, arg_b) {
        document.getElementById("arg-a").innerHTML = arg_a;
        document.getElementById("arg-b").innerHTML = arg_b;

        return {'success': true};
    },

    send: function(msg, cmd_cb) {
        return this.hybridge.send(msg, cmd_cb);
    }
}

window.onload = function window_onload() {
    var app_one = new AppOne('app_one');

    document.getElementById("to-hybridge-btn").addEventListener(
        "click",
        function() {
            console.log('send msg');
            var arg = document.getElementById("to-hybridge-txt").value;
            var uu = app_one.send({'command': 'ext_app_open', 'args': [arg]},
                                  on_cmd_cb);
            console.log("FIRED CMD WITH UUID: " + uu);
        }
    );
}

