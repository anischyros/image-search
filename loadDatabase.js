/*
 * Program which will create the "cat_info" database in MongoDB
 */

var fs = require("fs");
var mongo = require("mongodb").MongoClient;

// First, load data from file
var data = JSON.parse(fs.readFileSync("data.json", data));

mongo.connect("mongodb://localhost/image-search", onConnection);

function onConnection(err, db)
{
	if (err)
	{
		console.log("Error attempting to connect to database: " + err);
		return;
	}

	db.dropCollection("cat_info", function()
	{
		db.collection("cat_info", function(err, collection)
		{
			loadCollection(db, data, collection);
		});
	});
}

function loadCollection(db, data, collection)
{
	data.forEach(function(it, ndx)
	{
		collection.save(it);
	});

	setTimeout(function() { db.close(); }, 1000);
	console.log("Finished.  Added " + data.length + " rows.");
}
