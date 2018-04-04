# WISH LIST
- manage ssl certificates with application

# TODO LIST
- manage and test disconnections (both sides)
- client header modification by add-on: see https://developer.chrome.com/extensions/webRequest

- DONE web-api with a flag to inform about connection status
  - DONE web-api new command that do:
     - DONE submit a cb to start and to stop connection to ext_app
     - DONE submit a cb to remove start/stop cb when web_app disconnect
     - DONE run explicitly the callback to reply the current status

- DONE update messages documentation

- DONE web-api: hide HyBridge behind App class

- DONE ext-app <-> web-app (add-on part)
- DONE ext-app <-> web-app (web-page part)
- DONE web-app <-> ext-app (ext-part)

- DONE javascript object web-side infrastructure to manage hybridge commands

- DONE manage multiplicity for each webapp window
- DONE separate `configuration.js` from `background.js` using `manifest.json` and create a template
- DONE manage lock with proper object
- DONE window on top when open app required more than one time
- DONE web-app manage window close event
- DONE web-app web page registration
- DONE WIP web-app open-window
- DONE background.js: web-socket connection with the server
- DONE roundtrip 'command' -> 'background.js'
