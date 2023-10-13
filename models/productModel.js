const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
    company_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company'
    },
    name: {
        type: String,
        require: true
    },
    detail: {
        type: String,
    },
    status: {
        type: String,
        default: ""
    },
    contract_address: {
        type: String
    },
    total_minted_amount: {
        type: Number
    }
});

const Product = mongoose.model("Product", productSchema);
module.exports = Product;