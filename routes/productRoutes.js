const express = require('express');
const router = express.Router();
const ProductController = require('../controllers/productController');

// Protect all routes after this middleware
// router.use(authController.protect);

router.get('/', ProductController.getAllProducts);
router.post('/filter', ProductController.getAllProducts);
router.get('/:id', ProductController.getProduct);
router.post('/', ProductController.addProduct);
router.put('/:id', ProductController.updateProduct);
router.delete('/:id', ProductController.deleteProduct);


module.exports = router;