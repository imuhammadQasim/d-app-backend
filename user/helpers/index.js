const {
  SECRET,
  AWS_S3_BUCKET_NAME,
  AWS_S3_REGION,
  AWS_S3_SECRET_ACCESS_KEY,
  AWS_SE_ACCESS_ID,
  MAIL_HOST,
  MAIL_PORT,
  MAIL_USER,
  MAIL_PASS,
} = require('../config');
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { jwtDecode } = require('jwt-decode');
const nodemailer = require('nodemailer');
const AWS = require('aws-sdk');
module.exports = {
  REGULAR_HANDLER: (params, req, res, next) => {
    return res.status(params?.code).send(params);
  },
  generateSixDigitCode: () => {
    return Math.floor(100000 + Math.random() * 900000);
  },
  hashPassword: password => {
    const salt = bcryptjs.genSaltSync(10);
    const hashedPassword = bcryptjs.hashSync(password, salt);
    return hashedPassword;
  },
  comparePassword: (text, hash) => {
    return bcryptjs.compareSync(text, hash);
  },
  generateToken: payload => {
    const token = jwt.sign(payload, SECRET, {
      expiresIn: '1h',
      algorithm: 'HS256',
    });
    return token;
  },
  checkVerificationCodeValidity: expiry => {
    const now = new Date();
    const expiryTime = new Date(expiry);

    if (now > expiryTime) {
      return false;
    }
    return true;
  },
  decodeToken: token => {
    return jwtDecode(token);
  },
  uploadToS3: async (file, _id) => {
    try {
      const { mimetype, originalname, buffer } = file;

      AWS.config.update({
        region: AWS_S3_REGION,
        accessKeyId: AWS_SE_ACCESS_ID,
        secretAccessKey: AWS_S3_SECRET_ACCESS_KEY,
      });

      const params = {
        Bucket: AWS_S3_BUCKET_NAME,
        Key: `${_id}/${originalname}`,
        ContentType: mimetype,
        Body: buffer,
      };

      const S3 = new AWS.S3();

      const uploadedFile = await S3.upload(params).promise();

      return uploadedFile.Location;
    } catch (error) {
      console.error('Error uploading files to S3:', error);
      throw new Error(error?.message ?? `Error uploading files to S3:${error}`);
    }
  },
  sendEmail: async ({ template, to, subject, attachments = [] }) => {
    try {
      console.log('dtat . ...>>>>>> ', MAIL_PASS, MAIL_USER);
      let transporter = nodemailer.createTransport({
        host: MAIL_HOST,
        port: MAIL_PORT,
        secure: false,
        auth: {
          user: MAIL_USER,
          pass: MAIL_PASS,
        },
        tls: {
          rejectUnauthorized: false,
        },
      });

      await transporter.verify();

      await transporter.sendMail({  
        from: `"International Digital Dollar" <${MAIL_USER}>`,
        to,
        replyTo: MAIL_USER,
        subject,
        html: template,
        attachments,
      });
    } catch (error) {
      console.error('Error sending email:', error);
      throw new Error(error?.message ?? `Error sending email:${error}`);
    }
  },
};
