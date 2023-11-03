const Product = require('../models/productModel');
const QRcode = require('../models/qrcodeModel');
const base = require('./baseController');
const APIFeatures = require('../utils/apiFeatures');
// const { generateQrCode } = require('../utils/generateQrCode');
const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');
// require('ts-node').register();
const { initClient, batchMint, getNonce } = require('../web3/index');
// const qr = require('qr-image');
const qrcode = require('qrcode')

const divcount = 10000;
const numThreads = 4;

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

        // const contractAddres = await initClient();
        // product.contract_address = contractAddres;
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

exports.mint = async(req: any, res: any, next: any) => {
    try {
        const product = await Product.findById(req.params.id);
        // const product = await Product.findByIdAndUpdate(req.params.id, {
        //     total_minted_amount: prev_product.total_minted_amount + req.body.amount
        // }, {
        //     new: true,
        //     runValidators: true
        // });

        let qrcodeIds: any = [];
        console.log(product);
        let start = new Date();

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
                        if(qrcodeIds.length % 10000 === 0) {
                            console.log(qrcodeIds.length, 'generating QR code completed');
                            let end = new Date();
                            console.log(end.getTime() - start.getTime())
                        }
                        if (qrcodeIds.length === req.body.amount) {
                            // batchMint(product.contract_address, qrcodeIds);
                            // console.log(qrcodeIds);
                            // if(req.body.amount > divcount) {
                            console.log('generating qr code finished.');
                            if(qrcodeIds.length > divcount) {
                                let contractAddres;
                                for(let t = 0; t < qrcodeIds.length / divcount; t ++ ) {
                                    if(t % 3 === 0) {
                                        contractAddres = await initClient();
                                        product.contract_address.push(contractAddres);
                                    }
                                    console.log('started', t, 'batch minting');
                                    await batchMint(contractAddres, qrcodeIds.slice(t * divcount, (t + 1) * divcount));
                                    let end = new Date();
                                    console.log(end.getTime() - start.getTime())
                                }
                            } else {
                                const contractAddres = await initClient();
                                product.contract_address.push(contractAddres);
                                console.log('start minting');
                                await batchMint(contractAddres, qrcodeIds.slice((qrcodeIds.length / divcount - 1) * divcount));
                                let end = new Date();
                                console.log(end.getTime() - start.getTime())
                            }
                            // } else {
                            //     await batchMint(product.contract_address, qrcodeIds);
                            // }
                            product.total_minted_amount += req.body.amount;
                            product.save();

                            res.status(200).json({
                                status: 'success',
                                offset: product.total_minted_amount,
                            });
                        }
                        resolve();
                    });
                    
                    worker.on('error', (error: any) => { console.log(error), reject(error)});

                    for (let i = 1; i <= req.body.amount / numThreads; i ++) {
                        worker.postMessage({ threadNumber: j, product, i });
                    }
                })
            );
        }

        await Promise.all(qrCodePromises);

    } catch (error) {
        next(error);
    }
};

if (!isMainThread) {
    // Worker thread code for generating a QR code
    parentPort.on('message', async (data: any) => {
        const { product, i, threadNumber } = data;
        const stringdata = JSON.stringify({
            company_id: product.company_id,
            product_id: product._id,
            token_id: product.total_minted_amount + i + threadNumber * numThreads,
        });
    
        const code: any = await generateQRCode(stringdata);
        
        // Send the generated QR code back to the main thread
        parentPort.postMessage({ code: code });
    });
  }
  
const generateQRCode = (data: any) => {
    return new Promise((resolve, reject) => {
        qrcode.toDataURL(data, (err: any, code: any) => {
            if (err) {
                reject(err);
            } else {
                resolve(code);
            }
        });
    });
}