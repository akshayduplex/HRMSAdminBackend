const { body } = require('express-validator');

const express = require('express');
const router = express.Router();


/*** Validate User Login with Email/OTP  ********/
router.validateLoginWithEmail = [ 
    body('email_id')
        .isEmail()
        .withMessage('Please provide a valid email address')
];

/*** Verify User Login OTP  ********/
router.validateLoginOTP = [ 
    body('email_id')
        .isEmail()
        .withMessage('Please provide a valid email address'),
    body('otp')
        .isLength({ min: 4 })
        .withMessage('Please Enter 4 Digit OTP'),
    body('login_device')
        .isLength({ min: 1 })
        .withMessage('Please Enter Login Device Name')
];

module.exports = router;