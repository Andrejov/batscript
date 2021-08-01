const DecomposerScope = require("./DecomposerScope");
const Node = require("./Node");
const NodeType = Node.NodeType;
const rstream = require("./rstream");
const v8 = require('v8');

class Decomposer
{
    // traceLevel = [];
    // trace(text)
    // {
    //     const msg = `${
    //         [...this.traceLevel].reverse().join('/')
    //     }: ${text}`;
    //     console.log(msg);
    // }
    // traceEnter(node)
    // {
    //     this.traceLevel.unshift(node);
    // }
    // traceExit()
    // {
    //     this.traceLevel.shift();
    // }
    // nodeFromStringLog(string)
    // {
        
    // }

    static dclean(string)
    {
        return string.split(';').join('').trim();
    }

    static niceNodes(nodeOriginal)
    {
        // let node = JSON.parse(JSON.stringify(nodeOriginal));
        let node = v8.deserialize(v8.serialize(nodeOriginal));

        Object.keys(node).forEach(k => {
            const v = node[k];

            if(v)
            {
                if(v.type)
                {
                   node[k] = this.niceNodes(v);
                   return;
                }else if(Array.isArray(v))
                {
                    if(v.length) 
                    {
                        v.forEach((e,ind) => {
                            if(e.type)
                            {
                                v[ind] = this.niceNodes(e);
                            }
                        })

                        return;
                    }
                }else{
                    if(JSON.stringify(v) != "{}") return;
                }
            }

            delete node[k];
        }, this)

        return node;
    }

    static verifyName(string)
    {
        const regex = /^[a-z0-9_]+$/i
        return regex.test(string);
    }
    static verifyBrackets(string, scope)
    {
        const br = new rstream(string);
        
        br.setBlock();
        const brackets = [...br.blockChars];
        br.unsetBlock();

        brackets.forEach(bracket => {
            br.reset();
            const c1 = br.splitAll(bracket.open, true).split.length - 1;
            br.reset();
            const c2 = br.splitAll(bracket.close, true).split.length - 1;

            if(c1 != c2)
            {
                scope.warn(`Bracket pair ${bracket.open}${bracket.close} mismatch: ${c1} != ${c2}`);
            }
        })
    }

    static nodesFromString(string, scope)
    {
        if(!scope)
        {
            scope = new DecomposerScope(string);
        }


    }

    static nodeFromString(string, scope)
    {
        if(!scope)
        {
            scope = new DecomposerScope(string);
        }

        scope.treeNestCount += 1;

        const result = this.nodeFromStringRaw(string,scope);

        // console.log(' '.repeat(scope.treeNestCount) + ' ->' + result.type);

        scope.treeNestCount -= 1;

        return result;
    }

    /**
     * 
     * @param {string} string 
     * @returns {Node}
     */
    static nodeFromStringRaw(string, scope)
    {
        if(!scope)
        {
            scope = new DecomposerScope(string);
        }

        scope.update(string);
        this.verifyBrackets(string, scope);

        // console.log('.'.repeat(scope.treeNestCount) + string);

        const node = new Node();

        // possibilities:
        // .declare; .return; .raw; .join; .sub; eval

        //Clean encapsuling brackets ()
        while(true)
        {
            const brs = new rstream(string);
            const r = brs.rawRead() + brs.rawReadReverse();

            if(r == '()')
            {
                string = string.substring(1, string.length - 1).trim();
            }else{
                break;
            }
        }

        if(
            (string.startsWith('"') && string.endsWith('"')) ||
            (string.startsWith("'") && string.endsWith("'"))
        ){
            return this.rawFromString(string, scope);
        }else if(!isNaN(+string))
        {
            return this.rawFromString(string, scope);
        }

        if(['void','function','abstract'].some(i => string.startsWith(i+" ")))
        {
            return this.funcsFromString(string, scope);
        }else 
        if(string.startsWith('var '))
        {
            return this.declareFromString(string, scope);
        }else if(string.startsWith('return '))
        {
            return this.returnFromString(string, scope);
        }else{
            // Check for operators
            // const bs = new rstream(string);
            // bs.setBlock();
            
            // const opdef = bs.splitAll('=');

            // if(opdef.splitMin.length > 1)
            // {
            // }

            const operator = this.joinFromString(string, scope);

            if(operator)
            {
                return operator;
            }

            // Later if no operator structure
            const s = new rstream(string);
            const fbr = s.readTill('(');

            if(fbr.found)
            {
                const subs = ['if','while','exec']

                if(subs.indexOf(fbr.readMinClean)+1)
                {
                    return this.subFromString(string, scope);
                }else{
                    return this.evalFromString(string, scope);
                }
            }else{
                return this.evalFromString(string, scope);
            }
        }

        scope.throw(`Could not parse node type`);
    }

