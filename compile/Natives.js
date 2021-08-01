const Node = require("./Node");
const Util = require("./Util.js");

class Natives
{
    static nativeNode(string, params)
    {
        const n = new Node('native');
        n.nativeString = string;
        n.nativeParams = params;

        return n;
    }

    static native(name, string, params, normalName)
    {
        const func = new Node('func');
        func.func = `${normalName ? '' : '__native_'}${name}`;
        func.input = params;
        func.block = new Node('block');

        const ret = new Node('return');

        if(Array.isArray(string))
        {
            ret.value = this.nativeNode(string, params);
        }else{
            ret.value = this.nativeNode([string], params)
        }
        func.block.contents = [
            ret
        ];

        return func;
    }

    static generateNativeFunctions()
    {
        return [
            this.native("echo", "ECHO %${0}%", ["val"], true),
            this.native("add", "SET /A ${r}=${0}+${1}", ["a", "b"]),
            this.native("subtract", "SET /A ${r}=${0}-${1}", ["a", "b"]),
            this.native("multiply", "SET /A ${r}=${0}*${1}", ["a", "b"]),
            this.native("divide", "SET /A ${r}=${0}/${1}", ["a", "b"])
        ];
    }

    static natives = this.generateNativeFunctions();

    static swapOp(srcNode, destNative)
    {
        const evl = new Node('eval');
        evl.eval = `__native_${destNative}`;
        evl.params = [
            srcNode.nodeA,
            srcNode.nodeB
        ]
        evl.method = true;

        Object.assign(srcNode, evl);
    }

    static applyNatives(treeNode)
    {
        Util.forNode(treeNode, n => {
            if(n.type == "join")
            {
                switch(n.operator)
                {
                    case '+':
                        this.swapOp(n, "add");
                        break;
                    case '-':
                        this.swapOp(n, "subtract");
                        break;
                    case '*':
                        this.swapOp(n, "multiply");
                        break;
                    case '/':
                        this.swapOp(n, "divide");
                        break;
                }
            }
        })
    }
}

module.exports = Natives;