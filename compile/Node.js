const Symbol = require("./Symbol")

class Node
{
    /** @type{NodeType} */
    type;

    // Func
    func = ""
    void = false;
    abstract = false;
    /** @type{string[]} */
    input = [];
     //block = block;

    // Block
    /** @type{Node[]} */
    contents = [];
    /** @type{Object<string,Symbol>} */
    symbols = {};

    // Sub
    /** @type{Node} */
    sub = ""; // exec,if,while
    expression;

    // Sub && func
    /** @type{Node} */
    block;

    // Eval
    eval = "";
    /** @type{Node[]} */
    params = [];
    method = false;

    // Join
    /** @type{Node} */
    nodeA;
    /** @type{Node} */
    nodeB;
    operator = "";

    // Declare
    var = "";
    loose = false; // loose: a = b; not loose: var a = b
     //value = value;

    // Return
     //value = value

    // Declare && raw && return
    /** @type{Node | string} */
    value;

    // Assign
    // eval -> assign
    /** @type{Node[]} */
    assignSrc = [];
    /** @type{string[]} */
    assignDest = [];
    /** @type{Node[]} */
    assignContents = [];

    // Native
    nativeString = [];
    nativeParams = [];

    // Variable
    // declare -> var


    // Compiler setting to check if object is used in code
    attached = false;
    // Compiler setting containing generated name
    batch = "";

    /**
     * 
     * @param {NodeType} type 
     */
    constructor(type)
    {
        this.type = type;
    }
}

/**
 * 
 * @readonly
 * @enum {string}
 */
const NodeType = {

    func: "func", // <abstr> [void|func]([p]) {<code>};  eg function x() {};

    block: "block", // block of code, array of things below

    sub: "sub", // if,while(<expr>) {<code>}  eg  if(a) { x(); }

    eval: "eval", // <fname>([p])    eg x(3.14);
    join: "join", // <A> <operator> <B>  eg  a == b
    declare: "declare", // var <name>[= <value>];   eg var abc = 1;
    raw: "raw", // <value>   eg 3    eg 1.2   eg ";D"

    return: "return", // return;

    assign: "assign", // compiler type
    var: "var", // compiler type; only for symbols

    native: "native" // native functions; eg echo
}

module.exports = Node;
module.exports.NodeType = NodeType;