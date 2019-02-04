const MessageValidation = {

    validate(message, user, hub){
        if(message.server){
            this.validateServerMessage(message, user, hub);
        }else{

        }
    },

    validateServerMessage(message, user, hub){
        let reason = "";
        if(user === null){
            reason = MessageValidation.ERRORS.NOT_AUTHENTICATED;
        }else if(!!message.type){
            reason = MessageValidation.ERRORS.NO_TYPE;
        }else if(message.from !== user){
            reason = MessageValidation.ERRORS.INVALID_SENDER;
        }else if(!hub.authenticatedUserExists(message.to)){
            reason = MessageValidation.ERRORS.NON_EXISTENT_RECEIVER;
        }else if(!hub.channelExists(message.channel)){
            reason = MessageValidation.ERRORS.NON_EXISTENT_CHANNEL;
        }else if(!hub.userIsInChannel(user)){
            reason = MessageValidation.ERRORS.SENDER_NOT_IN_CHANNEL;
        }else if(!hub.userIsInChannel(message.to)){
            reason = MessageValidation.ERRORS.RECEIVER_NOT_IN_CHANNEL;
        }
        return reason;
    }

};

MessageValidation.ERRORS = Object.freeze({
    NON_EXISTENT_CHANNEL: "NON-EXISTENT-CHANNEL",
    NON_EXISTENT_RECEIVER: "NON-EXISTENT-RECEIVER",
    INVALID_SENDER: "INVALID-SENDER",
    NO_TYPE: "NO-TYPE",
    NOT_AUTHENTICATED: "NOT-AUTHENTICATED",
    SENDER_NOT_IN_CHANNEL: "SENDER-NOT-IN-CHANNEL",
    RECEIVER_NOT_IN_CHANNEL: "RECEIVER-NOT-IN-CHANNEL",
    AUTH_FAILED: "AUTH-FAILED",
});

module.exports = MessageValidation;