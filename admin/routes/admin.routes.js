const express = require('express');
const router = express.Router();
const tryCatch = require('../utils/tryCatch');
const { adminController } = require('../controllers');

router.post('/signin', tryCatch(adminController.signin));

router.delete('/logout', tryCatch(adminController.logout));

router.post('/add-admin', tryCatch(adminController.addAdmin));

router.put('/suspend-admin/:id', tryCatch(adminController.suspendAdmin));

router.delete('/delete-admin/:id', tryCatch(adminController.deleteAdmin));

router.patch('/update-admin/:id', tryCatch(adminController.updateAdmin));

router.get('/get-all-admins', tryCatch(adminController.getAllAdmins));

router.post('/force-logout-admin/:id', tryCatch(adminController.forceLogoutAdmin));

router.get('/perms', tryCatch(adminController.getMyPermissions));

router.get('/restore-admins-roles-permissions', tryCatch(adminController.restoreAdminRolesPermissions));

module.exports = router;
