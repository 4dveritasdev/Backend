const AppError = require('../utils/appError');
const Product = require('../models/productModel');
const QRcode = require('../models/qrcodeModel');
const userModel = require('../models/userModel')
const companyModel = require('../models/companyModel')
const {v4:uuidv4} = require('uuid')
const serialModal = require('../models/serialModal')
const base = require('./baseController');
const APIFeatures = require('../utils/apiFeatures');
import unmarshalDocs from '@api/unmarshal-docs';

// const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');
const { initClient, batchMint, getNonce, transferProduct } = require('../web3/index');
const { encrypt, decrypt } = require('../utils/helper');

const divcount = 20000;
const mintcount = 15000;
const numThreads = 4;

const delay = (ms : any) => new Promise(resolve => setTimeout(resolve, ms))

exports.getAllProducts = async(req: any, res: any, next: any) => {
    try {
        const doc = await Product.find({...req.body, is_deleted: false});
        
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
exports.updateProduct = async(req: any, res: any, next: any) => {
    try {
        const product = await Product.findOne({ name: req.body.name });

        if (product.total_minted_amount > 0) {
            return next(new AppError(404, 'fail', "Can't update this product. You already minted."), req, res, next);
        }
        if (product.is_deleted) {
            return next(new AppError(404, 'fail', "Product does not exists."), req, res, next);
        }
        
        const doc = await Product.findByIdAndUpdate(req.params.id, req.body, {
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

exports.deleteProduct = async(req: any, res: any, next: any) => {
    try {
        const product = await Product.findOne({ _id: req.params._id });

        if (product.total_minted_amount > 0) {
            return next(new AppError(404, 'fail', "Can't remove this product. You already minted."), req, res, next);
        }
        
        const doc = await Product.findByIdAndUpdate(req.params.id, { is_deleted: true }, {
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


async function mintChildProduct(product_id:string,qrcode_id:number) {
    try {
        const products = await Product.find({parent:product_id})

        for(const product of products) {
            let start = new Date();
            for(let j = 1;j<=product.parentCount;j++) {
                await QRcode.create({
                    product_id: product._id,
                    company_id: product.company_id._id,
                    qrcode_id: product.total_minted_amount + j,
                    parent_qrcode_id:qrcode_id
                })
    
                for(const serial of product.serials) {
                    await serialModal.create({
                        type:serial.type,
                        serial:uuidv4(),
                        qrcode_id:product.total_minted_amount + j,
                        product_id:product._id,
                        company_id: product.company_id._id,
                        parent_qrcode_id:qrcode_id
                    })
                }

                const productInfos = await Product.find({parent:product._id})

                if(productInfos.length) {
                    mintChildProduct(product._id,product.total_minted_amount + j)
                }
            }

            let mintAmount = product.parentCount

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
    
            for(let p = 0; p < Math.floor(mintAmount / divcount); p ++ ) {
                console.log('step', p, divcount);
                let contract_address = await initClient(product._id);
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
                let contract_address = await initClient(product._id);
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
            
        }


    }
    catch(error) {

    }
}

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

            for(const serial of product.serials) {
                await serialModal.create({
                    type:serial.type,
                    serial:uuidv4(),
                    qrcode_id:product.total_minted_amount + j,
                    product_id:product._id,
                    company_id: product.company_id._id,
                })
            }

            const products = await Product.find({parent:product._id})

            if(products.length > 0) {
                mintChildProduct(product._id,product.total_minted_amount + j)
            }

            
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

exports.getTransaction = async(req:any,res:any,next:any) => {
    try {
        const product = await Product.findById(req.params.id);
        const token_id = req.params.token_id;

        if(product && token_id) {
            let address = product.contract_address[Math.floor(token_id / divcount)];
            let token = token_id % divcount;

            unmarshalDocs.auth('q4guFpTe6XsWIb7fosJPgDAyGvkNKl0uqlrkhm9s');
            
            if(address) {
                let {data} = await unmarshalDocs.getV3ChainAddressAddressTransactions({
                    page: 1,
                    pageSize: 100,
                    chain: 'partisiablockchain-testnet',
                    address: address
                });

                let result:any[] = data.transactions as any[];

                if(data.has_next) {
                    while(data.has_next) {
                        let info =  await unmarshalDocs.getV3ChainAddressAddressTransactions({
                            page: 1,
                            pageSize: 100,
                            chain: 'partisiablockchain-testnet',
                            address: address
                        });

                        data = info.data

                        result = [...result,...(data.transactions as any[])]
                    }
                }

                const transactions = result.filter(item=>item.arguments?.token_id == token && item.type == 'transfer_from')

                for(const transaction of transactions) {
                    if(transaction.arguments.to) {
                        let userInfo = await companyModel.findOne({wallet:transaction.arguments.to})
                        let fromInfo = await companyModel.findOne({wallet:transaction.arguments.from})

                        transaction.company = userInfo
                        transaction.fromCompany = fromInfo
                    }
                }

                return res.status(200).json({
                    status:'success',
                    data:transactions,
                    results:result
                })
            }
           
        }

        res.status(200).json({
            status:'fail',
            data:[]
        })

    }
    catch(error) {
        console.log(error)
        res.status(200).json({
            status:'fail',
            data:[],
        })
    }
}
