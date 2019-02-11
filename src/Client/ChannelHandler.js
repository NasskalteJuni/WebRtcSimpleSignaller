const Listenable = require("../Utils/Listenable");
const Message = require("../Utils/Message");
const Member = require("./MemberHandler");

/**
 * A Channel is a set of 1 or more Members, that can send and receive direct and broadcast messages between each other.
 * The Channel takes care of Member count, etc. by sending and receiving control messages to the server, that stores this state.
 * The Listenable-Mixin is used to trigger on('type', (content, msg) => ...) event handlers for messages that are sent by other clients
 * or for updates to the members of the channel
 * */
class ChannelHandler extends Listenable(){

    constructor(id, client){
        super();
        this.id = id;
        this.client = client;
        this.members = [];
        this.on(Message.Types.CHANNEL, list => this.members = list.map(m => new Member(m, this.id)));
        this.on(Message.Types.JOIN, m => this.members.push(new Member(m, this.id)));
        this.on(Message.Types.LEAVE, m => this.members = this.members.filter(member => member.id !== m));
    }

    _messagehandler(message) {
        const member = this.member(message._receiver);
        if (member) member._messagehandler(message);
        this.trigger(message.type, [message.content, message]);
    }

    /**
     * @param {string} id the id of the member of this channel to search for
     * @returns Member with the given id or null, if no member with such id is present
     * */
    member(id){
        const i = this.members.findIndex(member => member.id === id);
        return i >= 0 ? this.members[i] : null;
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
        if(!message.receiver) message = message.withReceiver(Message.ALL);
        if(!message.channel) message = message.withChannel(this.id);
        this.client.send(message);
    };
}

module.exports = ChannelHandler;