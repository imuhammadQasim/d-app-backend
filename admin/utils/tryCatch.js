module.exports = handler => async (req, res, next) => {
  try {
    await handler(req, res, next);
  } catch (error) {
    console.log({ error }, error);
    return res.status(error?.code ?? 500).send({
      code: error?.code ?? 500,
      message: error?.message ?? 'Something Went Wrong',
      success: false,
    });
  }
};
