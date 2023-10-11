const User = require('../models/userModel');
const base = require('./baseController');
const APIFeatures = require('../utils/apiFeatures');

exports.getAllUsers = base.getAll(User);
exports.getUser = base.getOne(User);

// Don't update password on this 
exports.updateUser = base.updateOne(User);
exports.deleteUser = base.deleteOne(User);

exports.getUserByWallet = async(req, res, next) => {
    try {
        const data = await User.findOne(req.body);

        res.status(200).json({
            status: 'success',
            data: {
                data
            }
        });
    } catch (error) {
        next(error);
    }
};

exports.addUser = async(req, res, next) => {
    try {
        console.log(req.body)
        const doc = await User.create(req.body);

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
