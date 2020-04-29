const { ApolloServer, PubSub } = require('apollo-server');
const mongoose = require('mongoose');

const { mongoUser, mongoPassword, mongoDb } = require('./config');
const typeDefs = require('./graphql/typeDefs');
const resolvers = require('./graphql/resolvers');


const pubsub = new PubSub();

const server = new ApolloServer({
  typeDefs,
  resolvers,
  // Auth
  context: ({ req }) => ({ req, pubsub })
});

const PORT = process.env.PORT || 5000;

mongoose
  .connect(`mongodb+srv://${mongoUser}:${mongoPassword}@merngraphql-rnj7a.mongodb.net/${mongoDb}?retryWrites=true&w=majority`, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then(() => {
    console.log('MongoDB connected...');
  })
  .catch(err => {
    console.log(err);
  })
  
server
  .listen({ port: PORT })
	.then(res => {
		console.log(`Server running at ${res.url}`);
	}).catch(err => {
		console.log(err);
	})