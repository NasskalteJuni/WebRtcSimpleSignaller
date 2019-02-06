const path = require('path');

module.exports = {
    input: path.join(__dirname,'..','src','Server','Hub.js'),
    output: {
        format: 'cjs',
        dir: path.join('..','dist'),
        name: 'Hub',
        //file: 'server.js'
    }
};