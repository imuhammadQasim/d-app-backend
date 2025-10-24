const { USER, USER_JWT, SUPPORT_QUERY, TRANSACTIONS, DONATE_USER } = global;
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const {
  generateSixDigitCode,
  hashPassword,
  checkVerificationCodeValidity,
  generateToken,
  decodeToken,
  comparePassword,
  sendEmail,
  uploadToS3,
} = require('../helpers');

exports.register = async (req, res, next) => {
  try {
    const { email, password, ...rest } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        code: 400,
        message: 'Email and password are required',
      });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({
        status: 400,
        message: 'Invalid email format',
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        status: 400,
        message: 'Password must be at least 8 characters long',
      });
    }
    const existingUser = await USER.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        status: 409,
        message: 'User already exists',
      });
    }

    const code = generateSixDigitCode();
    const hashedPassword = hashPassword(password);

    const customer = await stripe.customers.create({
      name: `${rest.first_name} ${rest.last_name || ''}`.trim(),
      email,
      metadata: { signUpSource: 'INTD Signup Api' },
    });
    const expiryTime = new Date(Date.now() + 2 * 60 * 1000);
    const newUser = await USER.create({
      ...rest,
      email,
      password: hashedPassword,
      stripe_customer_id: customer.id,
      verification_code: { code, expiry: expiryTime.toISOString() },
    });

    await sendEmail({
      to: email,
      subject: `Email Verification Code`,
      template: `<h1> Email Verification Code:${code} </h1>`,
    });

    const token = generateToken({
      id: newUser._id,
      email: newUser.email,
    });

    if (!token) {
      return res.status(500).json({
        code: 500,
        message: 'Error generating token!',
      });
    }

    const { iat, exp } = decodeToken(token);

    await USER_JWT.create({
      user_id: newUser._id,
      token,
      iat,
      exp,
    });

    return res.status(200).json({
      code: 200,
      success: true,
      message: 'Email verification code has been sent successfully to registered email',
      token,
    });
  } catch (err) {
    console.error('Error in resgistration >>>>>> ', err);
    next(err);
  }
};

exports.verifyEmail = async (req, res, next) => {
  try {
    const { email, code, forgot } = req.body;
    // console.log(req.body);

    const user = await USER.findOne({ email });

    if (!user) {
      return res.status(404).json({
        code: 404,
        message: `User Doesn't Exists`,
      });
    }

    if (!forgot && user?.status !== 'VERIFY_EMAIL') {
      return res.status(409).json({
        code: 409,
        message: 'Email is already verified',
      });
    }

    const inputCode = String(code).trim();
    const savedCode = String(user?.verification_code?.code).trim();

    if (inputCode.length !== 6 || inputCode !== savedCode) {
      return res.status(401).json({
        code: 401,
        message: 'Entered verification code is incorrect.',
      });
    }

    if (!checkVerificationCodeValidity(user?.verification_code?.expiry)) {
      return res.status(401).json({
        code: 401,
        message: 'Entered verification code is expired. Please resend OTP.',
      });
    }

    // ✅ Clear OTP
    await USER.findByIdAndUpdate(user._id, {
      verification_code: { code: '', expiry: '' },
    });

    // ✅ Create token only ONCE
    const token = generateToken({
      id: user._id,
      email: user.email,
    });

    if (!token) {
      return res.status(500).json({
        code: 500,
        message: 'Error generating token!',
      });
    }

    const { iat, exp } = decodeToken(token);

    // ✅ Clear old sessions and save new one
    await USER_JWT.deleteMany({ user_id: user._id });

    await USER_JWT.create({
      user_id: user._id,
      token,
      iat,
      exp,
    });

    // ✅ Forgot password flow
    if (forgot) {
      return res.status(200).json({
        code: 200,
        success: true,
        message: 'OTP verified successfully for password reset',
        token,
      });
    }

    // ✅ Signup verification flow
    let payload = {
      verification_code: { code: '', expiry: '' },
      status: 'KYC_VERIFICATION_INITIATED',
    };

    if (user?.password === '') {
      if (user?.document_front_side !== '' && user?.document_back_side !== '') {
        payload.status = 'ACTIVE';
      } else {
        payload.status = 'EMAIL_VERIFIED';
      }
    }

    await USER.findByIdAndUpdate(user._id, payload);

    return next({
      code: 200,
      success: true,
      message: 'Email Verified Successfully',
      token,
    });
  } catch (error) {
    return next(error);
  }
};

