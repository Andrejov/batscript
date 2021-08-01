const rstream = require("./rstream");

const eval = (val) => {
    console.log(val);
    return val;
}

const clean = (val) => {
    
}

const test = (val1, val2) => {
    if(eval(val1) == eval(val2))
    {
        console.log("v PASS");
    }else{
        console.log("x FAIL");
    }
}

const wrap = (str) => {
    return new rstream(str);
}

function t(string)
{
    const bs = new rstream(string);
    // bs.blockChars = {
    //     open: '(', close: ')'
    // }
    bs.setBlock();

    const opdef = bs.readTill("{")

    return eval(opdef);

    // const opdef = bs.splitAll('=');

    // return eval(opdef.splitMin);
}

t("  { abc }")

// t("a == b");
// t("a <= b")
// t(" Array.push(a >= b)  != Object[x == y]  ");

// const s = new rstream("void nazwa(param1, param2) { xd(); };");

// const r1 = s.read(' ', '', false, false);
// eval(r1);

// const r2 = s.setString(r1.left).readTill('(');
// eval(r2);

// const r3 = s.setString(r2.left).read(')', ',');
// eval(r3);

// const r4 = s.setString(r3.left).readTill("{");
// eval(r4);

// const r5 = s.setString(r4.left).readTill("}", true);
// eval(r5);

// const func = {
//     type: r1.readMinClean,
//     name: r2.readMinClean,
//     paramArray: r3.splitMinClean,
//     contents: r5.leftClean
// }
// eval(func);


// const s = new rstream("testowo 'xD stringol' xDXD");

// const sr = s.read('', ' ', false, false);

// eval(sr);

// const x = new rstream(s.source);
// const xr = x.read('', ' ', false, true);

// eval(xr);