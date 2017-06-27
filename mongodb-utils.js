var Assert = require('assert');
var MongoClient = require('mongodb').MongoClient;
var Q = require('q');//promise
var mySettings = require('./settings.json');


/**
 * Get the list of RSS Source Links that are located in the collection 'feedLink' and be active
 * 
 * @returns {promise}
 */
exports.getFeedLinks = function(){
	var deferred = Q.defer();
	try {
		MongoClient.connect(mySettings.mongodb.url, function (err, db) {
			Assert.equal(null, err);
			db.collection('feedLink').find({isactive:true},{link:1, _id:0}).toArray(function (err, docs) {
				Assert.equal(null, err);					
				if(docs.length > 0){
					var list;
					list = docs.map(function(item){
						return item.link;
					});
					deferred.resolve(list);
				}else{
					deferred.reject(new Error("The Collection feedLink is empty"));
				}
				db.close();
			});//end of: db.collecion('feedLink')
		});//end of: MongoClient
	} catch (error) {
		console.log(error.message);
	}
	return deferred.promise;
};

/**
 * It manages the connection to MongoDB using MongoClient
 * @param callback function(err,db)
 * @returns {promise}
 */
exports.query = function(callback){
    try {
		MongoClient.connect(mySettings.mongodb.url, callback);//end of: MongoClient	
	} catch (error) {
		console.log(error.message);
	}
}

/**
 * Get post that are not published yet.
 * 
 * @returns {promise} List of posts
 */
exports.getPosts = function(){
    var deferred = Q.defer();
	try {
		MongoClient.connect(mySettings.mongodb.url, function (err, db) {
			Assert.equal(null, err);
			db.collection('post').find({posted:false}).toArray(function (err, docs) {
				Assert.equal(null, err);					
				if(docs.length > 0){
					deferred.resolve(docs);
				}else{
					deferred.reject("The Collection post is empty");
				}
				db.close();
			});//end of: db.collecion('post')
		});//end of: MongoClient	
	} catch (error) {
		console.log(error.message);
	}
	return deferred.promise
};

/**
 * Set field posted=true at post collection.
 */
exports.updatePost = function (p_link){
    MongoClient.connect(mySettings.mongodb.url, function (err, db) {
        Assert.equal(null, err);
        db.collection('post').updateOne({link:p_link}, {$set:{posted:true}},
            function (err, r) {
                Assert.equal(null, err);
                Assert.equal(1, r.matchedCount);
                Assert.equal(1, r.modifiedCount);
                db.close();
                if(mySettings.debugMode)
                    console.log('UPDATED post[link] = '+p_link);
        });//end of: db.collecion('post')
    });//end of: MongoClient	
};

/**
 * Delete the post that are already pusblished. Where post[posted] = true
 * 
 * @returns {promise} Number of items deleted
 */
exports.deleteOldPost = function(){
	var deferred = Q.defer();
	MongoClient.connect(mySettings.mongodb.url, function (err, db) {
		Assert.equal(null, err);
		db.collection('post').deleteMany({posted:true}, function(err, r) {
        	if(r.deletedCount > 0)
                deferred.resolve(r.deletedCount);
            else
                deferred.reject("All published posts are deleted");
        	db.close();
        });//end of: db.collecion('post')
	}) ;//end of: MongoClient
	return deferred.promise;
};

/**
 * Save Post to DB MongoDB. If it already exits is not inserted again.
 */
exports.savePost = function (p_listInfo) {
	if(p_listInfo.length == 0){
		return;
	}
	p_listInfo.forEach(function(element) {	
		try {
				MongoClient.connect(mySettings.mongodb.url, function (err, db) {
					Assert.equal(null, err);
					var db_post = db.collection('post'); 
					
					//find if it is already inserted 
					db_post.find({link:element.link}).toArray(function (err, r) {
						Assert.equal(null, err);	
						//Insert
						if(r.length === 0){//If there is no inserted before
							db_post.insertOne(element, function (err, r) {
								Assert.equal(null, err);
								Assert.equal(1, r.insertedCount);
							});
                            if (mySettings.debugMode)
                                console.log("INSERTED: post[link] = " + element.link);	
						}
						db.close();
					});//end of: db_post.find
				});//end of: MongoClient
		} catch (error) {
			console.log(error.message);
		}

	}, this);//end of: forEach

};//end of: savePost