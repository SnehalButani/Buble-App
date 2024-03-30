require('dotenv').config();
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const user = require("./routes/user.routes");

main()
async function main() {
    await mongoose.connect(process.env.LOCALDATABASE)
        .then(() => console.log("database connect...!"))
        .catch(err => console.log(err));
}


app.use("/uploads", express.static("uploads"))
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.get("/", (req, res) => {
    res.send("Buble App");
})


app.use("/",user);

const hostname = process.env.HOSTNAME;
const port = 5000 || process.env.PORT;
app.listen(port, hostname, () => {
    console.log(`Server running at http://${hostname}:${port}/`);
});
