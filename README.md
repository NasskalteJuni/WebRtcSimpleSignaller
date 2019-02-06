# WebRTC Simple Signaller

Version: 0.1
Status: Not Finished, not working

# What the f is this? (And what does it do)
Sometimes, applications may need to be able to send application data to specific users in specific channels.
This is a so called Signaller, that handles the described transfer.
The main purpose of a Signaller is to handle sending messages to and receiving messages from users.
This can be seen as a kind of chat app. But it is also a common requirement for building webrtc apps



## Message handling on the client side:

### Basics
The client only knows channels he is part of and in conclusion, only members of these channels.
Channels do not exist as Objects when the client has not joined them, the same goes for members.
The Channel and Member Objects trigger on Message reception, more precise:
A message of type 'someCustomType' sent by User A in Channel c1 triggers on .channel("c1").member("A").on("someCustomType", ...).
After triggering on the specific user, the someCustomType-Event raises to the higher level and the channel is triggered.
Message sending works in a similar way.
To send a message to the channel member User B in Channel c1, one uses the corresponding client objects:
This means invoking .channel("c1").member("B").send("someOtherCustomType", ...)

### Broadcasts
One could send and receive messages for each client in a channel,
but broadcasting is so common that it is even included in this simple signaller.
To broadcast to every user in a channel, just invoke the send-method on the corresponding channel object.
This will set the receiver to Everyone and tells the server to forward the message to every user that is currently in this channel.

# Look Up table
If you want to quickly get a grasp about who receives which messages, you can use this cheat-table

Sender is always UserA:

Receiver        Channel         who receives it                                 on which node
UserB           ChannelA        UserB                                           UserA
ALL             ChannelA        Every User in ChannelA except UserA             UserA
ALL             ALL             Every User in every Channel of UserA except A   UserA
UserB           ALL             UserB                                           UserA in Channels of A

### Advanced Message handling
As already explained, the client side message handling has the form of a tree with the signaller being the root note,
the channels as its children and the members of the channels as the channels children.
The basics also described how to control, who receives messages and to handle only messages on specific members.
More complex applications may need a bit more freedom on message handling,
that does not bind the receiver to the current user or channel node used.
For this reason, the send function accepts Message Objects instead of only pairs of type and content.
The Message Class offers more freedom to setting receiver, sender and channel than the previous way.
In fact .send(type, content) uses the underlying Message Class to communicate with the server,
since every client server communication is handled over Message objects.
Missing fields may be added by the Object send is called on.


## Message handling on the server side
While a client only knows channels and their members and this only for the time of being part of those channels,
the server knows every user and every channel that exists.
Channels and Users are not a tree any more, but users and channels are more independent from each other.
For this reason, the server side user and channel objects do not expose a send function themselves.
Instead, the Component that receives and forwards Message Objects from the Clients handles the reception and forwarding.
Methods and properties, like the current user and which channels he belongs to are instead exposed as a Context object, passed into the handler.

Using the client side sending example, where the member User A of Channel c1 sends a message to member B, we receive the following on the server side:

hub.on("someCustomType", context => ...)

With the given context, we can answer messages or forward them to everyone:

hub.on("someCustomType", ({user, content, channel}) => {
    console.log('message of user with id '+user.id+' and content '+content);
    const ack = new Message().withType('ACK')
                            .withContent("someCustomType")
                            .withSender(Message.Addresses.Server)
                            .withChannel(channel.id)
                            .withReceiver(user.id);
    hub.send(ack);
})