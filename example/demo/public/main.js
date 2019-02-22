// DOM operations and elements
var NAMEFIELD = document.getElementById("name-field");
var AVAILABLELIST = document.getElementById("available");
var MEMBERLIST = document.getElementById("members");
var JOINEDLIST = document.getElementById("joined");
var MESSAGELIST = document.getElementById("messages");
var AVAILABLESECTION = document.getElementById("available-section");
var MEMBERSECTION = document.getElementById("member-section");
var JOINEDSECTION = document.getElementById("joined-section");
var NEWCHANNELFIELD = document.getElementById("new-channel");
var CREATEBUTTON = document.getElementById("create-button");
var HIDDENCLASS = "hidden";

function displayName(name){
    NAMEFIELD.innerText = name;
}

function displayChannelsOnList(channels, listElement){
    var makeItem = (channel) => `<li class="channel" onclick="">${channel}</li>`;
    listElement.innerHTML = channels.map(makeItem).reduce((html, el) => html + el);
}

function switchBetweenChannelLists(){
    if(AVAILABLESECTION.classList.contains(HIDDENCLASS)){
        AVAILABLESECTION.classList.remove(HIDDENCLASS);
        JOINEDSECTION.classList.add(HIDDENCLASS);
    }else{
        AVAILABLESECTION.classList.add(HIDDENCLASS);
        JOINEDSECTION.classList.remove(HIDDENCLASS);
    }
}

function displayCurrentChannel(){
    document.title = currentChannel;

}

function displayMembers(){

}

// other stuff
var currentChannel = null;
var client = new Client("ws://localhost");
