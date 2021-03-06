const Listenable = require("../Utils/Listenable");
const Message = require("../Utils/Message");
const Member = require("./MemberHandler");

/**
 * A Channel is a set of 1 or more Members, that can send and receive direct and broadcast messages between each other.
 * The Channel takes care of Member count, etc. by sending and receiving control messages to the server, that stores this state.
 * The Listenable-Mixin is used to trigger on('type', (content, msg) => ...) event handlers for messages that are sent by other clients
 * or for updates to the members of the channel
 * @mixes Listenable
 * */
class ChannelHandler extends Listenable(){

    constructor(id, client){
        super();
        this._id = id;
        this._client = client;
        this._members = [];
        this.on(Message.Types.CHANNEL, list => this._members = list.map(m => new Member(m, this._id)));
        this.on(Message.Types.JOIN, m => this._members.push(new Member(m, this._id)));
        this.on(Message.Types.LEAVE, m => this._members = this._members.filter(member => member.id !== m));
    }

    /**
     * every member of the given channel
     * @readonly
     * @returns {ReadonlyArray} list of MemberHandlers
     * */
    get members(){
        return Object.freeze(this._members);
    }

    set members(v){
        throw new TypeError("cannot set property members (readonly)");
    }

    /**
     * get this channels id
     * @readonly
     * @returns {string} the channel id
     * */
    get id(){
        return this._id;
    }

    set id(v){
        throw new TypeError("cannot set property id (readonly)");
    }

    /**
     * get the superordinate client handler of this channel
     * @readonly
     * @returns {Client} the superordinate client handler
     * */
    get client(){
        return this._client;
    }

    set client(v){
        throw new TypeError("cannot set property client (readonly)");
    }

    _messagehandler(message) {
        const member = this.member(message.sender);
        if (member) member._messagehandler(message);
        this.trigger(message.type, [message.content, message]);
    }

    /**
     * @param {string} id the id of the member of this channel to search for
     * @returns {Member} with the given id or null, if no member with such id is present
     * */
    member(id){
        const i = this._members.findIndex(member => member.id === id);
        return i >= 0 ? this._members[i] : null;
    }

    /**
     * Send messages to everyone in this channel
     * send.broadcast same as send, triggers also on every member
     * send.halting only triggers on channel, but none of the members
     * @param {Message} message a message object
     * */
    send(message){
        if(arguments.length === 2){
            message = new Message({
                type: arguments[0],
                content: arguments[1]
            });
        }
        if(!message.receiver) message = message.withReceiver(Message.Addresses.ALL);
        if(!message.channel) message = message.withChannel(this._id);
        this._client.send(message);
    };
}

module.exports = ChannelHandler;