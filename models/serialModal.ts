const mongoose = require("mongoose");

const serialSchema = new mongoose.Schema({
    serial: {
        type: String,
        require: true
    },
    type:{
        type:String,
        require:true
    },
    qrcode_id:{
        type:Number,
        require:true
    },
    product_id:{
        type:String
    }
});

const QRcode = mongoose.model("Serial", serialSchema);
module.exports = QRcode;