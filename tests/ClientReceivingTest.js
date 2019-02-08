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
    t.context.client._id = "member_self";
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
    t.context.testChannel3.members.push(t.context.testMember2Channel3);
    t.context.message = (channel, sender, receiver) => t.context.client._messagehandler(new Message({channel, sender, receiver, type: "test", content: "example"}))
});

test("Client hands incoming messages to specific sending member correctly and triggers handle on member", t => {
    const sender = t.context.testMember1.id;
    const channel = t.context.testChannel1.id;
    t.context.client
        .channel(channel)
        .member(sender)
        .on("test", content => content === "example" ? t.pass("member received valid message") : t.fail("Invalid message content"));
    t.context.message(channel, sender, sender);
});

test("Client hands incoming messages to correct member (the sender and not the receiver, identifying the receiver is done on the server)", t => {
    t.context.client
        .channel("test_channel_2")
        .member("member_2")
        .on("test", ()=> t.true("triggered on sender"));
    t.context.client
        .channel("test_channel_2")
        .member("member_3")
        .on("test", ()=> t.fail("triggered on receiver"));
    t.context.message("test_channel_2", "member_2", "member_3")
});

test("receiving a message from a sender in a specific channel triggers also the channel the sender is part of", t => {
    t.context.client
        .channel("test_channel_1")
        .on("test", () => t.pass("_channel triggered"));
    t.context.message("test_channel_1", "member_1", "member_1");
});

test("Client hands incoming message from a specific member correctly and does NOT trigger on other members in channel", t => {
    t.context.client
        .channel("test_channel_2")
        .member("member_3")
        .on("test", () => t.fail("Invalid member got message"));
    t.context.client
        .channel("test_channel_2")
        .member("member_2")
        .on("test", () => t.pass("Valid member got message"));
    t.context.message("test_channel_2", "member_2", "member_2");
});

test.cb("receiving a message to broadcast (Message.Addresses.ALL) for a specific channel still only triggers for the sender", t => {
    const sender = t.context.testMember3;
    const channel = t.context.testChannel2.id;
    t.context.client
        .channel(channel)
        .member(sender)
        .on('test', () => t.pass("triggered on sender"));
    t.context.message(channel, sender, Message.Addresses.ALL);
});


test.cb("receiving a message with Message.Addresses.ALL as channel triggers on each sender handler in each channel the sender is part of", t => {
    const receivers = [];
    const markAsReceiver = member => {
        receivers.push(member);
        console.log('triggered member', member);
        if(receivers.length === 2) t.end();
    };
    const sender = "member_2";
    t.context.client.channel(t.context.testChannel2.id).member(sender).on("test", () => markAsReceiver('channel 2'));
    t.context.client.channel(t.context.testChannel3.id).member(sender).on("test", () => markAsReceiver('channel 3'));
    t.context.message(Message.Addresses.ALL, sender, Message.Addresses.ALL);
});
