const ComposingScope = require("./ComposingScope");
const Node = require("./Node");
const v8 = require('v8');
const Decomposer = require("./Decomposer");
const Natives = require("./Natives");
const Util = require("./Util");

class Composer
{
    static randomInc = -1;
    static random()
    {
        this.randomInc ++;
        return `_${this.randomInc.toString().padStart(4, '0')}_`;
    }

    /**
     * 
     * @param {Node[]} nodes 
     * @param {ComposingScope} scope 
     */
    static compose(nodes, scope)
    {
        if(!scope)
        {
            scope = new ComposingScope();
        }

        const natives = Natives.generateNativeFunctions();

        nodes = [...nodes, ...natives];

        const main = nodes.find(n => n.type == 'func' && n.func == 'main');

        if(!main)
        {
            throw `Could not find main statement`;
        }

        const globals = nodes.filter(n => n.func != 'main');

        // Init global symbols

        nodes.forEach(func => {
            func.batch = this.random() + func.func;

            scope.initSymbol(func.func, func, null);
        })

        // Destruct main eval
        const startpoint = new Node('eval');
        startpoint.eval = "main";
        startpoint.params = [];
        startpoint.method = true;

        let tree = this.assign(startpoint, scope, null);

        let found = true;
        let callStack = 0;
        while(found)
        {
            Natives.applyNatives(tree);

            found = false;
            callStack += 1;
            
            const assignCandidates = [];

            Util.forNode(tree, (n, parent) => {
                if(n.type == 'eval')
                {
                    found = true;
                    // this.assign(n, scope, parent);
                    assignCandidates.push({
                        n,
                        parent
                    })
                }
            })

            assignCandidates.forEach(c => {
                this.assign(c.n, scope, c.parent);
            })

            console.log("+")

            if(callStack > 100)
            {
                throw `Maximum compilation stack exceeded: note that recursion is not supported`
            }
        }

        console.log(JSON.stringify(Decomposer.niceNodes(tree), null, 4));

        // console.log(Recomposer.build(tree));

        // Util.forNode(tree, (n, parent) => {
        //     if(n.type == 'var')
        //     {
        //         n.batch = `${this.random()}***${n.var}`
        //     }
        // })
        // Util.forNode(tree, (n, parent) => {
        //     if(n.type == 'declare')
        //     {
        //         const sbl = scope.getSymbolDeep(n.var, parent);
        //         if(!sbl)
        //         {
        //             throw `Could not register batchnames`
        //         }
        //         console.log(n.var);
                
        //         n.batch = sbl.node.batch;
        //     }
        // })
        Util.forNode(tree, n => {
            if(n.var)
            {
                n.batch = n.var
            }
        })

        scope.pushLine("@ECHO OFF")

        this.build(tree, scope);



        // Util.forNode(main, n => {
        //     if(n.type == 'declare')
        //     {
        //         n.batch = this.random() + n.var;
        //     }
        // });

        // nodes.forEach(n => this.destruct(n, scope));

        // this.pick(main, scope);

        return [
            ...scope.initializers,
            ...scope.output
        ].join('\r\n');
    }

    /**
     * @param {Node} node
     * @returns {Node} 
     */
    static cloneNode(node)
    {
        // const n = new Node();
        // const c = JSON.parse(JSON.stringify(node));
        // Object.assign(n, c);
        // return n;
        return v8.deserialize(v8.serialize(node));
    }

    /**
     * @param {Node} evl 
     * @param {ComposingScope} scope 
     * @param {Node} parent
     */
    static assign(evl, scope, parent)
    {
        if(evl.type != 'eval') throw `Bad type for assign procedure`

        const symbol = scope.getSymbolDeep(evl.eval, parent);

        if(!symbol)
        {
            throw `Could not find matching declaration for '${evl.eval}'`
        }else if(symbol.node.type != (evl.method ? 'func' : 'var'))
        {
            throw `Eval ${evl.eval}${evl.method ? '(...)' : ''} does not match required type ${evl.method ? 'func' : 'var'}`;
        }

        if(!evl.method)
        {
            const vnode = new Node('var')
            vnode.var = evl.eval

            Object.assign(evl, vnode);
            
            return evl;
        }else{
            const node = new Node('assign');
            const func = this.cloneNode(symbol.node);

            const fmod = `__${func.func}_${this.random()}__`;

            node.assignSrc = evl.params.map(p => {
                // if(p.type == 'eval')
                // {
                //     return this.assign(p, scope, parent);
                // }else{
                    return p;
                // }
            });
            
            const oinput = func.input;
            const ninput = oinput.map(p => fmod + p);

            node.assignDest = ninput;

            function replaceInp(src)
            {
                const iof = oinput.indexOf(src);
                if(iof > -1)
                {
                    return ninput[iof];
                }else{
                    return src;
                }
            }

            Util.forNode(func, n => {
                if(n.type == 'eval')
                {
                    n.eval = replaceInp(n.eval);
                }else if(n.type == 'var')
                {
                    n.var = replaceInp(n.var);
                }else if(n.type == 'native')
                {
                    n.nativeParams = n.nativeParams.map(p => replaceInp(p));
                }
            })

            ninput.forEach(key => {
                const vn = new Node('var')
                vn.var = key;
                scope.initSymbol(key, vn, evl)
            })

            const baseReturn = Decomposer.nodeFromStringRaw("return 0", null);

            func.block.contents.push(baseReturn)

            node.assignContents = func.block.contents.map(c => {
                // if(c.type == 'eval')
                // {
                //     return this.assign(c, scope, node);
                // }else{
                    return c;
                // }
            });

            node.assignContents.forEach(dn => {
                if(dn.type == 'declare' && !dn.loose)
                {
                    const vn = new Node('var');
                    vn.var = dn.var;
                    scope.initSymbol(dn.var, vn, evl);
                }
            })

            Object.assign(evl, node);

            return evl;
        }
    }

