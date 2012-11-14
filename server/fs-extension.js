var fs = require("fs");
var paths = require("path");

var onWindows = process.platform === 'win32';

// Fix: On Windows, unlink fails for files that are read-only
if (onWindows) {

	var _makeWritable = function (path) {
		var writable = 0200;

		var stats = fs.statSync(path);
		
		// If file is read-only for the owner
		if (! (stats.mode & writable)) {
			// Make it writable for the owner
			fs.chmodSync(path, stats.mode | writable);
		}
	};

	// Wrap the unlink methods
	['unlink', 'unlinkSync'].forEach(function(methodName) {
		var original = fs[methodName];
		fs[methodName] = function(path) {
			// Make file deletable under Windows by making it writable
			_makeWritable(path);
			return original.apply(this, arguments);
		};
	});
}

// Make fs.symlink work under Windows transparently
if (onWindows) {
	// Node <= 0.6
	var oldNodeVersion = process.version.match(/^v0\.[0-6](\.|$)/);

	['symlink', 'symlinkSync'].forEach(function(methodName) {
		var original = fs[methodName];
		fs[methodName] = function(target, source) {
			var args = Array.prototype.slice.call(arguments);

			// Get the directory that will contain the link
			var linkDirectory = paths.dirname(paths.normalize(source));
			// From there, follow target, so we know what the link will point to
			var targetFromCwd = paths.resolve(linkDirectory, target);
			
			var stats = fs.statSync(targetFromCwd);
			if (stats.isDirectory()) {
				if (oldNodeVersion) {
					// Using Unix symlink semantics with a dir hint for Windows
					// Only works with Windows Vista and later
					// fs.symlink[Sync](target, source, "dir"[, callback]);
					args.splice(2, 0, "dir");
				}
				else {
					// Using a junction -> target path must be absolute
					// Works with Windows XP and later
					// fs.symlink[Sync](absolutePathToTarget, source, "junction"[, callback]);
					args[0] = fs.realpathSync(targetFromCwd);
					args.splice(2, 0, "junction");
				}
			}
			else if (stats.isFile()) {
				// Using Unix symlink semantics with a file hint for Windows
				// Compatibility unknown
				// fs.symlink[Sync](target, source, "file"[, callback]);
				args.splice(2, 0, "file");
			}

			return original.apply(this, args);
		};
	});
}


fs.removeRecursive = function(path,cb){
	var self = this;

	fs.stat(path, function(err, stats) {
		if(err){
			cb(err,stats);
			return;
		}
		if(stats.isFile()){
			fs.unlink(path, function(err) {
				if(err) {
					cb(err,null);
				}else{
					cb(null,true);
				}
				return;
			});
		} else if(stats.isDirectory()) {
			// A folder may contain files
			// We need to delete the files first
			// When all are deleted we could delete the
			// dir itself
			fs.readdir(path, function(err, files) {
				if(err){
					cb(err,null);
					return;
				}
				var f_length = files.length;
				var f_delete_index = 0;

				// Check and keep track of deleted files
				// Delete the folder itself when the files are deleted

				var checkStatus = function(){
					// We check the status
					// and count till we r done
					if(f_length===f_delete_index){
						fs.rmdir(path, function(err) {
							if(err){
								cb(err,null);
							}else{
								cb(null,true);
							}
						});
						return true;
					}
					return false;
				};
				if(!checkStatus()){
					for(var i=0;i<f_length;i++){
						// Create a local scope for filePath
						// Not really needed, but just good practice
						// (as strings arn't passed by reference)
						(function(){
							var filePath = path + '/' + files[i];
							// Add a named function as callback
							// just to enlighten debugging
							fs.removeRecursive(filePath,function removeRecursiveCB(err,status){
								if(!err){
									f_delete_index ++;
									checkStatus();
								}else{
									cb(err,null);
									return;
								}
							});
	
						})();
					}
				}
			});
		}
	});
};

module.exports = fs;