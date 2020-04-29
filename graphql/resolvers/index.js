const postResolvers = require('./post');
const userResolvers = require('./user');


module.exports = {
  // This runs each time a query or mutation returns a Post type
  Post: {
    likeCount: (parent) => parent.likes.length,
    commentCount: (parent) => parent.comments.length
  },
  Query: {
    ...postResolvers.Query,
    ...userResolvers.Query
  },
  Mutation: {
    ...postResolvers.Mutation,
    ...userResolvers.Mutation
  },
  Subscription: {
    ...postResolvers.Subscription
  }
}