    // /**
    //  * 
    //  * @param {Node} node 
    //  * @param {ComposingScope} scope 
    //  */
    // static func(node, scope)
    // {
        
    // }

    /**
     * 
     * @param {Node} node 
     * @param {ComposingScope} scope 
     */
    static build(node, scope)
    {
        console.log(`Building ${node.type}`)
        if(!this[`build${node.type}`])
        {
            console.log(`ERR: ${node.type} not implemented`)
        }
        return this[`build${node.type}`](node, scope);
    }

    /**
     * 
     * @param {Node} node 
     * @param {ComposingScope} scope 
     */
    static buildnative(node, scope)
    {
        //this.native("add", "SET /A ${r}=${a}+${b}", ["a", "b"])
        const retvar = `__ret_ntv_${this.random()}`;

        node.nativeString.forEach(line => {
            const rpbox = '___$$^_/'
            const rpbase = line.split('${').join(rpbox);

            let replaced = rpbase.split(`${rpbox}r}`).join(retvar);
            node.nativeParams.forEach((v,i) => {
                replaced = replaced.split(`${rpbox}${i}}`).join(`${v}`)
            })

            scope.pushLine(replaced);
        });

        return `%${retvar}%`
    }

    /**
     * 
     * @param {Node} node 
     * @param {ComposingScope} scope 
     */
    static buildraw(node, scope)
    {
        return node.value;
    }

    /**
     * 
     * @param {Node} node 
     * @param {ComposingScope} scope 
     */
    static buildvar(node, scope)
    {
        return `%${node.batch}%`;
    }

    /**
     * 
     * @param {Node} node 
     * @param {ComposingScope} scope 
     */
    static builddeclare(node, scope)
    {
        scope.pushLine(`SET "${node.batch}=${this.build(node.value, scope)}"`)
    }

    /**
     * 
     * @param {Node} node 
     * @param {ComposingScope} scope 
     */
    static buildassign(node, scope)
    {
        scope.pushLine(`REM Assign begin ${node.batch}`)

        const retstr = `__ret_${this.random()}`;
        const gotostr = `__gret_${this.random()}`;

        scope.pushLine(`SET ${retstr}=`);
        
        node.assignSrc.forEach((param, idx) => {
            const name = node.assignDest[idx];
            const sbl = scope.getSymbolDeep(name, node);

            scope.pushLine(`SET "${sbl.node.batch}=${this.build(param, scope)}"`);
        })

        node.assignContents.forEach(line => {
            if(line.type == 'return')
            {
                scope.pushLine(`SET "${retstr}=${this.build(line.value, scope)}"`)
                scope.pushLine(`GOTO ${gotostr}`);
            }else{
                this.build(line, scope);
            }
        })

        scope.pushLine(`:${gotostr}`)

        scope.pushLine(`REM Assign end`)

        return `%${retstr}%`;
    }
    
    /**
     * 
     * @param {Node} node 
     * @param {ComposingScope} scope 
     */
    static buildsub(node, scope)
    {
        if(node.sub == "if")
        {
            const exprstr = `__expr_${this.random()}`;
            const endstr = `__ifend_${this.random()}`;

            scope.pushLine(`SET "${exprstr}=${this.build(node.expression, scope)}"`);

            scope.pushLine(`IF \"%${exprstr}%\"==\"1\" (`)
            scope.pushLine(`REM IF_FILLER_STATEMENT`)
            scope.pushLine(`) ELSE (`);
            scope.pushLine(`GOTO ${endstr}`);
            scope.pushLine(`)`);

            this.build(node.block, scope);

            scope.pushLine(`:${endstr}`);
        }else if(node.sub == "while"){
            const exprstr = `__expr_${this.random()}`;
            const startstr = `__whilestart_${this.random()}`;
            const endstr = `__whileend_${this.random()}`;

            scope.pushLine(`:${startstr}`);

            scope.pushLine(`SET "${exprstr}=${this.build(node.expression, scope)}"`);

            scope.pushLine(`IF \"%${exprstr}%\"==\"1\" (`)
            scope.pushLine(`REM WHILE_FILLER_STATEMENT`)
            scope.pushLine(`) ELSE (`);
            scope.pushLine(`GOTO ${endstr}`);
            scope.pushLine(`)`);

            this.build(node.block, scope);

            scope.pushLine(`GOTO ${startstr}`);
            scope.pushLine(`:${endstr}`)
        }else{
            throw `Unsupported sub ${node.sub}`;
        }
    }

    /**
     * 
     * @param {Node} node 
     * @param {ComposingScope} scope 
     */
    static buildblock(node, scope)
    {
        node.contents.forEach(line => {
            this.build(line, scope);
        });
    }
}

module.exports = Composer