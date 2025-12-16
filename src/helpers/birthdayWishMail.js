const express = require('express');
const router = express.Router();
const fs 	  = require('fs');
const dotenv    = require('dotenv'); 
dotenv.config({path:'config.env'});
const { emailSystem } = require('../middlewares/smsMailSystem'); 
const { getHumanReadableDate } = require('../middlewares/myFilters'); 

router.birthdayWishMail = ( email, name = 'John' )=>{ 
	const birthDayMailImage = process.env.BASE_URL+'public/assets/'+process.env.BIRTHDAY_WISH_IMAGE; 
 
	const generalConfig = JSON.parse( fs.readFileSync('./src/config/general_config_file.txt', 'utf8' ) ); 
	const organizationConfig = JSON.parse( fs.readFileSync('./src/config/organization_config_file.txt', 'utf8' ) );  
	const hrConfig = JSON.parse( fs.readFileSync('./src/config/hr_config_file.txt', 'utf8' ) ); 
	const socialLinks = JSON.parse( fs.readFileSync('./src/config/social_media_config_file.txt', 'utf8' ) ); 

	const companyName =  organizationConfig?.organization_name;
	const companyLogo =  process.env.IMAGE_PATH +''+generalConfig.logo_image;

	const faceBookLink =  socialLinks?.social_media_links?.facebook_link;
	const twitterLink =  socialLinks?.social_media_links?.twitter_link;
	const instaGramLink =  socialLinks?.social_media_links?.instagram_link;
	const linkedInLink =  socialLinks?.social_media_links?.linkedin_link;

    const msgBody = `<!DOCTYPE html>
<html>
<head>
	<meta charset="utf-8">
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<title>Employee Birthday Wish</title>
	<link href="https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap" rel="stylesheet">

</head>
<body style="font-family: 'Poppins', sans-serif; color: #585858;">
	<table style="max-width: 700px;" center>
		<tr>
			<td style="text-align: center;border-bottom:1px solid #34209B; padding: 10px;">
				<img src="${companyLogo}" width="175px">
			</td>
		</tr>
		<tr>
			<td style="text-align: center;padding: 10px;">
				<p style="font-size:14px; text-align:right" >Date: ${getHumanReadableDate( new Date(),'date')}</p>
			</td>
		</tr>
		<tr>
			<td style="text-align: center;padding: 10px;">
				<img src="${birthDayMailImage}">
			</td>
		</tr>

		<tr>
			<td>
				<table style="padding: 20px;">
					<tr>
						<td> 
							<p style="font-size:14px;">Dear ${name},</p> 						
							<p style="font-size:14px; text-align:justify">Wishing you a fantastic birthday filled with joy, laughter, and all the things you love! 🎈🎉</p>
							<p style="font-size:14px; text-align:justify">On this special day, we want to take a moment to celebrate you and all the wonderful contributions you bring to our team. Your dedication, positive attitude, and hard work do not go unnoticed, and we are so grateful to have you as part of our family.</p>
						    <p style="font-size:14px; text-align:justify">May this year bring you new achievements, happy moments, and all the success you deserve. We hope you take some time to relax, enjoy your favorite treats, and spend it with loved ones. 🥳🎂</p>
                        </td>
					</tr>

                    <tr>
						<td> 
							<p style="font-size:14px;">Here's to celebrating you today and wishing you a fantastic year ahead! 🥂</p> 						
						</td>
					</tr>
					 
					<tr>
						<td>
							<p style="margin:0px;font-size:14px;">With appreciation,</p>
							<p style="font-size:14px;margin:0px;">${companyName} Team</p> 
						</td>
					</tr>
					<tr>
						<td>
							<strong style="font-size:14px;color:#585858;">Connect with us:</strong>
							<a href="${faceBookLink}" style="display:inline-block;vertical-align: middle;margin: 0 3px;"><img src="${process.env.BASE_URL}public/assets/fb.png"></a>
							<a href="${linkedInLink}" style="display:inline-block;vertical-align: middle;margin: 0 3px;"><img src="${process.env.BASE_URL}public/assets/li.png"></a>
							<a href="${twitterLink}" style="display:inline-block;vertical-align: middle;margin: 0 3px;"><img src="${process.env.BASE_URL}public/assets/glass.png"></a>
							<a href="${instaGramLink}" style="display:inline-block;vertical-align: middle;margin: 0 3px;"><img src="${process.env.BASE_URL}public/assets/insta.png"></a>
						</td>
					</tr>
				</table>
			</td>
		</tr>
		<tr>
			<td>
				<table style="border-spacing:0">
					<td style="border-top:1px solid #34209B; padding: 10px;"><img src="${companyLogo}" width="175px"></td>
					<td style="border-top:1px solid #34209B; padding: 10px;">
						<p style="font-size:12px;">The content of this email is confidential and intended for the recipient specified in message only. It is strictly forbidden to share any part of this message with any third party, without a written consent of the sender. If you received this message by mistake, please reply to this message and follow with its deletion, so that we can ensure such a mistake does not occur in the future.</p>
					</td>
				</table>
			</td>
		</tr>
	</table>

</body>
</html>`;
//return msgBody;

	const mailSubject = `🎉 Happy Birthday, ${name}! 🎂`;
	  
	if( email !=='' && process.env.ACTIVATE_LIVE_EMAIL_ACCOUNTS === 'YES' ){
		emailSystem( email, msgBody, mailSubject );
	}else{
		emailSystem( process.env.TEST_EMAIL_ACCOUNTS , msgBody, mailSubject );
	}
	  
}

module.exports = router;