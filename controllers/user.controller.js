require('dotenv').config();
const { User, validationSign, validationLogin } = require('../models/user.model');
const { Token } = require('../models/token.model');
const { sendError } = require("../util/response");
const jwt = require('jsonwebtoken');
const _ = require('lodash');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const path = require("path");

//Nodemailer stuff
const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    requireTLS: true,
    secure: false,
    service: "gmail",
    auth: {
        user: "sbbca21013@gmail.com",
        pass: "iongnfcrykvemwve"
    }
});

function generateOTP() {
    return Math.floor(1000 + Math.random() * 9000);
}

function createToken(userId) {
    let token = jwt.sign({ _id: userId }, `${process.env.PRIVATEKEY}`);
    return token;
}

function otpExpiresAt() {
    let otpExpiresAt = new Date();
    otpExpiresAt.setMinutes(otpExpiresAt.getMinutes() + 5);
    return otpExpiresAt;
}


exports.signup = async (req, res) => {
    try {
        const { error } = validationSign(req.body);
        if (error) {
            return res.status(400).json({
                status: 0,
                message: error.details
            })
        }

        let checkEmail = await User.findOne({ email: req.body.email });
        if (checkEmail) return res.status(200).json(sendError(res, 200, 0, "User Already Registered..."));

        const hashPassword = await bcrypt.hash(req.body.password, 10);
        let otp = generateOTP();

        const userData = new User({
            ...req.body,
            password: hashPassword,
            otp: otp,
            otpExpiresAt: otpExpiresAt()
        });

        userData.save()
            .then((result) => { sendOTPVerificationEmail(result, res) })
            .catch((error) => console.log(error))

        const tokenData = new Token({
            userId: userData._id,
            deviceId: req.body.deviceId,
            deviceToken: req.body.deviceToken
        })

        await tokenData.save();

        let token = createToken(userData._id);

        res.status(200).json({
            status: 1,
            message: "please verify email",
            otp: otp,
            userId: `${userData._id}`,
            token: token
        });
    } catch (error) {
        res.status(400).json(sendError(res, 404, 0, error.message))
    }
}

exports.verifyOtp = async (req, res) => {
    try {
        const { userId, otp, isNotificationAllow } = req.body;

        const checkUser = await User.findById(userId);
        if (!checkUser) return res.status(404).json(sendError(res, 404, 0, "User not found"));


        const isOTPValid = checkUser.otp === otp;
        if (!isOTPValid) {
            return res.status(200).json({ status: 0, message: "Invalid OTP" });
        }

        const currentTimestamp = new Date().getTime();
        const otpExpirationTimestamp = new Date(checkUser.otpExpiresAt).getTime();

        if (otpExpirationTimestamp <= currentTimestamp) {
            return res.status(200).json({ status: 0, message: "OTP has expired" });
        }

        // If OTP is valid and has not expired, proceed to update the user
        const token = createToken(userId);
        await User.updateOne({ _id: userId }, { $set: { isEmailVerify: true, otp: null, isNotificationAllow: isNotificationAllow } });

        return res.status(200).json({
            status: 1,
            message: "Email verified successfully",
            token,
            userId,
        });
    } catch (error) {
        res.status(400).json(sendError(res, 404, 0, error.message));
    }
};

exports.login = async (req, res) => {
    try {
        const { error } = validationLogin(req.body);
        if (error) {
            return res.status(400).json({
                status: 0,
                message: error.details
            })
        }

        let token;

        let checkEmail = await User.findOne({ email: req.body.email })
        if (!checkEmail) {
            return res.status(200).json({ status: 0, message: "Email and password does not match our records" })
        }

        const validPassword = await bcrypt.compare(req.body.password, checkEmail.password);
        if (!validPassword) {
            return res.status(200).json({ status: 0, message: "Email and password does not match our records" });
        }

        if (checkEmail.isEmailVerify == false) {
            let otp = generateOTP();
            await User.updateOne({ email: checkEmail.email }, { $set: { otp: otp, otpExpiresAt: otpExpiresAt() } })
            await sendOTPVerificationEmail({ email: checkEmail.email, otp });
            return res.status(200).json({
                status: 2,
                message: "Please Verify Email",
                userId: `${checkEmail._id}`,
                otp: otp
            });
        }

        if (checkEmail.isAccountSetup == false) {
            token = createToken(checkEmail._id);
            return res.status(200).json({
                status: 3,
                message: "Please Account Setup",
                token: token,
                userId: `${checkEmail._id}`,
            });
        }


        let tokenData = await Token.findOne({
            userId: checkEmail._id,
            deviceId: req.body.deviceId
        });

        if (tokenData) {
            await Token.updateOne({ _id: tokenData._id }, {
                $set: {
                    deviceId: req.body.deviceId,
                    deviceToken: req.body.deviceToken
                }
            })
        } else {
            tokenData = new Token({
                userId: checkEmail._id,
                deviceId: req.body.deviceId,
                deviceToken: req.body.deviceToken
            });
            await tokenData.save();
        }

        token = createToken(checkEmail._id);
        res.status(200).json({
            status: 1,
            message: "login Successfully",
            token: token,
            data: _.omit(checkEmail.toObject(), ["password", "__v"])
        })

    } catch (error) {
        res.status(400).json(sendError(res, 404, 0, error.message));
    }
}

