module.exports = () => {
  return {
    schema: {
      email: {
        type: String,
        required: true,
      },
      first_name: {
        type: String,
        required: true,
      },
      last_name: {
        type: String,
        required: true,
      },
      phone_number: {
        type: String,
        required: true,
      },
      country: {
        type: String,
      },
      city: {
        type: String,
      },
      state: {
        type: String,
      },
      zip_postal_code: {
        type: String,
      },
      address: {
        type: String,
      },
      query: {
        type: String,
      },
    },
    collection: 'support_query',
  };
};
