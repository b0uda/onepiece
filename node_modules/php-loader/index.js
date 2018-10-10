/*
  MIT License http://www.opensource.org/licenses/mit-license.php
  Author Tobias Koppers @sokra
*/

// @See https://webpack.github.io/docs/how-to-write-a-loader.html
// @See https://webpack.github.io/docs/loaders.html

loaderUtils = require('loader-utils');
glob = require('glob');

function phpLoader(content) {
  // Hold the name of the file to be executed (a resource in webpack terminology)
  var resource = this.resource;

  // The directory where the original file was run. This is necessary
  // if the php script use the __DIR__ variable, wich refer to the original file.
  // So if the file is runned "inline", we need to change path into that path so that
  // __DIR__ point to the correct location.
  var cwd = this.context;


  // this.addDependency(headerPath); -> mark a dependancy for watching and cachable mode
  // this.cacheable && this.cacheable(); -> mark the file as cachable (true if dependancies are marked)
  var query = loaderUtils.parseQuery(this.query);

  var callback = this.async();
  var options = Object.assign({
    proxyScript: null
  }, query);

  // Listen for any response from the child:
  var fullFile = "";
  var fullError = "";

  /**
  *
  * Run the PHP file inplace.
  *
  */
  var args = [ ];
  if (options.proxy) {
    this.addDependency(options.proxy);
    args.push(options.proxy);
  }

  if (options.args) {
    args = args.concat(options.args);
  }

  this.addDependency(resource);
  args.push(resource);

  if (options.dependancies) {
    if (!Array.isArray(options.dependancies)) {
      options.dependancies = [ options.dependancies ];
    }
    for(a of options.dependancies) {
      for(b of glob.sync(a)) {
        if (options.debug) {
          fullFile += "<!-- dependant of " + b + "-->\n";
        }
        this.addDependency(b);
      }
    }
  }

  child = require('child_process').spawn('php', args);
  var self = this;

  // Send data to the child process via its stdin stream
  // child.stdin.write(content);
  child.stdin.end();

  // Keep track of wich buffer is closed, since we can not determine it ourself.
  // We could use the "ended" property, but this one is not a public one
  // @See https://github.com/nodejs/node-v0.x-archive/blob/v0.11.11/lib/_stream_readable.js#L50
  var outIsClosed = false;
  var errIsClosed = false;

  /**
  * Run each time one of the two stream is closed.
  * If the two streams (out and err) are closed, then fire the callback:
  *   - if something went out on stderr, consider this as an error, and fire an error,
  *   - otherwise, everything went fine, and stream out the php content.
  */
  function endOfPhp() {
    if (outIsClosed && errIsClosed) {
      if (fullError) {
        self.emitError(fullError);
        callback(fullError);
      } else {
        callback(null, fullFile);
      }
    }
  }

  // Listen for content
  child.stdout.on('data', function (data) {
    fullFile += data;
  });

  // Listen for errors
  child.stderr.on('data', function (data) {
    fullError += data;
  });

  // When strout is closed, test if the process is ended
  child.stdout.on('end', function () {
    outIsClosed = true;
    endOfPhp();
  });

  // When strerr is closed, test if the process is ended
  child.stderr.on('end', function () {
    errIsClosed = true;
    endOfPhp();
  });
}

module.exports = phpLoader;
