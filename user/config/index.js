const dotenv = require('dotenv');
dotenv.config();

module.exports = {
  ENV: process.env.ENV,
  WINDOW: process.env.WINDOW,
  MAX_LIMIT: process.env.MAX_LIMIT,
  PORT: process.env.PORT,
  SECRET: process.env.SECRET,
  MONGO_URI: process.env.MONGO_URI,
  AWS_SE_ACCESS_ID: process.env.AWS_SE_ACCESS_ID,
  AWS_S3_SECRET_ACCESS_KEY: process.env.AWS_S3_SECRET_ACCESS_KEY,
  AWS_S3_REGION: process.env.AWS_S3_REGION,
  AWS_S3_BUCKET_NAME: process.env.AWS_S3_BUCKET_NAME,
  MAIL_HOST: process.env.MAIL_HOST,
  MAIL_PORT: process.env.MAIL_PORT,
  MAIL_USER: process.env.MAIL_USER,
  MAIL_PASS: process.env.MAIL_PASS,
  FRONTEND_URL: process.env.FRONTEND_URL,
};
