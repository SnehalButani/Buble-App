const jwt = require("jsonwebtoken");
const { commonModel } = require("./common.model");

exports.verifyToken = (req, res, next) => {
    const authHeader = req.header("Authorization");
    if (authHeader) {
        const token = authHeader.split(" ")[1];
        jwt.verify(token, `${process.env.PRIVATEKEY}`, async  (err, user) => {
            if (err) return res.status(403).json({ status: 0, message: "Token not valid" });
            const result = await commonModel(user._id); 
            if (result === 0) return res.status(401).json({ status: 0, message: "Authorization failed" });
            req.user = result;
            next();
        })
    } else {
        return res.status(401).json({ status: 0, message: "Authorization failed" });
    }
}