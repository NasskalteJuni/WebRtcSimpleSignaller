const ArrayTools = require('../Utils/ArrayTools');
const channels = [];

/**
 * Takes care of the Server Site Channel instances
 * Static methods manange a collection of open instances of this class
 * */
class Channel{

    /**
     * create a new, manageable Channel
     * @param {string} id a somehow unique identifier to that channel (you are responsible for uniqueness)
     * @param {string[]} [members=[]] the members of the channel
     * */
    constructor(id, members = []){
        this._id = id;
        this._members = members;
    }

    /**
     * @readonly
     * @returns {string} the id of the channel
     * */
    get id(){
        return this._id;
    }

    /**
     * @readonly
     * @returns {string[]} the user ids as members of the channel
     * */
    get members(){
        return this._members;
    }

    /**
     * @readonly
     * @returns {User} the authenticated users that are members of this channel
     * */
    get users(){
        this.members.map(id => User.byId(id)).filter(u => u !== null);
    }

    /**
     * @param {string} id the id of the created channel
     * @returns {Channel} a channel exactly like this, but with the given id
     * */
    withId(id){
        return new Channel(id, this.members);
    }

    /**
     * @param {string[]} members the members of the created channel
     * @returns {Channel} a channel exactly like this, but with the given members
     * */
    withMembers(members){
        return new Channel(this.id, members);
    }

    /**
     * add a user to this channel
     * @param {string} id the id of the user to join as a channel member
     * @returns {boolean} true, if the user could join, false, if there was already a user with this id and nothing changed
     * */
    addMember(id){
        const joinable = this.members.indexOf(id) === -1;
        if(joinable) this.members.push(id);
        return joinable;
    }

    /**
     * remove a user from this channel
     * @param {string} id the id of the user to remove as a channel member
     * @returns {boolean} true, if the user could leave, false, if there was no such user in this channel and nothing changed
     * */
    removeMember(id){
        const i = this.members.indexOf(id);
        const leaveable = i >= 0;
        if(leaveable) this.members.splice(i, 1);
        return leaveable;
    }

    /**
     * checks if the channel has the specific member
     * @param {string} id the id of the member
     * @returns {boolean} true, if there is a member with this id
     * */
    hasMember(id){
        return this.members.indexOf(id) >= 0;
    }

    /**
     * @static
     * A list of all added channels
     * @returns {Channel[]} every Channel that was added via Channel.add and not removed already via Channel.remove
     * */
    static get all(){
        return channels;
    }

    /**
     * @private
     * @static
     * @param {string} id the id of the channel to search
     * @returns {int} the index of the channel in the list of channels or -1, if there was no such channel
     * */
    static _indexOfId(id){
        return channels.findIndex(c => c.id === id);
    }

    /**
     * @static
     * get the channel with the given id
     * @param{string} id the id to search for
     * @returns {Channel} a Channel with the given id or null, if none was found
     * */
    static byId(id){
        const i = Channel._indexOfId(id);
        return i >= 0 ? channels[i] : null;
    }

    /**
     * @static
     * get the channels that have the given User as member
     * @param {string | User} user the id of the user or the user itself to search for
     * @returns {Channel[]} every Channel that has a member with the given user id
     * */
    static byMember(user){
        const id = user.id || user;
        return channels.filter(channel => channel._members.indexOf(id) >= 0);
    }

    /**
     * @static
     * add the channel from the list of all channels
     * @param {Channel | Channel.id} channel the channel or its id (creates empty Channel)
     * @returns {boolean} if the channel is new (true) or if there is already a channel with this id
     * */
    static open(channel){
        const c = typeof channel === "string" ? new Channel(id) : channel;
        const exists = Channel.byId(c.id) !== null;
        if(!exists) channels.push(c);
        return !exists;
    }

    /**
     * Opens this channel
     * @returns {boolean} true, if the channel channel has been opened, or false, if the channel was already open and nothing changed
     * */
    open(){
        return Channel.open(this);
    }

    /**
     * @static
     * remove the channel from the list of all channels
     * @param {string | Channel} channel the channel or its id
     * @returns {boolean} if there was a channel to remove (true) or if nothing was done
     * */
    static close(channel){
        const id = channel.id || channel;
        const i = channels.findIndex(c => id === c.id);
        const exists = i >= 0;
        if(exists) channels.splice(i, 1);
        return exists;
    }

    /**
     * Closes this channel
     * @return {boolean} true, if the Channel has been closed or false, if the Channel was already closed
     * */
    close(){
        return Channel.close(this);
    }

    /**
     * @static
     * creates a set of channels by removing duplicates from the given Array
     * @param {Channel[]} channels an Array of Channels to filter
     * @returns {Channel[]} a Set of unique Channels
     * */
    static unique(channels){
        return ArrayTools.unique(channels, (a,b) => a.id === b.id);
    }

    /**
     * @static
     * exclude a given channel from the given list of channels
     * @param {Channel[]} channels a list of channels that may contain the channel with the given id once or more times
     * @param {string} id the id of the Channel to exclude
     * @returns {Channel[]} a list of channels without the given id
     * */
    static exclude(channels, id){
        return ArrayTools.exclude(channels, id, (a,b) => a.id === b);
    }

}

module.exports = Channel;