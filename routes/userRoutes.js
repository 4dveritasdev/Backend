const express = require('express');
const router = express.Router();
const UserController = require('../controllers/userController');

// Protect all routes after this middleware
// router.use(authController.protect);

router.get('/', UserController.getAllUsers);
// router.get('/:id', UserController.getUser);
router.post('/filter', UserController.getAllUsers);
router.post('/getUserByWallet', UserController.getUserByWallet);
router.post('/', UserController.addUser);
router.put('/:id', UserController.updateUser);
router.delete('/:id', UserController.deleteUser);


module.exports = router;