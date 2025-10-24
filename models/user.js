module.exports = function () {
  return {
    schema: {
      email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
      },
      password: {
        type: String,
        required: true,
      },
      verification_code: {
        code: {
          type: String,
          required: true,
        },
        expiry: {
          type: Date,
          required: true,
        },
      },
      stripe_customer_id: {
        type: String,
      },
      first_name: {
        type: String,
        required: true,
      },
      last_name: {
        type: String,
        required: true,
      },
      status: {
        type: String,
        enum: ['VERIFY_EMAIL', 'ACTIVE', 'SUSPENDED', 'BLOCKED', 'KYC_VERIFICATION_INITIATED', 'KYC_VERIFIED'],
        default: 'VERIFY_EMAIL',
      },
      is_paid: {
        type: Boolean,
        default: false,
      },
      ipo_reward_amount: {
        type: Number,
        default: 0,
      },
      onboarding_number: {
        type: Number,
      },
      profile_picture: { type: String },
      document_front_side: {
        type: String,
        required: function () {
          return this.status === 'KYC_VERIFICATION_INITIATED';
        },
      },
      document_back_side: {
        type: String,
        required: function () {
          return this.status === 'KYC_VERIFICATION_INITIATED';
        },
      },
    },
    collection: 'user',
  };
};
