@nativescript/hook
=======================================

An easier way to install hooks into NativeScript projects when using the `ns install <module>` command. A project hook is a script that is configured to be executed when the NativeScript CLI executes some action.

Hooks go into the `hooks/` folder of a project. For example, when `ns prepare ...` is executed, all script files in the `hooks/before-prepare/` and `hooks/after-prepare/` folders are executed as well.

This simplifies the process of installing the scripts into the right project folder.

How to use
----------

### Describe the hooks

First, add a description of your hooks to the module's `package.json`. Here's an example:
```json
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
The above specifies that the script `lib/before-prepare.js` should be executed when the `ns prepare ...` command is executed. the `"type"` property specifies the type of the hook to install. The `"script"` property specifies the path to the script to execute. You can add more hooks by extending the `"hooks"` array.

### Install the hooks

Add a post-install and pre-uninstall script to your `package.json`, if you haven't done so already:

```ts
  "scripts": {
    ...
    "postinstall": "node postinstall.js",
    "preuninstall": "node preuninstall.js"
  },
```

The post-install script (`postinstall.js` in the example) should contain the following line:

```javascript
import path from 'path';
import hook from '@nativescript/hook';
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
hook(__dirname).postinstall();
```

The pre-uninstall script (`preuninstall.js` in the example) should contain the following line:

```javascript
import path from 'path';
import hook from '@nativescript/hook';
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
hook(__dirname).preuninstall();
```

These two hooks will take care of installing and removing the hooks from the NativeScript project, when your module is installed or uninstalled.

`ns install <module>`
----------------------
NativeScript modules that install hooks are intended to be installed using the `ns install <module>` command, not through npm directly. During module installation the NativeScript CLI provides information to the post-install script where to put the hooks. The following environment variables are defined when installing through `ns install <module>`:
* `TNS_HOOKS_DIR` - the directory where the hooks should be installed. It may or may not exist.
* `TNS_PROJECT_DIR` - the current project directory.

Modules installed this way can be uninstalled simply by running `npm rm --save-dev`.

In-process hooks
----------------
By default, hooks are executed in a child process and execution continues when the child process dies. This gives you flexibility when writing your hooks, but doesn't allow you to use any of the services of the CLI.

To that end, in-process hooks allow you to execute your hooks in such a way so that you can use any of the services available from the injector. In-process hooks work only for JavaScript hooks. To enable in-process execution, all you need to have is a `export default function(...)` statement in the hook. For example, if the hook script is:

```javascript
export default function($logger) {
};
```
Then, the hook script will be required by the CLI and the exported function will be called through the injector.

Hooks can take a special injected argument named `hookArgs`:

```javascript
export default function(hookArgs) {
};
```

`hookArgs` is a hash containing all the arguments passed to the hooked method. For example, the `prepare` hook is activated by the CLI method `preparePlatform(platform: string)`. Here, the hook will get the value of the `platform` argument in the `hookArgs.platform` property.

If you execute asynchronous code in your hook, you need to return a promise, otherwise execution will continue before your hook completes:

```javascript
import mkdirp from 'mkdirp';

export default function($logger) {
  return new Promise(function(resolve, reject) {
      mkdirp('somedir', function(err) {
          if (err) {
            reject(err);
          else {
            resolve();
          }
        })
    });
}
```

And finally, when installing in-process hooks through this module, you need to explicitly specify that using the `inject` property of the script descriptor in the `package.json`:
```json
{
  "nativescript": {
    "hooks": [
      {
        "type": "after-prepare",
        "script": "lib/after-prepare.js",
        "inject": true
      }
    ]
  },
}
```

You have the ability to define a custom name to your hook in `package.json`, this attribute is optional and defaults to the plugin package name:
```json
{
  "nativescript": {
    "hooks": [
      {
        "type": "after-prepare",
        "script": "lib/after-prepare.js",
        "name": "my-custom-hook"
      }
    ]
  },
}
```


