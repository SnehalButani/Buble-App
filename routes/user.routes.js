const express = require("express");
const { signup, verifyOtp, login, forgetPassword, resetPassword, editProfile, deleteAccount, resetOtp, changePassword, logOut } = require("../controllers/user.controller");
const { verifyToken } = require("../middleware/verifyToken");
const multer = require("multer");
const fs = require("fs");

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadPath = 'uploads/images';
        fs.mkdirSync(uploadPath, { recursive: true });
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        // Check if the file type is either jpg or png
        cb(null, file.originalname);
    },
});

const upload = multer({ storage: storage });
const router = express.Router();

router.post("/signup", signup);
router.post("/verifyotp", verifyOtp);
router.post("/login", login);
router.post("/forgetpassword", forgetPassword);
router.post("/resetpassword", resetPassword);
router.post("/sendotp", resetOtp);

router.post("/editprofile", upload.single("profileImage"), verifyToken, editProfile);
router.post("/deleteaccount", verifyToken, deleteAccount);
router.post("/changepassword", verifyToken, changePassword);
router.post("/logout", verifyToken, logOut);



module.exports = router;