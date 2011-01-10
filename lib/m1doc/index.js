var support = require('../../support');

var connect = require('connect');
var project = require('./project');

var startServer = function(root) {
  var server = connect.createServer(
      connect.logger(),
      connect.staticProvider(root)
  );
  server.listen(3000);
};

var rebuildDocs = function() {
  Project.getProjects(function(root, projects) {
    var count = 0;
    var onProcessed = function() {
      count++;
      if (count >= projects.length) {
        startServer(root);
      }
    };
    projects.forEach(function(project) {
      project.process(onProcessed);
    });
  });
};

// rebuild the docs, then start server
rebuildDocs();
