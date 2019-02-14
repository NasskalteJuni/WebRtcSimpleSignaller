module.exports = {
    // as long as this is not running fluently, please describe verbosely
    verbose: true,
    // we really do not need any mock state that carries over from one test to another
    // instead of calling clearMocks on every test, just always do it by default
    "clearMocks": true,
    // to check for test mode
    "globals":{
        "__DEV__": true
    },
    "globalSetup": "./jest.setup.js",
    // use only these file types! Avoid others or put them in here
    "moduleFileExtensions": [
        'js',
        'json'
    ],
    "testPathIgnorePatterns": [
        '/node_modules/',
        '/dist/',
        '/tmp/',
        '/build/',
        '/docs/',
        '/example'
    ],
    "testRegex": "/tests/.*\.js$",
};