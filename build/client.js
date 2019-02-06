const path = require('path');
const resolve = require('rollup-plugin-node-resolve');
const babel = require('rollup-plugin-babel');
const commonjs = require('rollup-plugin-commonjs');


module.exports = {
    input: path.join(__dirname,'..','src','Client','ClientHandler.js'),
    output: {
        format: 'iife',
        dir: path.join(__dirname,'..','dist'),
        name: 'Client',
        //file: 'client.js',
        sourcemap: true,
    },
    plugins: [
        resolve({
            jsnext: true,
            main: true,
            browser: true,
        }),
        commonjs(),
        babel({
            exclude: 'node_modules/**'
        })
    ]
};