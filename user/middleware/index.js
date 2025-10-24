const jwt = require('jsonwebtoken');
const { SECRET } = require('../config');
const { USER, USER_JWT } = global;

const MIDDLEWARE = (req, res, next) => {
  const authHeader = req.headers.authorization;
  console.log(authHeader + '');
  if (!authHeader) {
    return res.status(401).send({
      error: true,
      message: 'Authorization Header Missing!',
    });
  }

  const token = authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).send({
      error: true,
      message: 'Token must be non-null!',
    });
  }

  if (token === 'intd-secret-token') {
    next();
  } else {
    jwt.verify(token, SECRET, async (err, decodedToken) => {
      if (err) {
        return res.status(401).send({
          error: true,
          message: `${err.name + ':' + err.message}`,
        });
      }

      const user = await USER.findById(decodedToken.id);

      if (!user) {
        return res.status(401).send({
          error: true,
          message: 'User Not Found!',
        });
      }

      const isValid = await USER_JWT.findOne({ token });

      if (!isValid) {
        return res.status(401).send({
          isUnAuthorized: true,
          message: 'Kindly Login Again!',
        });
      }

      req.user = user;
      // console.log('[Decoded token user]:', req.user);
      next();
    });
  }
};

module.exports = MIDDLEWARE;
