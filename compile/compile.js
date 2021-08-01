const Composer = require('./Composer');
const Decomposer = require('./Decomposer');
const Environment = require('./Environment');
const Node = require('./Node');
const fs = require('fs');

exports.compile = function(sourceCode)
{
    const nodes = Decomposer.nodeFromString(sourceCode.trim())

    const batch = Composer.compose(nodes);

    return batch;
}

exports.compileFile = function(srcPath, destPath) {
    const src = fs.readFileSync(srcPath).toString();

    const batch = exports.compile(src);
    
    fs.writeFileSync(destPath, batch);
}

exports.autoCompileFile = function(srcPath) {
    const srcp = srcPath+"";

    if(!srcp.endsWith(".bats"))
    {
        throw `Filepath does not end with .bats extension`
    }

    const srcps = srcp.split('.');
    srcps.pop();
    srcps.push('bat')

    const outp = srcps.join('.');

    exports.compileFile(srcp, outp);
}

const args = process.argv.slice(2);

if(args.length > 0)
{
    exports.autoCompileFile(args[0]);
}else{
    throw `Usage: compile <path.bats>`
}