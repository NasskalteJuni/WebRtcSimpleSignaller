/**
 * Immutable Message Class that defines a 'protocol' or 'format' on how the signaller handles messages
 * It is used to define, which type of content is sent to which member of which channel
 * */
class Message{

    /**
     * creates a new message based on an object with the properties  type, content, channel, to and from
     * [the properties of mid, sent and forwarded should not be passed in when you create a message via new, they will be generated for you]
     * */
    constructor({mid=Math.random().toString(32).substr(2), type, content, channel, to=undefined, from=undefined, sent=new Date(), forwarded=undefined, answered=undefined} = {}){
        let config = {};
        if(arguments[0]) config = arguments[0];
        this._mid = mid || config._mid;
        this._type = type || config._type;
        this._content = content || config._content;
        this._channel = channel || config._channel;
        this._to = to || config._to;
        this._from = from || config._from;
        this._sent = sent || config._sent;
        this._forwarded = forwarded || config._forwarded;
        this._server = config._server || false;
        this._answered = answered || config._answered;
    }

    /**
     * @readonly
     * message id - allows to identify a message or an answer (message, where another member exchanged the content (and maybe type) and sent it back)
     * */
    get mid(){
        return this._mid;
    }

    /**
     * @readonly
     * message type - identifies, which kind of content is being sent. A common example in WebRTC may be 'offer'
     * */
    get type(){
        return this._type;
    }

    /**
     * @readonly
     * content data - the raw data that you want to send to the client. Do not try to describe it in itself (type is the property for this).
     * Can be a JS-Object, Array or Whatever
     * */
    get content(){
        return this._content;
    }

    /**
     * @readonly
     * Channel id - the identifier for the channel in which the message is being sent.
     * */
    get channel(){
        return this._channel;
    }

    /**
     * @readonly
     * Member id - the receiving Member of this message
     * */
    get to(){
        return this._to;
    }

    /**
     * @readonly
     * Member id - the sending Member of this message
     * */
    get from(){
        return this._from;
    }

    /**
     * @readonly
     * Date / Timestamp - when was the message created and sent to the server. May be used to discard old messages on server
     * */
    get sent(){
        return this._sent;
    }

    /**
     * @readonly
     * Date / Timestamp - when was the message forwarded by the server.
     * */
    get forwarded(){
        return this._forwarded;
    }

    /**
     * @readonly
     * Boolean Flag - if true, this message will only be handled by the server and not be forwarded to other members (regardless of receiver and channel given)
     * */
    get server(){
        return this._server;
    }

    /**
     * @param {string} type the message type
     * @returns Message copy of message with the given type
     * */
    withType(type){
        const msg = new Message(this);
        msg._type = type;
        return msg;
    }

    /**
     * @param {string} id a Channel id
     * @returns Message copy of message with given Channel id
     * */
    withChannel(id){
        const msg = new Message(this);
        msg._channel = id;
        return msg;
    }

    /**
     * @param {string} id a Member id
     * @returns Message copy of message with given receiving Member id
     * */
    withReceiver(id){
        const msg = new Message(this);
        msg._to = id;
        return msg;
    }

    /**
     * @param {string} id a Member id
     * @returns Message copy of message with given sending Member id
     * */
    withSender(id){
        const msg = new Message(this);
        msg._from = id;
        return msg;
    }

    /**
     * @param {*} data any data payload of the message
     * @returns Message copy of message with given content data
     * */
    withContent(data){
        const msg = new Message(this);
        msg._content = data;
        return msg;
    }

    /**
     * creates a reply to this message, with the receiver as sender and vice versa, new sent date but same mid
     * @param {*} arguments[0] the content of this message
     * @param {string} [arguments[arguments.length-1]=this.type] the type of the message
     * @return Message a reply to the given message, with changed sent-Timestamp, content (and optional type) but same mid
     * */
    reply(){
        const msg = new Message(this);
        if(arguments.length === 1){
            msg._content = arguments[0];
        }else if(arguments.length === 2){
            msg._type = arguments;
            msg._content = arguments[1];
        }else{
            throw new Error("Invalid Argument number");
        }
        msg._sent = new Date();
        const tmp = msg._from;
        msg._from = msg._to;
        msg._to = tmp;
        msg._answered = this._mid;
        this._mid = Math.random().toString(32).substr(2);
        return msg;
    }

    /**
     * creates a message like this, but as server message, with the server-flag being set (this message will not be forwarded)
     * @returns Message a message with server flag
     * */
    asServerMessage(){
        const msg = new Message(this);
        this._server = true;
    }

}
/**
 * @readonly
 * A symbol to use, when not a specific, but everyone on the given level (Channel or Member) will receive this message
 * */
Message.ALL = "*"; // TODO delete and refactor to Message.Adresses.ALL

/**
 * @readonly
 * */
Message.Types = Object.freeze({
    AUTH: 'auth',               // Authenticate socket connection
    DEAUTH: 'deauth',           // Unauthenticate socket connection
    JOIN: 'join',               // join the channel
    LEAVE: 'leave',             // leave the channel
    CHANNEL: 'channel',         // channel member list
    OPEN: 'open',               // channel opened
    CLOSE: 'close',             // channel closed
    DISCONNECT: 'disconnect',   // connection ended
    CONNECT: 'connect',         // connection established
    SERVER: 'server',           // server-message, do not forward to anyone else
    TRANSMIT: 'transmit',       // non-server-message, forward to client
    ERROR: 'error',              // some error occured and is now to be handled
    isCustomMessage: (msg) => Object.values(this).filter(v => v === msg).length === 0
});

/**
 * @readonly
 * */
Message.Addresses = Object.freeze({
    ALL: '*',
    SERVER: '@',
    isCustomAddress: (addr) => addr !== this.ALL && addr !== this.SERVER
});

module.exports = Message;