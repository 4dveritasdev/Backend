const mongoose = require("mongoose");

const companySchema = new mongoose.Schema({
    name: {
        type: String,
        require: true
    },
    logo: {
        type: String
    },
    detail: {
        type: String
    },
    location: {
        type: String
    },
    wallet: {
        type: String
    }
});

const Company = mongoose.model("Company", companySchema);
module.exports = Company;