    static funcsFromString(string, scope)
    {
        const node = new Node('func');

        const s = new rstream(string);

        if(!string.trim().length)
        {
            return [];
        }

        const fdef = s.read('(', ' ');

        const obligatoryfmod = ['void', 'function'];
        const optionalfmod = ['abstract'];
        const oofmod = [...obligatoryfmod, ...optionalfmod];

        const fname = fdef.splitMinClean.pop();
        const fmods = fdef.splitMinClean;

        if(!fdef.found)
        {
            scope.throw('Could not find ( opening f params');
        }

        if(!fname)
        {
            scope.throw('Error parsing function')
        }
        
        if(!fmods.every(m => oofmod.indexOf(m)+1))
        {
            scope.throw(`Unknown function modifier in ${fmods}`)
        }
        
        if(!fmods.some(m => obligatoryfmod.indexOf(m)+1))
        {
            scope.throw(`Functions must be specified as either void or function`)
        }

        node.func = fname;
        node.void = fmods.some(m => m == "void");
        node.abstract = fmods.some(m => m == "abstract");

        const pdef = s.setString(fdef.left).read(')', ',');

        if(!pdef.found)
        {
            scope.throw('Could not find ) closing f params');
        }

        node.input = pdef.splitMinClean;

        const frntdef = s.setString(pdef.left).readTill('{');
        var empty = this.dclean(frntdef.readMin);

        if(empty)
        {
            scope.throw(`Unknown statement before { ${empty}`);
        }

        s.setBlock();

        const enddef = s.setString(frntdef.left).readTill('}');
        // var empty = this.dclean(enddef.left);

        // if(empty)
        // {
        //     scope.throw(`Unknown statement after } '${empty}'`)
        // }

        // console.log(enddef);
        
        // console.log(':'.repeat(scope.treeNestCount) + node.func)

        node.block = this.blockFromString(enddef.readMinClean, scope);

        const following = this.funcsFromString(enddef.leftClean, scope);

        return [node, ...following];
    }

    static blockFromString(string, scope)
    {
        const node = new Node('block');

        const s = rstream.from(string);
        s.setBlock();
        // s.blockChars = {
        //     open: '(',
        //     close: ')'
        // }

        const plit = s.splitAll([';', '\n', '\r']);

        node.contents = [];

        const lines = plit.splitMin.map((line, index) => {
            const noMin = plit.split[index];

            if(noMin.trim().startsWith('//'))
            {
                return '';
            }
            return line.trim();
        }).filter(line => line.trim().length);

        // Special case for headless brackets
        const joined = [];
        lines.forEach((line, li, la) => {
            if(line.startsWith("{") & line.endsWith("}") && li > 0)
            {
                joined[joined.length - 1] += ` ${la[li]}`;
            }else{
                joined.push(line);
            }
        })

        // console.log(joined);

        joined.forEach(line => {
            node.contents.push(
                this.nodeFromString(line, scope)
            );
        });

        return node;
    }

    static rawFromString(string, scope)
    {
        const node = new Node('raw');

        const clean = string.trim();
        const nan = +clean;

        if(isNaN(nan))
        {
            const ca = clean.split('');
            if(ca[0] == ca[ca.length - 1] && ['"', "'"].includes(ca[0]))
            {
                node.value = clean.substring(1, clean.length - 1);
            }else{
                scope.throw(`Could not parse raw value from '${clean}'`);
            }
        }else{
            node.value = nan;
        }

        return node;
    }

    static declareFromString(string, scope)
    {
        const node = new Node('declare');
        
        if(!string.startsWith('var '))
        {
            scope.throw(`Invalid declare statement syntax '${string}'`);
        }

        node.loose = false;

        const s = new rstream(string.substr('var '.length)); // remove 'var '

        const namedef = s.readTill('=');

        if(!namedef.found)
        {
            scope.throw(`Could not find = in declaration statement`);
        }

        node.var = namedef.readMinClean;

        node.value = this.nodeFromString(namedef.leftClean, scope);

        return node;
    }

    static returnFromString(string, scope)
    {
        const node = new Node('return');

        if(!string.startsWith('return '))
        {
            scope.throw(`Invalid declare statement syntax '${string}'`);
        }

        const val = string.substr('return '.length).trim();

        node.value = this.nodeFromString(val, scope);

        return node;
    }

    static subFromString(string, scope)
    {
        const node = new Node('sub');

        const s = new rstream(string);

        const subdef = s.readTill('(');

        if(!subdef.found) scope.throw(`Could not find ( in sub statement`)

        node.sub = subdef.readMinClean;

        s.setBlock();

        const exprdef = s.read(')');

        if(!exprdef.found) scope.throw(`Could not find ) closing sub statement`)

        node.expression = this.nodeFromString(exprdef.readMinClean, scope);

        s.unsetBlock();

        // console.log(exprdef.left);

        const brdef = s.setString(exprdef.left).readTill('{');
        let bracket = true;

        // console.log(brdef);

        if(brdef.found)
        {
            if(brdef.readMinClean.length)
            {
                bracket = false;
            }
        }else{
            bracket = false;
        }
        
        if(bracket)
        {
            s.setBlock();

            const enddef = s.readTill('}');

            if(!enddef.found) scope.throw(`Could not find } closing sub block`);

            node.block = this.blockFromString(enddef.readMinClean, scope);
        }else{
            s.reset();
            s.setBlock();

            const rtedef = s.readTill('');

            node.block = this.blockFromString(rtedef.readMinClean, scope);
        }

        return node;
    }

