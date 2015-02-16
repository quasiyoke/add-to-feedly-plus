function Page () {
	this.feeds = [];
}

Page.prototype.pushFeed = function (feed) {
	/**
	 * Pays attention for removing duplicate feeds.
	 */
	for (var i = 0; i < this.feeds.length; ++i) {
		var thisFeed = this.feeds[i];
		if (thisFeed.url === feed.url) {
			if (feed.title && (!thisFeed.title || thisFeed.title.length < feed.title.length)) { // If new feed's title is better than existing, replace old one.
				thisFeed.title = feed.title;
			}
			return;
		}
	}
	this.feeds.push(feed);
};

self.port.on("processPage", function () {
	var page = new Page();
	
	var links = document.getElementsByTagName("link"); 
	for (var i = 0; i < links.length; ++i)	{
		if ("application/rss+xml" === links[i].getAttribute("type"))	{
			page.pushFeed({
				title: links[i].getAttribute("title"),
				url: links[i].href
			});
		}
	}

	var titles = document.getElementsByTagName("title");
	if (titles.length) {
		page.title = titles[0].text;
	}
	
	self.port.emit("pageProcessed", page);
});
