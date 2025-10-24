module.exports = mongo => {
  return {
    schema: {
      user_id: { type: mongo.Schema.Types.ObjectId, ref: 'user', required: true },
      balance: { type: Number },
    },
    collection: 'user_wallet',
  };
};
