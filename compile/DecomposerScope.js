class DecomposerScope
{
    source = "";

    scopeStack = [];
    scope = "";
    scopeIndex = 0;

    treeNestCount = 0;

    constructor(source)
    {
        this.setSource(source);
    }
    setSource(source)
    {
        this.source = source;
        this.scope = this.source;
        this.scopeIndex = 0;
        this.scopeStack = [];
    }

    update(scope)
    {
        const index = this.scope.indexOf(scope);

        if(index == -1)
        {
            this.revert();
            // this.update(scope);
        }else{
            this.scopeStack.unshift(
                {
                    scope: this.scope,
                    index
                }
            )
            this.scope = scope;
            this.scopeIndex += index;
        }
    }
    revert()
    {
        if(this.scopeStack.length == 0)
        {
            // throw `Scope indexer error`
        }else{
            const stack = this.scopeStack.shift();

            this.scopeIndex -= stack.index;
            this.scope = stack.scope;
        }
    }

    indexToLine(index)
    {
        if(!index) index = this.scopeIndex;

        const lines = this.source.split('\r\n');
        let ln = 1;
        lines.every(line => {
            index -= line.length;

            if(index <= 0)
            {
                return false;
            }else{
                ln += 1;
                return true;
            }
        })
        return ln;
    }
    
    format(text)
    {
        return text.split('	').join(' ').split('\r\n').join('  ').split(' ').filter(e => e.length).join(' ')
    }

    throw(err)
    {
        throw `${this.indexToLine()}: ${
            this.format(err)
        }`;
    }
    warn(err)
    {
        console.log(`WARN:${this.indexToLine()}: ${this.format(err)}`)
    }
}

module.exports = DecomposerScope;