const express = require('express')

const router = express.Router()
const authController = require("../controllers/auth");
const { body } = require("express-validator/check");
const user = require('../models/user')
router.post('/signup', [
    body('email')
    .isEmail()
    .withMessage('Please enter a valid email')
    .custom((value, {req}) => {
        return user.findOne({
            email: value
        }).then(userDoc => {
            if(userDoc){
                return Promise.reject('Email address already exists!')
            }
        })
    })
    .normalizeEmail(),
    body('password').trim().isLength({min: 5}),
    body('name').trim().not().isEmpty()
],authController.signup)

router.post('/login', authController.login)

module.exports = router