const mongoose = require("mongoose");
const Joi = require("joi");

const postSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users"
    },
    postType: {
        type: String,
        enum: ["General", "Storycollage"],
        default: "General"
    },
    post: [{
        postImage: {
            type: String,
            default: null
        },
        thumbnail: {
            type: String,
            default: null
        },
        audioUrl: {
            type: String,
            default: null
        }
    }]
}, { timestamps: true });