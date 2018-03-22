# WISH LIST
- manage ssl certificates with application

# TODO LIST

- WIP command bridged-app -> web-app (use uuid to serialize?)
  . web-app command
    DONE [app.js  -> bg(app).js -> bg.js -> ext_app -> bg.js -> bg(app).js -> app.js]
  . ext-app command
    TODO [ext_app -> bg.js -> bg(app).js -> app.js -> bg(app).js -> bg.js -> ext_app]

- command web-app -> bridged-app (use uuid to serialize?)
- javascript object web-side infrastructure to manage hybridge commands
- web app js class initialization (with flag to know if connected or not)

- client header modification by add-on: see https://developer.chrome.com/extensions/webRequest

DONE - manage multiplicity for each webapp window
DONE - separate `configuration.js` from `background.js` using `manifest.json` and create a template
DONE - manage lock with proper object
DONE - window on top when open app required more than one time
DONE - web-app manage window close event
DONE - web-app web page registration
DONE - WIP web-app open-window
DONE - background.js: web-socket connection with the server
DONE - roundtrip 'command' -> 'background.js'