const Product = require('../models/productModel');
const QRcode = require('../models/qrcodeModel');
const base = require('./baseController');
const APIFeatures = require('../utils/apiFeatures');
const { generateQrCode } = require('../utils/generateQrCode');
const { initClient, batchMint, getNonce } = require('../web3/index.ts');
const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');
// const qr = require('qr-image');
const qr = require('qrcode')

const divcount = 10;

exports.getAllProducts = async(req, res, next) => {
    try {
        const doc = await Product.find(req.body);
        
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

exports.getProduct = base.getOne(Product);

// Don't update password on this 
exports.updateProduct = base.updateOne(Product);
exports.deleteProduct = base.deleteOne(Product);

exports.addProduct = async(req, res, next) => {
    try {
        let product = req.body;

        const contractAddres = await initClient();
        product.contract_address = contractAddres;
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

        let qrcodeIds = [];
        console.log(product);
        console.log(product.contract_address, req.body.amount);
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
                qrcodeIds.push((newQrCode._id).toString());
                if(qrcodeIds.length == req.body.amount) {
                    // console.log(qrcodeIds);
                    console.log(qrcodeIds.length / divcount);
                    batchMint(product.contract_address, qrcodeIds.slice((qrcodeIds.length / divcount - 1) * divcount));
                }
                else if(qrcodeIds.length % divcount === 0) {
                    console.log(qrcodeIds.length / divcount);
                    batchMint(product.contract_address, qrcodeIds.slice((qrcodeIds.length / divcount - 1) * divcount, divcount));
                }
            })
        }

        res.status(200).json({
            status: 'success',
            offset: product.total_minted_amount
            // data: {
            //     doc
            // }
        });

    } catch (error) {
        next(error);
    }
};
