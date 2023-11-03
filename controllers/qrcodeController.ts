const QRcode = require('../models/qrcodeModel');
const base = require('./baseController');
const APIFeatures = require('../utils/apiFeatures');

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
