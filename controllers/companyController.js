const Company = require('../models/companyModel');
const base = require('./baseController');
const APIFeatures = require('../utils/apiFeatures');

exports.getAllCompanys = base.getAll(Company);
exports.getCompany = base.getOne(Company);

// Don't update password on this 
exports.updateCompany = base.updateOne(Company);
exports.deleteCompany = base.deleteOne(Company);
exports.addCompany = base.createOne(Company);
