const Listenable = require("../Utils/Listenable.js");
const Message = require("../Utils/Message.js");

/**
 * A handler for incoming messages sent by a specific user or for sending messages to that specific
 * @implements Listenable
 * */
class MemberHandler extends Listenable(){

    /**
     * Creates a new Handler for incoming messages sent by the given user id
     * @param {string} id the User id of the sender
     * @param {ChannelHandler} channel the superordinate channel handler, of which this member is part of
     * */
    constructor(id, channel){
        super();
        this._id = id;
        this._channel = channel;
    }

    /**
     * get the member id
     * @readonly
     * @returns {string} the id of this Member
     * */
    get id(){
        return this._id;
    }

    /**
     * get the channel Object
     * @readonly
     * @return {ChannelHandler} the channel that this member is part of
     * */
    get channel(){
        return this._channel;
    }

    /**
     * Send a message in this channel to this specific channel member with the given type and content
     * @param {string} type the type of the message
     * @param {*} content the content of the message
     * *//**
     * Sends the given message. If there is no receiver given, it will be added (sender and channel may also be added, but not overwritten)
     * @param {Message} message the message to send
     */
    send(message){
        if(arguments.length === 2){
            message = new Message({
                type: arguments[0],
                content: arguments[1]
            });
        }
        if(!message.receiver) message = message.withReceiver(this._id);
        this._channel.send(message);
    }

    _messagehandler(message){
        if(message.sender === this._id || message.sender === Message.Addresses.ALL)
            this.trigger(message.type, [message.content, message]);
    }

}

module.exports = MemberHandler;