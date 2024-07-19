const AppError = require('../utils/appError');
const Product = require('../models/productModel');
const QRcode = require('../models/qrcodeModel');
const base = require('./baseController');
const APIFeatures = require('../utils/apiFeatures');
// const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');
const { initClient, batchMint, getNonce, transferProduct } = require('../web3/index');
const { encrypt, decrypt } = require('../utils/helper');

const divcount = 20000;
const mintcount = 15000;
const numThreads = 4;

const delay = (ms : any) => new Promise(resolve => setTimeout(resolve, ms))

exports.getAllProducts = async(req: any, res: any, next: any) => {
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

exports.addProduct = async(req: any, res: any, next: any) => {
    try {

        let product = req.body;
        product.total_minted_amount = 0;

        console.log(product);
        const data = await Product.findOne({ name: product.name, detail: product.detail });
        console.log(data);
        if(data) {
            return next(new AppError(404, 'fail', 'product already exists'), req, res, next);
        }

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

exports.mint = async(req: any, res: any, next: any) => {
    try {
        const product = await Product.findById(req.params.id).populate('company_id');

        console.log(product);
        let start = new Date();

        let contract_address: any;
        let p: any;
        let mintAmount = req.body.amount;

        for (let j = 1; j <= mintAmount; j ++ ) {
            await QRcode.create({
                product_id: product._id,
                company_id: product.company_id._id,
                qrcode_id: product.total_minted_amount + j
            })
        }
        let end = new Date();
        console.log(end.getTime() - start.getTime())

        if (product.total_minted_amount % divcount > 0) {
            if (mintAmount >= (divcount - product.total_minted_amount % divcount)) {
                console.log('mint to prev contract', (divcount - product.total_minted_amount % divcount));
                await batchMint(product.company_id.wallet, product.contract_address[product.contract_address.length - 1], divcount - product.total_minted_amount % divcount);
                mintAmount -= (divcount - product.total_minted_amount % divcount);
                product.total_minted_amount += (divcount - product.total_minted_amount % divcount);
                product.save();
                // @ts-ignore
                global.io.emit('Refresh product data');

            } else {
                console.log('mint to prev contract', mintAmount);
                await batchMint(product.company_id.wallet, product.contract_address[product.contract_address.length - 1], mintAmount);
                product.total_minted_amount += mintAmount;
                product.save();
                // @ts-ignore
                global.io.emit('Refresh product data');
                mintAmount = 0;
            }
        }

        for(p = 0; p < Math.floor(mintAmount / divcount); p ++ ) {
            console.log('step', p, divcount);
            contract_address = await initClient(product._id);
            let end = new Date();
            console.log(end.getTime() - start.getTime())
            product.contract_address.push(contract_address);
            await batchMint(product.company_id.wallet, contract_address, divcount);
            end = new Date();
            console.log(end.getTime() - start.getTime())

            product.total_minted_amount += divcount;
            product.save();

            // @ts-ignore
            global.io.emit('Refresh product data');
        }
        if (mintAmount % divcount > 0) {
            console.log('step', p, mintAmount % divcount);
            contract_address = await initClient(product._id);
            let end = new Date();
            console.log(end.getTime() - start.getTime());
            product.contract_address.push(contract_address);
            await batchMint(product.company_id.wallet, contract_address, mintAmount % divcount);
            end = new Date();
            console.log(end.getTime() - start.getTime());
            product.total_minted_amount += mintAmount % divcount;
            product.save();

            // @ts-ignore
            global.io.emit('Refresh product data');
        }

        res.status(200).json({
            status: 'success',
            offset: product.total_minted_amount,
        });
    } catch (error) {
        next(error);
    }
};

exports.transfer = async(req: any, res: any, next: any) => {
    try {
        const {product_address, from, to, token_id, product_id, from_id, to_id} = req.body;
        const transferred = await transferProduct(product_address, from, to, token_id);

        const qr = await QRcode.findOne({
            product_id: product_id,
            company_id: from_id,
            qrcode_id: token_id
        });
        console.log(qr);

        qr.company_id = to_id;

        qr.save();
        
        // @ts-ignore
        global.io.emit('Refresh user data');

        res.status(200).json({
            status: transferred,
        });
    } catch (error) {
        next(error);
    }
}

exports.printQRCodes = async (req: any, res: any, next: any) => {
    try {
        const product = await Product.findById(req.params.id).populate('company_id');
        if (product.total_minted_amount >= product.printed_amount + req.body.count) {
            product.printed_amount += req.body.count;
        } else {
            product.printed_amount = product.total_minted_amount;
        }
        product.save();

        res.status(200).json({
            status: 'success',
            data: product
        });
    } catch (error) {
        next(error);
    }
}
