const express = require('express');
const router = express.Router();
const uploadController = require('../controllers/uploadController');
const upload = require('../utils/upload');

// Protect all routes after this middleware
// router.use(authController.protect);

router.post('/single', upload.single('file'), uploadController.uploadSingle);


module.exports = router;