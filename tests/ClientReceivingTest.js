/**
 * Very superficial tests that do not cover the functions in depth,
 * but hopefully guarantee basic functionality
 * @author nasskaltejuni
 * */
const test = require("ava");
const sinon = require("sinon");
const Signaller = require("../src/Client/ClientHandler");
const Channel = require("../src/Client/ChannelHandler");
const Member = require("../src/Client/MemberHandler");
const Message = require("../src/Utils/Message");


test.beforeEach(t => {
    // mock a few expected things...
    t.context.client = new Signaller("wss://localhost");
    //bypass auth and just set the id
    t.context.client.id = "member_self";
    // stub the websocket to avoid connection errors
    t.context.client.socket = sinon.stub(t.context.client.socket);
    // just act like these have been added/created already
    t.context.testChannel1 = new Channel("test_channel_1", t.context.client);
    t.context.testChannel2 = new Channel("test_channel_2", t.context.client);
    t.context.testChannel3 = new Channel("test_channel_3", t.context.client);
    t.context.testMember1 = new Member("member_1", t.context.testChannel1);
    t.context.testMember2 = new Member("member_2", t.context.testChannel2);
    t.context.testMember3 = new Member("member_3", t.context.testChannel2);
    t.context.testMember2Channel3 = new Member("member_2", t.context.testChannel3);
    t.context.client.channels.push(t.context.testChannel1);
    t.context.client.channels.push(t.context.testChannel2);
    t.context.testChannel1.members.push(t.context.testMember1);
    t.context.testChannel2.members.push(t.context.testMember2);
    t.context.testChannel2.members.push(t.context.testMember3);
    t.context.testChannel3.members.push(t.context.testMember2);
    t.context.message = (channel, receiver, sender) => t.context.client._messagehandler(new Message({channel, sender, receiver, type: "test", content: "example"}))
});

test("Client hands incoming messages to specific member correctly and triggers handle on member", t => {
    t.context.client
        .channel("test_channel_1")
        .member("member_1")
        .on("test", content => content === "example" ? t.pass("member received valid message") : t.fail("Invalid message content"));
    t.context.message("test_channel_1", "member_1", "member_1");
});

test("Client hands incoming messages to valid receiver (- and not sender)", t => {
    t.context.client
        .channel("test_channel_2")
        .member("member_2")
        .on("test", ()=> t.fail("sender got message"));
    t.context.client
        .channel("test_channel_2")
        .member("member_3")
        .on("test", ()=> t.pass("receiver got message"));
    t.context.message("test_channel_2","member_3","member_2")
});

test("receiving a message to a specific member triggers also the channel the member is part of", t => {
    t.context.client
        .channel("test_channel_1")
        .on("test", () => t.pass("_channel triggered"));
    t.context.message("test_channel_1","member_1","member_1");
});

test("Client hands incoming message to specific member correctly and does NOT trigger on other members in channel", t => {
    t.context.client
        .channel("test_channel_2")
        .member("member_3")
        .on("test", () => t.fail("Invalid member got message"));
    t.context.client
        .channel("test_channel_2")
        .member("member_2")
        .on("test", () => t.pass("Valid member got message"));
    t.context.message("test_channel_2","member_2","member_2");
});

test.cb("receiving a message to broadcast (Message.Addresses.ALL) triggers every member of the channel", t => {
    const receivers = [];
    const markAsReceiver = member => {
        receivers.push(member);
        if(receivers.length === t.context.client.channel("test_channel_2").members.length) t.end();
    };
    t.context.client
        .channel("test_channel_2")
        .members
        .forEach(m => m.on("test", () => markAsReceiver(m.id)));
    t.context.message("test_channel_2",Message.Addresses.ALL,"member_3");
});


test.cb("receiving a message to everyone (Message.Addresses.ALL as channel) triggers on each sender handler in each channel the sender is part of", t => {
    const receivers = [];
    const markAsReceiver = member => {
        receivers.push(member);
        console.log('triggered member', member);
        if(receivers.length === 2) t.end();
    };
    t.context.client.channels.forEach(c => c.on("test", () => markAsReceiver(c.name)));
    t.context.message(Message.Addresses.ALL,Message.Addresses.ALL,"member_2");
});
