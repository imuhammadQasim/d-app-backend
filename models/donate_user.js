module.exports = function (params) {
  return {
    schema: {
      userId: { type: Schema.Types.ObjectId, ref: 'User', required: false },
      email: { type: String, required: true },
      amount: { type: Number, required: true },
      firstName: { type: String, required: true },
      lastName: { type: String },
      transactionId: { type: String },
      status: {
        type: String,
        enum: ['pending', 'success', 'failed'],
        default: 'pending',
      },
      paymentMethod: { type: String, enum: ['card', 'bank'], default: 'card' },
      isAnonymous: { type: Boolean, default: false },
      organizationName: { type: String },
      donateDuration: { type: String, enum: ['weekly', 'monthly'], default: 'weekly' },
    },
    collection: 'donate_users',
  };
};
