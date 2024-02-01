const QRcode = require('../models/qrcodeModel');
const Product = require('../models/productModel');
const Company = require('../models/companyModel');
const base = require('./baseController');
const APIFeatures = require('../utils/apiFeatures');
const { encrypt, decrypt } = require('../utils/helper');
const { getProductMetadataFromSC } = require('../web3/index');
const qrcode = require('qrcode');

const divcount = 20000;

exports.getAllQRcodes = base.getAll(QRcode);
exports.getQRcode = base.getOne(QRcode);

// Don't update password on this 
exports.updateQRcode = base.updateOne(QRcode);
exports.deleteQRcode = base.deleteOne(QRcode);
exports.addQRcode = base.createOne(QRcode);

exports.getQRcodesWithProductId = async(req: any, res: any, next: any) => {
    try {
        // const doc = await QRcode.find({ product_id: req.body.product_id }).skip(req.body.offset).limit(req.body.amount);
        const product = await Product.findById(req.body.product_id);

        let data = [];
        for (let i = 0; i < (product.total_minted_amount > 100 ? 100 : product.total_minted_amount); i ++) {
            const stringdata = JSON.stringify({
                product_id: product._id,
                token_id: i
            });
            const encryptData = encrypt(stringdata);
            data.push(encryptData);
        }
        
        res.status(200).json({
            status: 'success',
            data
        });
        
    } catch (error) {
        next(error);
    }

};

exports.decrypt = async (req: any, res: any, next: any) => { 
    try {
        console.log(req.body.encryptData);
        const data = JSON.parse(decrypt(req.body.encryptData));
        console.log(data);

        if(data.product_id) {
            const product = await Product.findById(data.product_id);
            console.log(product);
            const tokenMetadata = await getProductMetadataFromSC(product.contract_address[Math.floor(data.token_id / divcount)], data.token_id % divcount);

            const qrcodeImage = await qrcode.toDataURL(req.body.encryptData);

            const resData = {
                token_id: data.token_id,
                ...product._doc,
                ...tokenMetadata,
                qrcode_img: qrcodeImage
            };
            
            res.status(200).json({
                status: 'success',
                data: resData,
                type: 'Product'
            });
        } else if (data.user_id) {
            const company = await Company.findById(data.user_id);
            company.privateKey = undefined;
            company.password = undefined;
            console.log(company);
            const qrcodeImage = await qrcode.toDataURL(req.body.encryptData);
            
            const resData = {
                token_id: data.token_id,
                ...company._doc,
                qrcode_img: qrcodeImage
            };
            
            res.status(200).json({
                status: 'success',
                data: resData,
                type: 'User'
            });
        }
    } catch (error) {
        next(error);
    }
};