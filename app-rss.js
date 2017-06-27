//Libraries
var Feed = require("feed-read-parser");
var Scheduler = require('node-schedule');
var Q = require('q');
var mySettings = require('./settings.json');
var DBUtils = require('./mongodb-utils');

var MS_PER_MINUTE = 60000;
//mySettings.RSSIntervalMinutes: Minutes of tolerance in the rss post
//mySettings.checkAllRSSItems: Check time for getting rss

//:: MAIN ::
	main();

function main() {
	if(mySettings.debugMode)
		console.log("STARTED the Scheduler - Save Rss Post. It's scheduled to: " + mySettings.scheduler.getRSSPost);
	
	var pr_feedLinks = DBUtils.getFeedLinks();

	var scheduler = Scheduler.scheduleJob(mySettings.scheduler.getRSSPost, function () {
		if(mySettings.debugMode)
			console.log('::SCHEDULER - time ' + new Date(Date.now()).toLocaleTimeString());
		
		pr_feedLinks.then(function(feedLinks){
			getFeeds(feedLinks)
				.then(function(rssList){
					DBUtils.savePost(rssList);
				})
				.catch(function(e){
					console.log(e);
				});
		});
	});
}
//end of: MAIN

/**
 * Gets Feeds from RSS Links.
 * @returns {promise}
 */
function getFeeds(p_feedLinks) {
	var deferred = Q.defer();
	var maxSizeContent = mySettings.twitter.endSizeTweet - mySettings.twitter.shortLinkSize;
	var listInfo = Array();
	//30 minutes before now
	var minutesBfr30 = new Date(Date.now() - mySettings.RSSIntervalMinutes*MS_PER_MINUTE);
	if(mySettings.debugMode)
		console.log("CHECK ALL ITEMS RSS: " + mySettings.checkAllRSSItems);

	Feed(p_feedLinks, function (err, articles) {
		if (err){
			console.log(err);
		}
		for (var key in articles) {
			var item = articles[key];
			var info = {
				title: item.title,
				content: item.title.substring(mySettings.twitter.startSizeTweet, maxSizeContent),
				published: new Date(item.published),
				link: item.link,
				posted:false
			}
			if(!mySettings.checkAllRSSItems){
				if(info.published >= minutesBfr30){
					listInfo.push(info);
				}
			}else{
				listInfo.push(info);	
			}	
		}
		if(listInfo.length > 0)
			deferred.resolve(listInfo);
		else
			deferred.reject("Empty list");
	});// end of: Feed
	return deferred.promise;
}//end of: getFeed