    static joinFromString(string, scope)
    {
        const singleOperators = "+-*/&|=".split('');
        const doubleOperators = ['==', '>=', '<=', '&&', '||'];

        const that = this;

        function treatOperator(op)
        {
            const s = new rstream(string);
            s.setBlock();
            const o = new rstream(op);

            let nodeA = "";
            let nodeB = "";

            while(o.available())
            {
                const ndef = s.readTill(
                    o.rawReadReverse(),
                    true
                );

                if(ndef.found)
                {
                    nodeA += ndef.readMin;
                }else{
                    scope.throw(`Unknown operator parsing error`)
                }
            }

            nodeA = nodeA.trim();
            nodeB = s.read('','',false,true).readClean;

            const node = new Node('join');
            
            if(op != '=')
            {
                node.operator = op;
                node.nodeA = that.nodeFromString(nodeB, scope);
                node.nodeB = that.nodeFromString(nodeA, scope);
            }else{
                node.type = 'declare';
                node.loose = true;
                node.var = nodeB;
                node.value = that.nodeFromString(nodeA, scope);
            }

            return node;
        }

        /**
         * @param {string} op 
         */
        function tryDouble(op)
        {
            const bs = new rstream(string);
            bs.setBlock();

            const run1 = bs.readTill(op.charAt(1), true);

            if(!run1.found) return false;

            const run2 = bs.readTill(op.charAt(0), true);

            if(!run2.found || run2.readMin.length) return false;

            return op;
        }
        //kurwa zmienialem tu operatory na backwards i sie wyjebalo

        /**
         * @param {string} op 
         */
        function trySingle(op)
        {
            const bs = new rstream(string);
            bs.setBlock();

            const run = bs.readTill(op, true);

            if(!run.found) return false;

            return op;
        }

        function matchOperator(callback, array)
        {
            for(let op of array)
            {
                const output = callback(op);
                if(output)
                {
                    return output;
                }
            }
            return false;
        }

        const node = new Node('join');

        const double = matchOperator(tryDouble, doubleOperators);

        if(double)
        {
            return treatOperator(double);
        }

        const single = matchOperator(trySingle, singleOperators);

        if(single)
        {
            return treatOperator(single);
        }
        
        return false;
    }

    static evalFromString(string, scope)
    {
        const node = new Node('eval');

        if(string.endsWith(')'))
        {
            node.method = true;

            const s = new rstream(string);

            const fbrdef = s.readTill('(');

            if(!fbrdef.found) scope.throw(`Could not find ( opening eval statement`);
            if(!this.verifyName(fbrdef.readMinClean)) scope.throw(`Value '${fbrdef.readMinClean}' cannot be used as name`);

            s.setBlock();

            const paramdef = s.read(')', ',');

            if(!paramdef.found) scope.throw(`Could not find ) closing eval statement`);
            if(paramdef.leftClean) scope.throw(`Unexpected '${paramdef.leftClean}' after ) closing statement`)

            node.eval = fbrdef.readMinClean;

            if(paramdef.splitMin.length == 1 && !paramdef.splitMin[0].length)
            {
                node.params = [];
            }else{
                node.params = paramdef.splitMin.map(param => this.nodeFromString(param, scope));
            }
        }else{
            if(!this.verifyName(string)) scope.throw(`Value '${string}' cannot be used as name`);

            node.eval = string;
            node.method = false;
            node.params = [];
        }

        return node;
    }

    // static joinFromString(string)
    // {
    //     const node = new Node('join');

    //     const bs = new rstream(string);
    //     bs.setBlock();
    //     const opdef = bs.splitAll('=')

    //     if(opdef.splitMin.length > 1)
    //     {
    //         if(opdef.splitMin.length == 3 && opdef.splitMin[1] == '')
    //         {
    //             //==
    //             node.operator = "==";
            
    //             node.nodeA = this.nodeFromString(
    //                 opdef.readMinClean
    //             );
    //             node.nodeB = this.nodeFromString(
    //                 opdef.leftClean
    //             )
    
    //             return node;
    //         }else if(opdef.splitMin.length == 2)
    //         {
    //             const operator = opdef.readMin.substring(opdef.readMin.length - 1);

    //             const operators = [">", "<", ]
                
    //         }else{
    //             throw`Unknown join statement type`
    //         }
    //     }else{
    //         throw`It is not a join statement`
    //     }
    // }
}

module.exports = Decomposer;