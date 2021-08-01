const Node = require("./Node");

class ComposingScope
{
    initializers = [];
    output = [];

    /**
     * @type {Symbol[]}
     */
    symbols = [];

    pushLine(line) 
    {
        this.output.push(line);
    }
    push(line)
    {
        this.output.push(this.output.pop() + line);
    }
    pushInit(line)
    {
        this.initializers.push(line);
    }

    /**
     * @param {string} key 
     * @param {Node} scope 
     * @returns {Symbol} 
     */
    getSymbol(key, scope)
    {
        return this.symbols.find(sbl => sbl.key == key && sbl.scope === scope);
    }
    /**
     * @param {string} key 
     * @param {Node} scope 
     * @returns {Symbol} 
     */
    getSymbolDeep(key, scope)
    {
        if(!scope)
        {
            return this.getSymbol(key, scope);
        }

        const found = this.symbols.filter(sbl => sbl.key == key);

        const origin = [];

        function cmpNode(fnode)
        {
            return scope === fnode;
        }
        /**
         * @param {Node} loopnode 
         */
        function loopThru(loopnode)
        {
            for(let cn of [...loopnode.contents, ...loopnode.assignContents])
            {
                if(cmpNode(cn))
                {
                    return cn;
                }
                
                const nd = loopThru(cn);
                if(nd) return nd;
            }
            return false;
        }

        found.forEach(sbl => {
            const node = sbl.scope;

            // TODO:
            // if(!node || loopThru(node))
            // {
                origin.push(sbl);
            // }
        });

        if(origin.length == 0)
        {
            return null;
        }else{
            if(origin.length > 1)
            {
                console.warn(`WARN: Found multiple accessibles of ${key} in one scope`)
            }
            return origin[0];
        }
    }

    initSymbol(key, node, scope)
    {
        const found = this.getSymbolDeep(key, scope);
        if(found)
        {
            found.key = key;
            found.node = node;
            found.scope = scope;

            console.log(`WARN: Symbol ${key} has been reinitalized in the same scope`)
        }else{
            // node.batch = `${key}_bvar_${Math.round(Math.random()*3)}`
            node.batch = `${key}`

            const s = new Symbol();
            s.key = key;
            s.node = node;
            s.scope = scope;

            this.symbols.push(s);
        }
    }
}

class Symbol
{
    key = "";
    /**
     * @type {Node}
     */
    node;
    /**
     * @type {Node}
     */
    scope = null;
}

module.exports = ComposingScope;