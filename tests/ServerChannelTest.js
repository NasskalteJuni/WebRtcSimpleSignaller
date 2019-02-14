// const test = require('ava');
// const User = require('../src/Server/User');
// const Channel = require('../src/Server/Channel');
//
// test.before(t => {
//     t.context.fakeWebSocket = () => ({socketid: Math.random().toString(32).substr(2)});
//     t.context.testUserAId = "a";
//     t.context.testUserA = new User(t.context.testUserAId,t.context.fakeWebSocket());
//     t.context.testUserBId = "b";
//     t.context.testUserB = new User(t.context.testUserBId,t.context.fakeWebSocket());
//     t.context.openedDummyId = "1";
//     t.context.openedDummy = new Channel(t.context.openedDummyId);
//     t.context.closedDummyId = "2";
//     t.context.closedDummy = new Channel(t.context.closedDummyId);
// });
//
// test.beforeEach(t => {
//     t.context.openedDummy.open();
//     t.context.closedDummy.close();
//     t.context.testUserA.authenticate();
//     t.context.testUserB.authenticate();
// });
//
// test.afterEach(t => {
//     Channel.all.forEach(channel => channel.id !== t.context.openedDummyId ? Channel.close(channel) : false);
//     t.context.closedDummy.members.forEach(user => t.context.closedDummy.removeMember(user));
//     t.context.openedDummy.members.forEach(user => t.context.openedDummy.removeMember(user));
// });
//
// test('Channel.all is returning every opened channel', t => {
//     t.true(Channel.all.findIndex(channel => channel.id === t.context.openedDummyId) !== -1);
// });
//
// test('Channel.all does not return closed channels', t => {
//     t.true(Channel.all.findIndex(channel => channel.id === t.context.closedDummyId) === -1)
// });
//
// test('creating a channel by passing an id AND member array works as expected', t => {
//     const newlyId = "c";
//     const newlyUsers = [t.context.testUserAId, t.context.testUserBId];
//     const newly = new Channel(newlyId, newlyUsers);
//     t.true(newly.id === newlyId && newly.members.filter(m => newlyUsers.indexOf(m) >= 0).length === newlyUsers.length && newly.members.length === newlyUsers.length);
// });
//
// test('the immutable methods do create a new Object and do not change the existing one', t => {
//     const newly = t.context.closedDummy.withId("d").withMembers([t.context.testUserAId]);
//     t.true(newly.id !== t.context.closedDummy && t.context.closedDummy.id === t.context.closedDummyId && newly.members.length !== t.context.closedDummy.members.length);
// });
//
// test('Opened Channels can be retrieved by their id', t => {
//     t.true(Channel.byId(t.context.openedDummyId) !== null);
// });
//
// test('Closed Channels can not be retrieved by their id but yield null', t => {
//     t.true(Channel.byId(t.context.closedDummyId) === null);
// });
//
// test.serial('Opened Channels can be found by their members', t => {
//     t.context.testUserA.join(t.context.openedDummy);
//     const foundChannelsForMember = Channel.byMember(t.context.testUserA);
//     t.true(foundChannelsForMember.length > 0 && foundChannelsForMember.indexOf(t.context.openedDummy) !== -1);
// });
//
// test.serial('Using a User that is in more than one channel retrieves every Channel that the user is part of', t => {
//     const otherChannel = new Channel('other');
//     Channel.open(otherChannel);
//     t.context.testUserA.join(t.context.openedDummy);
//     t.context.testUserA.join(otherChannel);
//     const foundChannels = Channel.byMember(t.context.testUserAId);
//     t.true(foundChannels.length === 2 && foundChannels.indexOf(otherChannel) !== -1 && foundChannels.indexOf(t.context.openedDummy) !== -1);
// });
//
// test.serial('Opening a channel adds it to the list of managed channels', t => {
//     Channel.open(t.context.closedDummy);
//     t.true(Channel.all.indexOf(t.context.closedDummy) !== -1);
// });
//
// test.serial('Closing a channel removes it from the list of managed channels', t => {
//     Channel.close(t.context.openedDummyId);
//     t.true(Channel.all.indexOf(t.context.openedDummy) === -1);
// });
//
// test.serial('Opening an already open channel does not change the opened channels and returns false', t => {
//     const alreadyOpenedChannelNumber = Channel.all.length;
//     const didItOpen = Channel.open(t.context.openedDummy);
//     t.true(alreadyOpenedChannelNumber === Channel.all.length && didItOpen === false);
// });
//
// test.serial('Closing an already closed channel does not change the opened channels and returns false', t => {
//     const alreadyOpenedChannelNumber = Channel.all.length;
//     const didItClose = Channel.close(t.context.closedDummy);
//     t.true(alreadyOpenedChannelNumber === Channel.all.length && didItClose === false);
// });
//
// test.serial('adding a member by its ID to a channel works', t => {
//     t.context.openedDummy.addMember(t.context.testUserBId);
//     t.true(t.context.openedDummy.members.indexOf(t.context.testUserBId) !== -1);
// });
//
// test.serial('removing a member from a channel by its ID works', t => {
//     t.context.openedDummy.addMember(t.context.testUserAId);
//     t.context.openedDummy.removeMember(t.context.testUserAId);
//     t.true(t.context.openedDummy.members.indexOf(t.context.testUserAId) === -1);
// });
//
// test('Unique works', t => {
//     t.true(Channel.unique([t.context.openedDummy, t.context.openedDummy]).length === 1);
// });
//
// test('Exclude works', t => {
//     t.true(Channel.exclude([t.context.openedDummy, t.context.openedDummy], t.context.openedDummyId).length === 0);
// });