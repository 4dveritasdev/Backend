const Product = require('../models/productModel');
const QRcode = require('../models/qrcodeModel');
const base = require('./baseController');
const APIFeatures = require('../utils/apiFeatures');
// const { generateQrCode } = require('../utils/generateQrCode');
const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');
// require('ts-node').register();
const { initClient, batchMint, getNonce } = require('../web3/index');
// const qr = require('qr-image');

const divcount = 10000;
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

        console.log(req.body.amount);
        let start = new Date();
        let qrcodeIds: any = [];
        let p: any;

        for(p = 0; p < req.body.amount / divcount; p ++ ) {
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
                            
                            // if (qrcodeIds.length === divcount) {
                            //     let end = new Date();
                            //     console.log(end.getTime() - start.getTime())
                            //     console.log(p - 1, Math.floor((p - 1) / 3), contractAddress[Math.floor((p - 1) / 3)], typeof contractAddress[Math.floor((p -1) / 3)]);
                            //     await batchMint(contractAddress[Math.floor((p - 1) / 3)], qrcodeIds);
                            //     end = new Date();
                            //     console.log(end.getTime() - start.getTime())

                            //     if(p % 3 === 0) {
                            //         product.contract_address.push(contractAddress[Math.floor((p - 1) / 3)]);
                            //     }
                            //     product.total_minted_amount += divcount;
                            //     product.save();
    
                            //     if(p == req.body.amount / divcount - 1) {
                            //         res.status(200).json({
                            //             status: 'success',
                            //             offset: product.total_minted_amount,
                            //         });
                            //     }
                            // }
                            resolve();
                        });
                        
                        worker.on('error', (error: any) => { console.log(error), reject(error)});
    
                        for (let i = 1; i <= divcount / numThreads; i ++) {
                            const postData = { threadNumber: j, product, i, p };
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

        while(qrcodeIds.length != req.body.amount) {
            await delay(2000);
            console.log('qrcodes', qrcodeIds.length);
        }
        end = new Date();
        console.log(end.getTime() - start.getTime())
        let contract_address: any;

        // for(p = 0; p < req.body.amount / divcount; p ++ ) {
        //     if(p % 3 === 0) {
        //         contract_address = await initClient();
        //         product.contract_address.push(contract_address);
        //         await delay(4000);
        //     }

        //     console.log(p, contract_address);
        //     await batchMint(contract_address, qrcodeIds.slice(p * divcount, (p + 1) * divcount));
        //     end = new Date();
        //     console.log(end.getTime() - start.getTime())
        //     await delay(4000);
        // }
        
        product.total_minted_amount += req.body.amount;
        product.save();

        res.status(200).json({
            status: 'success',
            offset: product.total_minted_amount,
        });
    } catch (error) {
        console.log(error);
        next(error);
    }
};

if (!isMainThread) {
    const qrcode = require('qrcode')

    // Worker thread code for generating a QR code
    parentPort.on('message', async (data: any) => {
        const { product, i, threadNumber, p } = data;
        const stringdata = JSON.stringify({
            company_id: product.company_id,
            product_id: product._id,
            token_id: product.total_minted_amount + i + threadNumber * numThreads + p * divcount,
        });
    
        const code: any = await generateQRCode(stringdata);
        
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