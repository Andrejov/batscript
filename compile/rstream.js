class rstream
{
    static from(string)
    {
        const r = new rstream(string);

        return r;
    }

    source = "";
    raw = [];

    /**
     * @type {{open: string, close:string}[]}
     */
    blockChars = [];
    stringChars = ['"', "'"];

    stack = [];
    string = "";

    constructor(string)
    {
        this.setString(string);
    }

    trace(text)
    {
        //console.log(text);
    }

    setString(string)
    {
        this.source = string;
        this.raw = string.split('');
        return this;
    }

    setBlock(blockChars)
    {
        if(!blockChars)
        {
            blockChars = [
                {
                    open: '(', close: ')'
                },
                {
                    open: '{', close: '}'
                },
                {
                    open: '[', close: ']'
                }
            ];
        }
        this.blockChars = blockChars;
    }
    unsetBlock()
    {
        this.blockChars = [];
        this.stack = [];
    }
    clearStack()
    {
        this.stack = [];
    }

    reset()
    {
        this.setString(this.source);
        return this;
    }

    available()
    {
        return this.raw.length;
    }

    rawRead()
    {
        if(this.raw.length)
        {
            return this.raw.splice(0,1)[0];
        }else{
            return '';
        }
    }
    rawReadReverse()
    {
        if(this.raw.length)
        {
            return this.raw.splice(this.raw.length - 1, 1)[0];
        }else{
            return '';
        }
    }

    read(search, splitter, ignoreComma, reverse)
    {
        const that = this;
        const r = {
            found: false,

            read: "",
            readClean: "",
            readMin: "",
            readMinClean: "",
            left: "",
            leftClean: "",

            split: [],
            splitClean : [],
            
            splitMin: [],
            splitMinClean: [],

            countRead: 0,
            countLeft: 0,

            string: "",
            stack: [],

            parent: () => that,
            reset: function() {
                that.reset.bind(that);
                return this;
            },
            setString: function() {
                that.setString.bind(that);
                return this;
            },
        }
        let word = "";

        const splitters = Array.isArray(splitter) ? splitter : [splitter];

        while(true)
        {
            const rd = !reverse ? this.rawRead() : this.rawReadReverse();

            if(rd == '')
            {
                this.trace('Read finished: stream empty')
                break;
            }
            this.trace(`Read next char ${rd}`);

            if(!reverse)
            {
                r.read += rd;
            }else{
                r.read = rd + r.read;
            }

            const comma = (this.stringChars.indexOf(rd)+1 && this.string == "") ? rd : false;
            if(!ignoreComma && comma)
            {
                this.string = comma;
                this.trace(` Found comma char ${comma}`);
            }

            if(ignoreComma || this.string == "")
            {
                this.trace(` Outside a string`);

                const openFind = this.blockChars.find(b => (!reverse ? b.open : b.close) == rd)

                if(this.stack.length)
                {
                    this.trace(`  Inside a lvl ${this.stack.length} stack`);
                    if(rd == this.stack[0][!reverse ? 'close' : 'open'])
                    {
                        this.trace(`  Decremented stack to lvl ${this.stack.length}`);
                        this.stack.shift();
                    }

                    if(!reverse)
                    {
                        word += rd;
                    }else{
                        word = rd + word;
                    }
                }else if(openFind){
                    this.stack.unshift(openFind)
                    this.trace(`  Incremented stack to lvl ${this.stack.length}`);

                    if(!reverse)
                    {
                        word += rd;
                    }else{
                        word = rd + word;
                    }
                }else{
                    if(splitters.indexOf(rd)+1)
                    {
                        if(!reverse)
                        {
                            r.split.push(word);
                        }else{
                            r.split.unshift(word);
                        }
                        word = "";
                    }else{
                        if(!reverse)
                        {
                            word += rd;
                        }else{
                            word = rd + word;
                        }
                    }
    
                    if(rd == search)
                    {
                        r.found = true;
                        break;
                    }
                }

            }else if(!ignoreComma && !comma)
            {
                this.trace(` Inside a string`)
                if(rd == this.string)
                {
                    this.trace(`  Breaking out of the string`);
                    this.string = "";
                }
                
                if(!reverse)
                {
                    word += rd;
                }else{
                    word = rd + word;
                }
            }else{
                if(!reverse)
                {
                    word += rd;
                }else{
                    word = rd + word;
                }
            }
        }

        if(!reverse)
        {
            r.split.push(word);
        }else{
            r.split.unshift(word);
        }

        if(r.found)
        {
            r.splitMin = r.split.map((v,i) => {
                if(i == r.split.length - 1)
                {
                    if(!reverse)
                    {
                        return v.substring(0, v.length - 1);
                    }else{
                        return v.substr(1);
                    }
                }
                return v;
            });
        }else{
            r.splitMin = [...r.split];
        }

        r.splitClean = r.split.map(v => v.trim()).filter(v => v.length);
        r.splitMinClean = r.splitMin.map(v => v.trim()).filter(v => v.length);

        r.readClean = r.read.trim();
        r.readMin = r.found ? (!reverse ? r.read.substr(0, r.read.length - 1) 
                                : r.read.substring(1)) : r.read;
        r.readMinClean = r.readMin.trim();

        r.left = this.raw.join('');
        r.leftClean = r.left.trim();

        r.countLeft = this.raw.length;
        r.string = this.string;
        r.stack = this.stack;

        return r;
    }

    readTill(character, fromTheBack, ignoreComma)
    {
        return this.read(character, '', ignoreComma, fromTheBack);
    }
    splitAll(splitter, ignoreComma)
    {
        return this.read('', splitter, ignoreComma, false);
    }
}

module.exports = rstream;
