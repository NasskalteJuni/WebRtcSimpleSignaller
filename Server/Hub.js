const ws = require("ws");
const Listenable = require("../Utils/Listenable");
const Message = require("../Utils/Message");
const Context= require("./ServerContext");
const User = require("./User");
const Channel = require("./Channel");
const TYPES = require("../Utils/Types");

class Hub extends Listenable(){

    /**
     * Creates a new Hub that controls the server side of our signaller
     * @param {Object} config an Object that may has the following properties
     *  - {HttpServer} [new HttpServer()] server -  optional node http(s) server to be used as a basis for the web socket connection.
     *  - {Integer} [80] port - port number used, when no server was passed, default port 80
     *  - {Function} [() => true] authentication function - function that checks auth requests. Receives id and token as parameter, then the socket
     *  - {Boolean} [true] allowChannelManipulationOverSocket - defines, if clients should be able to call create and close methods
     *  - {Boolean} [false] autoCreateChannelOnJoin - when a client tries to join a not-existing channels, it is created
     *  - {Boolean} [false] autoCloseChannelOnEmpty - when the last client leaves the channel, it will be closed
     *  - {Boolean} [true] allowGlobalBroadcast - if set to true, Messages to all Channels (channel: Message.ALL) are forwarded to every channel the user is part of
     * */
    constructor(config){
        super();
        this.socketServer = ws.Server({port});
        this.socketServer.on('connection', socket => {
            socket.on('message', message => {
                message = new Message(JSON.parse(message));
                const hub = this;
                const context = new Context({message, socket, hub});
                this.trigger(message.type, context);
                this.trigger('message', context);
            });

            socket.on('close', () => {
                const user = User.bySocket(socket);
                if(user){
                    const type = TYPES.DISCONNECT;
                    const hub = this;
                    const message = new Message({type, content: user}).withSender(user.id);
                    const context = new Context({message, socket, hub});
                    this.trigger(type, context);
                }
            });

            socket.on('error', err => {
                const user = User.bySocket(socket);
                if(user){
                    const type = TYPES.ERROR;
                    const hub = this;
                    const message = new Message({type, content: err}).withSender(user.id);
                    this.trigger(type, new Context({message, socket, hub}));
                }
            });
        });
    }

    send(message) {
        if(message.channel === Message.Addresses.ALL){
            if(message.to === Message.Addresses.ALL)
                Channel.byMember(message.from).forEach(channel => channel.users.forEach(user => this.sendToUser(user, message)));
            else
                this.sendToUser(message.to, message);
        }else{
            if(message.to === Message.Addresses.ALL)
                Channel.byId(channel.to).users.forEach(user => this.sendToUser(user, message));
            else
                this.sendToUser(message.to, message);
        }
    }

    /**
     * Send a message to a given User
     * @param {string | User} user the user or its id
     * @param {Message} message the message to send
     * */
    sendToUser(user, message){
        user = typeof User === "string" ? User.byId(id) : user;
        this.sendOverSocket(user.socket, message);
    }

    /**
     * Send a message over a given socket
     * @param {WebSocket} socket the socket to use
     * @param {Message} message the message to send
     * */
    sendOverSocket(socket, message){
        socket.send(JSON.stringify(message))
    }

    //--- make the user and channel core functions available on the hub

    /**
     * user should join a channel and inform the clients
     * @param {string | User} user the user that should join the channel
     * @param {string | Channel} channel the channel that should be joined
     * */
    join(user, channel){
        user = typeof user === "string" ? User.byId(user) : user;
        channel = typeof channel === "string" ? Channel.byId(channel) : channel;
        const m = new Message().withSender(Message.Types.SERVER).withChannel(channel.id);
        this.send(m.withType(Message.Types.JOIN).withContent(user.id).withReceiver(Message.Addresses.ALL));
        this.send(m.withType(Message.Types.CHANNEL).withContent(channel.members).withReceiver(user.id));
        return user.join(channel);
    }

    /**
     * user should leave the channel and inform the clients
     * @param {string | User} user the user to leave
     * @param {string | Channel} channel the channel to leave
     * */
    leave(user, channel){
        user = typeof user === "string" ? User.byId(user) : user;
        channel = typeof channel === "string" ? Channel.byId(channel) : channel;
        this.send(new Message({type: Message.Types.LEAVE, content: user.id, receiver: Message.Addresses.ALL, channel: channel.id, sender: Message.Addresses.SERVER}));
        return user.leave(channel);
    }

    /**
     * a channel should be opened and everyone should be informed about this
     * @param {string | Channel} channel the channel or its id to be opened
     * */
    open(channel){
        const t = Channel.open(channel);
        this.send(new Message().withType(Message.Types.OPEN).withContent(channel.id).withReceiver(Message.Addresses.ALL).withChannel(channel.id).withSender(Message.Addresses.SERVER));
        return t;
    }

    /**
     * a channel should be closed and the members should be informed about this
     * @param {string | Channel} channel the channel to close
     * */
    close(channel){
        this.send(new Message({type: Message.Types.CLOSE, content: channel.id, receiver: Message.Addresses.ALL, sender: Message.Addresses.SERVER}));
        return Channel.close(channel);
    }

    /**
     * unauthenticates a user and informs its client about this
     * @param {string | User} user the user to unauthenticate
     * */
    unauthenticate(user){
        user = typeof User === "string" ? User.byId(user) : user;
        user.channels.forEach(channel => this.leave(user, channel));
        this.send(new Message({type: Message.Types.DEAUTH, receiver: user.id, channel: Message.Addresses.ALL, sender: Message.Addresses.SERVER}));
        return User.unauthenticate(user);
    }

}


module.exports = Hub;