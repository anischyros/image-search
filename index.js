var http = require("http");
var express = require("express");
var mongo = require("mongodb").MongoClient;

var db;

app = express();

app.get("/", displayInstructions);
app.get("/api/imagesearch/*", doImageSearch);
app.get("/api/latest/imagesearch", doStoredSearches);

mongo.connect("mongodb://localhost/image-search", function(err, connection)
{
	db = connection;

	app.listen(8080);
	console.log("Listening to port 8080");
});

function doError(response, message, err)
{
	var obj = { error_message: message };
	if (err)
		obj.err = err;
	response.setHeader("Content-Type", "text/json");
	response(JSON.stringify(obj));
}

function updateStoredSearches(searchTerm)
{
	db.collection("stored_searches", function(err, collection)
	{
		if (err)
		{
			doError(response, "Error trying to store search term");
			return;
		}

		collection.save({ term: searchTerm, when: new Date().toJSON() });
	});
}

function doImageSearch(request, response)
{
	response.setHeader("Content-Type", "text/json");

	// Get offset param
	var offset = request.query.offset;
	if (offset == undefined)
	{
		doError(response, "Missing offset parameter");
		return;
	}
	offset = parseInt(offset, 10);
	if (offset == undefined)
	{
		doError(response, "offset parameter is not an integer");
		return;
	}


	// Extract search term
	var searchTerm = 
		decodeURIComponent(request.url.substring(17, request.url.indexOf("?"))).
		trim();

	updateStoredSearches(searchTerm);

	db.collection("cat_info", function(err, collection)
	{
		if (err)
		{
			doError(response, "Error occurred while getting collection", err);
			return;
		}

		// Perform search with support for paging
		collection.find({ snippet: { $regex: searchTerm, $options: "$i" } },
			{ fields: { _id: 0 }, limit: 10, skip: offset }, 
			function(err, items)
		{
			if (err)
			{
				doError(response, "Error occurred while searching collection",
					err);
				return;
			}

			items.toArray(function(err, array)
			{
				if (err)
				{
					doError(response, "Error occurred while collecting found " +
						"documents", err);
					return;
				}

				response.send(JSON.stringify(array));
			});
		});
	});
}

function doStoredSearches(request, response)
{
	response.setHeader("Content-Type", "text/json");

	db.collection("stored_searches", function(err, collection)
	{
		collection.find({}, { fields: { _id: 0 } }, function(err, items)
		{
			items.toArray(function(err, array)
			{
				response.send(JSON.stringify(array));
			});
		});
	});
}

function displayInstructions(request, response)
{
	var out = "<html><head><title>Image Search Abstraction Layer</title>" +
		"</head><body>" +
		"<h1>Image Search Abstraction Layer</h1>" +
		"<h3>To perform a search:</h3><p>" +
		"<code>https://image-search-anischyros.c9users.io/api/imagesearch/" +
		"<strong><em>&lt;search term&gt;</em></strong>/?offset=" +
		"<strong><em>&lt;skip count&gt;</em></strong></code></p>" +
		"<h3>To see the most recent search terms:</h3><p>" +
		"<code>https://image-search-anischyros.c9users.io/api/latest/" +
		"imagesearch</code></p>"+
		"<p>Results are returned in JSON format.</p></body></html>";

	response.send(out);
}