exports.resendVerificationCode = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await USER.findOne({ email });

    if (!user) {
      return res.status(400).json({
        code: 400,
        message: `User doesn't exist.`,
      });
    }

    const { verification_code } = user;

    if (verification_code) {
      const isValid = checkVerificationCodeValidity(verification_code.expiry);

      if (isValid) {
        return res.status(200).json({
          code: 200,
          success: true,
          message: 'Your verification code is still valid.',
        });
      }
    }

    const newCode = generateSixDigitCode();

    user.verification_code = {
      code: newCode,
      expiry: new Date(Date.now() + 2 * 60 * 1000).toISOString(),
    };

    await user.save();

    await sendEmail({
      to: email,
      subject: 'Your New Email Verification Code',
      template: `<h1>Your Verification Code: ${newCode}</h1>`,
    });

    return res.status(200).json({
      code: 200,
      success: true,
      message: 'A new verification code has been sent to your email.',
    });
  } catch (error) {
    return next(error);
  }
};

exports.createPaymentIntent = async (req, res, next) => {
  try {
    const { _id } = req.user;
    console.log('id is', _id);

    const { token, amount, ...rest } = req.body;
    const user = await USER.findById(_id);

    const charge = await stripe.charges.create({
      amount,
      currency: 'usd',
      source: token,
      description: `Payment by ${user.email}`,
    });

    if (charge.status === 'succeeded') {
      const lastUser = await USER.findOne({ onboarding_number: { $ne: null } }, { onboarding_number: 1 })
        .sort({ onboarding_number: -1 })
        .lean();
      const nextNumber = lastUser?.onboarding_number ? lastUser.onboarding_number + 1 : 1;

      await USER.findByIdAndUpdate(
        _id,
        { status: 'ACTIVE', is_paid: true, onboarding_number: nextNumber, ipo_reward_amount: 500 },
        { runValidators: false, new: true },
      );
    }

    res.json({ success: true, message: 'payment charged Successfully!', charge });
  } catch (err) {
    console.error('Error creating charge:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.createNewPaymentIntent = async (req, res, next) => {
  try {
    const { _id } = req.user;
    console.log('id is', _id);

    const { token, amount, amountIntd, type, ...rest } = req.body;
    const user = await USER.findById(_id);

    if (!user) {
      return res.status(404).json({
        status: 404,
        message: 'User not found',
      });
    }

    const charge = await stripe.charges.create({
      amount,
      currency: 'usd',
      source: token,
      description: `Payment by ${user.email}`,
    });

    console.log('Response from charge >> ', charge?.balance_transaction, charge?.amount, user?._id);

    const transactionData = {
      user_id: user._id,
      amountUsdCents: charge.amount,
      amountIntd: amountIntd,
      txnId: charge.balance_transaction,
      type: type ?? 'Purchase',
      stripeChargeId: charge.id,
      status: charge.status,
      currency: charge.currency,
    };

    // console.log('Transaction data >> ', transactionData);

    const transaction = await TRANSACTIONS.create(transactionData);

    // console.log('Transaction saved successfully >> ', {
    //   _id: transaction._id,
    //   user_id: transaction.user_id,
    //   amountUsdCents: transaction.amountUsdCents,
    //   amountIntd: transaction.amountIntd,
    //   txnId: transaction.txnId,
    //   type: transaction.type,
    //   created_at: transaction.created_at,
    // });

    res.json({
      success: true,
      charge: charge,
      transaction: {
        id: transaction._id,
        txnId: transaction.txnId,
        amount: transaction.amountUsdCents / 100,
        currency: 'USD',
      },
    });
  } catch (err) {
    console.error('Error creating Payment Intent:', err);
    res.status(500).json({
      error: err.message,
      details: 'Failed to process payment and save transaction',
    });
  }
};
exports.walletPaymnetUSDT = async (req, res, next) => {
  try {
    const { _id } = req.user;
    console.log('id is', _id);

    const { hash, status } = req.body;

    if (status === 'success') {
      //Assigning onboarding_number value
      const lastUser = await USER.findOne({ onboarding_number: { $ne: null } }, { onboarding_number: 1 })
        .sort({ onboarding_number: -1 })
        .lean();

      const nextNumber = lastUser?.onboarding_number ? lastUser.onboarding_number + 1 : 1;

      // update user record
      await USER.findByIdAndUpdate(
        _id,
        { status: 'ACTIVE', is_paid: true, onboarding_number: nextNumber, ipo_reward_amount: 500 },
        { runValidators: false, new: true },
      );
    }

    res.json({
      success: true,
      message: 'Wallet payment verified & stored successfully!',
    });
  } catch (err) {
    // console.error('Error saving wallet payment:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.sendVerificationEmail = async (req, res, next) => {
  try {
    const { email, forgot } = req.body;

    const user = await USER.findOne({ email });

    if (!user) {
      return res.status(404).json({
        code: 404,
        message: `User Doesn't Exists`,
      });
    }

    if (user?.status !== 'VERIFY_EMAIL' && !forgot) {
      return res.status(409).json({
        code: 409,
        message: 'Email is already verified',
      });
    }

    const code = generateSixDigitCode();

    const payload = {
      verification_code: { code, expiry: new Date(Date.now() + 2 * 60 * 1000) },
    };

    // if (forgot) {
    //   payload.password = '';
    // }

    await USER.findOneAndUpdate({ email }, payload);

    await sendEmail({
      to: email,
      subject: `Email Verification Code`,
      template: `<h1> Email Verification Code:${code} </h1>`,
    });

    return next({
      code: 200,
      success: true,
      message: 'Email verification code has been sent successfully to registered email',
    });
  } catch (error) {
    return next(error);
  }
};

exports.setPassword = async (req, res, next) => {
  try {
    const { _id } = req.user;
    console.log('id is---->>>>. is setpassword', _id);
    const { password } = req.body;

    await USER.findByIdAndUpdate(_id, { password: hashPassword(password) });

    return next({ code: 200, success: true, message: 'Your password has been successfully set up! ' });
  } catch (error) {
    return next(error);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await USER.findOne({ email });

    if (!user) {
      return res.status(400).json({
        code: 400,
        message: "User Doesn't Exists",
      });
    }

    if (!comparePassword(password, user.password)) {
      return res.status(401).json({
        code: 401,
        message: 'Password is Incorrect',
      });
    }

    if (user.status === 'VERIFY_EMAIL') {
      const code = generateSixDigitCode();

      user.verification_code = {
        code,
        expiry: new Date(Date.now() + 2 * 60 * 1000),
      };
      await user.save();

      await sendEmail({
        to: email,
        subject: `Email Verification Code`,
        template: `<h1> Email Verification Code:${code} </h1>`,
      });
    }

    const user_id = user._id;

    const totalSessions = await USER_JWT.countDocuments({
      user_id,
    });

    if (totalSessions > 0) {
      await USER_JWT.deleteOne({ user_id });
    }

    const token = generateToken({
      id: user_id,
      email: user.email,
    });

    if (!token) {
      return res.status(500).json({
        code: 500,
        message: 'Error generating token!',
      });
    }

    const { iat, exp } = decodeToken(token);

    await USER_JWT.create({
      user_id,
      token,
      iat,
      exp,
    });

    return next({
      code: 200,
      success: true,
      message: 'User Logged In Successfully!',
      token,
    });
  } catch (error) {
    return next(error);
  }
};

exports.getUserDetails = async (req, res, next) => {
  try {
    const { _id } = req.user;

    const user = await USER.findById(_id).select('-password -verification_code').lean();

    return next({
      code: 200,
      success: true,
      response: 'User Details Fetched Successfully',
      user,
    });
  } catch (error) {
    return next(error);
  }
};

exports.getKycVerified = async (req, res, next) => {
  try {
    const { _id } = req.user;
    // console.log('-------------> req.user', req.user);
    const { document_front_side, document_back_side } = req.files || {};

    if (!document_front_side || !document_back_side) {
      return res.status(400).json({
        code: 400,
        message: 'Please upload both the front and back sides of the document for KYC verification.',
      });
    }

    const [documentFrontSide, documentBackSide] = await Promise.all([
      uploadToS3(document_front_side[0], _id),
      uploadToS3(document_back_side[0], _id),
    ]);

    await USER.findByIdAndUpdate(
      _id,
      {
        document_front_side: documentFrontSide,
        document_back_side: documentBackSide,
        status: 'KYC_VERIFIED',
      },
      { runValidators: true },
    );

    return next({
      code: 200,
      success: true,
      message: 'KYC verification is now under process.',
    });
  } catch (error) {
    return next(error);
  }
};

exports.contactSupport = async (req, res, next) => {
  try {
    await SUPPORT_QUERY.create({ ...req.body });

    return next({ code: 200, success: true, message: 'Support Request Submitted Successfully' });
  } catch (error) {
    return next(error);
  }
};

exports.contactUs = async (req, res, next) => {
  return next({ code: 200, success: true, message: "Thanks for contacting us, we'll get in touch with you" });
};

exports.sendConfigToClient = async (req, res, next) => {
  res.status(200).json({ success: true, publishableKey: process.env.STRIPE_PUBLISHABLE_KEY });
};

exports.getTransactions = async (req, res, next) => {
  const { _id } = req.user;
  if (!_id) {
    return res.status(400).json({
      code: 400,
      message: 'User id is required',
    });
  }

  try {
    const transactions = await TRANSACTIONS.find({ user_id: _id }).sort({ created_at: -1 });

    if (!transactions) {
      return res.status(404).json({
        code: 404,
        message: 'No transactions found',
      });
    }
    res.status(200).json({
      code: 200,
      success: true,
      transactions,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      code: 500,
      message: 'Internal server error',
    });
  }
};
