const Company = require('../models/companyModel');
const Product = require('../models/productModel')
const base = require('./baseController');
const APIFeatures = require('../utils/apiFeatures');
const AppError = require('../utils/appError');
const { initClient, batchMint, getNonce, mintUser, getUserTokenIdFromId } = require('../web3/index');
const { CryptoUtils } = require('../web3/utils/CryptoUtil');
const { encrypt, decrypt } = require('../utils/helper');
const qrcode = require('qrcode');
const QRcode = require('../models/qrcodeModel');
const mongoose = require("mongoose");

exports.getAllCompanys = base.getAll(Company);
exports.getCompany = base.getOne(Company);

// Don't update password on this 
exports.updateCompany = base.updateOne(Company);
exports.deleteCompany = base.deleteOne(Company);
exports.addCompany = async(req: any, res: any, next: any) => {
    try {
        const company = await Company.findOne({ name: req.body.name });
        if(company) {
            return next(new AppError(400, 'fail', 'Already exists the company'), req, res, next);
        }

        const newKeyPair = CryptoUtils.generateKeyPair();
        const newAddress = CryptoUtils.keyPairToAccountAddress(newKeyPair);
        console.log(newAddress, newKeyPair.getPrivate('hex'));

        const doc = await Company.create({
            wallet: newAddress,
            privateKey: newKeyPair.getPrivate('hex'),
            ...req.body
        });
        await mintUser(doc._id.toString(), newAddress);
        console.log(doc);

        res.status(200).json({
            status: 'success',
            data: {
                // doc
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


exports.getProductsByCompanyId = async(req:any,res:any,next:any) => {
    try 
    {
        const user_id = req.query.user_id;
        console.log('user_id',user_id)
        const company_products = await QRcode.find({company_id:mongoose.Types.ObjectId(user_id)})
       

        let products = [];
        let count:any = {}

        for(const info of company_products) {   
            if(count[info.product_id]) {
                count[info.product_id] ++;
            }
            else {
                count[info.product_id] = 1; 
                const product = await Product.findById(info.product_id)
                products.push(product)
            }
        }
        res.status(200).json({
            status:'success',
            data:{
                products,
                count,
                company_products
            }
        })
    }
    catch(err) {
        console.log('error',err)
        next(err)
    }
}

exports.login = async(req: any, res: any, next: any) => {
    try {
        const user = await Company.findOne({ name: req.body.name, password: req.body.password });
        let ismobile = req.body.mobile;

        if(!user || !ismobile) {
           return res.status(404).json({
                status: 'failed',
                message: 'User name or password is wrong!'
            });    
        }

        const {token_id} = await getUserTokenIdFromId(user._id);
        console.log(token_id);
        const stringdata = JSON.stringify({
            user_id: user._id,
            token_id
        });
        const encryptData = encrypt(stringdata);

        const qrcodeImage = await qrcode.toDataURL('https://4dveritaspublic.com?qrcode=' + encryptData);

        const company_products = await QRcode.find({ company_id: user._id });

        user.privateKey = undefined;
        let doc = {
            qrcode: qrcodeImage,
            products: company_products,
            ...user._doc
        };

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

exports.verify = async(req: any, res: any, next: any) => {
    try {
        const doc = await Company.findByIdAndUpdate(req.params.id, { isVerified: true }, {
            new: true,
            runValidators: true
        });

        if (!doc) {
            return next(new AppError(404, 'fail', 'No document found with that id'), req, res, next);
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