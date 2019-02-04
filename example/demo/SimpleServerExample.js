const http = require("http");
const fs = require("fs");
const path = require("path");

const simpleServerExample = function(port=80){
    let errorhandler = (err) => console.error(err);
    let notfoundhandler = (request, response) => {
        response.statusText = "404 NOT FOUND";
        response.statusCode = 404;
        response.end("404 - Not Found");
    };
    let logging = true;
    const requesthandlers = {
        'GET': {},
        'POST': {},
        'PUT': {},
        'DELETE': {},
    };

    const httpServer = http.createServer(function(request, response){
        if(logging) console.log(new Date().toISOString(),'::', request.method, request.url);
        let body = [];
        const requestPath = path.resolve(path.join(__dirname,'public',request.url));
        response.json = (data) => response.end(JSON.stringify(data));
        if(request.url === "/"){
            const indexPath = path.join(__dirname,"public","index.html");
            response.end(fs.existsSync(indexPath) ? fs.readFileSync(indexPath) : 'No Index')
        }else if(requestPath.startsWith(__dirname) && fs.existsSync(requestPath)){
            response.end(fs.readFileSync(requestPath,"utf8"));
        }else{
            const URLS = Object.keys(requesthandlers[request.method]);
            const i = URLS.findIndex(URL => URL instanceof RegExp ? URL.test(request.url) : URL.toLocaleLowerCase() === request.url.toLocaleLowerCase());
            const handler = i >= 0 ? Object.values(requesthandlers[request.method])[i] : notfoundhandler;
            request
                .on('error', errorhandler)
                .on('data', chunk => body.push(chunk))
                .on('end', () => {
                    request.body = Buffer.concat(body).toString();
                    request.json = () => JSON.parse(request.body);
                    handler(request, response);
                });
        }
    });

    return {
        error: (handler) => errorhandler = handler,
        get: (url, handler) => requesthandlers['GET'][url] = handler,
        post: (url, handler) => requesthandlers['POST'][url] = handler,
        put: (url, handler) => requesthandlers['PUT'][url] = handler,
        delete: (url, handler) => requesthandlers['DELETE'][url] = handler,
        start: (port=80, cb) => httpServer.listen(80, cb),
        http: () => httpServer,
        logging: (flag) => logging = !!flag
    };
};

module.exports = simpleServerExample;