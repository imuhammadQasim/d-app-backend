const dotenv = require('dotenv');
dotenv.config();

module.exports = {
  ENV: process.env.ENV,
  WINDOW: process.env.WINDOW,
  MAX_LIMIT: process.env.MAX_LIMIT,
  PORT: process.env.PORT,
  SECRET: process.env.SECRET,
  MONGO_URI: process.env.MONGO_URI,
};
