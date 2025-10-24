const express = require('express');
const router = express.Router();
const tryCatch = require('../utils/tryCatch');
const userController = require('../controller');

const multer = require('multer');

const storage = multer.memoryStorage();
const upload = multer({ storage: storage ,limits: {
    fileSize: 500 * 1024 * 1024, 
    files: 2, 
  }});

router.get('/health', (req, res) => {
  res.send('OK');
});

router.post('/verify-email', tryCatch(userController.verifyEmail));
router.post('/send-verification-email', tryCatch(userController.sendVerificationEmail));
router.post('/set-password', tryCatch(userController.setPassword));
router.get('/get-user-details', tryCatch(userController.getUserDetails));
router.post('/create-payment-intent', tryCatch(userController.createPaymentIntent));
router.post('/create-new-payment-intent', tryCatch(userController.createNewPaymentIntent));
router.post('/wallet-payment-webhook', tryCatch(userController.walletPaymnetUSDT));
router.post(
  '/get-kyc-verified',
  upload.fields([
    { name: 'document_front_side', maxCount: 1 },
    { name: 'document_back_side', maxCount: 1 },
  ]),
  tryCatch(userController.getKycVerified),
);
router.get('/get-transaction-history', tryCatch(userController.getTransactions));


router.post('/contact-support', tryCatch(userController.contactSupport));

router.post('/contact-us', tryCatch(userController.contactUs));

module.exports = router;
