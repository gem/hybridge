# WISH LIST
- manage ssl certificates with application

# TODO LIST
- web-api with a flag to inform about connection status
  . web-api new command that do:
      . submit a cb to start and to stop connection to ext_app
      . submit a cb to remove start/stop cb when web_app disconnect
      . run explicitly the callback to reply the current status

- ext-api with a flag to inform about connection status
  . ext-api new command that do:
      . ext-bg retrieve command setting current status to unknown
      . submit a cb to start and to stop connection to web_app
      . submit a cb to remove start/stop cb when ext_app disconnect
      . run explicitly the callback to reply the current status


- update messages documentation
- client header modification by add-on: see https://developer.chrome.com/extensions/webRequest

- manage and test disconnections (both sides)

DONE - web-api: hide HyBridge behind App class

DONE - ext-app <-> web-app (add-on part)
DONE - ext-app <-> web-app (web-page part)
DONE - web-app <-> ext-app (ext-part)

DONE - javascript object web-side infrastructure to manage hybridge commands

DONE - manage multiplicity for each webapp window
DONE - separate `configuration.js` from `background.js` using `manifest.json` and create a template
DONE - manage lock with proper object
DONE - window on top when open app required more than one time
DONE - web-app manage window close event
DONE - web-app web page registration
DONE - WIP web-app open-window
DONE - background.js: web-socket connection with the server
DONE - roundtrip 'command' -> 'background.js'
