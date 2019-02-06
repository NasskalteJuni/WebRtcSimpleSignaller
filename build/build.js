const rollup = require('rollup');
const path = require('path');
const fs = require('fs');

const verbose = true;
const log = () => verbose ? console.log(...arguments) : false;

const config = require('./client');


fs.readdir(config.output.dir, (err, files) => {
    if (err) throw err;
    for (const file of files) fs.unlink(path.join(config.output.dir, file), err => err ? console.error(err) : false);
});

log('use config', config);


async function build() {

    const bundle = await rollup.rollup(config);
    log(bundle.watchFiles);
    await bundle.write(config.output);

}

try{
    build();
}catch(err){
    console.error(err);
}
