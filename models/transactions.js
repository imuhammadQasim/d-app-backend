module.exports = mongo => {
  return {
    schema: {
      user_id: { type: mongo.Schema.Types.ObjectId, ref: 'user', required: true },
      amountUsdCents: { type: Number, required: true },
      amountIntd: { type: Number },
      txnId: { type: String, required: true },
      type: { type: String,enum:['Purchase','Invest'], default: 'Purchase' }, 
      stripeChargeId: { type: String }, 
      status: { type: String },
      currency: { type: String, default: 'usd' }
    },
    collection: 'transactions'
  };
};