const Express = require('express');
const BodyParser = require('body-parser');
const MongoClient = require('mongodb').MongoClient;
const ObjectId = require('mongodb').ObjectID;
const imdb = require('./src/imdb.js');

const DENZEL_IMDB_ID = 'nm0000243';
const CONNECTION_URL = 'mongodb+srv://user_1:Schoeser1998@webappdenzel-wcs49.mongodb.net/test?retryWrites=true';
const DATABASE_NAME = 'WebappDenzel';

var app = Express();

app.use(BodyParser.json());
app.use(BodyParser.urlencoded({ extended: true }));

var database;
var collection;

/*---------- ENDPOINTS ----------*/

app.get('/movies/populate', async (req, res) => {
	var movies = await imdb(DENZEL_IMDB_ID);
	var counter = 0;
	movies.forEach((movie) => {
		var nbDocs = 0;
		collection.find({ id: `${movie.id}` }).toArray((err, docs) => {
			if (err) {
				return response.status(500).send(err);
			}
			nbDocs = docs.length;
			if (nbDocs > 0) {
				console.log('Movie ' + movie.id + ' already in the DB');
			} else {
				counter = counter + 1;
				collection.insertOne(movie, (err) => {
					if (err) {
						console.log(err);
					}
					console.log('Movie ' + movie.id + ' added to the DB..');
				});
			}
		});
	});
	res.send('DB updated with ' + counter + ' movies !');
});

app.get('/movies/delete', async (req, res) => {
	collection.deleteMany({}, function(err, obj) {
		if (err) return res.status(500).send(err);
		console.log('DB cleared !');
		res.send('DB cleared !');
	});
});

app.get('/movies', (req, res) => {
	collection.find({ metascore: { $gte: 70 } }).toArray((err, docs) => {
		if (err) {
			return res.status(500).send(err);
		}
		let random = Math.floor(Math.random() * Math.floor(docs.length));
		res.send(docs[random]);
	});
});

app.get('/movies/:id', (req, res) => {
	collection.findOne({ id: req.params.id }, (err, result) => {
		if (err) {
			return res.status(500).send(err);
		}
		res.send(result);
	});
});

app.get('/movies/search', (req, res) => {
	let metascore = 0;
	if (req.query['metascore'] != null) {
		metascore = Number(req.query.metascore);
		if (metascore > 100) metascore = 100;
	}
	let limit = 5;
	if (req.query['limit'] != null && Number(req.query.limit) <= 5) limit = Number(req.query.limit);
	collection.find({ metascore: { $gte: metascore } }).sort({ metascore: -1 }).toArray((err, docs) => {
		if (err) {
			return res.status(500).send(err);
		}
		var moviesSearched = [];
		for (let i = 0; i < limit; i++) {
			if (docs[i] != null) moviesSearched.push(docs[i]);
		}
		res.send(moviesSearched);
	});
});

app.post('/movies/:id', (req, res) => {
	collection.updateOne({ id: req.params.id }, { $set: req.body }, (err, result) => {
		if (err) {
			return res.status(500).send(error);
		}
		res.send(result);
	});
});

/*---------- ENDPOINTS ----------*/

app.listen(9292, () => {
	MongoClient.connect(CONNECTION_URL, { useNewUrlParser: true }, (error, client) => {
		if (error) {
			throw error;
		}
		database = client.db(DATABASE_NAME);
		collection = database.collection('movies');
		console.log('Connected to `' + DATABASE_NAME + '`!');
	});
});
