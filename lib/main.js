var { ToggleButton } = require("sdk/ui/button/toggle");
var tabs = require("sdk/tabs");
var browserWindows = require("sdk/windows").browserWindows;
var data = require("sdk/self").data;
var panel = require("sdk/panel");

/*
 * Stores info about current tab's page.
 *
 * Object containing the following keys:
 * feeds: array, containing page's feeds in such format:
 *   [{title: 'Example website feed', url: 'http://example.com/feed' }, ... ]
 * title: Title of the webpage.
 */
var page;

var BUTTON_LABEL_DEFAULT = "Add to Feedly";
/**
 *  Create Feedly Button in toolbar :: default is Disabled
 */
var button = ToggleButton({
	id: "add-to-feedly",
	label: BUTTON_LABEL_DEFAULT,
	badge: 0,
	badgeColor: "#00aaaa",
	disabled : true,
	icon : {
		"16": "./icon-16-d.png",
		"32": "./icon-32-d.png",
		"64": "./icon-64-d.png"
	},
	onClick: handleClick
});

function openFeed (url) {
	tabs.open("http://feedly.com/#subscription/feed/" + url);	
}

function handleClick (state) {
	if (page.feeds.length > 0) {
		if (1 === page.feeds.length) {
			button.checked = false;
			openFeed(page.feeds[0].url);
		} else {
			mainPanel.show({
				position: button
			});			
		}
	}
}

/**
 * When a tab open and ready ContentScript add to the tab then call addBtn function
 */
tabs.on('open', function (tab) {
	tab.on('ready', handleTabReady);
});

/**
 * ContentScript add to the activated tab
 * 
 */
tabs.on('activate', handleTabReady);

function enableButton () {
	button.disabled = false;
	button.icon = {
		"16": "./icon-16.png",
		"32": "./icon-32.png",
		"64": "./icon-64.png"
	};	
}

function disableButton () {
	button.disabled = true;
	button.icon = {
		"16": "./icon-16-d.png",
		"32": "./icon-32-d.png",
		"64": "./icon-64-d.png"
	}
}

function handleTabReady (tab) {
	tabworker =	tab.attach({
		contentScriptFile : data.url('content.js'),
	});
	tabworker.port.emit("processPage"); // An event on ContentScript (content.js) that gets the RSS links from the web page.
	
	tabworker.port.on("pageProcessed", function (_page) { // When contentScript finds RSS link on the web page then emit this event. This event sets RSS link and activates button.
		page = _page;
		if (page.feeds.length > 0) {
			enableButton();
		} else {
			disableButton();
		}
		if (page.feeds.length > 1) {
			button.badge = page.feeds.length;
		} else {
			button.badge = 0;
		}
		if (1 === page.feeds.length) {
			button.label = "Add „" + (page.feeds[0].title || page.title) + "“ to Feedly";
		} else {
			button.label = BUTTON_LABEL_DEFAULT;
		}
	});
}

var mainPanel = panel.Panel({
	contentURL: data.url("main-panel.html"),
	contentScriptFile: data.url("main-panel.js")
});

mainPanel.on("show", function () {
	mainPanel.port.emit("show", page);
});

mainPanel.on("hide", function () {
	button.checked = false;
});

mainPanel.port.on("feedChosen", function (url) {
	mainPanel.hide();
	openFeed(url);
});
