const express = require("express");
const path = require('path')
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const mongoose = require("mongoose");
const config = require("./config").get(process.env.NODE_ENV);
const app = express();
const cors = require("cors");
const multer = require('multer')
const jimp = require('jimp')
const uuid = require('uuid')

mongoose.Promise = global.Promise;
mongoose.connect(config.DATABASE, {
    useNewUrlParser: true
});

const { User } = require("./models/user");
const { Property } = require('./models/properties')
const { auth, verifyToken } = require("./middleware/auth");
const errorHandler = require("./helpers");

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors());

app.use(express.static(path.join(__dirname, 'public')));
// app.use(express.static("client/build"));
app.use('/images', express.static(path.join(__dirname, 'public/uploads')));


app.get("/api/test", (req, res) => {
    res.send("API test success!")
})

// GET all property
app.get("/api/property", (req, res) => {
    Property.find().exec((err, data) => {
        if (err) res.status(400).send(err.message)
        res.json(data);
    })
})

// Get property by sale or rent filter
app.get("/api/property/:filter", (req, res) => {
    const property_for = req.params.filter
    Property.find({ property_for }).exec((err, data) => {
        if (err) res.status(400).send(err.message)
        res.json(data);
    })
})

const fileUpload = () => {
    const multerOptions = {
        storage: multer.memoryStorage(),
        fileFilter(req, file, next) {
            const isPhoto = file.mimetype.startsWith('image/');

            if (isPhoto) {
                next(null, true);
            } else {
                next({ message: "That filetype is not allowed!" }, false);
            }

        }
    }

    return multer(multerOptions).single('property_image')
}

const fileResize = async (req, res, next) => {
    if (!req.file) {
        next();
        return;
    }
    const extension = req.file.mimetype.split('/')[1];
    req.body.property_image = `${uuid.v4()}.${extension}`;

    const photo = await jimp.read(req.file.buffer);
    await photo.resize(800, jimp.AUTO);
    await photo.write(path.join(__dirname, 'public/uploads/') + `${req.body.property_image}`)
    next()
}

// POST a property
app.post("/api/property", verifyToken, fileUpload(), fileResize, (req, res) => {
    const property = new Property(req.body);
    property.save((err, doc) => {
        if (err) return res.status(400).send(err.message);
        res.status(200).json({
            post: true,
            postId: doc._id
        });
    });
})

// check user login token
app.get("/api/auth", auth, (req, res) => {
    res.json({
        isAuth: true,
        id: req.user._id,
        email: req.user.email,
        token: req.token,
        firstname: req.user.firstname,
        lastname: req.user.lastname,
        contact: req.user.contact
    });
});



// user login
app.post("/api/register", (req, res) => {
    const user = new User(req.body);
    user.save((err, doc) => {
        if (err) return res.status(400).send(err.message);
        res.status(200).json({
            success: true,
            ...doc._doc
        });
    });
});

// user login
app.post("/api/login", (req, res) => {
    User.findOne({ email: req.body.email }, (err, user) => {
        if (!user)
            return res.status(400).json({
                isAuth: false,
                message: "Auth Failed, invalid email."
            });
        user.comparePassword(req.body.password, (err, isMatch) => {
            if (!isMatch)
                return res.status(400).json({
                    isAuth: false,
                    message: "Auth Failed, invalid password."
                });
            user.generateToken((err, user) => {
                if (err) return res.status(400).send(err.message);
                res.cookie("auth", user.token).json({
                    isAuth: true,
                    token: user.token,
                    id: user._id,
                    email: user.email,
                    firstname: user.firstname,
                    lastname: user.lastname,
                    contact: user.contact
                });
            });
        });
    });
});

// log out
app.get("/api/logout", verifyToken, (req, res) => {
    req.user.deleteToken(req.token, (err, user) => {
        if (err) return res.status(400).send(err);
        res.sendStatus(200);
    });
});

app.use(errorHandler)

// if (process.env.NODE_ENV === "production") {
//     const path = require("path");
//     app.get("/*", (req, res) => {
//         res.sendfile(path, resolve(__dirname, "../client", "build", "index.html"));
//     });
// }

const port = process.env.PORT || 3001;
app.listen(port, () => {
    console.log(`Server running at ${port}`);
});