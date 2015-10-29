nativescript-hook
=======================================

This module gives you an easier way to install hooks into NativeScript projects when using the `tns install <module>` command. A project hook is some sort of script that is configured to be executed when the NativeScript CLI executes some action.

Hooks go into the `hooks/` folder of a project. For example, when `tns prepare ...` is executed, all script files in the `hooks/before-prepare/` and `hooks/after-prepare/` folders are executed, as well.

This module simplifies the process of installing the scripts into the right project folder.

How to use
----------

### Describe the hooks
First, add a description of your hooks to the module's `package.json`. Here's an example:
```
{
  "nativescript": {
    "hooks": [
      {
        "type": "before-prepare",
        "script": "lib/before-prepare.js"
      }
    ]
  },
}
```
The above specifies that the script `lib/before-prepare.js` should be executed when the `tns prepare ...` command is executed. the `"type"` property specifies the type of the hook to install. The `"script"` property specifies the path to the script to execute. You can add more hooks by extending the `"hooks"` array.

### Install the hooks
Add a post-install and pre-uninstall script to your `package.json`, if you haven't done so already:
```
  "scripts": {
    ...
    "postinstall": "node postinstall.js",
    "preuninstall": "node preuninstall.js"
  },
```

The post-install script (`postinstall.js` in the example) should contain the following line:
```
require('nativescript-hook').postinstall(__dirname);
```

The pre-uninstall script (`preuninstall.js` in the example) should contain the following line:
```
require('nativescript-hook').preuninstall(__dirname);
```

These two hooks will take care of installing and removing the hooks from the NativeScript project, when your module is installed or uninstalled.

`tns install <module>`
----------------------
NativeScript modules that install hooks are intended to be installed using the `tns install <module>` command, not through npm directly. During module installation the NativeScript CLI provides information to the post-install script where to put the hooks. The following environment variables are defined when installing through `tns install <module>`:
* `TNS_HOOKS_DIR` - the directory where the hooks should be installed. It may or may not exist.
* `TNS_PROJECT_DIR` - the current project directory.

Modules installed this way can be uninstalled using `npm rm --save-dev`.
