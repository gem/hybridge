// Copyright 2018 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.


let page = document.getElementById('buttonDiv');

function options_manager() {

    let base_url = document.getElementById('base-url');
    let is_devel = document.getElementById('is-devel'); 

    chrome.storage.local.get(['base_url'], function(ret) {
        if (ret.base_url === undefined)
            base_url.value = base_url_default;
        else
            base_url.value = decodeURI(ret.base_url);
    });
    chrome.storage.local.get(['is_devel'], function(ret) {
        if (ret.is_devel === undefined)
            is_devel.checked = is_devel_default;
        else
            is_devel.checked = (ret.is_devel == "true" ? true : false);
    });
    
    let btn_reset = document.getElementById('btn-reset');
    let btn_close = document.getElementById('btn-close');
    let btn_save = document.getElementById('btn-save');

    btn_reset.addEventListener('click', function() {
        base_url.value = base_url_default;
        is_devel.checked = (is_devel_default == "true" ? true : false);
    });
    
    btn_save.addEventListener('click', function() {
        chrome.storage.local.set({'base_url': encodeURI(base_url.value)});
        chrome.storage.local.set({'is_devel': is_devel.checked ? "true" : "false"});

        chrome.extension.getBackgroundPage().window.location.reload();
    });
}
options_manager();
