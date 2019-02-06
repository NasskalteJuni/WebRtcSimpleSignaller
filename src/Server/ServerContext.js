const Message = require('../Utils/Message');
const Channel = require('./Channel');
const User = require('./User');

/**
 * A Context Object produced by the Hub that handles message context.
 * It is intended to be based on a received message on the server and offers functionality to handle the received message accordingly.
 * This can be a reply to the given message, offering the user that sent the message as property and other utility functions,
 * like allowing a call to join(channelId) to let the user join the given Channel.
 * */
class ServerContext{

    /**
     * create a new message receiving context, which has properties and methods to handle & send the message
     * @private
     * @param {Object} context - context data of the hub
     * @param {Hub} context.hub - the Hub that received the message
     * @param {Message} context.message - the message that was received
     * @param {WebSocket} context.socket - the WebSocket on which the message was received
     * */
    constructor({hub, message, socket}={}){
        this._hub = hub;
        this._message = message;
        this._socket = socket;
    }

    /**
     * @readonly
     * @returns {Hub} the current Hub instance
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
     * a property that references the User instance on the Server which sent this message
     * @readonly
     * @returns {User} the user that sent the message over his socket connection
     * or null, if the socket connection has not been authenticated (therefore, we cannot say, which user it really is)
     * */
    get user(){
        return User.bySocket(this.socket);
    }

    /**
     * a property that references the Channel instance on the Server in which this message was sent
     * @readonly
     * @returns {Channel} the channel of this message or null
     * */
    get channel(){
        return Channel.byId(this.message.channel);
    }

    /**
     * every channel that the user who sent the message is a member of
     * @readonly
     * @returns {Array} an array of channels that the user who sent the message over its connection is part of
     * (which is empty, if the connection is not authenticated and there is no user, obviously)
     * */
    get channelsOfUser(){
        return this.user !== null ? this.user.channels : [];
    }

    /**
     * is the socket connection authenticated and does belong to a user?
     * @readonly
     * @returns {boolean} if the connection used was authenticated (then, there will be a user)
     * */
    get isAuthenticated(){
        return this.user !== null;
    }

    /**
     * is the sender field in the message equal to the actual User id on the server
     * (You may have use cases, where a user sends messages in the name of another user,
     * but most of the time, this can be used as a check for forged messages with invalid sender id)
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
     * (this will update the clients, who will also remove the user as member of any channels the user is part of)
     * @param {string} [user=this.user] the user to un-authenticate
     * @returns {boolean} true, if the user was authenticated already and is now is not authenticated any more
     * */
    unauthenticate(user=undefined){
        user = id === undefined ? this.user : user;
        return this.hub.unauthenticate(user);
    }


    /**
     * get the User instance with the given id
     * @param {string} id the id of the user
     * @returns {Object} the user object or null
     * */
    userById(id){
        return User.byId(id);
    }

    /**
     * get the channel instance with the given id
     * @param {string} id the id of a channel
     * @returns {Object} the channel object or null
     * */
    channelById(id){
        return Channel.byId(id);
    }

    /**
     * let a user join a channel and inform the clients
     * (who will then add the user to their local channel instance)
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
     * let a user leave a channel and inform the clients
     * (who will then remove the user from their local channel instance)
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
     * Open a new Channel (and create it in the process)
     * @param {string | Channel} channel the channel or its id to be opened. Without parameter, the current channel is used
     * @return {boolean} successful
     * */
    open(channel=undefined) {
        return this.hub.open(channel === undefined ? this.channel : channel);
    }

    /**
     * Close a Channel and inform everyone about it
     * @param {string | Channel} [channel=this.channel] the channel to be closed. Without parameter, the current channel is used
     * @returns {boolean} successful
     * */
    close(channel=undefined){
        return this.hub.close(channel === undefined ? this.channel : channel);
    }

    /**
     * Use the current context to answer the user that sent the current message, but with a manipulated message
     * @param {Message} message - the message to use in the answer (might come in handy, if other message fields should be manipulated beforehand)
     * *//**
     * Use the current content context to answer the current message but with the given type and content
     * @param {string} type - the type of the answer Message
     * @param {*} content - the content of the answer Message
     *//**
     * Use the current context to answer the message with different content
     * @param {*} content - the content to use in the answer
     */
    reply(type, content, message=undefined){
        message = this._messageFromArgs(arguments);
        if(this._argumentsLengthWithoutMessage(arguments) === 2) message = message.withType(type);
        if(this._argumentsLengthWithoutMessage(arguments) > 0) message = message.withContent(arguments[this._argumentsLengthWithoutMessage(arguments)-1]);
        let reply = this.message.withType(type).withContent(content).withReceiver(message.sender).withSender(Message.Addresses.SERVER)
        this.hub.sendOverSocket(this.socket, reply);
    }


    /**
     * Uses the current context to just send the message. The message is handed down like described, without doing anything else
     * @param {Message} [message=this.message] - the message that should be send. defaults to the received message
     * (this will be effectively forwarding the received message)
     * */
    send(message=undefined){
        this.hub.send(message === undefined ? this.message : message);
    }
}

module.exports = ServerContext;