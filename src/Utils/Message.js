/**
 * Immutable Message Class that defines a 'protocol' or 'format' on how the signaller handles messages.
 * It is used to define, which type of content is sent to which member of which channel.
 * All underlying Client-Server-Communication is wrapped by this type.
 * */
class Message{

    /**
     * creates a new message based on an object with the properties  type, content, channel, to and from
     * [the properties of mid, sent and forwarded should not be passed in by yourself when you create a message via new, they will be generated for you]
     * @param {Message | Object} message - an Object containing the desired Message properties as readable fields
     * @param {string} message.type - the type of the Message
     * @param {*} message.content - the content of the message
     * @param {string} message.channel - the id of the Channel that this Message is sent in
     * @param {string} message.receiver - the id of the User who shall be the receiver of the Message
     * @param {string} message.sender - the id of the User who shall be the sender of the Message
     * @param {Date} [message.sent=new Date()] - the Date when this Message was sent to the server. May be used to discard old messages
     * @param {Date} [message.forwarded=undefined] - the Date when this Message was forwarded by the server
     * @param {string} [message.answered=undefined] - the id of the Message that this Message is an answer to
     * @constructor
     * */
    constructor({id = Math.random().toString(32).substr(2), type=undefined, content=undefined, channel=undefined, receiver=undefined, sender=undefined, sent=new Date(), forwarded=undefined, answered=undefined} = {}){
        const message = arguments.length === 1 && arguments[0] instanceof Message ? arguments[0].asDataObject() : {};
        this._id = id || message.id;
        this._type = type || message.type;
        this._content = content || message.content;
        this._channel = channel || message.channel;
        this._receiver = receiver || message.receiver;
        this._sender = sender || message.sender;
        this._sent = sent || message.sent;
        this._forwarded = forwarded || message.forwarded;
        this._answered = answered || message.answered;
    }

    /**
     * Allows to identify a message. This is per default a string matching [a-z0-9]{11}.
     * The id can be used to identify an answer to a message,
     * since the <message>.answered-field contains the id of the original message.
     * Be aware that the id is only unique, when a new message is created via new Message().
     * The with<property>-methods do not change the id!
     * This may allow to sent a Message with the same id multiple tines, but with different content.
     * @readonly
     * @returns {string} the message id
     * */
    get id(){
        return this._id;
    }

    /**
     * identifies, which kind of content is being sent. A common example in WebRTC may be 'offer',
     * but any other type is also acceptable. A programmer may use a type like 'ring' or 'rpcForSomething'.
     * The only types which should be avoided are the predefined message types of the signaller.
     * They can be found via Message.
     * Types and one can check that a message is not a predefined Message via Message.Types.isCustomType
     * @readonly
     * @returns {string} the message type
     * */
    get type(){
        return this._type;
    }

    /**
     * the raw data or message payload that you want to send to the client.
     * Can be a JS-Object, Array or everything else that can be sent as a string over the net.
     * Do not try to describe the content type inside a given content object if not necessary,
     * for those kind of reasons the message object contains the type property.  (@see Message.type).
     * @readonly
     * @returns {*} the message data / payload of the message object
     * */
    get content(){
        return this._content;
    }

    /**
     * the id for the channel in which the message is being sent.
     * This id equals the server side Channel Object id and the client side ChannelHandler id (@see Channel#id) (@see ChannelHandler#id).
     * @readonly
     * @returns {string} the channel id
     * */
    get channel(){
        return this._channel;
    }

    /**
     * The id of the User that sent this message.
     * This id equals the server side User Objects id and the client side MemberHandler id / Client id (@see User#id) (@see MemberHandler#id) (@see Client#id).
     * @readonly
     * @returns {string} the receiver id
     * */
    get receiver(){
        return this._receiver;
    }

    /**
     * the id of the User that sent this message
     * This id equals the server side User Objects id and the client side MemberHandler id / Client id (@see User#id) (@see MemberHandler#id) (@see Client#id).
     * @readonly
     * @returns {string} the sender id
     * */
    get sender(){
        return this._sender;
    }

    /**
     * when was the message created and sent to the server.
     * This field may be used to discard old messages on server, avoid duplicate messages or order received messages.
     * If this property is a string and not a Date, it has to be convertible to a date by calling new Date(string).
     * @readonly
     * @returns {string | Date} the sending date
     * */
    get sent(){
        return this._sent;
    }

    /**
     * When was the message forwarded by the server.
     * Can be used to discard old messages on the client.
     * If this property is a string and not a Date, it has to be convertible to a date by calling new Date(string).
     * @readonly
     * @returns {Date} the forward date
     * */
    get forwarded(){
        return this._forwarded;
    }

    /**
     * The id of the original Message to which this message is a reply to.
     * (@see Message#id) for further informations
     * @readonly
     * @returns {string} the original message id
     * */
    get answered(){
        return this._answered;
    }

    /**
     * Create a message like this one, but with the given Message type instead.
     * Use this immutable method instead of trying to set the Message id directly.
     * @param {string} type the message type
     * @returns {Message} copy of message with the given type
     * */
    withType(type){
        const msg = new Message(this);
        msg._type = type;
        return msg;
    }

    /**
     * Create a Message like this one, but with the given channel instead.
     * Use this immutable method instead of trying to set the channel directly.
     * @param {string} id a Channel id
     * @returns {Message} copy of message with given Channel id
     * */
    withChannel(id){
        const msg = new Message(this);
        msg._channel = id;
        return msg;
    }

