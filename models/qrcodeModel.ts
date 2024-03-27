const mongoose = require("mongoose");

const qrcodeSchema = new mongoose.Schema({
    product_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product'
    },
    company_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company'
    },
    qrcode_id: {
        type: Number,
        require: true
    }
});

const QRcode = mongoose.model("QRcode", qrcodeSchema);
module.exports = QRcode;