const Signaller = require("../src/Client/ClientHandler");
const Channel = require("../src/Client/ChannelHandler");
const Member = require("../src/Client/MemberHandler");
const Message = require("../src/Utils/Message");
const onSendFn = jest.fn();
const client = new Signaller("wss://localhost/");
client._socket = {send: (msg) => onSendFn(JSON.parse(msg))};
client._id = 'testclient';


beforeEach(() => {
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
});

describe("Sending messages on members, channels or the client by passing type and content constructs messages as expected", () => {

    test("Sending a message on a member in a channel constructs a message for this client in this channel", () => {
        client.channel("c1").member("m1").send("t","c");
        expect(onSendFn).toBeCalledWith(expect.objectContaining({channel: 'c1', receiver: 'm1', sender: 'testclient', type:'t', content: 'c'}));
    });

    test("Sending a message on a channel constructs a message for this channels (broadcast)", () => {
        client.channel("c1").send("t","c");
        expect(onSendFn).toBeCalledWith(expect.objectContaining({channel: 'c1', receiver: Message.Addresses.ALL, sender: 'testclient', type: 't', content: 'c'}));
    });

    test("Sending a message on the client constructs a message from this user and to all channels he knows as broadcast", () => {
        client.send("t","c");
        expect(onSendFn).toBeCalledWith(expect.objectContaining({sender: 'testclient', channel: Message.Addresses.ALL, receiver: Message.Addresses.ALL}))
    });
});

describe("Passing in a message object to the send function adds data based on the used handler, but not overrides given data", () => {

    test("Sending a message on a member handler in a channel adds the members id as receiver, the channel as channel, the client as sender", () => {
        client.channel("c1").member("m1").send(new Message());
        expect(onSendFn).toBeCalledWith(expect.objectContaining({channel: 'c1', receiver: 'm1', sender: 'testclient'}));
    });

    test("Sending a message on a member handler in a channel does not overwrite given data", () => {
        client.channel("c1").member("m1").send(new Message({channel: 'c2', receiver: 'm2', sender: 'notTestClient'}));
        expect(onSendFn).toBeCalledWith(expect.objectContaining({channel: 'c2', receiver: 'm2', sender: 'notTestClient'}));
    });

    test("Sending a message on a channel handler works as broadcast for that channel", () => {
        client.channel("c1").send(new Message());
        expect(onSendFn).toBeCalledWith(expect.objectContaining({channel: 'c1', receiver: Message.Addresses.ALL, sender: 'testclient'}));
    });

    test("Sending a message on a channel does not overwrite given data", () => {
        client.channel("c1").send(new Message({channel: 'c2', receiver: 'c2', sender: 'notTestClient'}));
        expect(onSendFn).toBeCalledWith(expect.objectContaining({channel: 'c2', receiver: 'c2', sender: 'notTestClient'}));
    });

    test("Sending a message on the client handler adds as broadcast for every known channel", () => {
        client.send(new Message());
        expect(onSendFn).toBeCalledWith(expect.objectContaining({sender: 'testclient', channel: Message.Addresses.ALL, receiver: Message.Addresses.ALL}));
    });

    test("Sending a message on the client handler does not overwrite given data", () => {
        client.send(new Message({channel: 'c1', receiver: 'm1', sender: 'notTestClient'}));
        expect(onSendFn).toBeCalledWith(expect.objectContaining({sender: 'notTestClient', channel: 'c1', receiver: 'm1'}));
    });
});
