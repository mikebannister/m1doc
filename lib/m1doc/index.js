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
  Project.getProjects(function(root, projects, fn) {
    var count = 0;
    // keep track of progress of processing projects
    var onProcessed = function() {
      count++;
      // callback when all projects are processed
      if (count >= projects.length) {
        fn(root);
      }
    };
    projects.forEach(function(project) {
      project.process(onProcessed);
    });
  });
};

// rebuild the docs, then start server
rebuildDocs(function(root) {
  startServer(root);
});
