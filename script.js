var uglifycss = require('uglifycss');
 
var uglified = uglifycss.processFiles(
    [ './src/common.css', './src/index.css' ],
    { maxLineLen: 500, expandVars: true }
);
 
console.log(uglified);