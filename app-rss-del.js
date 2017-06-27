var Scheduler = require('node-schedule');
var mySettings = require('./settings.json');
var DBUtils = require('./mongodb-utils');

//Main
if(mySettings.debugMode)
		console.log("STARTED the Scheduler Delete Post. It's scheduled to: "
		+ mySettings.scheduler.deletePost);
var scheduler = Scheduler.scheduleJob(mySettings.scheduler.deletePost, function () {
	if(mySettings.debugMode)
		console.log('::SCHEDULER Delete Published Posts - time ' + new Date(Date.now()).toLocaleTimeString());
	DBUtils.deleteOldPost()
		.then(function(deletedCount){
			if(mySettings.debugMode)
				console.log(':: ' + deletedCount + " post(s) deleted.");
		})
		.catch(function(e){
			console.log(e);
		});//end of: deleteOldPost
});//end of: Scheduler
//end of: Main