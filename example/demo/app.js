/**
 * Simple Demo - Lacks every check for missing parameters, etc. so DO ONLY USE AS LOCAL EXAMPLE (obviously)
 * */
const Hub = require("../../src/Server/Hub");
const Message = require("../../src/Utils/Message");
Object.assign(global, Message.Types);
const server = require("./SimpleServerExample")();  // Very simple test server
const hub = new Hub({server: server.http()});
const rand = () => Math.random().toString(32).substr(2);

// we do not have a database in this example, so everything will be kept simple and in memory
let users = [];
let channels = [];

const userById = id => {
    const i = users.findIndex(u=>u.id===id);
    return i >= 0 ? users[i] : null;
};

const channelById = id => {
    const i = channels.findIndex(c=>c.id===id);
    return i >= 0 ? channels[i] : null;
};

// handle user listing request over http (hub-external)
server.get("/users", (request, response) => {
    // return all authenticated users but only their id and name (obviously not the token)
    response.json(users.map(u => ({id: u.id, name: u.name})));
});


// handle user creation (our improvised login) over http (hub-external)
server.post("/user", (request, response) => {
    // create a user with the user data sent in the request body
    const created = {id: rand(), name: JSON.parse(request.body).name, token: rand()};
    // update the persisted users
    users.push(created);
    // we do not need to inform the hub about the new user, since hub users only exist,
    // once their socket connection has been authenticated
    // send the user its own data, so the id and the token can be used for further requests
    response.json(created);
});

// handle user removal (our improvised logout) over http (hub-external)
server.delete("/user", (request, response) => {
    // we extract the data of the user from the body
    const removed = request.json();
    // check if the users request is allowed
    const isValid = removed && removed.id && userById(removed.id) && removed.token && removed.token === userById(removed.id).token;
    if(isValid){
        // remove the user with the given id from your app logic
        users = users.filter(user => user.id === removed.id && user.token === removed.token);
        // make sure to inform the hub that this user is no longer valid
        hub.unauthenticate(removed.id);
    }
    response.statusCode = isValid ? 200 : 400;
    response.end();
});

// handle the channel listing request over http (hub-external)
server.get("/channels", (request, response) => {
    // return all joinable channels but with no additional info
    response.json(channels.map(c => ({id: c.id, name: c.name})));
});

// handle the channel creation over http (hub-external)
server.post("/channel", (request, response) => {
    // create a new channel based on the name in the request
    const created = {id: rand(), name: request.json().name, limit: 12, creator: request.json().user, users: []};
    // add it to your existing channels in your app logic
    channels.push(created);
    // inform the hub about the new channel
    hub.open(created.id);
    // send the user the data of the created channel
    response.json(created);
});

// handle the channel removal request over http (hub-external)
server.delete("/channel", (request, response) => {
    // get the user and channel of the request
    const i = users.findIndex(u => request.json().user === u.id);
    const j = channels.findIndex(c => request.json().channel === c.id);
    const user = i >= 0 ? users[i] : null;
    const channel = i >= 0 ? channels[j] : null;
    const isValid = user && channel && user.token === request.json().token && channel.creator === user.id;
    if(isValid){
        // inform the hub, that the channel should get closed
        hub.close(channel.id);
    }
    response.statusCode = isValid ? 200 : 400;
    response.end();
});

// enter a channel over http (hub-external)
server.post("/join", (request, response) => {
    // get the user and channel of the request
    const user = userById(request.json().user);
    const channel = channelById(request.json().channel);
    // check via any way http offers if the request is valid and authenticated
    const isValid = user && channel && user.token && user.token === request.json().token;
    // inform the hub that a new user should join the channel
    if(isValid) hub.join(user.id, channel.id);
    response.statusCode = isValid ? 200 : 400;
    response.end();
});

// leave a channel over http (hub-external)
server.post("/leave", (request, response) => {
    const user = userById(request.json().user);
    const channel = channelById(request.json().channel);
    const isValid = user && channel && user.token && user.token === request.json().token;
    if(isValid) hub.leave(user.id, channel.id);
    response.statusCode = isValid ? 200 : 400;
    response.end();
});

// since the wss protocol (or tls) will guarantee, that the messages are not tempered with
// or that someone man in the middle attacks
// there is no way of proofing that the sender in the message is indeed the sender,
// except when we authenticate the socket connection
// This can be done by challenging the unauthenticated socket client to send a tuple of user-id and auth-token.
// auth token can be a session token or something similar, as long as it is hard to guess
// and unique for this user. (in this example, the token is just a random string patched as token to the user object)
hub.on(AUTH, ({authenticate, content, failAuthentication}) => {
    // get the user from your application logic by the id that was sent over the socket connection
    const user = userById(content.id);
    // when you got the user and the token matches - authenticate the user
    const isValid = user && user.token === content.token;
    if(isValid) authenticate();
    else failAuthentication();
});


hub.on(DEAUTH, ({deauthenticate, socket}) => {
    // we have nothing to do on deauth.
    // Deauthentication of a socket does not nesessary mean, that the user is logged out,
    // just that its socket connection is invalid or disconnected...
    // just for example, we will inform everyone, that the user is not part of the active users currently and close the socket
    deauthenticate();
    socket.close();
});

// handle user joins over socket (hub-internal)
hub.on(JOIN, ({join}) => {
    // you have to call the join function manually, so that you can implement your logic around it
    join();
});

// handle user leave over socket (hub-internal)
hub.on(LEAVE, ({leave}) => {
    // you have to call the leave function manually, so that you can implement your logic around it
    leave();
});

// handle channel creation over socket (hub-internal)
hub.on(OPEN, ({open}) => {
    // create for your channel logic
    const channel = {id: rand(), name: content.name, limit: content.limit || 12, creator: user, users: []};
    channels.push(channel);
    // inform the hub that a channel with this id exists now
    open(channel.id);
});

// handle channel closing over socket (hub-internal)
hub.on(CLOSE, ({close, channel}) => {
    // remove from your channel logic
    channels = channels.filter(c => c.id === channel.id);
    // inform the hub that the the channel does not exist any more
    close(channel);
});

// start up the http server
server.start();