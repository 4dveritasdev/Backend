const AppError = require('../utils/appError');
const Product = require('../models/productModel');
const QRcode = require('../models/qrcodeModel');
const base = require('./baseController');
const APIFeatures = require('../utils/apiFeatures');
const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');
const { initClient, batchMint, getNonce } = require('../web3/index');
const { encrypt, decrypt } = require('../utils/helper');

const divcount = 10000;
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
        const product = await Product.findById(req.params.id);

        console.log(product);
        let start = new Date();
        let qrcodeIds: any = [];
        let p: any;
        console.log(req.body.amount / divcount);
        for(p = 0; p < Math.floor(req.body.amount / divcount); p ++ ) {
            console.log('step', p);
            const qrCodePromises = [];
    
            for(let j = 0; j < numThreads; j ++) {
                qrCodePromises.push(
                    new Promise((resolve: any, reject: any) => {
                        const worker = new Worker(__filename, { execArgv: /\.ts$/.test(__filename) ? ["--require", "ts-node/register"] : undefined });
                        worker.on('message', async (data: any) => {
                            const { code } = data;
                            const newQrCode = await QRcode.create({
                                product_id: product._id,
                                image: code
                            });
    
                            qrcodeIds.push((newQrCode._id).toString());
                            resolve();
                        });
                        
                        worker.on('error', (error: any) => { console.log(error), reject(error)});

                        // let pamount = divcount;
                        // if ((p + 1) * divcount > req.body.amount) {
                        //     pamount = req.body.amount % divcount;
                        // }
                        // console.log(pamount);
                        for (let i = 1; i <= divcount / numThreads; i ++) {
                            const productData = {
                                _id: String(product._id),
                                total_minted_amount: product.total_minted_amount + i + j * divcount / numThreads + p * divcount
                            };
                            const postData = { threadNumber: j, product: productData, i, p };
                            worker.postMessage(postData);
                        }
                    })
                );
            }
            
            await Promise.all(qrCodePromises);
        }

        console.log('qrcodes', qrcodeIds.length);
        let end = new Date();
        console.log(end.getTime() - start.getTime())

        // while(qrcodeIds.length < req.body.amount) {
        //     await delay(2000);
        //     console.log('qrcodes', qrcodeIds.length);
        // }
        // end = new Date();
        // console.log(end.getTime() - start.getTime())

        
        console.log("rest", req.body.amount % divcount);
        const qrcode = require('qrcode')
        for(let i = 1; i <= req.body.amount % divcount; i ++) {
            const stringdata = JSON.stringify({
                product_id: product._id,
                token_id: product.total_minted_amount + i,
            });
            // console.log(stringdata);
            const encryptData = encrypt(stringdata);

            const code = await qrcode.toDataURL(encryptData);
            const newQrCode = await QRcode.create({
                product_id: product._id,
                image: code
            });

            qrcodeIds.push((newQrCode._id).toString());
        }

        end = new Date();
        console.log(end.getTime() - start.getTime())

        while(qrcodeIds.length < req.body.amount) {
            await delay(2000);
            console.log('qrcodes', qrcodeIds.length);
        }
        end = new Date();
        console.log(end.getTime() - start.getTime())

        let contract_address: any;

        for(p = 0; p < req.body.amount / mintcount; p ++ ) {
            if(p % 2 === 0) {
                contract_address = await initClient();
                product.contract_address.push(contract_address);
                // await delay(4000);
            }

            console.log(p, contract_address);

            if (req.body.amount % mintcount > 0 && p == Math.floor(req.body.amount / mintcount)) {
                console.log('last');
                await batchMint(contract_address, qrcodeIds.slice(p * mintcount));
            } else {
                await batchMint(contract_address, qrcodeIds.slice(p * mintcount, (p + 1) * mintcount));
            }
            end = new Date();
            console.log(end.getTime() - start.getTime())
            // await delay(4000);
        }
        
        product.total_minted_amount += req.body.amount;
        product.save();

        res.status(200).json({
            status: 'success',
            offset: product.total_minted_amount,
        });
    } catch (error) {
        next(error);
    }
};

if (!isMainThread) {
    const qrcode = require('qrcode')

    // Worker thread code for generating a QR code
    parentPort.on('message', async (data: any) => {
        const { product, i, threadNumber, p } = data;
        // console.log(product);
        const stringdata = JSON.stringify({
            product_id: product._id,
            token_id: product.total_minted_amount,
        });
        // console.log(stringdata);
        const encryptData = encrypt(stringdata);
    
        const code: any = await generateQRCode(encryptData);
        
        // Send the generated QR code back to the main thread
        parentPort.postMessage({ code: code });
    });
  
    const generateQRCode = async (data: any) => {
        try {
            const code = await qrcode.toDataURL(data);
            return code;
        } catch (err) {
            console.error(err);
            throw err;
        }
    }
}