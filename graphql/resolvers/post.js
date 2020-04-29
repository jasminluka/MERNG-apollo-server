const { AuthenticationError, UserInputError } = require('apollo-server');

const auth = require('../../utils/auth');

const Post = require('../../models/Post');


module.exports = {
  Query: {
    getPosts: async () => {
      try {
        const posts = await Post.find().sort({ createdAt: -1 });
        
        return posts;
      }
      catch (err) {
        throw new Error(err);
      }
    },

    getPost: async (_, { postId }) => {
      try {
        const post = await Post.findById(postId);

        if (post) {
          return post;
        }
        else {
          return new UserInputError('Post not found');
        }
      }
      catch (err) {
        throw new Error(err);
      }
    }
  },

  Mutation: {
    createPost: async (_, { body }, context) => {
      const user = auth(context);

      if (body.trim() === '') {
        throw new Error('Post body must not be empty');
      }

      const newPost = new Post({
        body,
        user: user.id,
        username: user.username,
        createdAt: new Date().toISOString()
      });

      try {
        const post = await newPost.save();

        context.pubsub.publish('NEW_POST', {
          newPost: post
        });
  
        return post;  
      }
      catch (err) {
        throw new Error(err);
      }
    },

    deletePost: async (_, { postId }, context) => {
      const user = auth(context);

      try {
        const post = await Post.findById(postId);

        if (!post) {
          return new UserInputError('Post not found');
        }

        if (user.username === post.username) {
          await post.delete();

          return 'Post deleted successfully';
        }
        else {
          return new AuthenticationError('Action not allowed');
        }
      }
      catch (err) {
        throw new Error(err);
      }
    },

    addComment: async (_, { postId, body }, context) => {
      const { username } = auth(context);

      if (body.trim() === '') {
        throw new UserInputError('Empty comment', {
          errors: {
            body: 'Comment body must not be empty'
          }
        });
      }

      try {
        const post = await Post.findById(postId);

        if (post) {
          post.comments.unshift({
            body,
            username,
            createdAt: new Date().toISOString()
          });

          await post.save()
          
          return post;
        }
        else {
          return new UserInputError('Post not found');
        }
      }
      catch (err) {
        throw new Error(err);
      }
    },

    deleteComment: async (_, { postId, commentId }, context) => {
      const { username } = auth(context);

      try {
        const post = await Post.findById(postId);
        
        if (post) {
          const commentIndex = post.comments.findIndex(comment => comment.id === commentId);

          if (post.comments[commentIndex].username === username) {
            post.comments.splice(commentIndex, 1);

            await post.save();
            
            return post;
          }
          else {
            return new AuthenticationError('Action not allowed')
          }
        }
        else {
          return new UserInputError('Post not found');
        }
      }
      catch (err) {
        throw new Error(err);
      }
    },

    likePost: async (_, { postId }, context) => {
      const { username } = auth(context);

      try {
        const post = await Post.findById(postId);

        if (post) {
          if (post.likes.find(like => like.username === username)) {
            // Post already liked, unlike
            post.likes = post.likes.filter(like => like.username !== username);
          }
          else {
            // Not liked, like post
            post.likes.push({
              username,
              createdAt: new Date().toISOString()
            });
          }

          await post.save();

          return post;
        }
        else {
          return new UserInputError('Post not found');
        }
      }
      catch (err) {
        throw new Error(err);
      }
    }
  },

  Subscription: {
    newPost: {
      subscribe: (_, __, { pubsub }) => pubsub.asyncIterator('NEW_POST')
    }
  }
}