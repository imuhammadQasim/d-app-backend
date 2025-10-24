const express = require('express');
const router = express.Router();
const tryCatch = require('../utils/tryCatch');
const { roleController } = require('../controllers');

router.post('/role', tryCatch(roleController.createRole));

router.get('/role', tryCatch(roleController.getAllRoles));

router.post('/restore-role', tryCatch(roleController.restoreRole));

router.put('/role/:id', tryCatch(roleController.updateRole));

router.delete('/delete-role/:id', tryCatch(roleController.deleteRole));

module.exports = router;
