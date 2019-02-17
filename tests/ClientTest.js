const Client = require("../src/Client/ClientHandler");
const Channel = require("../src/Client/ChannelHandler");
const Member = require("../src/Client/MemberHandler");
const Message = require("../src/Utils/Message");
const client = new Client("wss://localhost/");

const c1 = new Channel("c1", client);
const c2 = new Channel("c2", client);
const c3 = new Channel("c3");
const c1m1 = new Member("m1",c1);
const c1m2 = new Member("m2",c1);
const c2m2 = new Member("m2",c2);
const c2m3 = new Member("m3",c2);
const c3m3 = new Member("m3",c3);

// mock receiving message from server
const receiveMsg = msg => client._messagehandler(msg);
// mock echo like server (without sending over network);
client._socket.send = jest.fn(m => {
    const msg = new Message(JSON.parse(m));
    let response = null;
    const t = setTimeout(() => {
        switch(msg.type){
            case 'auth':
                const success =  msg.content.token === 'testToken' && msg.content.id === 'testId';
                response = msg.asAnswer().withContent({success, error: !success ? "Invalid Credentials" : ""});
                break;
            case 'join':
                response = msg.asAnswer().withContent({success: true, members: ['m1']});
                break;
            case 'leave':
            case 'open':
            case 'close':
                response = msg.asAnswer().withContent({success: true});
                break;
            default:
                response = msg.asAnswer();
        }
        receiveMsg(response);
        clearTimeout(t);
    }, 100);

});

beforeEach(() => {
    global.WebSocket = {send: jest.fn()};
    client._channels = [c1,c2,c3];
    client._id = null;
    c1._members = [c1m1, c1m2];
    c2._members = [c2m2, c2m3];
    c3._members = [c3m3];
});

afterEach(() => {
    jest.restoreAllMocks();
    global.WebSocket = null;
    client._channels = [];
    c1._members = [];
    c2._members = [];
    c3._members = [];
});

describe("getting channels or members locally works (tests do not invoke update messages)", () => {

    test("retrieve a channel the client is part of", () => {
        expect(client.channel("c1")).toBe(c1);
    });

    test("retrieve a member of a channel the client is part of", () => {
        expect(client.channel("c1").member("m1")).toBe(c1m1);
    });

    test("getting every channel the client is part of", () => {
        expect(client.channels).toContain(c1);
        expect(client.channels).toContain(c2);
        expect(client.channels).toContain(c3);
        expect(client.channels.length).toBe(3);
    });

    test("the retrieved channel list is read only, manipulation attempts throw an error in strict mode", () => {
        "use strict";
        expect(() => client.channels.push(null)).toThrowError();
    });

    test("getting every known member of a channel", () => {
        "use strict";
        expect(client.channel("c1").members).toContain(c1m1);
        expect(client.channel("c1").members).toContain(c1m2);
        expect(client.channel("c1").members.length).toBe(2);
    });

    test("the retrieved member list is read only, manipulation attempts throw an error in strict mode", () => {
        "use strict";
        expect(() => client.channel("c1").members.push(null)).toThrowError();
    });

    test("receive null when an unknown channel should be retrieved", () => {
        expect(client.channel("c5")).toBeNull();
    });

    test("receive null when an unkown member should be retrieved", () => {
        expect(client.channel("c1").member("m5")).toBeNull();
    });

    test("one can get a channels id but not set it", () => {
        "use strict";
        expect(client.channel("c1").id).toBe("c1");
        expect(() => client.channel("c1").id = "c5").toThrowError();
    });

    test("one can get a members id but not set it", () => {
        "use strict";
        expect(client.channel("c1").member("m1").id).toBe("m1");
        expect(() => client.channel("c1").member("m1").id = "m5").toThrowError();
    });
});

describe("updating the clients channels and members works", () => {

    test("doing a basic request works", async () => {
        const response = await client.request('t','c');
        expect(response).not.toBeNull();
        expect(response).toBe('c');
    });

    test("doing an authentication request sets the users id", async () => {
        expect(client.id).toBeNull();
        try{
            await client.auth('testId','testToken');
        }catch (err) {
            expect(err).toBeFalsy();
        }
        expect(client.id).not.toBeNull();
    });

    test("doing an invalid auth request does not set the id and throws error (msg definable on server)", async () => {
        expect(client.id).toBeNull();
        try{
            await client.auth('testId','wrongTestTokenOrId');
        }catch(err){
            expect(err.message).toBe("Invalid Credentials");
        }
        expect(client.id).toBeNull();
    });

    test("doing a successful join request adds the channel", async () => {
        await client.join('channel');
        expect(client.channel('channel')).not.toBeNull();
    });

    test("doing a successful leave request removes the channel", async () => {
        await client.leave('channel');
        expect(client.channel('channel')).toBeNull();
    });

    test("receiving a join message that is no answer to an own message adds the joining user to the channel", () => {
        receiveMsg(new Message({type: 'join', content: 'm4', channel: 'c1', sender: 'm4'}));
        expect(client.channel('c1').member('m4')).not.toBeNull();
    });

    test("receiving a leave message that is no answer to an own leave message removes the user from the channel", () => {
        receiveMsg(new Message({type: 'leave', content: 'm2', channel: 'c1', sender: 'm2'}));
        expect(client.channel('c1').member('m2')).toBeNull();
    });
});