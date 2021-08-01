const Composer = require('./Composer');
const Decomposer = require('./Decomposer');
const fs = require('fs');
const Util = require('./Util');

exports.compile = function(sourceCode)
{
    console.log('Compile started');
    let time1 = new Date().getTime();
    
    const nodes = Decomposer.nodeFromString(sourceCode.trim())

    let count = 0;

    nodes.forEach(node => {
        Util.forNode(node, n => {
            count +=1;
        })
    })

    let time2 = new Date().getTime();
    console.log(`Composing...`)

    const batch = Composer.compose(nodes);

    let time3 = new Date().getTime();
    console.log(`Decompose nodes count: ${count}`);
    console.log(`Batch lines count: ${batch.split('\r\n').length}`)
    console.log(`Decompose finished in ${time2 - time1}ms`)
    console.log(`Compose finished in ${time3 - time2}ms`)
    console.log(`Compile ended successfully in ${time3 - time1}ms`);

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