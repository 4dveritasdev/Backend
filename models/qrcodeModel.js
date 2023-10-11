const mongoose = require("mongoose");

const qrcodeSchema = new mongoose.Schema({
    data: {
        type: String
    }
});

const QRcode = mongoose.model("Company", qrcodeSchema);
module.exports = QRcode;