const mongoose = require("mongoose");

const qrcodeSchema = new mongoose.Schema({
    product_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product'
    },
    image: {
        type: String
    }
});

const QRcode = mongoose.model("QRcode", qrcodeSchema);
module.exports = QRcode;