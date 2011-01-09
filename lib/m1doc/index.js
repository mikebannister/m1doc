var support = require('../../support');

var md = require('discount'),
    fs = require('fs'),
    path = require('path'),
    ejs = require('ejs'),
    connect = require('connect'),
    exec  = require('child_process').exec;

var rootPrefix = path.join(__dirname, '../..'),
    sourceRoot = path.join(process.env.HOME, 'docs'),
    destRoot = path.join(rootPrefix, 'build'),
    templateRoot = path.join(rootPrefix, 'templates');

var Project = function(name) {
  this.name = name;
  this.fileNames = [];
  this.sourceRoot = path.join(sourceRoot, name);
  this.destRoot = path.join(destRoot, name);
};

Project.prototype.createDocList = function(fn) {
  var self = this;
  var templatePath = path.join(templateRoot, 'docList.html');
  var destPath = path.join(self.destRoot, 'index.html');
  fs.readFile(templatePath, function(err, data) {
    if (err) throw err;
    var markup = ejs.render(data.toString(), {
      locals: {
        project: path.basename(self.name, '.md'),
        docList: self.fileNames
      }
    });
    fs.writeFile(destPath, markup, function (err) {
      if (err) throw err;
      fn();
    });
  });
};

Project.prototype.createProjectList = function(fn) {
  var self = this;
  var templatePath = path.join(templateRoot, 'projectList.html');
  var destPath = path.join(destRoot, 'index.html');
  fs.readFile(templatePath, function(err, data) {
    if (err) throw err;
    Project.getProjects(function(projects) {
      var markup = ejs.render(data.toString(), {
        locals: {
          projectList: projects
        }
      });
      fs.writeFile(destPath, markup, function (err) {
        if (err) throw err;
        fn && fn();
      });
    });
  });
};

Project.prototype.process = function(fn) {
  var self = this;
  
  var generateMarkup = function(baseName, rawString, fn) {
    var rawMarkup = md.parse(rawString);
    var templatePath = path.join(templateRoot, 'doc.html');
    var markup;
    fs.readFile(templatePath, function(err, data) {
      if (err) throw err;
      markup = ejs.render(data.toString(), {
        locals: {
          project: self.name,
          title: baseName,
          body: rawMarkup
        }
      });
      fn(markup);
    });
  };

  var convertFile = function(file, fn) {
    var sourceFilePath = path.join(self.sourceRoot, file);
    var destFileName,
        destFilePath,
        destBaseName;
    if (path.extname(sourceFilePath) === '.md') {
      fs.readFile(sourceFilePath, function (err, data) {
        destBaseName = path.basename(file, '.md');
        self.fileNames.push(destBaseName);
        destFileName = path.basename(file, '.md') + '.html';
        destFilePath = path.join(self.destRoot, destFileName);
        if (err) throw err;
        markup = generateMarkup(destBaseName, data.toString(), function(markup) {
          fs.writeFile(destFilePath, markup, function (err) {
            if (err) throw err;
            fn();
          });
        });
      });
    } else {
      fn();
    }
  };

  var convertFiles = function(files, fn) {
    var i = 0;
    var complete = function() {
      i++;
      if (i >= files.length) {
        fn();
      }
    };
    files.forEach(function(file) {
      convertFile(file, complete);
    });  
  };

  exec('mkdir -p ' + self.destRoot, function() {
    exec('ln -s ' + rootPrefix + '/css ' + destRoot + '/css', function() {
      exec('ln -s ' + rootPrefix + '/images ' + destRoot + '/images', function() {
        fs.readdir(self.sourceRoot, function(err, files) {
          self.files = files;
          if (err) throw err;
          convertFiles(files, function() {
            self.createDocList(function() {
              self.createProjectList(function() {
                fn();
              });
            });
          });
        });
      });
    });
  });

};

var realPathIsDirectory = function(path, fn) {
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

Project.getProject = function(name, fn) {
  var projectDirPath = path.join(sourceRoot, name);
  realPathIsDirectory(projectDirPath, function(isDir) {
    if (isDir) {
      fn(new Project(name));
    } else {
      fn();
    }
  });
};

Project.getProjects = function(fn) {
  var all = [];
  var count = 0;
  var projectDir;
  fs.readdir(sourceRoot, function(err, projectDirs) {
    if (err) {
      throw new Error('Could not read root document directory: ' + sourceRoot);
    };
    for (var i = 0; i < projectDirs.length; i++) {
      projectDir = projectDirs[i];
      Project.getProject(projectDir, function(project) {
        if (project) {
          all.push(project);
        }
        count++;
        if (count >= projectDirs.length) {
          fn(all);
        }
      });
    }
  });
};

var startServer = function() {
  var server = connect.createServer(
      connect.logger(),
      connect.staticProvider(destRoot)
  );
  server.listen(3000);
};

Project.getProjects(function(projects) {
  var i = 0;
  var onProcessed = function() {
    i++;
    if (i >= projects.length) {
      startServer();
    }
  };
  projects.forEach(function(project) {
    project.process(onProcessed);
  });
});
