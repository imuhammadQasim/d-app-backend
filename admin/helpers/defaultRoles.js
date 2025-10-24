const defaultPermissions = require('./defaultPermission.json');

const defaultRoles = () => {
  return [
    {
      type: 'SUPER_ADMIN',
      permissions: defaultPermissions,
    },
  ];
};

module.exports = defaultRoles;
