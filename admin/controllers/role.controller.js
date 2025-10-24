const { PERMISSION, ROLE, ADMIN } = global;
const { filterQuery, pagination } = require('../helpers');
const defaultRoles = require('../helpers/defaultRoles');

exports.createRole = async (req, res, next) => {
  const { type, description, permissions } = req.body;

  const isPresent = await ROLE.findOne({ type });

  if (isPresent) {
    throw {
      code: 409,
      message: 'Role exists with this same type',
      success: false,
    };
  }

  if (!type || !description || !permissions) {
    throw {
      code: 400,
      message: 'Data is invalid',
      success: false,
    };
  }

  let newPermissions = await PERMISSION.find({
    can: { $in: permissions },
  }).select('_id');

  newPermissions = [...new Set(newPermissions.map(e => e._id).flat())];

  await ROLE.create({
    type,
    description,
    permissions: newPermissions,
  });

  return next({
    code: 200,
    message: 'Role Added Successfully',
    success: true,
    data: newPermissions,
  });
};

exports.getAllRoles = async (req, res, next) => {
  let { endDate, startDate, searchText, itemsPerPage, page } = filterQuery(req);

  const query = { $and: [] };

  if (searchText && !searchText?.includes('?')) {
    query.$and.push({
      $or: [{ type: { $regex: searchText, $options: 'i' } }, { description: { $regex: searchText, $options: 'i' } }],
    });
  } else if (searchText?.includes('?')) {
    throw {
      code: 405,
      success: false,
      message: 'Special Characters such as ? is not allowed',
    };
  }

  if (startDate && endDate) {
    let start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    let end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    query.$and.push({ created_at: { $gte: start, $lt: end } });
  }

  if (req.query.filterRoles && req.query.filterRoles !== '') {
    query.$and.push({
      type: { $regex: req.query.filterRoles, $options: 'i' },
    });
  }

  const count = await ROLE.countDocuments(query);

  if (req.query.getAll === 'true') {
    page = 1;
    itemsPerPage = count;
  }

  const roles = await ROLE.find(query)
    .populate({
      path: 'permissions',
      model: PERMISSION,
    })
    .skip((page - 1) * itemsPerPage)
    .limit(itemsPerPage)
    .sort({ created_at: -1 });

  return next({
    code: 200,
    message: 'Roles fetched successfully',
    ...pagination(roles, page, count, itemsPerPage),
  });
};

exports.updateRole = async (req, res, next) => {
  const { id } = req.params;

  const adminWithThisRole = await ADMIN.find({ roles: { $in: id } }).select('_id');

  const { type, description, permissions } = req.body;

  const isPresent = await ROLE.find({ type: type });

  if (isPresent.length > 1) {
    throw {
      code: 409,
      success: true,
      message: 'Duplicate type not allowed',
    };
  }

  if (!type && !description && !permissions) {
    throw {
      code: 400,
      success: false,
      message: 'Data is invalid',
    };
  }

  let newPermissions = await PERMISSION.find({
    can: { $in: permissions },
  });

  const permissionToAddInAdmin = newPermissions.map(e => e.can);

  newPermissions = newPermissions.map(e => e._id).flat();

  adminWithThisRole.forEach(async _ => {
    await ADMIN.findByIdAndUpdate(_, { $set: { permissions: permissionToAddInAdmin } });
  });

  await ROLE.findByIdAndUpdate(id, {
    type,
    description,
    permissions: newPermissions,
  });

  return next({
    code: 200,
    success: true,
    message: 'Role updated Successfully',
  });
};

exports.deleteRole = async (req, res, next) => {
  const { id } = req.params;

  const role = await ROLE.findByIdAndDelete(id);

  if (!role) {
    throw {
      code: 409,
      success: true,
      message: 'Role not found!',
    };
  }

  await ADMIN.updateMany({ roles: id }, { $pull: { roles: id } });

  return next({
    code: 200,
    success: true,
    message: 'Role deleted Successfully',
  });
};

exports.restoreRole = async (req, res, next) => {
  const roleId = req.body.id;
  const hardCodedRoles = defaultRoles();
  let dbRole = await ROLE.findOne({ _id: roleId });
  let roleExistPermissions = {};

  hardCodedRoles?.map(ele => {
    if (ele.type === dbRole?.type) {
      roleExistPermissions = ele;
    }
  });

  if (!Object.keys(roleExistPermissions)?.length) {
    throw {
      code: 200,
      success: false,
      message: 'Default Role not Exist',
    };
  }

  const new_permissions = await PERMISSION.find({ can: { $in: roleExistPermissions.permissions.map(val => val.can) } })
    .select('_id can')
    .lean();

  const new_permissions_id = new_permissions.map(({ _id }) => _id?.toString());

  await ROLE.findOneAndUpdate({ _id: roleId }, { $set: { permissions: new_permissions_id } });

  return next({
    code: 200,
    success: true,
    message: 'Role Restored Successfully',
  });
};
