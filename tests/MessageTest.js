const Message = require('../src/Utils/Message');

describe("Message creation works as expected", () => {
    test("creating a Message without any parameter sets defaults or undefined", () => {
        const m = new Message();
        expect(m.sent instanceof Date).toBeTruthy();
        expect(typeof m.id).toBe('string');
        expect(m.sender).toBeUndefined();
        expect(m.receiver).toBeUndefined();
        expect(m.channel).toBeUndefined();
    });

    test("creating a Message by passing in the properties as an Object works", () => {
        const props = {type: "t", content: "c", sender: "s", receiver: "r", channel: "c", sent: new Date(0)};
        const m = new Message(props);
        expect(m.asDataObject()).toMatchObject(props);
    });

    test("creating a message by passing in a message object works like copying/cloning the passed in data", () => {
        const o = new Message({type: "t", content: "c", sender: "s", receiver: "r", channel: "c", sent: new Date(0)});
        const m = new Message(o);
        expect(m).toMatchObject(o);
    });
});

describe("Message Object is immutable", () => {

    test("trying to directly set a property on the message object does not work and throws an Error in strict mode", () => {
        "use strict";
        const m = new Message();
        expect(() => m.sender = 'test').toThrowError();
        expect(m.sender).toBeUndefined();
    });

    test("creating a Message and using the with-methods sets the attributes on new Messages (but does not change the original)", () => {
        const o = new Message();
        const m = o.withType("t").withContent("c").withChannel("c").withReceiver("r").withSender("s");
        expect(m).toMatchObject({type: 't', content: 'c', channel:'c', receiver: 'r', sender: 's'});
        expect(m).not.toBe(o);
    });

    test("creating a Message and using the with-methods sets the attributes on new Messages (but does not change the original)", () => {
        const o = new Message();
        const m = o.withType("t").withContent("c").withChannel("c").withReceiver("r").withSender("s");
        expect(m).toMatchObject({type: 't', content: 'c', channel:'c', receiver: 'r', sender: 's'});
        expect(o.type).toBeUndefined();
        expect(o.content).toBeUndefined();
        expect(o.channel).toBeUndefined();
        expect(o.sender).toBeUndefined();
        expect(o.receiver).toBeUndefined();
    });

    test("using the with methods does not change the message id", () => {
        const o = new Message();
        const m = o.withSender("s").withReceiver("r");
        expect(o.id).toBe(m.id);
    });

});

describe("Utility methods of the message object work", () => {

    test("using the answer method switches sender and receiver and sets the original message id as answered field", () => {
        const o = new Message();
        const mid = o.id;
        const m = o.withSender("s").withReceiver("r").withChannel("c").asAnswer("t","c");
        expect(m.sender).toBe('r');
        expect(m.receiver).toBe('s');
        expect(m.channel).toBe('c');
        expect(m.type).toBe('t');
        expect(m.content).toBe('c');
        expect(m.answered).toBe(mid);
    });

});

