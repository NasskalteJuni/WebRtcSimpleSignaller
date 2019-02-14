const Signaller = require("../src/Client/ClientHandler");
const Channel = require("../src/Client/ChannelHandler");
const Member = require("../src/Client/MemberHandler");
const Message = require("../src/Utils/Message");
const client = new Signaller("wss://localhost/");
const receiveMsg = (msg) => client._messagehandler(msg);

beforeEach(() => {
    global.WebSocket = {send: jest.fn()};
    // structrue:
    // - c1: (m1, m2, m3)
    // - c2: (m2, m3)
    // - c3: (m3)
    const c1 = new Channel('c1', client);
    c1._members.push(new Member('m1', c1), new Member('m2', c1), new Member('m3', c1));
    const c2 = new Channel('c2', client);
    c2._members.push(new Member('m2', c2), new Member('m3', c2));
    const c3 = new Channel('c3', client);
    c3._members.push(new Member('m3', c3));
    client._channels.push(c1, c2, c3);
});

afterEach(() => {
    jest.restoreAllMocks();
    client._channels = [];
    delete global["WebSocket"];
});

describe("Receiving a message triggers handlers with type and content", () => {

    test("member handler triggers on message with valid content (and the message)", () => {
        const receivedCb = jest.fn();
        client.channel('c1').member('m1').on('t', receivedCb);
        receiveMsg(new Message({type: 't', content: 'c', sender: 'm1', receiver: 'm1', channel: 'c1'}));
        expect(receivedCb).toBeCalledWith('c', expect.any(Message));
    });

    test("channel handler triggers on message with valid content (and the message)", () => {
        const receivedCb = jest.fn();
        client.channel('c1').on('t', receivedCb);
        receiveMsg(new Message({type: 't', content: 'c', sender: 'm1', receiver: 'm1', channel: 'c1'}));
        expect(receivedCb).toBeCalledWith('c', expect.any(Message));
    });

    test("correct handler triggers once", () => {
        const receivedCb = jest.fn();
        client.channel('c1').member('m1').on('t', receivedCb);
        receiveMsg(new Message({type: 't', content: 'c', sender: 'm1', channel: 'c1', receiver: 'm2'}));
        expect(receivedCb).toHaveBeenCalledTimes(1);
    });

    test("incorrect handler does not trigger", () => {
        const receivedCb = jest.fn();
        client.channel('c1').member('m1').on('K', receivedCb);
        expect(receivedCb).not.toHaveBeenCalled();
    })

});

describe("client triggers ONLY ON CORRECT MEMBERS and channels and not always on all / randomly", () => {
    test("invalid member does not trigger", done => {
        client.channel("c1").member("m2").on('t', () => done.fail("Invalid member"));
        client.channel("c1").member("m3").on('t', () => done.fail("Invalid member, triggered on receiver instead!"));
        receiveMsg(new Message({type: 't', content: 'c', sender: 'm1', receiver: 'm3', channel: 'c1'}));
        done();
    });

    test("invalid channel (receiver is not member of channel) does not get triggered", done => {
        client.channel("c3").on('t', () => done.fail("Invalid channel, sender is not part of c3"));
        receiveMsg(new Message({type: 't', content: 'c', sender: 'm1', receiver: 'm2'}));
        done();
    });
});

describe("Messages are received on EVERY handler that match the sender", () => {

    test("Message from sender in ALL channels triggers on sender handler in every channel of sender", () => {
        const validCbs = jest.fn();
        client.channel('c1').member('m2').on('t', validCbs);
        client.channel('c2').member('m2').on('t', validCbs);
        receiveMsg(new Message({type: 't', content: 'c', sender: 'm2', receiver: 'm3', channel: Message.Addresses.ALL}));
        expect(validCbs.mock.calls.length).toBe(2);
    });
});