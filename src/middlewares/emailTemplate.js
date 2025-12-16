const express = require('express');
const router = express.Router();
const fs 	  = require('fs');
const dotenv    = require('dotenv'); 
dotenv.config({path:'config.env'});

const { emailSystem } = require('../middlewares/smsMailSystem');

router.otpEmailTemplate = ( emailId, otp , name = null )=>{ 

	const organizationConfig = JSON.parse( fs.readFileSync('./src/config/organization_config_file.txt', 'utf8' ) );  
	const generalConfig = JSON.parse( fs.readFileSync('./src/config/general_config_file.txt', 'utf8' ) ); 

	const companyName =  organizationConfig?.organization_name;
	const companyEmail =  organizationConfig?.organization_email_id;
	const companyMobile =  organizationConfig?.organization_mobile_no;
	const companyLogo =  process.env.IMAGE_PATH +''+generalConfig.logo_image; 

	var HlfpptSlogan = '';
	if( process.env.IS_A_HLFPPT_PANEL == "YES" ){
		HlfpptSlogan = `<p style="font-size:12px; text-align:center">Empowering Health & Family Planning Solutions</p>`;
	}

     const msgBody = `
	<!DOCTYPE html>
	<html>
	<head>
		<meta charset="utf-8">
		<meta name="viewport" content="width=device-width, initial-scale=1">
		<title>Login OTP</title>
		<link href="https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap" rel="stylesheet">
	
	</head>
	<body style="font-family: 'Poppins', sans-serif; color: #585858;">
		<table style="max-width: 700px;" center>
			<tr>
				<td style="text-align: center;border-bottom:1px solid #34209B; padding: 10px;">
					<img src="${companyLogo}">
				</td>
			</tr>
			<tr>
				<td>
					<table style="padding: 20px;">
						<tr>
							<td>
								<p style="font-size:14px;">Dear ${name} ,</p>
								<p style="font-size:14px;">Thank you for choosing ${companyName}! For enhanced security, please use the One-Time Password (OTP) below to verify your account.</p>
								<p style="font-size:14px;">Your OTP: <strong>${otp}</strong></p>
							   
							</td>
						</tr> 
						<tr>
							<td>
								<p style="font-size:14px;">Please note, this OTP is valid for the next 10 minutes. Do not share this code with anyone for your security. If you did not request this OTP, please contact our support team immediately.</p>
								<p style="font-size:14px;margin-top:0px;">For assistance, feel free to reach out to us at ${companyEmail} or call ${companyMobile}.</p>
							</td>
						</tr>
						<tr>
							<td>
								<p style="margin:0px;font-size:14px;">Best Regards,</p>
								<p style="font-size:14px;margin:0px;">${companyName} System</p>
							</td>
						</tr>
						<tr>
							<td>  
								${HlfpptSlogan}
							</td>
						</tr>
						 
					</table>
				</td>
			</tr>
			<tr>
				<td>
					<table style="border-spacing:0">
						<td style="border-top:1px solid #34209B; padding: 10px;"><img src="${companyLogo}"></td>
						<td style="border-top:1px solid #34209B; padding: 10px;">
							<p style="font-size:12px;">The content of this email is confidential and intended for the recipient specified in message only. It is strictly forbidden to share any part of this message with any third party, without a written consent of the sender. If you received this message by mistake, please reply to this message and follow with its deletion, so that we can ensure such a mistake does not occur in the future.</p>
						</td>
					</table>
				</td>
		    </tr> 
		</table>
	
	</body>
	</html>`; 
     
        const mailSubject = `Your One-Time Password ${otp} for Secure Access!`;

	    if( emailId !=='' && process.env.ACTIVATE_LIVE_EMAIL_ACCOUNTS === 'YES' ){
			emailSystem( emailId, msgBody, mailSubject );
		}else{
			emailSystem( process.env.TEST_EMAIL_ACCOUNTS , msgBody, mailSubject );
		}
}

module.exports = router;