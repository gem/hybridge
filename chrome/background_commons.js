/**
 *
 * @source: hybridge (chrome) background_commons.js
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

function lock(tout)
{
    this.tout = tout;
}

lock.prototype = {
    tout: 0,
    lck: false,
    lck_del: null,

    lock: function() {
        if (this.lck)
            return false;
        this.lck = true;
        return true;
    },

    delayed_unlock: function () {
        if (this.tout) {
            var _this = this;

            this.lck_del = window.setTimeout(function delayed_unlock_cb() {
                console.log('lock: unlock by timeout');
                _this.lck_del = null;
                _this.lck = false;
                console.log('hello');
            }, this.tout);
        }
    },

    lockt: function () {
        if (this.lck) {
            return false;
        }
        this.lck = true;
        if (this.tout) {
            var _this = this;
            this.lck_del = window.setTimeout(this.tout, function lock_tmp_cb() {
                console.log('lock: unlock by timeout');
                _this.lck_del = null;
                _this.lck = false;
            });
        }
        return true;
    },

    unlock: function () {
        if (this.lck_del) {
            window.clearTimeout(this.lck_del);
            this.lck_del = null;
        }
        this.lck = false;
    }
}

function window_feat(config) {
    this.gen_conf = config.general;
    this.config = config.window;
    this.win_lock = new lock(config.window.tout);
}

window_feat.prototype = {
    gen_conf: null,
    config: null,
    win_id: chrome.windows.WINDOW_ID_NONE,
    tab_idx: -1,
    win_lock: null,

    is_set: function()
    {
        return(this.win_id != chrome.windows.WINDOW_ID_NONE);
    },
    set: function(win_id, tab_idx)
    {
        if (this.win_lock.lock()) {
            if (this.is_set()) {
                console.log("WARNING: win_id not empty during set");
            }
            this.win_id = win_id;
            this.tab_idx = tab_idx;
            this.win_lock.unlock();
        }
    },

    reset: function()
    {
        if (this.win_lock.lock()) {
            this.win_id = chrome.windows.WINDOW_ID_NONE;
            this.tab_idx = -1;
            this.win_lock.unlock();
        }
    },

    open: function() {
        var _this = this;

        console.log('window_feat::open');

        if (this.win_lock.lock()) {
            console.log("WIN HANDLE: " + this.win_id);
            if (this.win_id == chrome.windows.WINDOW_ID_NONE) {
                var app_url = "http" + (this.gen_conf.is_secure ? "s" : "") +
                "://" + this.gen_conf.server_url +
                    this.config.page;
                try {
                    chrome.windows.create(
                        {'url': [app_url], 'width': 800, 'height': 1200});
                } catch(e) {
                    console.log(e);
                }
            }
            else {
                chrome.windows.update(this.win_id, {focused: true});
                chrome.tabs.highlight({windowId: this.win_id,
                                       tabs: [this.tab_idx]})
                // TODO put on top
                console.log('PUT ON TOP HERE');
            }
            this.win_lock.unlock();
        }
        else {
            console.log('WIN LOCK ENABLED, TRY LATER');
        }
    }
}
