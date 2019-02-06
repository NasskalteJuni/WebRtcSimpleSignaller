const Signaller = require('./Client/ClientHandler');
const Hub = require('./Server/Hub');

module.exports = {
    Client: Signaller,
    Server: Hub
};