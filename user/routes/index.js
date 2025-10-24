const express = require('express');
const router = express.Router();
const tryCatch = require('../utils/tryCatch');
const userController = require('../controller');

const multer = require('multer');

const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 500 * 1024 * 1024,
    files: 2,
  },
});

router.post('/login', tryCatch(userController.login));
router.post('/register', tryCatch(userController.register));
router.post('/resend-otp', tryCatch(userController.resendVerificationCode));

router.post('/contact-support', tryCatch(userController.contactSupport));
router.post('/contact-us', tryCatch(userController.contactUs));

router.get('/config', tryCatch(userController.sendConfigToClient));

module.exports = router;
