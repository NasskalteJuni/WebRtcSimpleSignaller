// const test = require('ava');
// const sinon = require('sinon');
// const Client = require('../src/Client/ClientHandler');
// const Channel = require('../src/Client/ChannelHandler');
// const Message = require('../src/Utils/Message');
//
// test.before(t => {
//     t.context.client = new Client("wss://localhost");
//     t.context.client._socket = sinon.stub(t.context.client._socket);
//     t.context.testChannelId = "test_channel_1";
//     t.context.testChannel = new Channel(t.context.testChannelId, t.context.client);
//     t.context.client._socket.send = function(msg){
//         // Mock this as an echo function, with no message leaving to the client
//         msg = new Message(JSON.parse(msg));
//         switch(msg.type){
//             case "auth":
//                 break;
//             case "join":
//                 break;
//             case "leave":
//                 break;
//         }
//         t.context.client._messagehandler(msg.asAnswer());
//     };
//     t.context.message = (msg) => t.context.client._messagehandler(msg);
// });
//
// test.beforeEach(t => {
//     t.context.client._channels = [t.context.testChannel];
// });
//
// test.afterEach(t => {
//     t.context.client._channels = [];
// });
//
// test("Retrieving every channel this client is part of works", t => {
//     t.true(t.context.client.channels.indexOf(t.context.testChannel) >= 0)
// });
//
// test("Authentication works as expected", t => {
//     t.true(t.context.client.id === null);
//     t.context.client.auth("id","token").then(t.true(t.context.id === "id")).catch(t.fail);
// });
//
// test("Joining a channel by passing the channel id to join works", t => {
//     const channel = "someFakeChannel";
//     t.context.client.join(channel)
//         .then(() => {
//             if(t.context.client.channels.findIndex(c => c.id === channel) >= 0) t.pass("joined");
//             else t.fail("did not join");
//         }).catch(t.fail);
// });
//
// test("Leaving a channel by passing the channel id to leave works", t => {
//     t.context.client.leave(t.context.testChannel)
//         .then(() => {
//             if(t.context.client.channels.findIndex(c => c.id === testChannel.id) >= 0) t.fail("did not leave");
//             else t.pass("left");
//         }).catch(t.fail);
// });
