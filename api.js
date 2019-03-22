const Express = require('express');
const BodyParser = require('body-parser');
const MongoClient = require('mongodb').MongoClient;
const cors = require('cors');
const imdb = require('./src/imdb.js');

const graphqlHTTP = require('express-graphql');
const { GraphQLSchema } = require('graphql');
const { GraphQLObjectType, GraphQLString, GraphQLNonNull, GraphQLList } = require('graphql');

const DENZEL_IMDB_ID = 'nm0000243';
const CONNECTION_URL = 'mongodb+srv://user_1:Schoeser1998@webappdenzel-wcs49.mongodb.net/test?retryWrites=true';
const DATABASE_NAME = 'WebappDenzel';

var app = Express();

app.use(cors());
app.use(BodyParser.json());
app.use(BodyParser.urlencoded({ extended: true }));

var database;
var collection;

/*---------- ENDPOINTS ----------*/

app.get('/movies/populate', async (req, res) => {
	var movies = await imdb(DENZEL_IMDB_ID);
	movies.forEach((movie) => {
		var nbDocs = 0;
		collection.find({ id: `${movie.id}` }).toArray((err, docs) => {
			if (err) {
				return response.status(500).send(err);
			}
			nbDocs = docs.length;
			if (nbDocs > 0) {
				console.log('Movie ' + movie.id + ' already in the DB..');
			} else {
				counter = counter + 1;
				collection.insertOne(movie, (err) => {
					if (err) {
						console.log(err);
					}
					console.log('Movie ' + movie.id + ' added to the DB !');
				});
			}
		});
	});
	var counter = await collection.countDocuments();
	res.send('Movies in the DB: ' + counter);
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

/*---------- GRAPHQL ----------*/

const { movieType } = require('./schema.js');

const queryType = new GraphQLObjectType({
	name: 'Query',
	fields: {
		moviesPopulate: {
			type: GraphQLString,
			resolve: async function() {
				var movies = await imdb(DENZEL_IMDB_ID);
				movies.forEach((movie) => {
					var nbDocs = 0;
					collection.find({ id: `${movie.id}` }).toArray((err, docs) => {
						if (err) {
							return response.status(500).send(err);
						}
						nbDocs = docs.length;
						if (nbDocs > 0) {
							console.log('Movie ' + movie.id + ' already in the DB..');
						} else {
							counter = counter + 1;
							collection.insertOne(movie, (err) => {
								if (err) {
									console.log(err);
								}
								console.log('Movie ' + movie.id + ' added to the DB !');
							});
						}
					});
				});
				var counter = await collection.countDocuments();
				return 'Movies in the DB : ' + counter;
			}
		},
		moviesDelete: {
			type: GraphQLString,
			resolve: function() {
				collection.deleteMany({});
				return 'DB cleared !';
			}
		},
		moviesSearchByID: {
			type: movieType,
			args: {
				id: { type: GraphQLString }
			},
			resolve: async function(source, args) {
				return await collection.findOne({ id: args.id });
			}
		},
		moviesSearchRandom: {
			type: movieType,
			resolve: async function() {
				var movies = await collection.find({ metascore: { $gte: 70 } }).toArray();
				let random = Math.floor(Math.random() * Math.floor(movies.length));
				return movies[random];
			}
		},
		moviesSearch: {
			type: new GraphQLList(movieType),
			args: {
				limit: { type: GraphQLString },
				metascore: { type: GraphQLString }
			},
			resolve: async function(source, args) {
				var meta = 0,
				limit = 5;
				meta = Number(args.metascore);
				if (meta > 100) meta = 100;
				if (Number(args.limit) <= 5) limit = Number(args.limit);
				movies = await collection.find({ metascore: { $gte: meta } }).sort({ metascore: -1 }).toArray();
				var moviesSearched = [];
				for (let i = 0; i < limit; i++) {
					if (movies[i] != null) {
						moviesSearched.push(movies[i]);
					}
				}
				return moviesSearched;
			}
		},
		moviesUpdate: {
			type: movieType,
			args: {
				date: { type: GraphQLString },
				review: { type: GraphQLString },
				id: { type: GraphQLString }
			},
			resolve: async function(source, args) {
				collection.updateOne({ id: args.id }, { $set: { date: args.date, review: args.review } });
				return await collection.findOne({ id: args.id });
			}
		}
	}
});

const schema = new GraphQLSchema({ query: queryType });

app.use(
	'/graphql',
	graphqlHTTP({
		schema: schema,
		graphiql: true
	})
);

/*---------- GRAPHQL ----------*/

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
