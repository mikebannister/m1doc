var fs = require('fs');

realPathIsDirectory = exports.realPathIsDirectory = function(path, fn) {
  var isDirectory = function(path, fn) {
    fs.lstat(path, function(err, stats) {
      if (err) throw err;
      fn(stats.isDirectory());
    });
  };
  fs.lstat(path, function(err, stats) {
    if (err) throw err;
    if (stats.isSymbolicLink()) {
      fs.readlink(path, function(err, realPath) {
        isDirectory(realPath, fn);
      });
    } else {
      isDirectory(path, fn);
    }
  });
};
