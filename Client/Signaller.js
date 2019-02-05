const Listenable = require("../Utils/Listenable");
const Message = require("../Utils/Message");
const Channel = require("./Channel");
const WebSocket = require("ws");

class Signaller extends Listenable() {

    constructor(url) {
        super();
        if(url.indexOf("://") === -1) url = 'wss://' + url;
        url = url.replace(/^http/, 'ws');
        this.socket = new WebSocket(url);
        this.onopen = () => this.trigger(Message.Types.CONNECT);
        this.onclose = () => this.trigger(Message.Types.DISCONNECT);
        this.onerror = e => console.error(e);
        this.onmessage = e => this._messagehandler(new Message(JSON.parse(e.data)));
        this.channels = [];
        this.id = null;
    }

    _messagehandler(message) {
        if (message.channel === Message.ALL) {
            this.channels.forEach(channel => channel._messagehandler(message));
        }else{
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
        const response = this.request('auth',{id, token});
        if(response === "INVALID") throw new Error(response);
        return response;
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
            const msg = new Message().withType(type).withContent(content).withSender(this.id).withReceiver(Message.Addresses.SERVER);
            this.send(msg);
            const timeout = setTimeout(() => {
                clearTimeout(timeout);
                reject(new Error("TIMEOUT"));
            }, maxtime);
            const handler = response => {
                if(response.ansered = msg._mid){
                    this.off(type, handler);
                    resolve(response.content);
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