const mongoose = require("mongoose");
const Joi = require("joi");

const friendSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users"
    },
    firstName: {
        type: String,
        default: null
    },
    lastName: {
        type: String,
        default: null
    },
    profileImage: {
        type: String,
        default: null
    }
}, { timestamps: true });