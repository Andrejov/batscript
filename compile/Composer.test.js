const Decomposer = require("./Decomposer");
const Recomposer = require('./Recomposer');
const Composer = require('./Composer');

// console.log(Decomposer.funcFromString(
//     "abstract void abc(x1, x2 ) {   echo(string('xD',2),1);\nprint(\"lolz\") }; "
// ))

function t(text)
{
    const d = Decomposer.nodeFromString(text.trim());
    // const r = Recomposer.build(d);
    const c = Composer.compose(d);

    // console.log(JSON.stringify(Decomposer.niceNodes(d), null, 4));
    // console.log(c);
    return c;
}

// t(`function xD(a) { if(a == 1) { return a; } }`)

const fs = require('fs');
const contents = fs.readFileSync('D:\\Programming\\batscript\\test.bats').toString();

const out = t(contents);
// t("2 + (1 + 1)")
// t("1 + 2 + 3");

fs.writeFileSync(`D:\\Programming\\batscript\\output.bat`, out)

// console.log("XDs")