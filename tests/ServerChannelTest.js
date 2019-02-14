const User = require('../src/Server/User');
const Channel = require('../src/Server/Channel');


const fakeWebSocket = () => ({socketid: Math.random().toString(32).substr(2)});
const testUserAId = "a";
const testUserA = new User(testUserAId, fakeWebSocket());
const testUserBId = "b";
const testUserB = new User(testUserBId, fakeWebSocket());
const openedDummyId = "1";
const openedDummy = new Channel(openedDummyId);
const closedDummyId = "2";
const closedDummy = new Channel(closedDummyId);


beforeEach(() => {
    openedDummy.open();
    closedDummy.close();
    testUserA.authenticate();
    testUserB.authenticate();
});

afterEach(() => {
    Channel.all.forEach(channel => channel.id !== openedDummyId ? Channel.close(channel) : false);
    closedDummy.members.forEach(user => closedDummy.removeMember(user));
    openedDummy.members.forEach(user => openedDummy.removeMember(user));
});

describe("The methods to retrieve (read) channels works as expected", () => {

    test('Channel.all is returning every opened channel', () => {
        expect(Channel.all).toContain(openedDummy);
    });

    test('Channel.all does not return closed channels', () => {
        expect(Channel.all).not.toContain(closedDummy);
    });

    test('Opened Channels can be retrieved by their id', () => {
        expect(Channel.byId(openedDummyId)).toBe(openedDummy);
    });

    test('Closed Channels can not be retrieved by their id but yield null', () => {
        expect(Channel.byId(closedDummyId)).toBeNull();
    });

    test('Opened Channels can be found by their members', () => {
        testUserA.join(openedDummy);
        const foundChannelsForMember = Channel.byMember(testUserA);
        expect(foundChannelsForMember).toContain(openedDummy);
        expect(foundChannelsForMember.length).toBe(1);
    });

    test('Using a User that is in more than one channel retrieves every Channel that the user is part of', () => {
        const otherChannel = new Channel('other');
        Channel.open(otherChannel);
        testUserA.join(openedDummy);
        testUserA.join(otherChannel);
        const foundChannels = Channel.byMember(testUserAId);
        expect(foundChannels).toContain(openedDummy);
        expect(foundChannels).toContain(otherChannel);
        expect(foundChannels.length).toBe(2);
    });
});

describe("Channel objects are immutable", () => {

});

describe('Channel utils work as expected', () => {

    test('Unique works', () => {
        const unique = Channel.unique([openedDummy, openedDummy])
        expect(unique).toContain(openedDummy);
        expect(unique.length).toBe(1);
    });

    test('Exclude works', () => {
        const excluded = Channel.exclude([openedDummy, openedDummy], openedDummyId);
        expect(excluded).not.toContain(openedDummy);
        expect(excluded.length).toBe(0);
    });

});


describe("Channel objects are immutable", () => {
    "use strict";

    test('creating a channel by passing an id AND member array works as expected', () => {
        const newlyId = "c";
        const newlyUsers = [testUserAId, testUserBId];
        const newly = new Channel(newlyId, newlyUsers);
        expect(newly.id).toBe(newlyId);
        expect(newly.members).toContain(testUserAId);
        expect(newly.members).toContain(testUserBId);
        expect(newly.members.length).toBe(2);
    });

    test('the immutable methods do create a new Object and do not change the existing one', () => {
        const newly = closedDummy.withId("d").withMembers([testUserAId]);
        expect(closedDummy.id).toBe(closedDummyId);
        expect(newly.id).toBe("d");
    });

    test('trying to set a property directly does not work or throws in strict mode', () => {
        expect(() => closedDummy.id = "42").toThrowError();
        expect(closedDummy.id).not.toBe("42");
    });
});

describe("join and leave works as expected", () => {

    test('just creating a channel does add the channel to the list of tracked channels', () => {
        new Channel('test');
        expect(Channel.byId('test')).toBeNull();
    });

    test('Opening a channel adds it to the list of managed channels', () => {
        Channel.open(closedDummy);
        expect(Channel.all).toContain(closedDummy);
    });

    test('adding a member by Id works', () => {
        openedDummy.addMember(testUserAId);
        expect(openedDummy.members).toContain(testUserAId);
    });

    test('removing a member by Id works', () => {
        openedDummy._members.push(testUserAId);
        openedDummy.removeMember(testUserAId);
        expect(openedDummy.members).not.toContain(testUserAId);
    });

    test('closing a channel removes it from all tracked channels', () => {
        openedDummy.close();
        expect(Channel.byId(openedDummyId)).toBeNull();
    });

    test('opening an already open channel has no additional effects and does not throw an error', () => {
        expect(() => openedDummy.open()).not.toThrowError();
        expect(Channel.all).toContain(openedDummy);
    });

    test('closing an already closed channel has no additional effects and does not throw an error', () => {
        expect(() => closedDummy.close()).not.toThrowError();
        expect(Channel.all).not.toContain(closedDummy);
    });

});
