const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const { User } = require("./user.model");

const tokenSchema = new Schema({
    userId: {
        type: mongoose.Types.ObjectId,
        ref: User
    },
    deviceId: {
        type: String,
        required: true
    },
    deviceToken: {
        type: String,
        required: true
    }
}, { timestamps: true });


const Token = mongoose.model("token", tokenSchema);

exports.Token = Token;