const express = require('express');
const router = express.Router();
const fs 	  = require('fs');
const { emailSystem } = require('../middlewares/smsMailSystem');

router.completeProfileMail = ( email, name )=>{

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
	<title>Complete Profile Email</title>
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
			<td>
				<table style="padding: 20px;">
					<tr>
						<td>
							<p style="font-size:14px;">Dear ${name},</p>
							<p style="font-size:14px;">We notice you haven’t completed your profile.</p>
							<p style="font-size:14px;">In order get you application considered for the further rounds. We insist you to complete your profile and upload all the necessary documents asap. </p>
							<p style="font-size:14px;">Please proceed to the dashboard and complete your profile.</p>
						</td>
					</tr>
					<tr>
						<td style="text-align: center; padding: 10px;">
							<a href="#" style="font-size:14px;background: #00B957;border-radius: 5px;padding: 10px;color: #fff; text-decoration: none;">Complete Profile</a>
						</td>
					</tr>
					<tr>
						<td>
							<p style="margin:0px;font-size:14px;">All the best,</p>
							<p style="font-size:14px;margin-top:0px;">${companyName} Recruitment Team</p>
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
					<td style="border-top:1px solid #34209B; padding: 10px;"><img src="${companyLogo}" width="175px" ></td>
					<td style="border-top:1px solid #34209B; padding: 10px;">
						<p style="font-size:12px;">The content of this email is confidential and intended for the recipient specified in message only. It is strictly forbidden to share any part of this message with any third party, without a written consent of the sender. If you received this message by mistake, please reply to this message and follow with its deletion, so that we can ensure such a mistake does not occur in the future.</p>
					</td>
				</table>
			</td>
		</tr>
	</table>

</body>
</html>`;

	const mailSubject = "Complete Your Profile!";
	if( email ){
		emailSystem( email, msgBody, mailSubject );
	}
}

module.exports = router;