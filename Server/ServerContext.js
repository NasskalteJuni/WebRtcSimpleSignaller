const Message = require('../Utils/Message');
const Channel = require('./Channel');
const User = require('./User');

/**
 * Handles message context
 * */
class ServerContext{

    /**
     * create a new message receiving context, which has properties and methods to send the message
     * */
    constructor({hub, message, socket}={}){
        this._hub = hub;
        this._message = message;
        this._socket = socket;
    }

    /**
     * @readonly
     * @returns {Hub} the hub
     * */
    get hub(){
        return this._hub;
    }

    /**
     * @readonly
     * @returns {Message} the received message
     * */
    get message(){
        return this._message;
    }

    /**
     * @readonly
     * @returns {*} shorthand for the messages content or null, if there was no message
     * */
    get content(){
        return this.message !== null ? this.message.content : null;
    }

    /**
     * @readonly
     * @returns {WebSocket} the socket that received the message
     * */
    get socket(){
        return this._socket;
    }

    /**
     * @readonly
     * @returns {User} the user that sent the message over his socket connection
     * or null, if the socket connection has not been authenticated (therefore, we cannot say, which user it really is)
     * */
    get user(){
        return User.bySocket(this.socket);
    }

    /**
     * @readonly
     * @returns {Channel} the channel of this message or null
     * */
    get channel(){
        return Channel.byId(this.message.channel);
    }

    /**
     * @readonly
     * @returns {Array} an array of channels that the user who sent the message over its connection is part of
     * (which is empty, if the connection is not authenticated and there is no user, obviously)
     * */
    get channelsOfUser(){
        return this.user !== null ? this.user.channels : [];
    }

    /**
     * @readonly
     * @returns {boolean} if the connection used was authenticated (then, there will be a user)
     * */
    get isAuthenticated(){
        return this.user !== null;
    }

    /**
     * @readonly
     * @returns {boolean} if the sender of the message equals the authenticated user
     * (connection not authenticated ->  false)
     * */
    get senderEqualsAuthenticatedUser(){
        return !!this.user && this.message.sender === this.user.id;
    }

    /**
     * Message Class
     * @readonly
     * @returns {Message} the Message Class of the server context
     * */
    get Message(){
        return Message;
    }

    /*defaults to contexts message*/
    _messageFromArgs(argsArray){
        const i = Array.from(arguments).findIndex(arg => arg instanceof Message);
        return i >= 0 ? arguments[i] : this.message;
    }

    /*number of args that are no message*/
    _argumentsLengthWithoutMessage(argsArray){
        return Array.from(argsArray).filter(arg => !(arg instanceof Message)).length;
    }

    /**
     * authenticates the user and adds it to the managed user list
     * @param {string} [id=this.user.id] the id that the newly authenticated user should have. You could use a user of your app for this
     * @param {WebSocket} [socket=this.socket] the socket that belongs to this id. This defaults to the current socket
     * @returns {boolean} true, if a new user was added or if the given id was already authenticated
     * */
    authenticate(id, socket=undefined){
        const user = this.user || new User(id, socket === undefined ? this.socket : socket);
        return User.authenticate(user);
    }

    /**
     * removes a user from the authenticated users
     * @param {string} [user=this.user] the user to unauthenticate
     * @returns {boolean} true, if the user was authenticated already and is now is not authenticated any more
     * */
    unauthenticate(user=undefined){
        user = id === undefined ? this.user : user;
        return this.hub.unauthenticate(user);
    }


    /**
     * the user with the id
     * @param {string} id the id of the user
     * @returns {Object} the user object or null
     * */
    userById(id){
        return User.byId(id);
    }

    /**
     * the channel with the id
     * @param {string} id the id of a channel
     * @returns {Object} the channel object or null
     * */
    channelById(id){
        return Channel.byId(id);
    }

    /**
     * let a user join a channel
     * @param {string | Object} channel the channel or its id to join. defaults to the messages channel. Always the first argument
     * @param {string | Object} user the user or its id that should join the given channel. defaults to the current user
     * @returns {boolean} true, if the user was NOT already part of that channel
     * */
    join(channel=undefined, user=undefined){
        channel = channel === undefined ? this.channel : channel;
        user = user ===  undefined ? this.user : user;
        return this.hub.join(user, channel);
    }

    /**
     * let a user leave a channel
     * @param {string | Channel} channel the channel or its id to leave. defaults to the current messages channel. Always the first argument
     * @param {string | User} user the user or its id to leave the given channel. defaults to the current user
     * @return {boolean} true, if the user was part of that channel
     * */
    leave(channel=undefined, user=undefined){
        channel = channel === undefined ? this.channel : channel;
        user = channel === undefined ? this.user : user;
        return this.hub.leave(user, channel)
    }

    /**
     * Opens a new Channel (and creates it in the process)
     * @param {string | Channel} channel the channel or its id to be opened. Without parameter, the current channel is used
     * @return {boolean} successful
     * */
    open(channel=undefined) {
        return this.hub.open(channel === undefined ? this.channel : channel);
    }

    /**
     * Closes a Channel and inform everyone about it
     * @param {string | Channel} [channel=this.channel] the channel to be closed. Without parameter, the current channel is used
     * @returns {boolean} successful
     * */
    close(channel=undefined){
        return this.hub.close(channel === undefined ? this.channel : channel);
    }

    /**
     * Uses the current context to answer the user that sent the current request (or any kind of message)
     * @param {string} [type=this.message.type] the type of the message. Defaults to the received message type
     * @param {*} [content=this.message.content] the content of the response. if called with one argument, the given argument is seen as content
     * @param {Message} [message=this.message] the message to use. Defaults to the current message. Always the last parameter
     * */
    reply(type, content, message=undefined){
        message = this._messageFromArgs(arguments);
        if(this._argumentsLengthWithoutMessage(arguments) === 2) message = message.withType(type);
        if(this._argumentsLengthWithoutMessage(arguments) > 0) message = message.withContent(arguments[this._argumentsLengthWithoutMessage(arguments)-1]);
        let reply = this.message.withType(type).withContent(content).withReceiver(message.from).asServerMessage();
        this.hub.sendOverSocket(this.socket, reply);
    }


    /**
     * Uses the current context to just send the message. The message is handed down like described, without doing anything else
     * @param {Message} [message=this.message] the message that should be send. defaults to the received message
     * */
    send(message=undefined){
        this.hub.send(message === undefined ? this.message : message);
    }
}

module.exports = ServerContext;