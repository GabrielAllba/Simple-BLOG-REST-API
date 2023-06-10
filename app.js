const path = require('path');

const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');

const feedRoutes = require('./routes/feed');
const authRoutes = require('./routes/auth');

const app = express();
const fs = require('fs');

const cors = require('cors');

const fileStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'images');
    },
    filename: function (req, file, cb) {
        cb(null, uuidv4() + '-' + file.originalname);
    },
});
const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'image/png' || file.mimetype === 'image/jpg' || file.mimetype === 'image/jpeg') {
        cb(null, true);
    } else {
        cb(null, false);
    }
};

app.use(multer({ storage: fileStorage, fileFilter: fileFilter }).single('imageUrl'));

app.use('/images', express.static(path.join(__dirname, 'images')));

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, GET, POST, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(cors());
// controller
app.use('/feed', feedRoutes);
app.use('/auth', authRoutes);

// middleware for error
app.use((error, req, res, next) => {
    console.log(error);
    const status = error.statusCode || 500;
    const message = error.message;
    const data = error.data;
    const tempimage = req.file.path;
    let filePath = '';
    let image = '';

    if ((status === 401 || status === 500) && image != undefined) {
        image = tempimage.replace('\\', '/');
        filePath = path.join(__dirname, '.', image);

        fs.unlink(filePath, (err) => console.log(err));
    }

    res.status(status).json({ status: status, message: message, data: data });
});

mongoose.set('strictQuery', false);

mongoose
    .connect('mongodb+srv://rielgbrl:HwlvMRpH00vxfqMb@blog.rd77edv.mongodb.net/?retryWrites=true&w=majority')
    .then((result) => {
        app.listen(process.env.PORT || 8000);
    })
    .catch((err) => console.log(err));
