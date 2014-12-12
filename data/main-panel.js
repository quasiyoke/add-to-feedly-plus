var menu = document.getElementById("menu");

function addFeed (feed) {
	var menuItem = document.createElement("li");
	menuItem.setAttribute("class", "menu-item");
	menu.appendChild(menuItem);
	var button = document.createElement("button");
	button.setAttribute("title", feed.title);
	menuItem.appendChild(button);
	var buttonWrap = document.createElement("div");
	button.appendChild(buttonWrap);
	buttonWrap.appendChild(document.createTextNode(feed.title));
	buttonWrap.setAttribute("class", "button-wrap");
	button.addEventListener("click", function (e) {
		self.port.emit("feedChosen", feed.url);
	});
}

function addTitle (text) {
	var title = document.createElement("h1");
	title.appendChild(document.createTextNode(text));
	menu.parentNode.insertBefore(title, menu);
}

function getCommonTitle (feeds) {
	if (feeds.length <= 1) {
		return "";
	}
	var firstTitle = feeds[0].title;
	outer:
	for (length = 0; length < firstTitle.length; ++length) {
		var c = firstTitle.charAt(length);
		for (var i = 1; i < feeds.length; ++i) {
			if (feeds[i].title.charAt(length) != c) {
				break outer;
			}
		}
	}
	return firstTitle.substr(0, length);
}

self.port.on("show", function (page) {
	menu.parentNode.removeChild(menu.previousSibling);
	menu.innerHTML = "";
	var commonTitle = getCommonTitle(page.feeds);
	var commonTitleLength;
	if (commonTitle) {
		addTitle(commonTitle);
		commonTitleLength = commonTitle.length;
	} else {
		commonTitleLength = 0;
	}
	for (var i = 0; i < page.feeds.length; ++i) {
		var feed = page.feeds[i];
		if (feed.title) {
			feed.title = feed.title.substr(commonTitleLength);
		}
		if (!feed.title) {
			feed.title = feed.url;
		}
		addFeed(feed);
	}
});
