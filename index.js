
'use strict';

var minimatch = require('minimatch');
var chokidar = require('chokidar');
var path = require('path');

var dirCache = {};

function MiniWatchDirectory(options) {
	var directory = '' + options.directory;
	var observers = [];
	var files = {};
	var changes = {
		created: {},
		updated: {},
		deleted: {}
	};
	var lastEventTime = Date.now();

	this.directory = directory;
	this.observers = observers;
	this.files = files;

	function invokeObservers() {
		lastEventTime = Date.now();

		var filesEvent = {
			created: Object.keys(changes.created),
			updated: Object.keys(changes.updated),
			deleted: Object.keys(changes.deleted)
		};
		changes.created = {};
		changes.updated = {};
		changes.deleted = {};

		observers.forEach(function(observer) {
			observer(null, filesEvent);
		});
	}

	function onFileChange(event, filename) {
		filename = path.relative(directory, filename);

		if (event === 'created') {
			files[filename] = true;
			changes.created[filename] = true;
			delete changes.deleted[filename];
		} else if (event === 'updated') {
			files[filename] = true;
			changes.updated[filename] = true;
			delete changes.deleted[filename];
		} else if (event === 'deleted') {
			delete files[filename];
			delete changes.created[filename];
			delete changes.updated[filename];
			changes.deleted[filename] = true;
		}

		var remainingTime = 100 - (Date.now() - lastEventTime);
		if (remainingTime <= 0) {
			invokeObservers();
		} else {
			setTimeout(invokeObservers, remainingTime);
		}
	}

	var watcher = chokidar.watch(directory);

	watcher.on('add', function(filename)  {
		onFileChange('created', filename);
	}).on('change', function(filename) {
		onFileChange('updated', filename);
	}).on('unlink', function(filename) {
		onFileChange('deleted', filename);
	}).on('error', function(error) {
		observers.forEach(function(observer) {
			observer(error);
		});
	});
}

MiniWatchDirectory.prototype.listen = function listen(callback) {
	this.observers.push(callback);
	callback(null, { created: Object.keys(this.files) });
	return this;
};

function MiniWatch(options) {
	if (typeof(options) === 'string') {
		options = {
			directory: options
		};
	}
	if (!options) {
		throw new TypeError('No directory and/or options given.');
	}
	if (!options.directory) {
		throw new TypeError('Missing directory parameter.');
	}

	var directory = '' + options.directory;
	var directoryWatcher = dirCache[directory];
	if (!directoryWatcher) {
		dirCache[directory] = directoryWatcher = new MiniWatchDirectory(options);
	}

	this.directoryWatcher = directoryWatcher;
	this.include = options.include ? minimatch.filter('' + options.include) : null;
	this.exclude = options.exclude ? minimatch.filter('' + options.exclude) : null;
}

MiniWatch.prototype.filter = function filter(files) {
	if (!files) {
		return null;
	}

	var self = this;

	var result = [];
	for (var i = 0; i < files.length; i++) {
		var file = files[i];
		if ((!self.include || self.include(file)) &&
				(!self.exclude || !self.exclude(file))) {
			result.push(file);
		}
	}
	return result.length ? result : null;
};

MiniWatch.prototype.listen = function listen(callback) {
	var self = this;

	self.directoryWatcher.listen(function(error, files) {
		if (error) {
			callback(error);
			return;
		}

		files = {
			created: self.filter(files.created),
			updated: self.filter(files.updated),
			deleted: self.filter(files.deleted)
		};

		if (files.created || files.updated || files.deleted) {
			callback(null, files);
		}
	});
};

function miniwatch(options, callback) {
	return new MiniWatch(options).listen(callback);
}

miniwatch.MiniWatch = MiniWatch;

module.exports = miniwatch;
