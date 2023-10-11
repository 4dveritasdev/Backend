const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
    company_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company'
    },
    qrcode_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'QRcode'
    },
    name: {
        type: String,
        require: true
    },
    image: {
        type: String,
    },
    detail: {
        type: String,
    },
    status: {
        type: String,
        default: ""
    }
});

const Product = mongoose.model("Product", productSchema);
module.exports = Product;