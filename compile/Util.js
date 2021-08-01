const Node = require('./Node');

class Util
{

    /**
     * @param {Node} node 
     * @param {(n: Node, parent: Node) => void} callback
     */
    static forNode(node, callback)
    {
        if(!node) return;

        // callback(node);

        node.contents.forEach(n => {
            callback(n, node);
            this.forNode(n, callback);
        });
        node.assignContents.forEach(n => {
            callback(n, node);
            this.forNode(n, callback);
        });
        if(node.expression)
        {
            callback(node.expression, node);
            this.forNode(node.expression, callback);
        }
        if(node.block)
        {
            callback(node.block, node);
            this.forNode(node.block, callback);
        }
        if(node.nodeA)
        {
            callback(node.nodeA, node);
            this.forNode(node.nodeA, callback);
        }
        if(node.nodeB)
        {
            callback(node.nodeB, node);
            this.forNode(node.nodeB, callback);
        }
        node.params.forEach(n => {
            callback(n, node);
            this.forNode(n, callback);
        });
        node.assignSrc.forEach(n => {
            callback(n, node);
            this.forNode(n, callback);
        });
        if(node.type != 'raw' && node.value)
        {
            callback(node.value, node);
            this.forNode(node.value, callback);
        }
    } 
}

module.exports = Util;