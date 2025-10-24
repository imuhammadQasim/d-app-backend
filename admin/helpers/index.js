const { SECRET } = require('../config');
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { jwtDecode } = require('jwt-decode');

module.exports = {
  REGULAR_HANDLER: (params, req, res, next) => {
    return res.status(params?.code).send(params);
  },
  hashPassword: password => {
    const salt = bcryptjs.genSaltSync(10);
    const hashedPassword = bcryptjs.hashSync(password, salt);
    return hashedPassword;
  },
  comparePassword: (text, hash) => {
    return bcryptjs.compareSync(text, hash);
  },
  generateToken: payload => {
    const token = jwt.sign(payload, SECRET, {
      expiresIn: '1h',
      algorithm: 'HS256',
    });
    return token;
  },
  decodeToken: token => {
    return jwtDecode(token);
  },
  filterQuery: req => ({
    ...req.query,
    page: req.query.page ? Number(req.query.page) : 1,
    itemsPerPage: req.query.itemsPerPage
      ? Number(req.query.itemsPerPage)
      : req.query.perPage
        ? Number(req.query.perPage)
        : 10,
    searchText:
      req.query.searchText !== 'null' && req.query.searchText !== 'undefined' && req.query.searchText
        ? req.query.searchText
        : '',
    startDate:
      req.query.startDate !== 'null' && req.query.startDate !== 'undefined' && req.query.startDate
        ? req.query.startDate
        : '',
    endDate:
      req.query.endDate !== 'null' && req.query.endDate !== 'undefined' && req.query.endDate ? req.query.endDate : '',
  }),
  pagination: (items = [], page = 1, totalItems = 0, itemsPerPage = 5) => {
    return {
      currentPage: page,
      hasNextPage: itemsPerPage * page < totalItems,
      hasPreviousPage: page > 1,
      nextPage: page + 1,
      previousPage: page - 1,
      lastPage: Math.ceil(totalItems / itemsPerPage),
      totalItems: totalItems,
      items: items,
    };
  },
  rolesFilter: async query => {
    const myQuery = {
      type: { $regex: '.*' + query + '.*', $options: 'i' },
    };

    const rolesFilter = await ROLE.find(myQuery).select('_id');
    return rolesFilter.map(e => e._id);
  },
};
