const Company = require('../models/companyModel');
const base = require('./baseController');
const APIFeatures = require('../utils/apiFeatures');
const AppError = require('../utils/appError');

exports.getAllCompanys = base.getAll(Company);
exports.getCompany = base.getOne(Company);

// Don't update password on this 
exports.updateCompany = base.updateOne(Company);
exports.deleteCompany = base.deleteOne(Company);
exports.addCompany = async(req: any, res: any, next: any) => {
    try {
        const company = Company.find({ name: req.body.name });
        console.log(company)
        if(company) {
            return next(new AppError(400, 'fail', 'Already exists the company'), req, res, next);
        }
        const doc = await Company.create(req.body);

        res.status(200).json({
            status: 'success',
            data: {
                doc
            }
        });

    } catch (error) {
        next(error);
    }
};

// exports.getCompanyByWallet = async(req: any, res: any, next: any) => {
//     try {
//         const doc = await Company.findOne({ wallet: req.params.wallet});

//         res.status(200).json({
//             status: 'success',
//             data: {
//                 doc
//             }
//         });
//     } catch (error) {
//         next(error);
//     }
// };

exports.login = async(req: any, res: any, next: any) => {
    try {
        const doc = await Company.findOne({ name: req.body.name, password: req.body.password });

        if(!doc) {
            res.status(404).json({
                status: 'failed',
                message: 'company does not exist'
            });    
        }

        res.status(200).json({
            status: 'success',
            data: {
                doc
            }
        });
    } catch (error) {
        next(error);
    }
};