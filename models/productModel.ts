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
    model: {
        type: String,
    },
    detail: {
        type: String,
    },
    images: {
        type: Array,
    },
    files: {
        type: Array,
    },
    videos: {
        type: Array,
    },
    warrantyAndGuarantee: {
        warranty: {
            period: {
                type: Number
            },
            unit: {
                type: Number
            }
        },
        guarantee: {
            period: {
                type: Number
            },
            unit: {
                type: Number
            }
        }
    },
    manualsAndCerts: {
        public: {
            type: String
        },
        private: {
            type: String
        }
    },
    status: {
        type: String,
        default: ""
    },
    contract_address: {
        type: Array
    },
    total_minted_amount: {
        type: Number,
        default: 0
    },
    printed_amount: {
        type: Number,
        default: 0
    }
});

const Product = mongoose.model("Product", productSchema);
module.exports = Product;