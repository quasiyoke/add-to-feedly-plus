var { ToggleButton } = require("sdk/ui/button/toggle");
var tabs = require("sdk/tabs");
var browserWindows = require("sdk/windows").browserWindows;
var data = require("sdk/self").data;
var panel = require("sdk/panel");

/*
 * Stores info about current tab's page.
 *
 * Object containing the following keys:
 * {Array} feeds: array, containing page's feeds in such format:
 *   [{title: "Example website feed", url: "http://example.com/feed" }, ... ]
 * {String} title: Title of the webpage.
 */
var page;

var BUTTON_DISABLED_ICON = {
	"16": "./icon-16-d.png",
	"32": "./icon-32-d.png",
	"64": "./icon-64-d.png"
};
var BUTTON_LABEL_DEFAULT = "Add to Feedly";

/**
 *  Create Feedly button in toolbar: disabled by default.
 */
var button = ToggleButton({
	id: "add-to-feedly",
	label: BUTTON_LABEL_DEFAULT,
	badge: 0,
	badgeColor: "#00aaaa",
	icon: BUTTON_DISABLED_ICON,
	onChange: onButtonChange
});
disableButton();

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
	button.icon = BUTTON_DISABLED_ICON;
}

function onButtonChange (state) {
	this.state('window', null);
	this.checked = !this.checked;
	if (this.checked) {
		mainPanel.show({
			position: button
		});		
	} else {
		mainPanel.hide();
	}
}

var mainPanel = panel.Panel({
	contentURL: data.url("main-panel.html"),
	contentScriptFile: data.url("main-panel.js"),
	onHide: function () {
		button.checked = false;
	},
	onShow: onMainPanelShow
});

function onMainPanelShow () {
	mainPanel.port.emit("show", page);
}

mainPanel.port.on("feedChosen", function (url) {
	button.checked = false;
	mainPanel.hide();
	openFeed(url);
});

tabs.on('open', function (tab) {
	tab.on('ready', onTabReady);
});
tabs.on('activate', onTabReady);

function onTabReady (tab) {
	tabworker =	tab.attach({
		contentScriptFile : data.url('content.js')
	});
	tabworker.port.emit("processPage"); // An event on ContentScript (content.js) that gets the RSS links from the web page.
	
	tabworker.port.on("pageProcessed", function (_page) { // This event is emitted when contentScript finds RSS link on the web page. This event sets RSS link and activates button.
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
		if (!page.feeds.length) {
			button.label = BUTTON_LABEL_DEFAULT;
		} else if (1 === page.feeds.length) {
			button.label = "Add “" + (page.feeds[0].title || page.title) + "” to Feedly";
		} else {
			button.label = BUTTON_LABEL_DEFAULT + " (" + page.feeds.length + ")";
		}
	});
}

function openFeed (url) {
	tabs.open("https://feedly.com/i/subscription/feed/" + url);
}
