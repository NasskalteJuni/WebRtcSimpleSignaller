
Sender is always UserA:

Receiver        Channel         who receives it                                 on which node
UserB           ChannelA        UserB                                           UserA
ALL             ChannelA        Every User in ChannelA except UserA             UserA
NONE            ChannelA        Every User in ChannelA except UserA             ChannelA
ALL             ALL             Every User in every Channel of UserA except A   UserA
NONE            ALL             Every User in every Channel of UserA except A   Channels of A
ALL             NONE            Every User in every channel of UserA except A   Signaller
NONE            NONE            UserA                                           Signaller
UserB           NONE            UserB                                           Signaller
UserB           ALL             UserB                                           Channels of A


Sender is always UserA:

Receiver        Channel         who receives it                                 on which node
UserB           ChannelA        UserB                                           UserA
ALL             ChannelA        Every User in ChannelA except UserA             UserA
ALL             ALL             Every User in every Channel of UserA except A   UserA
UserB           ALL             UserB                                           UserA in Channels of A
