const { threadId } = require("worker_threads");
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
            // R A W
            this.native("raw", "%${0}%", ["raw"], true),
            this.native("env", "CALL SET ${r}=%%%${0}%%%", ['var'], true),

            // I/O
            this.native("echo", "ECHO %${0}%", ["val"], true),
            this.native("println", [
                'IF "%${0}%"=="" (',
                    'ECHO(',
                ') ELSE (',
                    'ECHO %${0}%',
                ')'
            ], ["val"], true),
            this.native("print", [
                '<NUL SET /P=%${0}%'
            ], ["val"], true),
            this.native("readline", [
                "SET ${r}=",
                "SET /P ${r}="
            ], [], true),
            this.native("pause", "PAUSE>NUL", [], true),
            this.native("settitle", "TITLE %${0}%", ["val"], true),
            this.native("setcolor", "COLOR %${0}%", ["clr"], true),

            // Basic commands
            this.native("start", "START %${0}%", ['args'], true),
            
            // File&dirs
            this.native("cd", "CD %${0}%", ['dir'], true),
            this.native("mkdir", "MD %${0}%", ['dir'], true),

            // Number operators
            this.native("add", "SET /A ${r}=${0}+${1}", ["a", "b"]),
            this.native("subtract", "SET /A ${r}=${0}-${1}", ["a", "b"]),
            this.native("multiply", "SET /A ${r}=${0}*${1}", ["a", "b"]),
            this.native("divide", "SET /A ${r}=${0}/${1}", ["a", "b"]),

            // String operators
            this.native("join", "SET ${r}=%${0}%%${1}%", ["str1", "str2"]),

            this.native("compare", [
                'SET ${r}=0',
                'IF "%${0}%"=="%${1}%" (',
                    'SET ${r}=1',
                ')'
            ], ["str1", "str2"]),
            this.native("comparenot", [
                'SET ${r}=1',
                'IF "%${0}%"=="%${1}%" (',
                    'SET ${r}=0',
                ')'
            ], ["str1", "str2"]),

            // Logic operators
            this.native("logicand", [
                'SET ${r}=0',
                'IF "%${0}%"=="1" (',
                    'IF "%${1}%"=="1" (',
                        'SET ${r}=1',
                    ')',
                ')'
            ], ["a","b"]),
            this.native("logicor", [
                'SET ${r}=0',
                'IF "%${0}%"=="1" (',
                    'SET ${r}=1',
                ')',
                'IF "%${1}%"=="1" (',
                    'SET ${r}=1',
                ')'
            ], ["a","b"])
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
                    case '&':
                        this.swapOp(n, "join");
                        break;
                    case '&&':
                        this.swapOp(n, "logicand");
                        break;
                    case '||':
                        this.swapOp(n, "logicor");
                        break;
                    case '==':
                        this.swapOp(n, "compare");
                        break;
                    case '!=':
                        this.swapOp(n, "comparenot");
                        break;
                }
            }
        })
    }
}

module.exports = Natives;