module.exports = mongo => {
  return {
    schema: {
      email: {
        type: String,
        unique: true,
        required: [true, 'email is required'],
      },
      password: {
        type: String,
        required: [true, 'password is ready'],
      },
      permissions: { type: Array, default: [] },
      roles: [{ type: mongo.Schema.Types.ObjectId, ref: 'role' }],
    },
    collection: 'admin',
  };
};
