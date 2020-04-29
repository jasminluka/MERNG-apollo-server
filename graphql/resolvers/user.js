const { UserInputError } = require('apollo-server');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const { secretKey } = require('../../config');
const { validateRegisterInput, validateLoginInput } = require('../../utils/validators');

const User = require('../../models/User');


const generateToken = user => {
  return jwt.sign({
    id: user.id,
    username: user.username,
    email: user.email
  }, secretKey, {
    expiresIn: '1h'
  });
}

module.exports = {
  Mutation: {
    register: async (parent, args, context, info) => {
      let { registerInput: { username, email, password, confirmPassword } } = args;

      // Validate user data
      const { errors, valid } = validateRegisterInput(username, email, password, confirmPassword);

      if (!valid) {
        throw new UserInputError('Errors', {
          errors
        });
      }


      // Make sure user doesnt already exist
      try {
        const user = await User.findOne({ username });

        if (user) {
          return new UserInputError('Username is taken', {
            // Payload for frontend
            errors: {
              username: 'This username is taken'
            }
          });
        }

        // Hash password and create an auth token
        password = await bcrypt.hash(password, 12);

        const newUser = new User({
          username,
          email,
          password,
          createdAt: new Date().toISOString()
        });

        const res = await newUser.save();

        const token = generateToken(res);

        return {
          ...res._doc,
          id: res._id,
          token
        }
      }
      catch (err) {
        throw new Error(err);
      }
    }
  },
  Query: {
    login: async (_, { username, password }) => {
      const { errors, valid } = validateLoginInput(username, password);

      if (!valid) {
        throw new UserInputError('Errors', {
          errors
        });
      }

      try {
        const user = await User.findOne({ username });

        if (!user) {
          errors.general = 'User not found';
          return new UserInputError('User not found', {
            errors
          });
        }

        const match = await bcrypt.compare(password, user.password);

        if (!match) {
          errors.general = 'Wrong credentials';
          return new UserInputError('Wrong credentials', {
            errors
          });
        }

        const token = generateToken(user);

        return {
          ...user._doc,
          id: user.id,
          token
        }
      }
      catch (err) {
        throw new Error(err);
      }
    }
  }
}