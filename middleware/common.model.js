const { Token } = require("../models/token.model");
const ObjectId = require('mongoose').Types.ObjectId

exports.commonModel = async (userId,res) => {
    try {
        const result = await Token.aggregate([
            {
                $match: {
                    userId: new ObjectId(userId)
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "userId", //token collection user fildes
                    foreignField: "_id",
                    as: "info"
                }
            }
        ]);

        if (result.length > 0 && result[0].info.length > 0) {
            return result[0].info[0];
        } else {
            return 0;
        }
    } catch {
        return res.status(401).json({ status: 0, message: "Authorization failed" });
    }
}