const express = require('express');
const router = express.Router();
const dotenv    = require('dotenv'); 
dotenv.config({path:'config.env'});

const { sendTextSms } = require('../middlewares/smsMailSystem');

router.otpSmsTemplate = ( mobileNo, otp )=>{ 
     const msgBody = `Your Login Password is ${otp} Don't Share with any one Thanks ${process.env.COMPANY_NAME}`;
     //sendTextSms( mobileNo, msgBody );
}

module.exports = router;