exports.forgetPassword = async (req, res) => {
    try {
        const { email } = req.body;

        let checkEmail = await User.findOne({ email: req.body.email });
        if (!checkEmail) return res.status(200).json({ status: 0, message: "Email does not match our records" });

        let otp = generateOTP();
        await sendOTPVerificationEmail({ email, otp }, res);

        await User.updateOne({ email: checkEmail.email }, {
            otp: otp,
            otpExpiresAt: otpExpiresAt()
        });

        res.status(200).json({
            status: 1,
            message: "Forget password Successfully",
            userId: `${checkEmail._id}`,
            otp: otp
        })

    } catch (error) {
        res.status(400).json(sendError(res, 400, 0, error.message));
    }
}

exports.resetPassword = async (req, res) => {
    try {
        let { userId, newPassword } = req.body;

        const checkUser = await User.findOne({ _id: userId });
        if (!checkUser) return res.status(404).json(sendError(res, 404, 0, "User not found"));

        newPassword = await bcrypt.hash(newPassword, 10);
        await User.updateOne({ _id: userId }, { $set: { password: newPassword } });

        res.status(200).json({
            status: 1,
            message: "Your password has been changed successfully"
        });

    } catch (error) {
        res.status(400).json(sendError(res, 400, 0, error.message));
    }
}

exports.resetOtp = async (req, res) => {
    try {
        let { id } = req.body;

        let otp = generateOTP();

        const checkUser = await User.findById(id);
        if (!checkUser) return res.status(404).json(sendError(res, 404, 0, "User not found"));

        await sendOTPVerificationEmail({ email: checkUser.email, otp }, res);
        await User.findByIdAndUpdate({ _id: id }, { otp: otp, otpExpiresAt: otpExpiresAt() }, { new: true });

        res.status(200).json({
            status: 1,
            message: "Otp send",
            otp: otp
        })
    } catch (error) {
        res.status(400).json(sendError(res, 400, 0, error.message));
    }
}

exports.editProfile = async (req, res) => {
    try {
        let userId = req.user;
        let editProfile;
        if (req.body.constructor === Object && Object.keys(req.body).length === 0 && req.files == null) {
            //If body and files are null --userlist
            editProfile = await User.findById(userId._id);
            res.status(200).json({
                status: 1,
                data: _.omit(editProfile.toObject(), ["password", "__v"])
            })
        } else {
            if (req.file && req.body) {
                var profileImage = req.file;
                profileImage = path.join('uploads/images/' + profileImage.originalname);
                editProfile = await User.findByIdAndUpdate({ _id: userId._id }, { profileImage: profileImage, ...req.body }, { new: true })
                res.status(200).json({
                    status: 1,
                    message: "Account Setup Successfully",
                    data: _.omit(editProfile.toObject(), ["password", "__v"])
                })
            } else {
                //only for file
                if (req.file) {
                    var profileImage = req.file;
                    profileImage = path.join('uploads/images/' + profileImage.originalname);

                    editProfile = await User.findByIdAndUpdate({ _id: userId._id }, { ...req.body }, { new: true })

                    res.status(200).json({
                        status: 1,
                        message: "Edit profile Successfully",
                        data: _.omit(editProfile.toObject(), ["password", "__v"])
                    })
                } else {
                    // only for body
                    editProfile = await User.findByIdAndUpdate({ _id: userId._id }, { ...req.body }, { new: true })
                    res.status(200).json({
                        status: 1,
                        message: "Edit profile Successfully",
                        data: _.omit(editProfile.toObject(), ["password", "__v"])
                    })
                }
            }
        }
    } catch (error) {
        res.status(400).json(sendError(res, 400, 0, error.message))
    }
}

exports.deleteAccount = async (req, res) => {
    try {
        let userId = req.user;

        userId = await User.findByIdAndDelete(userId);

        res.status(200).json({
            status: 1,
            message: "Delete User Successfully"
        })
    } catch (error) {
        res.status(400).json(sendError(res, 400, 0, error.message));
    }
}

exports.changePassword = async (req, res) => {
    try {
        let { newPassword, oldPassword } = req.body;

        let userId = req.user;
        userId = await User.findById(userId);
        if (!userId) return res.status(404).json(sendError(res, 404, 0, "User not found"));

        let oldPasswordMatch = await bcrypt.compare(oldPassword, userId.password);
        if (!oldPasswordMatch) return res.status(200).json(sendError(res, 200, 0, "Old password is incorrent"))

        if (oldPassword == newPassword) return res.status(200).json(sendError(res, 200, 0, "Old password and New password are same"))

        newPassword = await bcrypt.hash(newPassword, 10);
        await User.findByIdAndUpdate({ _id: userId._id }, { password: newPassword }, { new: true });

        res.status(200).json({
            status: 1,
            message: "Changes Password Successfully"
        })
    } catch (error) {
        res.status(400).json(sendError(res, 400, 0, error.message));
    }
}

exports.logOut = async (req, res) => {
    try {
        let userId = req.user;

        //deviceId delete
        await Token.deleteMany({userId:userId._id});

        res.status(200).json({
            status:1,
            message:"Logout Successfully"
        })
    } catch (error) {
        res.status(400).json(sendError(res, 400, 0, error.message))
    }
}


const sendOTPVerificationEmail = async ({ email, otp }, res) => {

    // Send emails to users 
    let mailoption = {
        from: "sbbca21013@gmail.com",
        to: email,
        subject: "Verify your email",
        html: `<p>Enter <h2>${otp}</h2> in the app verify your email address and complete</p>`,
    };

    return transporter.sendMail(mailoption);
};