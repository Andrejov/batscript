const Node = require('./Node');

class Recomposer
{
    static pretty = true;
    static prettyIndent = "    ";

    /**
     * @param {Node} node 
     */
    static build(node)
    {
        if(Array.isArray(node))
        {
            return node.map(n => this.build(n)).join('\r\n\r\n');
        }

        switch(node.type)
        {
            case 'raw':
                return isNaN(+node.value) ? `'${node.value}'` : node.value;
            case 'func':
                return `${
                    node.abstract ? 'abstract ' : ''
                }${
                    node.void ? 'void ' : 'function '
                }${
                    node.func
                }(${
                    node.input.join(', ')
                }) {${
                    this.pretty ? '\r\n' : ' '
                }${
                    this.pretty ? this.prettyIndent + this.build(node.block).split('\r\n').join(`\r\n${this.prettyIndent}`) : this.build(node.block)
                }${
                    this.pretty ? '\r\n' : ' '
                }}`;
            case 'block':
                const joiner = this.pretty ? ';\r\n' : '; ';
                return node.contents.map(line => this.build(line)).join(joiner) + '; ';
            case 'sub':
                return `${node.sub}(${
                    node.expression ? this.build(node.expression) : ''
                }) {${
                    this.pretty ? '\r\n' : ' '
                }${
                    this.pretty ? this.prettyIndent + this.build(node.block).split('\r\n').join(`\r\n${this.prettyIndent}`) : this.build(node.block)
                }${
                    this.pretty ? '\r\n' : ' '
                }}`;
            case 'eval':
                return `${node.eval}` + (node.method ? `(${
                    node.params.map(param => this.build(param)).join(', ')
                })` : '');
            case 'join':
                const encaps = (n) => {
                    return (n.type != 'join') ? `${this.build(n)}` : `(${this.build(n)})`
                }

                return `${
                    encaps(node.nodeA)
                } ${node.operator} ${
                    encaps(node.nodeB)
                }`;
            case 'declare':
                return `var ${node.var} = ${this.build(node.value)}`;
            case 'return':
                return `return ${this.build(node.value)}`;
            case 'assign':
                let out = "";
                node.assignSrc.forEach((src, i) => {
                    const dest = node.assignDest[i];

                    out += `var ${dest} = ${this.build(src)};${this.pretty ? '\r\n' : ' '}`;
                })

                const j = this.pretty ? ';\r\n' : '; ';
                out += node.assignContents.map(line => this.build(line)).join(j) + '; ';
                return `[${out}]`;
            case 'var':
                return `CVAR_${node.var}`
            case 'native':
                return `NTV_'${node.nativeString.join(';;')}'`
            default:
                throw `Unknown node type ${node.type}`;
        }
    }
}

module.exports = Recomposer;