    /**
     * Create a Message like this one, but with the given Receiver instead.
     * Use this immutable method instead of trying to set the receiver directly.
     * @param {string} id a User id
     * @returns {Message} copy of message with given receiving User id
     * */
    withReceiver(id){
        const msg = new Message(this);
        msg._receiver = id;
        return msg;
    }

    /**
     * Create a Message like this one, but with the given Sender instead.
     * Use this immutable method instead of trying to set the sender directly.
     * @param {string} id a User id
     * @returns {Message} copy of message with given sending User id
     * */
    withSender(id){
        const msg = new Message(this);
        msg._sender = id;
        return msg;
    }

    /**
     * Create a Message like this but with the given content.
     * Use this immutable method instead of trying to set the content directly.
     * @param {*} data any data payload of the message
     * @returns {Message} copy of message with given content data
     * */
    withContent(data){
        const msg = new Message(this);
        msg._content = data;
        return msg;
    }

    /**
     * creates an answer to this message, with the receiver as sender and vice versa, new sent date and this messages id as answered field
     * @param {string} type - the type of the answer Message
     * @param {*} content - the content of the answer Message
     * @returns {Message} a Message like this one, but with new Message id and this Message id as answer, and with the sender as receiver and vice versa
     **//**
     * creates an answer to this message, with the receiver as sender and vice versa, new sent date and this messages id as answered field
     * @param {string} content - the content of the answered Message
     * @returns {Message} a Message like this one, but with new Message id and this Message id as answer, and with the sender as receiver and vice versa
     *//**
     * creates an answer to this message, with the receiver as sender and vice versa, new sent date and this messages id as answered field
     * @returns {Message} a Message like this one, but with new Message id and this Message id as answer, and with the sender as receiver and vice versa
     */
    asAnswer(type, content){
        const msg = new Message(this);
        if(arguments.length === 1){
            msg._content = arguments[0];
        }else if(arguments.length === 2){
            msg._type = arguments[0];
            msg._content = arguments[1];
        }else if(arguments.length > 2){
            throw new Error("Invalid Argument number");
        }
        msg._sent = new Date();
        const tmp = msg._sender;
        msg._sender = msg._receiver;
        msg._receiver = tmp;
        msg._answered = this._id;
        this._id = Math.random().toString(32).substr(2);
        return msg;
    }


    /**
     * Creates a simple Javascript Object that is not an instance of Message but shares all getters as fields.
     * This offers a way to quickly retrieve all current data without breaking immutability.
     * A use case could be, that the current JS version does not support the object spread syntax for getters,
     * so retrieving the data fields would be necessary.
     * @returns {Object} a simple js object (not a Message!) with the readable properties as fields
     * */
    asDataObject(){
        const self = this;
        return {
            id: self.id,
            type: self.type,
            content: self.content,
            sender: self.sender,
            receiver: self.receiver,
            channel: self.channel,
            sent: self.sent,
            forwarded: self.forwarded,
            answered: self.answered,
        }
    }

    /**
     * Predefined message types used by the application to communicate.
     * Common types would be AUTH, JOIN, LEAVE, etc. They communicate a state change from the server to the client or vice versa.
     * @namespace
     * @readonly
     * @enum {string}
     * @property {Object} Types - the predefined message types
     * @property {string} Types.AUTH - an app authentication message (login)
     * @property {string} Types.DEAUTH - an app de-authentication message (logout)
     * @property {string} Types.JOIN - an app join message for channel management
     * @property {string} Types.LEAVE - an app leave message for channel management
     * @property {string} Types.CHANNEL - an app channel member listing message
     * @property {string} Types.OPEN - an app channel opened message
     * @property {string} Types.CLOSE - an app channel closed message
     * @property {string} Types.CONNECT - an app connection opened message
     * @property {string} Types.DISCONNECT - an app connection closed message
     * @property {string} Types.ERROR - an app error message
     * @property {function} isCustomType - a function to check if the given message has not a predefined type
     * */
    static get Types(){
        return Object.freeze({
            AUTH: 'auth',               // Authenticate socket connection
            DEAUTH: 'deauth',           // Unauthenticate socket connection
            JOIN: 'join',               // join the channel
            LEAVE: 'leave',             // leave the channel
            CHANNEL: 'channel',         // channel member list
            OPEN: 'open',               // channel opened
            CLOSE: 'close',             // channel closed
            DISCONNECT: 'disconnect',   // connection ended
            CONNECT: 'connect',         // connection established
            ERROR: 'error',              // some error occured and is now to be handled
            isCustomType: (type) => Object.values(this).filter(v => v === type).length === 0
        });
    }

    /**
     * Predefined addresses used by the application to communicate.
     * Common addresses used by the application are SERVER or ALL (broadcast)
     * @namespace
     * @enum {string}
     * @readonly
     * @property {Object} Addresses - the predefined Addresses of the app
     * @property {string} Addresses.ALL - the broadcast address, that defines that this message should be sent to everyone
     * @property {string} Addresses.SERVER - the server address, that defines that this message should only be sent to the server
     * @property {function} Addresses.isCustomAddress - checks if the Address is not one of the above
     * */
    static get Addresses(){
        return Object.freeze({
            ALL: '*',
            SERVER: '@',
            isCustomAddress: (addr) => addr !== this.Addresses.ALL && addr !== this.Addresses.SERVER
        });
    }

}


module.exports = Message;