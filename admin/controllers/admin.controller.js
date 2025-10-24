const { ADMIN, ROLE, PERMISSION, ADMIN_JWT } = global;
const {
  hashPassword,
  generateToken,
  comparePassword,
  decodeToken,
  filterQuery,
  pagination,
  rolesFilter,
} = require('../helpers');
const { default: mongoose } = require('mongoose');
const { seedRoles, createFirstAdmin } = require('../helpers/seedFunction');

exports.signin = async (req, res, next) => {
  const { email, password } = req.body;

  let admin = await ADMIN.findOne({
    email,
  }).select('-updated_at -created_at');

  if (!admin || !comparePassword(password, admin.password)) {
    throw {
      code: 401,
      success: false,
      message: 'Email or Password is Incorrect',
    };
  }

  const totalSessions = await ADMIN_JWT.countDocuments({
    admin_id: admin._id,
  });

  if (totalSessions > 0) {
    await ADMIN_JWT.deleteOne({ admin_id: admin._id });
  }

  const token = generateToken({
    id: admin._id,
    email,
  });

  if (!token) {
    throw {
      code: 500,
      success: false,
      message: 'Error generating token!',
    };
  }

  const decryptedToken = decodeToken(token);
  await ADMIN_JWT.create({
    admin_id: admin._id,
    token: token,
    iat: decryptedToken.iat,
    exp: decryptedToken.exp,
  });

  return next({
    code: 200,
    success: true,
    message: 'Login successful!',
    token,
  });
};

exports.logout = async (req, res, next) => {
  await ADMIN_JWT.deleteOne({
    admin_id: req.admin._id,
  });

  return next({ code: 200, message: 'Logged out!' });
};

exports.addAdmin = async (req, res, next) => {
  const { email } = req.body;

  let admin = await ADMIN.findOne({ email });

  if (admin) {
    throw {
      code: 409,
      message: 'Email address you provided is already in use',
      success: false,
    };
  }

  let roles = await ROLE.find({
    _id: { $in: req.body.roles.map(i => new mongoose.Types.ObjectId(i)) },
  });

  let permissions_find_array = roles.map(r => r.permissions.flat()).flat();
  permissions_find_array = permissions_find_array.map(permission => new mongoose.Types.ObjectId(permission));

  let permissions = await PERMISSION.find({
    _id: { $in: permissions_find_array },
  });

  req.body.permissions = permissions.map(i => i.can);

  let new_admin_request = req.body;
  new_admin_request.password = hashPassword(new_admin_request.password);
  const newAdmin = await ADMIN.create(new_admin_request);

  return next({
    code: 200,
    message: 'Admin is created Successfully!',
    success: true,
    data: newAdmin,
  });
};

exports.deleteAdmin = async (req, res, next) => {
  let id = req.params.id;

  await ADMIN.deleteOne({
    _id: id,
  });

  return next({ code: 200, message: 'Admin is removed' });
};

exports.forceLogoutAdmin = async (req, res, next) => {
  const { id } = req.params;
  const adminJwt = await ADMIN_JWT.findOne({ admin_id: id });

  if (!adminJwt || adminJwt?.token === '') {
    return next({
      code: 200,
      error: true,
      message: 'This admin is already logged out',
    });
  }

  await ADMIN_JWT.findOneAndUpdate({ admin_id: id }, { $set: { token: '' } });

  return next({
    code: 200,
    error: false,
    message: 'Successfully logged out',
  });
};

exports.updateAdmin = async (req, res, next) => {
  const { id } = req.params;

  const payload = req.body;
  const counter = await ADMIN.findOne({ _id: id });

  if (counter) {
    let admin = {};
    Object.keys(payload).forEach(element => {
      if (element === 'password') {
        payload[element] = hashPassword(payload[element]);
      }
      admin[element] = payload[element];
    });

    await ADMIN.findOneAndUpdate({ _id: id }, { $set: { ...admin } });
  }

  return next({ code: 200, message: 'Admin updated' });
};

exports.getAllAdmins = async (req, res, next) => {
  let { page, itemsPerPage, searchText, startDate, endDate } = filterQuery(req);

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

  if (req.query.filterRoles && req.query.filterRoles !== '') {
    query.$and.push({
      roles: {
        $in: (await rolesFilter(req.query.filterRoles)) ?? [],
      },
    });
  }

  if (searchText && searchText !== '') {
    query.$or = [
      {
        email: { $regex: '.*' + searchText + '.*', $options: 'i' },
      },
      {
        roles: {
          $in: (await rolesFilter(searchText)) ?? [],
        },
      },
    ];
  }

  if (!query.$and.length > 0) {
    delete query.$and;
  }

  if (!query.$or.length > 0) {
    delete query.$or;
  }

  let totalItems = await ADMIN.countDocuments(query);
  if (req.query.getAll === 'true') {
    page = 1;
    itemsPerPage = totalItems;
  }

  const admins = await ADMIN.find(query)
    .populate({ path: 'roles', model: ROLE, select: 'type' })
    .sort({ created_at: -1 })
    .skip((page - 1) * itemsPerPage)
    .limit(itemsPerPage)
    .lean();

  const data = pagination(admins, page, totalItems, itemsPerPage);

  return next({ ...data, code: 200 });
};

exports.suspendAdmin = async (req, res, next) => {
  const admin = await ADMIN.findOne({ _id: req.params.id });
  admin.is_suspended = !admin.is_suspended;
  await admin.save();

  return next({ code: 200, message: 'Successfully Update Suspend Status', status: 200, statusText: 'OK' });
};

exports.getMyPermissions = async (req, res, next) => {
  const adminMain = await ADMIN.findById(req.admin._id).select('-password -token').lean();

  const { permissions, ...rest } = adminMain;

  let admin = adminMain;

  let roles = await ROLE.find({ _id: { $in: admin.roles } }).select('_id type permissions');

  let filterPermissions = [...new Set(roles.map(_ => _.permissions).flat())];

  let permissions_comp = await PERMISSION.find({
    _id: { $in: filterPermissions },
  }).select('-_id can');

  permissions_comp = permissions_comp.map(e => e.can);

  let role_type = roles.map(_ => _.type);

  return next({
    code: 200,
    message: 'Permissions fetched successfully',
    ...rest,
    permissions: permissions_comp,
    role_type: role_type,
  });
};

exports.restoreAdminRolesPermissions = async (req, res, next) => {
  const { isFirst } = req.query;
  const cond = isFirst && isFirst !== '' && isFirst === 'true';

  seedRoles(cond)
    .then(() => {
      if (cond) {
        createFirstAdmin();
      }
    })
    .catch(e => {
      throw { code: e?.code ?? 500, message: e?.message };
    });

  return next({
    code: 200,
    success: true,
    message: 'Restored Successfully',
  });
};
