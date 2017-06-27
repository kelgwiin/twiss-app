var Scheduler = require('node-schedule');
var Googl = require('goo.gl');
var Twitter = require('twitter');
var mySettings = require('./settings.json');
var DBUtils = require('./mongodb-utils');

//Settings Google
Googl.setKey(mySettings.google.googlAPIKey);
var twitterPoster = new TwitterPoster();

//Main
if(mySettings.debugMode)
		console.log("STARTED the Scheduler Poster. It's scheduled to: " + mySettings.scheduler.postRSS);

var scheduler = Scheduler.scheduleJob(mySettings.scheduler.postRSS, function () {
	if(mySettings.debugMode)
		console.log('::SCHEDULER - time ' + new Date(Date.now()).toLocaleTimeString());
	main();
});

/**
 * Executes the main actions
 */
function main(){
	DBUtils.getPosts()
    .then(function(postList){
		
		postList.forEach(function(element) {
			Googl.shorten(element.link)
				.then(function(shortLink){
					var msg = element.content + " " + shortLink;
					post(msg, function(data){
						twitterPoster.post(data);
					});
				})
				.catch(function(error){
					console.log(error.message);
				});//end of: Googl
			DBUtils.updatePost(element.link);		
		}, this);//end of: forEach postList
    })
    .catch(function(error){
        console.log(error);
    });//end of: getPosts
}
//end of:Main

/**
 * Generic function to pubish item
 * @param data {string} Info to post
 * @param callback Function that implements the publish item
 */
function post(data, callback){
	callback(data);
}

/**
 * Module: Twitter Posted
 */
function TwitterPoster(){ 
	/** Connection Twitter*/
	this.clientTwitter = new Twitter({
		consumer_key: mySettings.twitter.consumer_key,
		consumer_secret: mySettings.twitter.consumer_secret,
		access_token_key: mySettings.twitter.access_token_key,
		access_token_secret: mySettings.twitter.access_token_secret
	});

	/**
	 * Posting a tweet
	 */
	this.post = function (data){
		this.clientTwitter.post('statuses/update', {status: data},
			function(error, tweet, response) {
			if(error){
				console.log(error);
			}
		});
	}
}