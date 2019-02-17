const Listenable = require("../Utils/Listenable");
const Message = require("../Utils/Message");
const Channel = require("./ChannelHandler");

/**
 * A handler for every incoming message to this client.
 * Offers common actions a client performs (like opening channels, joining them, etc.)
 * @mixes Listenable
 * */
class ClientHandler extends Listenable() {

    /**
     * create a new client endpoint to communicate with the server and to interact with the application
     * */
    constructor(url) {
        super();
        if(url.indexOf("://") === -1) url = 'wss://' + url;
        url = url.replace(/^http/, 'ws');
        this._socket = new WebSocket(url);
        this.onopen = () => this.trigger(Message.Types.CONNECT);
        this.onclose = () => this.trigger(Message.Types.DISCONNECT);
        this.onerror = e => console.error(e);
        this.onmessage = e => this._messagehandler(new Message(JSON.parse(e.data)));
        this._channels = [];
        this._id = null;
    }

    /**
     * get every channel this user is a member of
     * @readonly
     * @returns{ReadonlyArray} for every channel a handler that offers channel functionality
     * */
    get channels(){
        return Object.freeze(this._channels);
    }

    set channels(v){
        throw new TypeError("cannot set property channels (readonly)");
    }

    /**
     * get the id of this client (the one, you use on the server as identifier and )
     * @readonly
     * @returns {string} the id of this client or null, if the client is not authenticated
     * */
    get id(){
        return this._id;
    }

    set id(v){
        throw new TypeError("cannot set property id (readonly)");
    }

    _messagehandler(message) {
        if (message.channel === Message.Addresses.ALL) {
            this._channels
                .filter(c => c.member(message.sender))
                .forEach(channel => channel._messagehandler(message));
        }else{
            const channel = this.channel(message.channel);
            if (channel) channel._messagehandler(message);
        }
        this.trigger(message.type, [message.content, message]);
    }

    /**
     * authenticate the socket connection
     * @param {string} id - the user identifier
     * @param {string} token -  a password or token to authenticate the user
     * @returns {Promise} - resolves when the authentication was successful, fails when it was not successful or after 5 seconds
     * */
    async auth(id, token) {
        const response = await this.request('auth',{id, token});
        if(response.success) this._id = id;
        else throw new Error(response.error || "INVALID");
        return response;
    }

    /**
     * joins the channel with the given id
     * @param {string} name - the id of the channel, obtainable by calling joinableChannels()
     * @returns {Promise} resolves upon completion, but rejects on invalid (denied on server side) join requests
     * */
    async join(name){
        const channel = this.channel(name);
        if(channel) return;
        const response = await this.request('join', name);
        if(!response.success) throw new Error(response.error || "INVALID");
        this._channels.push(new Channel(name, this));
    }

    /**
     * leaves a channel with the given id
     * @param {string} name - the id of a channel to leave. If you are not part of that channel, this will have no effect
     * @returns {Promise} resolves, when channel was left, rejects when the channel could not be left on server
     * */
    async leave(name){
        const channel = this.channel(name);
        if(!channel) return;
        const response = await this.request('leave', name);
        if(!response.success) throw new Error(response.error || "INVALID");
        this._channels = this._channels.filter(c => c.name === name);
    }

    /**
     * creates a new channel and adds it to the joined channels
     * @param {string} name - the id of the channel
     * @returns {Promise} resolves upon completion but rejects if the channel could not be created on the server
     * */
    async create(name){
        const channel = this.channel(name);
        if(channel) return;
        const response = await this.request('create', name);
        if(!response.success) throw new Error(response.error || "INVALID");
        this._channels.push(channel);
    }

    /**
     * @param {string} id - the id of the channel
     * @returns {Channel} the channel with the id or null, if there is no such channel
     * */
    channel(id) {
        const i = this._channels.findIndex(channel => channel.id === id);
        return i >= 0 ? this._channels[i] : null;
    }

    /**
     * make a request to the server and abort, if the response takes too long
     * @param {string} type - the request type
     * @param {*} content - the request content
     * @param {int} [maxtime=5000] - after how many milliseconds will a response be extremely unlikely (timeout)
     * @return {Promise} resolves with the response messages content or fails with a "TIMEOUT" error, when the server response takes too long
     * */
    request(type, content, maxtime=5000){
        return new Promise((resolve, reject) => {
            const msg = new Message().withType(type).withContent(content).withSender(this._id).withReceiver(Message.Addresses.SERVER);
            this.send(msg);
            const timeout = setTimeout(() => {
                clearTimeout(timeout);
                reject(new Error("TIMEOUT"));
            }, maxtime);
            const handler = (content, response) => {
                if(response.answered === msg.id){
                    this.off(type, handler);
                    resolve(content);
                }
            };
            this.on(type, handler);
        });
    }

    /**
     * Send a message by type and content to the server
     * @param {string} type - the message type
     * @param {*} content - the content of the message
     * *//**
     * Send a given message object to its receiver
     * @param {Message} message - the message to send. If the message has no sender, this.id will be set
     * */
    send(message){
        if(arguments.length === 2){
            message = new Message({
                type: arguments[0],
                content: arguments[1],
            });
        }
        if(!message.sender) message = message.withSender(this._id);
        if(!message.channel) message = message.withChannel(Message.Addresses.ALL);
        if(!message.receiver) message = message.withReceiver(Message.Addresses.ALL);
        this._socket.send(JSON.stringify(message.asDataObject()));
    }

}

module.exports = ClientHandler;