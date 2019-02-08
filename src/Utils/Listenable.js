/**
 * Defines a set of methods to trigger events on the implementing object and to listen for those triggered events.
 * Basically an observer-pattern-light, were callbacks inform anyone interested on something happening.
 * Does not work with the common DOM events, but mimics jQuerys event listener signature loosely.
 * @mixin Listenable
 * @param {*} [superclass=Object] any superclass that your original class that extends the mixin should extend originally
 * */
const Listenable = (superclass=Object) => class extends superclass{

    /**
     * passes any number of given arguments to the superclass without changing them
     * @constructor
     * */
    constructor(){
        super(...arguments);
        this._handlers = {};
        this._proxies = [];
    }

    /**
     * A callback function triggered as soon as .trigger is called on this Listenable.
     * @see {@link Listenable.trigger}
     * @callback Listenable~listenableHandler
     * @param {...*} any number of arguments that was passed in to trigger as argumentsArray
     * */
    /**
     * listen for a given app event by registering an event handler (not working with typical javascript DOM events)
     * @param {string} event the event type / name to listen for
     * @param {Listenable~listenableHandler} handler the event handler function that is triggered when the given event type / name occurs and has the arguments array passed to .trigger as function parameters
     * @memberOf Listenable
     * @instance
     * */
    on(event, handler){
        if(typeof handler !== "function") throw new Error("Invalid Handler function given:"+handler+" ["+(typeof handler)+"]");
        this._handlers[event] = this.hasListenerFor(event) ? this._handlers[event].concat([handler]) : [handler];
    }

    /**
     * unregister the given event handler
     * @param {string} event the event type / name that the handler was registered for
     * @param {Listenable~listenableHandler} handler the handler function that was registered and shall be removed
     * @memberOf Listenable
     * @instance
     * */
    off(event, handler){
        if(typeof handler !== "function") throw new Error("Invalid Handler function given:"+handler+" ["+(typeof handler)+"]");
        if(this.hasListenerFor(event)) this._handlers[event] = this._handlers[event].filter(h => h.toString() === handler.toString())
    }

    /**
     * Check if there is already at least one listener on the Listenable instance registered for this event
     * @param {string} event the event
     * @returns {boolean} true, when at least one listener has been registered (and is still not unregistered) on this Listenable for the given event
     * @memberOf Listenable
     * @instance
     * */
    hasListenerFor(event){
        return !!this._handlers[event] && this._handlers[event].length > 0;
    }

    /**
     * Forward any received trigger calls to the given Listenable, which will act like the .trigger-function was called on them as well
     * @param {Listenable} listenable any kind of Object implementing the Listenable Interface
     * @memberOf Listenable
     * @instance
     * */
    proxy(listenable){
        if(!(listenable instanceof Listenable)) throw new Error("Invalid Proxy given, must be Listenable");
        this._proxies.push(listenable);
    }

    /**
     * trigger the event on the given Listenable with the given parameters
     * @param {string} event the event type to trigger
     * @param {Array | *} argumentsArray an Array of anything that will be passed to the registered handler functions as arguments. If only one thing is given and it is not an array, it will be the only argument passed to the handler functions
     * @param {Object} self a reference to this or what will be this in an event handler like .on('...', function(){console.log(this)})
     * @memberOf Listenable
     * @instance
     * */
    trigger(event, argumentsArray=[], self=this){
        if(!(argumentsArray instanceof Array)) argumentsArray = [argumentsArray];
        this._proxies.forEach(proxy => proxy.trigger(event, argumentsArray, self));
        if(this.hasListenerFor(event)) this._handlers[event].forEach(h => h.apply(self, argumentsArray));
    }
};

module.exports = Listenable;