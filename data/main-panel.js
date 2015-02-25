var menu = document.getElementById("menu");

function addFeed (feed) {
	var menuItem = document.createElement("li");
	menuItem.setAttribute("class", "menu-item");
	menu.appendChild(menuItem);
	var button = document.createElement("a");
	button.setAttribute("href", feed.url);
	button.setAttribute("title", feed.title);
	button.setAttribute("class", "button");
	menuItem.appendChild(button);
	var buttonWrap = document.createElement("div");
	button.appendChild(buttonWrap);
	buttonWrap.appendChild(document.createTextNode(feed.title));
	buttonWrap.setAttribute("class", "button-wrap");
	button.addEventListener("click", function (e) {
		e.preventDefault();
		self.port.emit("feedChosen", feed.url);
	});
}

function addTitle (text) {
	var title = document.createElement("h1");
	title.appendChild(document.createTextNode(text));
	menu.parentNode.insertBefore(title, menu);
}

function Feed (options) {
	this.url = options.url;
	this.title = options.title || options.url;
}

Feed.getCommonTitle = function (feeds) {
	/**
	 * The idea behind common title is to get common header for feeds with titles starting identically.
	 * Imagine the following feeds list:
	 *
	 * - The Time » New Articles
	 * - The Time » Editor's blog
	 * - The Time » Comments
	 *
	 * In such case our desire is to get common title "The Time » ".
	 */
	if (feeds.length <= 1) {
		return "";
	}
	var firstTitle = feeds[0].title;
	outer:
	for (length = 0; length < firstTitle.length; ++length) {
		var c = firstTitle.charAt(length);
		for (var i = 1; i < feeds.length; ++i) {
			if (feeds[i].title.charAt(length) !== c) {
				break outer;
			}
		}
	}
	var commonTitle = firstTitle.substr(0, length);
	if (Feed.isCommonTitleAdsorbing(commonTitle, feeds)) {
		var match = /^(.+»)[^»]+$/.exec(commonTitle);
		/*
		 * For such feeds list:
		 *
		 * - John Doe's website » Blog
		 * - John Doe's website » Blog comments
		 *
		 * ...common title will be: "John Doe's website »"
		 */
		if (match) {
			commonTitle = match[1];
			/*
			 * For such feeds list with common title delimited with hyphen-minus:
			 *
			 * - John Doe's website - Blog
			 * - John Doe's website - Blog comments
			 *
			 * ...common title will be: "John Doe's website -"
			 */
		} else if (match = /^(.+\-)[^\-]+$/.exec(commonTitle)) {
			commonTitle = match[1];
			/*
			 * For such feeds list with common title delimited with figure dash:
			 *
			 * - John Doe's website ‒ Blog
			 * - John Doe's website ‒ Blog comments
			 *
			 * ...common title will be: "John Doe's website ‒"
			 */
		} else if (match = /^(.+\u2012)[^\u2012]+$/.exec(commonTitle)) {
			commonTitle = match[1];
			/*
			 * For such feeds list with common title delimited with en dash:
			 *
			 * - John Doe's website – Blog
			 * - John Doe's website – Blog comments
			 *
			 * ...common title will be: "John Doe's website –"
			 */
		} else if (match = /^(.+\u2013)[^\u2013]+$/.exec(commonTitle)) {
			commonTitle = match[1];
			/*
			 * For such feeds list with common title delimited with em dash:
			 *
			 * - John Doe's website — Blog
			 * - John Doe's website — Blog comments
			 *
			 * ...common title will be: "John Doe's website —"
			 */
		} else if (match = /^(.+\u2014)[^\u2014]+$/.exec(commonTitle)) {
			commonTitle = match[1];
			/*
			 * For such feeds list:
			 *
			 * - John Doe's blog
			 * - John Doe's blog comments
			 *
			 * ...common title will be: "John Doe's"
			 */
		} else if (match = /^(.+)\s[^\s]+\s*$/.exec(commonTitle)) {
			commonTitle = match[1];
		} else {
			commonTitle = "";
		}
	}
	return commonTitle;
};

Feed.isCommonTitleAdsorbing = function (commonTitle, feeds) {
	/**
	 * Example feeds list:
	 *
	 * - John Doe's blog
	 * - John Doe's blog comments
	 *
	 * In such case straightforward common title will adsorb first feed's title.
	 *
	 * @return bool Is common title adsorbing any feed's title from feeds list.
	 */
	for (var i = 0; i < feeds.length; ++i) {
		if (commonTitle.length >= feeds[i].title.length) {
			return true;
		}
	}
	return false;
};

Feed.prototype.ensureTitle = function (commonTitleLength) {
	/**
	 * Ensures the title is trimmed correctly.
	 */
	this.title = this.title.substr(commonTitleLength);
};

self.port.on("show", function (page) {
	/* Remove title if present. */
	var titles = document.getElementsByTagName("h1");
	if (titles.length) {
		titles[0].parentNode.removeChild(titles[0]);
	}
	
	menu.textContent = "";
	var commonTitle = Feed.getCommonTitle(page.feeds);
	var commonTitleLength;
	if (commonTitle) {
		commonTitleLength = commonTitle.length;
		/* Trim trailing delimiter char. */
		var match = /^(.+)[»-\u2012\u2013\u2014]\s*/.exec(commonTitle); // Quotation mark, hyphen-minus, figure dash, en dash, em dash, respectively.
		if (match) {
			commonTitle = match[1];
		}
		addTitle(commonTitle);
	} else {
		commonTitleLength = 0;
	}
	for (var i = 0; i < page.feeds.length; ++i) {
		var feed = new Feed(page.feeds[i]);
		feed.ensureTitle(commonTitleLength);
		addFeed(feed);
	}
});
