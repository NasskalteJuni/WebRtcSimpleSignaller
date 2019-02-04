const Listenable = require("../Utils/Listenable.js");
const Message = require("../Utils/Message.js");

class Member extends Listenable(){

    constructor(id, channel){
        super();
        this.id = id;
        this.channel = channel;
    }

    send(message){
        if(arguments.length === 2){
            message = new Message({
                type: arguments[0],
                content: arguments[1]
            });
        }
        if(!message.to) message = message.withReceiver(this.id);
        this.channel.send(message);
    }

    _messagehandler(message){
        this.trigger(message.type, [message.content, message]);
    }

}

module.exports = Member;