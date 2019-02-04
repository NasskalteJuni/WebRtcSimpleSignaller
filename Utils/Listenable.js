const Listenable = (superclass=Object) => class extends superclass{

    constructor(){
        super(...arguments);
        this._handlers = {};
        this._proxies = [];
    }

    on(event, handler){
        if(typeof handler !== "function") throw new Error("Invalid Handler function given:"+handler+" ["+(typeof handler)+"]");
        this._handlers[event] = this.hasListenerFor(event) ? this._handlers[event].concat([handler]) : [handler];
    }

    off(event, handler){
        if(typeof handler !== "function") throw new Error("Invalid Handler function given:"+handler+" ["+(typeof handler)+"]");
        if(this.hasListenerFor(event)) this._handlers[event] = this._handlers[event].filter(h => h.toString() === handler.toString())
    }

    hasListenerFor(event){
        return !!this._handlers[event] && this._handlers[event].length > 0;
    }

    proxy(listenable){
        if(!(listenable instanceof Listenable)) throw new Error("Invalid Proxy given, must be Listenable");
        this._proxies.push(listenable);
    }

    trigger(event, argumentsArray=[], self=this){
        if(!(argumentsArray instanceof Array)) argumentsArray = [argumentsArray];
        this._proxies.forEach(proxy => proxy.trigger(event, argumentsArray, self));
        if(this.hasListenerFor(event)) this._handlers[event].forEach(h => h.apply(self, argumentsArray));
    }
};

module.exports = Listenable;