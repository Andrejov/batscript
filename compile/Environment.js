const Symbol = require('./Symbol');
const Node = require('./Node')

class Environment
{
    /** @type {string} Source code */
    source;

    /** @type {Node[]} */
    nodes = [];

    /** @type {Object<string,Node>} */
    symbols = {};

    constructor()
    {

    }

    build()
    {

        this.preloadVars = [];
        this.symbols = {};

        this.nodes.forEach(node => {
            if(node.type == 'func')
            {
                if(this.symbols[node.func])
                {
                    throw `Symbol ${node.func} is declared multiple times`;
                }
                this.symbols[node.func] = node;
            }else if(node.type == 'declare'){
                if(this.symbols[node.var])
                {
                    throw `Symbol ${node.var} is declared multiple times`;
                }
                this.symbols[node.var] = node;

                this.preloadVars.push(node);
            }
        })

        const main = this.symbols['main'];

        if(!main)
        {
            throw `No main function found`;
        }

        recursiveFunctions(main);

        let output = [];

        output.push(`@REM batS compiler v.0 : 2021`)
        output.push('@ECHO OFF')

        
    }
}

/**
 * 
 * @param {Node} functionNode 
 */
function recursiveFunctions(functionNode)
{
    if(!functionNode.attached)
    {
        functionNode.attached = true;

        functionNode.block.contents.forEach(e => {
            if(e.type == "func" || e.type == "declare")
            {
                e.batch = Math.round(Math.random()*1000) + "" + (e.func ?? e.var);
            }

            if(e.type == "func")
            {
                recursiveFunctions(e);
            }
        });
    }
}

module.exports = Environment;