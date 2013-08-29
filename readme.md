## Simple file/directory watcher library with a simple API

Simple example:

```javascript
miniwatch('my-dir', function(error, files) {
  console.log(files);
});
```

With **miniwatch** you can watch a directory for file changes using the well-known `(error, result)` callback pattern. The events are throttled, so you can optimize your event handling for a bunch of simultaneous file changes. All the initial files, currently in the watched directory, are also reported as created. So you don't have to `glob` yourself.

Verbose example:

```javascript
miniwatch({
  directory: __dirname + '/site',
  include: '**/*.js',
  exclude: '**/*.bundle.js'
}, function(error, files) {
  if (error) {
    console.error('Error:', error.stack || error);
    return;
  }

  if (files.deleted) {
    files.deleted.forEach(function(file) {
      bundler.remove(file);
    });
  }

  if (files.updated) {
    files.updated.forEach(function(file) {
      bundler.reload(file);
    });
  }

  if (files.created) {
    files.created.forEach(function(file) {
      bundler.add(file);
    });
  }
});
```

API:

 * `miniwatch(options, callback)` with the following options:
    * `directory`: string, the directory path you want to watch for changes
    * `include`: string, glob pattern of files to include (default all)
    * `exclude`: string, glob pattern of files to exclude (default none)
 * `miniwatch(directory, callback)`, shorthand if you want to watch all files

Install:

```bash
npm install miniwatch
```
