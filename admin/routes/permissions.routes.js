const express = require('express');
const router = express.Router();
const tryCatch = require('../utils/tryCatch');
const { permissionController } = require('../controllers');

router.post('/permission', tryCatch(permissionController.createPermission));

router.get('/get-all-permission', tryCatch(permissionController.getAllPermissions));

router.post('/restore-permissions', tryCatch(permissionController.restorePermissions));

router.delete('/permission/:id', tryCatch(permissionController.deletePermission));

router.put('/permission/:id', tryCatch(permissionController.updatePermission));

module.exports = router;
