module.exports = async () => {
    global.WebSocket = function(url, protocols){
        if(arguments.length === 0) throw new TypeError("Failed to construct 'WebSocket': 1 argument required, but only 0 present.");
        if(typeof url !== "string" || ! /^ws(s)?:\/\/.+\.[a-zA-Z]{2,20}/.test(url)) throw new TypeError("The URL '"+url+"' is invalid.")
        this.url = url;
        this.protocols = protocols;
        this.readyState = 0;
        this.send = jest.fn();
        this.close = jest.fn();
    };


};