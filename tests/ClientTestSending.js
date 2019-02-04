/**
 * Very superficial tests that do not cover the functions in depth,
 * but hopefully guarantee basic functionality
 * @author nasskaltejuni
 * */
// test functionality dependencies
const test = require("ava");
const sinon = require("sinon");
// custom components used or up for test
const Signaller = require("../Client/Signaller");
const Channel = require("../Client/Channel");
const Member = require("../Client/Member");
const Message = require("../Utils/Message");

test.beforeEach(t => {
    t.context.signaller = new Signaller("wss://example.com");
    //bypass auth and just set the id
    t.context.signaller.id = "member_self";
    // stub every method on the websocket (including send) and prevent default socket behaviour (like connecting)
    t.context.signaller.socket = sinon.stub(t.context.signaller.socket);
    // just act like these have been added/created already
    const testChannel1 = new Channel("test_channel_1", t.context.signaller);
    const testChannel2 = new Channel("test_channel_2", t.context.signaller);
    const testMember1 = new Member("member_1", testChannel1);
    const testMember2 = new Member("member_2", testChannel2);
    const testMember3 = new Member("member_3", testChannel2);
    t.context.signaller.channels.push(testChannel1);
    t.context.signaller.channels.push(testChannel2);
    testChannel1.members.push(testMember1);
    testChannel2.members.push(testMember2);
    testChannel2.members.push(testMember3);
});

test.afterEach(t => {
    t.context.signaller.socket.send.restore();
});

// basic sending functionality creates messages as expected

test("Sending a message on a member of a _channel creates a message specifically for that member in that _channel", t => {
    t.context.signaller.channel("test_channel_2").member("member_3").send("test","content");
    const msg = new Message(JSON.parse(t.context.signaller.socket.send.args[0]));
    t.true(msg.to === "member_3" && msg.channel === "test_channel_2");
});


test("sending a message over a _channel by (type, content) acts as broadcast", t => {
    t.context.signaller.channel("test_channel_2").send("test","content");
    const msg = new Message(JSON.parse(t.context.signaller.socket.send.args[0]));
    t.true(msg.to === Message.ALL && msg.channel === "test_channel_2");
});


test("using send on a _channel by passing a message just acts as send without changing given sender and receiver", t => {
    t.context.signaller.channel("test_channel_2").send(new Message({to: "test-receiver", from: "test-sender"}));
    const msg = new Message(JSON.parse(t.context.signaller.socket.send.args[0]));
    t.true(msg.to === "test-receiver" && msg.from === "test-sender")
});

test("using send on a member by passing a message just acts as send without changing given sender and receiver", t => {
    t.context.signaller.channel("test_channel_2").member("member_3").send(new Message({to: "test-receiver", from: "test-sender"}));
    const msg = new Message(JSON.parse(t.context.signaller.socket.send.args[0]));
    t.true(msg.to === "test-receiver" && msg.from === "test-sender")
});

test("using send by passing in a message with lacking _channel and member adds those attributes", t => {
    t.context.signaller.channel("test_channel_2").member("member_3").send(new Message({type: "test", content: "content"}));
    const msg = new Message(JSON.parse(t.context.signaller.socket.send.args[0]));
    t.true(msg.to === "member_3" && msg.channel === "test_channel_2");
});
