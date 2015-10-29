var fs = require('fs');
var os = require('os');
var path = require('path');
var util = require('util');
var mkdirp = require('mkdirp');

function generateHookName(pkg, hook) {
	return pkg.name + '.js';
}

function forEachHook(pkgdir, callback) {
	var pkg = require(path.join(pkgdir, 'package.json'));
	var ns = pkg.nativescript;
	if (!ns) {
		throw Error('Not a NativeScript development module.');
	}

	var hooksDir = process.env['TNS_HOOKS_DIR'];
	if (!hooksDir) {
		console.warn('This module should be installed through the `tns install` command, not npm.');
		process.exit(1);
	}

	if (ns.hooks) {
		ns.hooks.forEach(function (hook) {
			callback(hooksDir, pkg, hook)
		});
	}
}

exports.postinstall = function postinstall(pkgdir) {
	var hookFiles = [];
	forEachHook(pkgdir, function (hooksDir, pkg, hook) {
		var hookDir = path.join(hooksDir, hook.type);
		if (!fs.existsSync(hookDir)) {
			mkdirp.sync(hookDir);
		}
		var hookFileName = generateHookName(pkg, hook);
		var hookPath = path.join(hookDir, hookFileName);

		var trampoline = util.format('%srequire("%s/%s");', hook.inject ? 'module.exports = ' : '', pkg.name, hook.script);

		fs.writeFileSync(hookPath, trampoline + os.EOL);
		hookFiles.push(path.relative(pkgdir, hookPath));
	});

	fs.writeFileSync(path.join(pkgdir, '_hooks.json'), JSON.stringify(hookFiles));
}

exports.preuninstall = function preuninstall(pkgdir) {
	try {
		var hookFiles = JSON.parse(fs.readFileSync(path.join(pkgdir, '_hooks.json')));
		hookFiles.forEach(function (hookRelativePath) {
			var hookFileName = path.join(pkgdir, hookRelativePath);
			if (fs.existsSync(hookFileName)) {
				fs.unlinkSync(hookFileName);
			}
		});
	} catch (err) {
		console.warn('pkgdir: ' + err.toString());
	}
}
