const express = require('express');
const router = express.Router();
const adminRoutes = require('./admin.routes');
const rolesRoutes = require('./roles.routes');
const permissionsRoutes = require('./permissions.routes');
const userRoutes = require('./user.routes');

router.get('/health', (req, res) => {
  res.send('OK');
});

router.use('/', adminRoutes);
router.use('/roles', rolesRoutes);
router.use('/permissions', permissionsRoutes);
router.use('/user', userRoutes);

module.exports = router;
