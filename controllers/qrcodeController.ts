const QRcode = require('../models/qrcodeModel');
const base = require('./baseController');
const APIFeatures = require('../utils/apiFeatures');
const { encrypt, decrypt } = require('../utils/helper');
const Product = require('../models/productModel');
const { getProductMetadataFromSC } = require('../web3/index');

exports.getAllQRcodes = base.getAll(QRcode);
exports.getQRcode = base.getOne(QRcode);

// Don't update password on this 
exports.updateQRcode = base.updateOne(QRcode);
exports.deleteQRcode = base.deleteOne(QRcode);
exports.addQRcode = base.createOne(QRcode);

exports.getQRcodesWithProductId = async(req: any, res: any, next: any) => {
    try {
        const doc = await QRcode.find({ product_id: req.body.product_id }).skip(req.body.offset).limit(req.body.amount);
        
        res.status(200).json({
            status: 'success',
            results: doc.length,
            data: {
                data: doc
            }
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
        const product = await Product.findById(data.product_id);
        console.log(product);
        const tokenMetadata = await getProductMetadataFromSC(product.contract_address[Math.floor(data.token_id / 30000)], data.token_id % 30000);

        const qrcode  = await QRcode.find({product_id: data.product_id});
        const resData = {
            token_id: data.token_id,
            ...product._doc,
            ...tokenMetadata,
            qrcode_img: qrcode[data.token_id - 1].image
        };
        
        res.status(200).json({
            status: 'success',
            data: resData
        });
    } catch (error) {
        next(error);
    }
};