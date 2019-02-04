const Listenable = require("../Utils/Listenable.js");
const Message = require("../Utils/Message.js");
const WebSocket = require("ws");

class Signaller extends Listenable() {

    constructor(url) {
        super();
        if(url.indexOf("://") === -1) url = 'wss://' + url;
        url = url.replace(/^http/, 'ws');
        this.url = url;
        this.socket = new WebSocket(url);
        this.onopen = () => this.trigger('ready', this.socket);
        this.onerror = e => this.trigger('error', e);
        this.onmessage = e => this._messagehandler(new Message(JSON.parse(e.data)));
        this.channels = [];
        this.id = null;
        this.send = this.send.bind(this);
        this.send.server = (type, content) => this.send(new Message().withType(type).withContent(content).asServerMessage())
    }

    _messagehandler(message) {
        if (message.channel === Message.ALL) {
            this.channels.forEach(channel => channel._messagehandler(message));
        }else if(message.channel !== Message.NONE){
            const channel = this.channel(message.channel);
            if (channel) channel._messagehandler(message);
        }
        this.trigger(message.type, [message.content, message]);
    }

    /**
     * authenticate the socket connection
     * @param userId the user identifier
     * @param token a password or token to authenticate the user
     * @returns Promise resolves when the authentication was successful, fails when it was not successful or after 5 seconds
     * */
    async auth(userId, token) {
        const response = this.request('auth',{userId, token});
        if(response === "INVALID") throw new Error(response);
        return response;
    }

    /**
     * gives a list of channel names that one can join
     * @returns a list of all channel names that are not added to the Signallers channels and can be joined through join(id)
     * */
    async joinableChannels(){
        const channels = await this.request('channels', null);
        return channels.filter(channel => this.channels.indexOf(channel) === -1);
    }

    /**
     * joins the channel with the given id
     * @param name the id of the channel, obtainable by calling joinableChannels()
     * */
    async join(name){
        const channel = this.channel(name);
        if(channel) return;
        if("SUCCESS" !== await this.request('join', name)) throw new Error("INVALID");
        this.channels.push(new Channel(name, this));
    }

    /**
     * leaves a channel with the given id
     * @param name the id of a channel to leave. If you are not part of that channel, this will have no effect
     * */
    async leave(name){
        const channel = this.channel(name);
        if(!channel) return;
        if("SUCCESS" !== await this.request('leave', name)) throw new Error("INVALID");
        this.channels = this.channels.filter(c => c.name === name);
    }

    /**
     * creates a new channel and adds it to the joined channels
     * @param name the id of the channel
     * */
    async create(name){
        const channel = this.channel(name);
        if(channel) return;
        if("SUCCESS" !== await this.request('create', name)) throw new Error("INVALID");
        this.channels.push(channel);
    }

    /**
     * @param id the id of the channel
     * @returns Channel the channel with the id or null, if there is no such channel
     * */
    channel(id) {
        const i = this.channels.findIndex(channel => channel.id === id);
        return i >= 0 ? this.channels[i] : null;
    }

    request(type, content, maxtime=5000){
        return new Promise((resolve, reject) => {
            const authMessage = new Message().withType(type).withContent(content).asServerMessage();
            this.send(authMessage);
            const timeout = setTimeout(() => {
                clearTimeout(timeout);
                reject(new Error("TIMEOUT"));
            }, maxtime);
            const handler = response => {
                if(response.mid = authMessage._mid){
                    this.off(type, handler);
                    resolve(message.content);
                }
            };
            this.on(type, handler);
        });
    }

    send(message){
        if(arguments.length === 2){
            message = new Message({
                type: arguments[0],
                content: arguments[1]
            });
        }
        if(!message._from) message = message.withSender(this.id);
        this.socket.send(JSON.stringify(message));
    }

}

module.exports = Signaller;