const mongoose = require("mongoose");
const Joi = require("joi");


const userSchema = new mongoose.Schema({
    firstName: {
        type: String,
        default: null
    },
    lastName: {
        type: String,
        default: null
    },
    email: {
        type: String,
        default: null
    },
    password: {
        type: String,
        default: null
    },
    otp: {
        type: Number,
        default: null
    },
    otpExpiresAt: {
        type: Date,
        default: null,
    },
    isEmailVerify: {
        type: Boolean,
        default: false
    },
    isNotificationAllow: {
        type: Boolean,
        default: false
    },
    isAccountSetup: {
        type: Boolean,
        default: false
    },
    profileImage: {
        type: String,
        default: null
    },
    userName: {
        type: String,
        default: null
    },
    bio: {
        type: String,
        default: null
    },
    isContactsAllow: {
        type: Boolean,
        default: null
    },
    isTerms: {
        type: Boolean,
        default: null
    }
}, { timestamps: true });

const User = mongoose.model("user", userSchema);


function validationSign(req) {
    const schema = Joi.object({
        firstName: Joi.string(),
        lastName: Joi.string(),
        email: Joi.string(),
        password: Joi.string(),
        deviceId: Joi.string(),
        deviceToken: Joi.string(),
        isTerms: Joi.boolean()
    })
    return schema.validate(req)
}

function validationLogin(req) {
    const schema = Joi.object({
        email: Joi.string(),
        password: Joi.string(),
        deviceId: Joi.string(),
        deviceToken: Joi.string()
    })
    return schema.validate(req)
}

exports.User = User;
exports.validationSign = validationSign;
exports.validationLogin = validationLogin;
