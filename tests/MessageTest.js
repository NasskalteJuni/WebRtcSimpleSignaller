const test = require("ava");
const Message = require("../src/Utils/Message");

test("creating a Message without any parameter sets defaults or undefined", t => {
    const m = new Message();
    t.true(m.sent instanceof Date && typeof m.id === "string");
    t.true(m.sender===undefined&&m.receiver===undefined&&m.channel===undefined&&m.forwarded===undefined&&m.type===undefined&&m.content===undefined&&m.answered===undefined);
});

test("creating a Message by passing in the properties as an Object works", t => {
    const m = new Message({type: "t", content: "c", sender: "s", receiver: "r", channel: "c", sent: new Date(0)});
    t.true(m.type==="t"&&m.content==="c"&&m.sender==="s"&&m.receiver==="r"&&m.channel==="c"&&m.sent.toString()===new Date(0).toString());
});

test("creating a message by passing in a message object works like copying/cloning the passed in data", t => {
    const o = new Message({type: "t", content: "c", sender: "s", receiver: "r", channel: "c", sent: new Date(0)});
    const m = new Message(o);
    t.true(m.type==="t"&&m.content==="c"&&m.sender==="s"&&m.receiver==="r"&&m.channel==="c"&&m.sent.toString()===new Date(0).toString());
});


test("creating a Message and using the with-methods sets the attributes on new Messages (but does not change the original)", t => {
    const o = new Message();
    const m = o.withType("t").withContent("c").withChannel("c").withReceiver("r").withSender("s");
    t.true(m.type==="t"&&m.content==="c"&&m.channel==="c"&&m.receiver==="r"&&m.sender==="s");
    t.true(o.type===undefined&&o.content===undefined&&o.channel===undefined&&o.receiver===undefined&&o.sender===undefined);
});

test("using the with methods does not change the message id", t => {
    const o = new Message();
    const m = o.withSender("s").withReceiver("r");
    t.true(m.id === o.id);
});

test("using the answer method switches sender and receiver and sets the original message id as answered field", t => {
    const o = new Message();
    const mid = o.id;
    const m = o.withSender("s").withReceiver("r").withChannel("c").asAnswer("t","c");
    t.true(m.sender==="r"&&m.receiver==="s"&&m.channel==="c"&&m.answered===mid&&m.type==="t"&&m.content==="c");
});

