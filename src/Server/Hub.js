const ws = require("ws");
const Listenable = require("../Utils/Listenable");
const Message = require("../Utils/Message");
const Context= require("./ServerContext");
const User = require("./User");
const Channel = require("./Channel");

/**
 * A hub is a special server that handles client connections and transfers the sent data.
 * It manages Channel and User instances and relates them in a ServerContext to the current socket connection and received messages
 * */
class Hub extends Listenable(){

    /**
     * Creates a new Hub that controls the server side of our signaller
     * @param {Object} [config] - an Object with properties to configure the Hub Server
     * @param {Server} [config.server=http.createServer()] - a node http server to use. If none is given, a new one will be instantiated
     * @param {int} [config.port=80] - the port the server will be running on. Defaults to the standard HTTP Port.
     */
    constructor({port=80, server}={}){
        super();
        this.socketServer = server ? new ws.Server({server}) : new ws.Server({port});
        this.socketServer.on('connection', socket => {
            socket.on('message', message => {
                message = new Message(Object.assign(JSON.parse(message),{forwarded: new Date()}));
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

    /**
     * Sends a message over the matching socket connection(s).
     * The Message must define the sender, receiver and channel, so that it can be transmitted accordingly.
     * How is a message sent by User A handled:
     * Receiver User B, Channel 1 -> sent to User B
     * Receiver All, Channel 1 -> sent to every User in Channel 1 except User A
     * Receiver User B, Channel All -> sent to User B
     * Receiver All, Channel All -> sent to every User in every Channel User A is part of, except to User A
     * @param {Message} message - the message to send
     * */
    send(message) {
        if(message.channel === Message.Addresses.ALL){
            if(message.receiver === Message.Addresses.ALL)
                Channel.byMember(message.from).forEach(channel => channel.users.forEach(user => this.sendToUser(user, message)));
            else
                this.sendToUser(message.receiver, message);
        }else{
            if(message.receiver === Message.Addresses.ALL)
                Channel.byId(channel.receiver).users.forEach(user => this.sendToUser(user, message));
            else
                this.sendToUser(message.receiver, message);
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