/**
 * Very superficial tests that do not cover the functions in depth,
 * but hopefully guarantee basic functionality
 * @author nasskaltejuni
 * */
// test functionality dependencies
const test = require("ava");
const sinon = require("sinon");
// custom components used or up for test
const Signaller = require("../src/Client/ClientHandler");
const Channel = require("../src/Client/ChannelHandler");
const Member = require("../src/Client/MemberHandler");
const Message = require("../src/Utils/Message");

test.beforeEach(t => {
    t.context.client = new Signaller("wss://example.com");
    //bypass auth and just set the id
    t.context.client.id = "member_self";
    // stub every method on the websocket (including send) and prevent default socket behaviour (like connecting)
    t.context.client.socket = sinon.stub(t.context.client.socket);
    // just act like these have been added/created already
    const testChannel1 = new Channel("test_channel_1", t.context.client);
    const testChannel2 = new Channel("test_channel_2", t.context.client);
    const testMember1 = new Member("member_1", testChannel1);
    const testMember2 = new Member("member_2", testChannel2);
    const testMember3 = new Member("member_3", testChannel2);
    t.context.client.channels.push(testChannel1);
    t.context.client.channels.push(testChannel2);
    testChannel1.members.push(testMember1);
    testChannel2.members.push(testMember2);
    testChannel2.members.push(testMember3);
});

test.afterEach(t => {
    t.context.client.socket.send.restore();
});

// basic sending functionality creates messages as expected

test("Sending a message on a member of a _channel creates a message specifically for that member in that _channel", t => {
    t.context.client.channel("test_channel_2").member("member_3").send("test","content");
    const msg = new Message(JSON.parse(t.context.client.socket.send.args[0]));
    t.true(msg.receiver === "member_3" && msg.channel === "test_channel_2");
});


test("sending a message over a _channel by (type, content) acts as broadcast", t => {
    t.context.client.channel("test_channel_2").send("test","content");
    const msg = new Message(JSON.parse(t.context.client.socket.send.args[0]));
    t.true(msg.receiver === Message.ALL && msg.channel === "test_channel_2");
});


test("using send on a _channel by passing a message just acts as send without changing given sender and receiver", t => {
    t.context.client.channel("test_channel_2").send(new Message({to: "test-receiver", from: "test-sender"}));
    const msg = new Message(JSON.parse(t.context.client.socket.send.args[0]));
    t.true(msg.receiver === "test-receiver" && msg.sender === "test-sender")
});

test("using send on a member by passing a message just acts as send without changing given sender and receiver", t => {
    t.context.client.channel("test_channel_2").member("member_3").send(new Message({to: "test-receiver", from: "test-sender"}));
    const msg = new Message(JSON.parse(t.context.client.socket.send.args[0]));
    t.true(msg.receiver === "test-receiver" && msg.sender === "test-sender")
});

test("using send by passing in a message with lacking _channel and member adds those attributes", t => {
    t.context.client.channel("test_channel_2").member("member_3").send(new Message({type: "test", content: "content"}));
    const msg = new Message(JSON.parse(t.context.client.socket.send.args[0]));
    t.true(msg.receiver === "member_3" && msg.channel === "test_channel_2");
});
