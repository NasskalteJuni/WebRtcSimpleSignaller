/**
 * Very superficial tests that do not cover the functions in depth,
 * but hopefully guarantee basic functionality
 * @author nasskaltejuni
 * */
const test = require('ava');
const User = require('../Server/User');
const Channel = require('../Server/Channel');

test.before(t => {
    // generate dummies and a few utility functions for the text context
    t.context.fakeWebSocket = () => ({socketid: Math.random().toString(32).substr(2)});
    t.context.unauthenticatedDummyId = "1";
    t.context.unauthenticatedDummySocket = t.context.fakeWebSocket();
    t.context.unauthenticatedDummy = new User(t.context.unauthenticatedDummyId, t.context.unauthenticatedDummySocket);
    t.context.authenticatedDummyId = "2";
    t.context.authenticatedDummySocket = t.context.fakeWebSocket();
    t.context.authenticatedDummy = new User(t.context.authenticatedDummyId, t.context.authenticatedDummySocket);
    t.context.testChannelId = "test";
    t.context.testChannel = new Channel(t.context.testChannelId, []);
});

test.beforeEach(t => {
    // bring everything in the correct state
    User.unauthenticate(t.context.unauthenticatedDummy);
    User.authenticate(t.context.authenticatedDummy);
    Channel.open(t.context.testChannel)
});

test.afterEach(t => {
    // clean up the dummies
    User.all.forEach(user => User.unauthenticate(user)); // disconnect possible new users
    User.authenticate(t.context.authenticatedDummy); // authenticate the dummy for authenticated
});

test('Authenticated users are part of User.all', t =>{
    t.true(User.all.findIndex(user => user.id === t.context.authenticatedDummyId) !== -1);
});

test('Unauthenticated users are not part of User.all', t =>{
    t.true(User.all.findIndex(user => user.id === t.context.unauthenticatedDummyId) === -1);
});

test('A new instance of a user is created by passing in its id and its Websocket', t => {
    t.true(t.context.unauthenticatedDummy.id === t.context.unauthenticatedDummyId && t.context.unauthenticatedDummy.socket === t.context.unauthenticatedDummySocket);
});

test('The User Object is immutable and disallows direct manipulation of .id and .socket', t => {
    t.throws(() => t.context.unauthenticatedDummy.id = "2");
    t.throws(() => t.context.unauthenticatedDummy.socket = null);
});

test('calling the immutable withId and withSocket methods creates a new, but matching Object', t => {
    const original = t.context.unauthenticatedDummy;
    const newly = original.withId("2").withSocket(null);
    t.true(original !== newly && newly.id === "2" && newly.socket === null);
    t.true(original.id !== newly.id);
});

test('An authenticated User can be retrieved by its id', t =>{
    t.true(User.byId(t.context.authenticatedDummyId).id === t.context.authenticatedDummyId);
});

test('An unauthenticated User cannot be retrieved by its id (since unautenticated users dont exist on this realm)', t => {
    t.true(User.byId(t.context.unauthenticatedDummyId) === null);
});

// everything changing global state must be serial!
test.serial('just creating a user does not add it to the list of authenticated users but calling authenticate does', t => {
    const testId = "3";
    const unauthenticated = new User(testId, t.context.fakeWebSocket());
    t.true(User.byId(testId) === null);
    User.authenticate(unauthenticated);
    t.true(User.byId(testId) !== null);
    User.unauthenticate(unauthenticated);
});

test.serial('calling the disconnect method removes the user from the list of authenticated users', t => {
    User.authenticate(t.context.unauthenticatedDummy);
    const numberOfAuthenticatedUsers = User.all.length;
    User.unauthenticate(t.context.unauthenticatedDummyId);
    t.true(User.all.length === numberOfAuthenticatedUsers-1);
    t.true(User.byId(t.context.unauthenticatedDummyId) === null);
});

test.serial('getting a user by its socket works (for authenticated users)', t => {
    User.authenticate(t.context.authenticatedDummy);
    const foundForDummySocket = User.bySocket(t.context.authenticatedDummy.socket);
    t.true(foundForDummySocket !== null && foundForDummySocket.id === t.context.authenticatedDummyId);
    t.true(User.bySocket(t.context.fakeWebSocket()) === null);
});

test('a user that did not join any channels has an empty array for .channels', t => {
    t.true(t.context.authenticatedDummy.channels.length === 0);
});

test.serial('user joining channel adds the user as a member, leaving removes the user as member', t => {
    const currentMemberNumber = t.context.testChannel.members.length;
    t.context.authenticatedDummy.join(t.context.testChannelId);
    t.true(t.context.testChannel.members.length === currentMemberNumber+1 && t.context.testChannel.members.indexOf(t.context.authenticatedDummyId) !== -1);
    t.context.authenticatedDummy.leave(t.context.testChannelId);
    t.true(t.context.testChannel.members.length === currentMemberNumber);
});

test('excluding a specific user works', t => {
    t.true(User.exclude([t.context.unauthenticatedDummy, t.context.authenticatedDummy], t.context.unauthenticatedDummyId).length === 1);
});

test('filtering duplicate users works', t => {
    t.true(User.unique([t.context.unauthenticatedDummy, t.context.unauthenticatedDummy, t.context.authenticatedDummy]).length === 2);
});

