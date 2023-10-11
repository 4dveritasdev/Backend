const Product = require('../models/productModel');
const base = require('./baseController');
const APIFeatures = require('../utils/apiFeatures');

exports.getAllProducts = base.getAll(Product);
exports.getProduct = base.getOne(Product);

// Don't update password on this 
exports.updateProduct = base.updateOne(Product);
exports.deleteProduct = base.deleteOne(Product);
exports.addProduct = base.createOne(Product);
