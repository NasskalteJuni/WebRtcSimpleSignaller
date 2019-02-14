const User = require('../src/Server/User');
const Channel = require('../src/Server/Channel');

const fakeWebSocket = () => ({socketid: Math.random().toString(32).substr(2)});
const unauthenticatedDummyId = "1";
const unauthenticatedDummySocket = fakeWebSocket();
const unauthenticatedDummy = new User(unauthenticatedDummyId, unauthenticatedDummySocket);
const authenticatedDummyId = "2";
const authenticatedDummySocket = fakeWebSocket();
const authenticatedDummy = new User(authenticatedDummyId, authenticatedDummySocket);


beforeEach(() => {
    // bring everything in the correct state
    User.unauthenticate(unauthenticatedDummy);
    User.authenticate(authenticatedDummy);
});

afterEach(() => {
    // clean up the dummies
    User.all.forEach(user => User.unauthenticate(user)); // disconnect possible new users
    User.authenticate(authenticatedDummy); // authenticate the dummy for authenticated
});

describe("Users can be retrieved (read access) with a set of methods", () => {

    test('Authenticated users are part of User.all', () => {
        expect(User.all).toContain(authenticatedDummy);
    });


    test('A new instance of a user is created by passing in its id and its Websocket', () => {
        expect(User.all).not.toContain(unauthenticatedDummy);
    });

    test('An authenticated User can be retrieved by its id', () =>{
        expect(User.byId(authenticatedDummyId)).toBe(authenticatedDummy);
    });

    test('An unauthenticated User cannot be retrieved by its id (since unautenticated users dont exist on this realm)', () => {
        expect(User.byId(unauthenticatedDummyId)).toBeNull();
    });

    test('getting a user by its socket works (for authenticated users)', () => {
        expect(User.bySocket(authenticatedDummySocket)).toBe(authenticatedDummy);
    });

    test('getting a user by a new (not-known) socket returns null', () => {
        expect(User.bySocket(fakeWebSocket())).toBeNull();
    });
});

describe("User utility functions work", () => {
    test('excluding a specific user works', () => {
        const excluded = User.exclude([unauthenticatedDummy, authenticatedDummy], unauthenticatedDummyId);
        expect(excluded).toContain(authenticatedDummy);
        expect(excluded).not.toContain(unauthenticatedDummy);
    });

    test('filtering duplicate users works', () => {
        const unique = User.unique([unauthenticatedDummy, unauthenticatedDummy, authenticatedDummy]);
        expect(unique).toContain(unauthenticatedDummy);
        expect(unique).toContain(authenticatedDummy);
        expect(unique.length).toBe(2);
    });
});

describe("The User Object is immutable and throws an Error in strict mode", () => {
    "use strict";

    test('The User Object is immutable and disallows direct manipulation of .id and .socket', () => {
        expect(() => unauthenticatedDummy.id = "2").toThrowError();
        expect(() => unauthenticatedDummy.socket = null).toThrowError();
    });

    test('calling the immutable withId and withSocket methods creates a new, but matching Object', () => {
        const original = unauthenticatedDummy;
        const newly = original.withId("2").withSocket(null);
        expect(original).not.toBe(newly);
        expect(newly.id).toBe("2");
        expect(newly.socket).toBeNull();
        expect(newly.id).not.toBe(original.id);
    });
});


describe("authentication and deauthentication works as expected", () => {

    test('just creating a user does not add it to the list of authenticated users but calling authenticate does', () => {
        const testId = "3";
        new User(testId, fakeWebSocket());
        expect(User.byId(testId)).toBeNull();
    });

    test('calling authenticate on an unauthenticated user adds the user to the tracked users', () => {
        const testId = "3";
        (new User(testId, fakeWebSocket())).authenticate();
        expect(User.byId(testId)).not.toBeNull();
    });

    test('calling authenticate multiple times is no different than once and throws no error', () => {
        authenticatedDummy.authenticate();
        expect(() => authenticatedDummy.authenticate()).not.toThrowError();
        expect(User.byId(authenticatedDummyId)).not.toBeNull();
    });

    test('calling unauthenticate removes a user from the list of tracked users', () => {
        authenticatedDummy.unauthenticate();
        expect(User.byId(authenticatedDummyId)).toBeNull();
    });

    test('calling unauthenticate multiple times does not behave different than calling it only once', () => {
        unauthenticatedDummy.unauthenticate();
        expect(() => unauthenticatedDummy.unauthenticate()).not.toThrowError();
        expect(() => User.byId(unauthenticatedDummy).toBeNull())
    });

});
