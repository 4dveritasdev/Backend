const Product = require('../models/productModel');
const QRcode = require('../models/qrcodeModel');
const base = require('./baseController');
const APIFeatures = require('../utils/apiFeatures');
const { generateQrCode } = require('../utils/generateQrCode');
// const qr = require('qr-image');
const qr = require('qrcode')

exports.getAllProducts = base.getAll(Product);
exports.getProduct = base.getOne(Product);

// Don't update password on this 
exports.updateProduct = base.updateOne(Product);
exports.deleteProduct = base.deleteOne(Product);

exports.addProduct = async(req, res, next) => {
    try {
        let product = req.body;
        product.contract_address = '02c18bb9a23418d4139f71b271af63fac6881da459';
        product.total_minted_amount = 0;

        const doc = await Product.create(product);

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

exports.mint = async(req, res, next) => {
    try {
        const product = await Product.findById(req.params.id);
        const doc = await Product.findByIdAndUpdate(req.params.id, {
            total_minted_amount: product.total_minted_amount + req.body.amount
        }, {
            new: true,
            runValidators: true
        });

        for(let i = 1; i <= req.body.amount; i ++) {
            let stringdata = JSON.stringify({
                company_id: product.company_id,
                product_id: product._id,
                token_id: product.total_minted_amount + i
            })

            qr.toDataURL(stringdata, async function (err, code) {
                if(err) return console.log("error occurred")

                const newQrCode = await QRcode.create({
                    product_id: product._id,
                    image: code
                });
            })
        }
        // const doc = await Product.create(req.body);
        const qrcodedata = await QRcode.find();

        res.status(200).json({
            status: 'success',
            // data: {
            //     doc
            // }
        });

    } catch (error) {
        next(error);
    }
};
