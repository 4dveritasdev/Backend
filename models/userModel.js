const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    wallet: {
        type: String,
        require: true,
        unique: true
    },
    role: {
        type: String,
        enum: ['User', 'Company', 'Admin'],
        default: 'User'
    },
    name: {
        type: String,
        require: true
    },
    email: {
        type: String,
        unique: true,
        require: true
    },
    avatar: {
        type: String,
    },
    company_name: {
        type: String
    },
    company_logo: {
        type: String
    },
    company_detail: {
        type: String
    }
});

const User = mongoose.model("User", userSchema);
module.exports = User;