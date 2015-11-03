module.exports = function (__dirname) {
	return {
		findProjectDir: function () {
			return findProjectDir(__dirname);
		},
		postinstall: function () {
			return postinstall(__dirname);
		},
		preuninstall: function () {
			return preuninstall(__dirname);
		}
	};
}

var fs = require('fs');
var os = require('os');
var path = require('path');
var util = require('util');
var mkdirp = require('mkdirp');

function generateHookName(pkg, hook) {
	return pkg.name + '.js';
}

function findProjectDir(pkgdir) {
	var candidateDir = pkgdir;

	while (true) {
		var oldCandidateDir = candidateDir;
		candidateDir = path.dirname(candidateDir);
		if (path.basename(candidateDir) === 'node_modules') {
			continue;
		}
		var packageJsonFile = path.join(candidateDir, 'package.json');
		if (fs.existsSync(packageJsonFile)) {
			return candidateDir;
		}

		if (oldCandidateDir === candidateDir) {
			return;
		}
	}
}

function forEachHook(pkgdir, callback) {
	var pkg = require(path.join(pkgdir, 'package.json'));
	var ns = pkg.nativescript;
	if (!ns) {
		throw Error('Not a NativeScript development module.');
	}

	var projectDir = findProjectDir(pkgdir);
	if (!projectDir) {
		return;
	}
	var hooksDir = path.join(projectDir, 'hooks');

	if (ns.hooks) {
		ns.hooks.forEach(function (hook) {
			callback(hooksDir, pkg, hook)
		});
	}
}

function postinstall(pkgdir) {
	forEachHook(pkgdir, function (hooksDir, pkg, hook) {
		var hookDir = path.join(hooksDir, hook.type);
		if (!fs.existsSync(hookDir)) {
			mkdirp.sync(hookDir);
		}
		var hookFileName = generateHookName(pkg, hook);
		var hookPath = path.join(hookDir, hookFileName);

		var trampoline = util.format('%srequire("%s/%s");', hook.inject ? 'module.exports = ' : '', pkg.name, hook.script);

		fs.writeFileSync(hookPath, trampoline + os.EOL);
	});
}

function preuninstall(pkgdir) {
	forEachHook(pkgdir, function (hooksDir, pkg, hook) {
		var hookDir = path.join(hooksDir, hook.type);
		var hookFileName = generateHookName(pkg, hook);
		var hookPath = path.join(hookDir, hookFileName);

		try {
			if (fs.existsSync(hookPath)) {
				fs.unlinkSync(hookPath);
			}
		} catch (err) {
			console.warn('nativescript-hook: ' + err.toString());
		}
	});
}
