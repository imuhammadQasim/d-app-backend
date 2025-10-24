const express = require('express');
const router = express.Router();
const tryCatch = require('../utils/tryCatch');
const { userController } = require('../controllers');

router.get('/get-all-users', tryCatch(userController.getAllUsers));

router.post('/change-user-kyc-verification-status', tryCatch(userController.changeUserKycVerificationStatus));

module.exports = router;
