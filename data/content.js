self.port.on("processPage", function () {
	var page = {
		feeds: []
	};
	
	var links = document.getElementsByTagName("link"); 
	for (var i = 0; i < links.length; ++i)	{
		if ("application/rss+xml" == links[i].getAttribute("type"))	{
			page.feeds.push({
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
