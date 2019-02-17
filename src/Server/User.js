const ArrayTools = require('../Utils/ArrayTools');
const Channel = require('./Channel');
const users = [];

/**
 * Takes care of the Server Site User Instances
 * A Server Site User instance is always a tuple of id and socket
 * Static methods manage a collection of authenticated instances of this class
 * */
class User{

    /**
     * create a new, manageable User
     * @param {string} id a unique identifier for this user. You are responsible for its uniqueness
     * @param {WebSocket} socket a WebSocket Connection for this user
     * */
    constructor(id, socket){
        this._id = id;
        this._socket = socket;
    }

    /**
     * @readonly
     * @returns {string} the id of this user
     * */
    get id(){
        return this._id;
    }

    /**
     * @readonly
     * @returns {WebSocket} the socket of this user
     * */
    get socket(){
        return this._socket;
    }

    /**
     * all channels that this user is a member of
     * @returns {Channel[]} a list of the channels, where this user is a member
     * */
    get channels(){
        return Channel.byMember(this.id);
    }

    /**
     * a User exactly like this one, but with the given id
     * @param {string} id the id of the new User Object
     * @returns {User} a newly created user Object, but with the given id
     * */
    withId(id){
        return new User(id, this.socket);
    }

    /**
     * a User exaclty like this one, but with the given socket
     * @param {WebSocket} socket the socket of the new User Object
     * @returns {User} a newly created user Object, but with the given socket
     * */
    withSocket(socket){
        return new User(this.id, socket);
    }

    /**
     * @static
     * every user added via User.add and not already removed via User.remove
     * @returns {ReadonlyArray | User[]} every user
     * */
    static get all(){
        return Object.freeze(users.slice());
    }

    /**
     * @private
     * @static
     * get the index of the user with this id in the list of all users
     * @param {string} id the id of the user
     * */
    static _indexOfId(id){
        return users.findIndex(u => u.id === id);
    }

    /**
     * @static
     * get the user that owns this socket
     * @param {WebSocket} socket the socket of the user
     * @returns {User} the user of the socket or null, if there is no such user with this id
     * */
    static bySocket(socket){
        const i = users.findIndex(user => user._socket === socket);
        return i >= 0 ? users[i] :  null;
    }

    /**
     * @static
     * get the user with the given id
     * @param id the id of the user to search for
     * @returns {User} the user with the given id, or null if there is no such user
     * */
    static byId(id){
        const i = this._indexOfId(id);
        return i >= 0 ? users[i] : null;
    }

    /**
     * Join a channel
     * @param {string | Channel } channel the channel or its id to join
     * @returns {boolean} true, if this user was added to the channel members. False, if no such channel exists or the user is already part of it
     */
    join(channel){
        const c = Channel.byId(channel.id || channel);
        let joined = false;
        if(c) joined = c.addMember(this.id);
        return joined;
    }

    /**
     * leave a channel
     * @param {string | Channel} channel the channel or its id to leave
     * @returns {boolean} true, if this user left the channel. False, if there was no such channel or the user was not part of it
     * */
    leave(channel){
        const c = Channel.byId(channel.id || channel);
        let left = false;
        if(c !== null) left = c.removeMember(this.id);
        return left;
    }

    /**
     * checks if the user is a member of the given channel
     * @param {string | Channel} channel the channel to check for
     * @returns {boolean} true, if the user is indeed a member of the channel
     * */
    isMemberOf(channel){
        const c = Channel.byId(channel.id || channel);
        return c !== null && c.hasMember(id);
    }


    /**
     * @static
     * add a user to the list of managed users
     * @param {User} user a user to add
     * @returns {boolean} true, when the action was performed, since there wasn't already a user with such an id
     * */
    static authenticate(user){
        const exists = User.byId(user.id);
        if(!exists) users.push(user);
        return !exists;
    }

    /**
     * authenticates this user
     * @returns {boolean} true, if the user was newly authenticated, but false when the user has been authenticated already and nothing changend
     * */
    authenticate(){
        User.authenticate(this);
    }

    /**
     * @static
     * remove a user from the list of managed users
     * @param {User | User.id} user a user or its id to remove
     * @returns {boolean} true, if the action was performed, since there was a user with such an id
     * */
    static unauthenticate(user){
        const id = user.id || user;
        const i = User._indexOfId(id);
        const exists = i >= 0;
        if(exists) users.splice(i, 1);
        return exists;
    }

    /**
     * removes the user from the authenticated users
     * @returns {boolean} true, if the user was newly disconnected, false if nothing changed (because the user was not authenticated in the first place)
     * */
    unauthenticate(){
        User.unauthenticate(this)
    }

    /**
     * @param {User[]} users
     * @returns {User[]}
     * */
    static unique(users){
        return ArrayTools.unique(users, (a,b) => a.id === b.id);
    }

    /**
     * @param {User[]} users
     * @param {string} id
     * @returns {User[]}
     * */
    static exclude(users, id){
        return ArrayTools.exclude(users, id, (a,b) => a.id === b);
    }
}

module.exports = User;