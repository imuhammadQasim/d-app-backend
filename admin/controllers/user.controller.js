const { filterQuery, pagination } = require('../helpers');
const { USER, USER_WALLET } = global;

exports.getAllUsers = async (req, res, next) => {
  let { page, itemsPerPage, searchText, startDate, endDate, status } = filterQuery(req);

  let query = {
    $and: [],
    $or: [],
  };

  if (startDate && endDate) {
    let start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    let end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    query?.$and.push({ created_at: { $gte: start, $lt: end } });
  }

  if (searchText && searchText !== '') {
    query.$or = [
      {
        email: { $regex: '.*' + searchText + '.*', $options: 'i' },
      },
      {
        first_name: { $regex: '.*' + searchText + '.*', $options: 'i' },
      },
      {
        last_name: { $regex: '.*' + searchText + '.*', $options: 'i' },
      },
    ];
  }

  if (status && status !== '') {
    query.$and.push({
      status,
    });
  }

  if (!query.$and.length > 0) {
    delete query.$and;
  }

  if (!query.$or.length > 0) {
    delete query.$or;
  }

  let totalItems = await USER.countDocuments(query);
  if (req.query.getAll === 'true') {
    page = 1;
    itemsPerPage = totalItems;
  }

  const users = await USER.find(query)
    .select('-password -verification_code')
    .sort({ created_at: -1 })
    .skip((page - 1) * itemsPerPage)
    .limit(itemsPerPage)
    .lean();

  const data = pagination(users, page, totalItems, itemsPerPage);

  return next({ ...data, code: 200 });
};

exports.changeUserKycVerificationStatus = async (req, res, next) => {
  const { user_id, status } = req.body;

  const user = await USER.findByIdAndUpdate(user_id, { status });

  if (!user) {
    throw {
      code: 404,
      message: 'User not found!',
    };
  }

  if (status === 'ACTIVE') {
    await USER_WALLET.create({ user_id, balance: 0 });
  }

  return next({ code: 200, success: true, message: 'User KYC request status updated successfully' });
};
