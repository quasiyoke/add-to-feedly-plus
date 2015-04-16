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
	  var linkType = links[i].getAttribute("type");
		// All MIME list courtesy to Robert MacLean on Stack Overflow
		// http://stackoverflow.com/a/7001617/2449800
		if ("application/rss+xml"  === linkType ||
		    "application/rdf+xml"  === linkType ||
		    "application/atom+xml" === linkType ||
		    "application/xml"      === linkType ||
		    "text/xml"             === linkType)	{
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
