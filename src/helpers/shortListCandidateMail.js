const express = require('express');
const router = express.Router();
const fs 	  = require('fs');
const dotenv    = require('dotenv'); 
dotenv.config({path:'config.env'});
const { emailSystem } = require('../middlewares/smsMailSystem');

router.shortListCandidateMail = ( email, name, jobTitle = null, position = null, location = 'Noida' , mailRegards = null )=>{ 

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


	var regardsName =  hrConfig?.default_hr_details?.name;
	var regardsDesignation = hrConfig?.default_hr_details?.designation;
	var regardsContactInfo = hrConfig?.default_hr_details?.mobile_no;
	var regardsMailInfo = hrConfig?.default_hr_details?.email_id;

	if( mailRegards ){
		var regardsName =  mailRegards?.name || '';
		var regardsDesignation =  mailRegards?.designation || '';
		var regardsContactInfo =  mailRegards?.mobile || '';
		var regardsMailInfo =  mailRegards?.email || '';
	}

	const default_hr_enable_status = process.env.DEFAULT_HR_ENABLE_STATUS;
	  

	/*Best Regards*/
	var bestRegards = '';
	//if( default_hr_enable_status !== 'ACTIVE'  ){
	if( mailRegards ){
		if( typeof regardsName !== 'undefined' ){
			bestRegards += `<p style="font-size:14px;margin:0px;">${regardsName}</p>`;
		}
		if( typeof regardsDesignation !== 'undefined' ){
			bestRegards += `<p style="font-size:14px;margin:0px;">${regardsDesignation}</p>`;
		}
		if( typeof companyName !== 'undefined' ){
			bestRegards += `<p style="font-size:14px;margin:0px;">${companyName}</p>`;
		}
		if( typeof regardsContactInfo !== 'undefined' ){
			bestRegards += `<p style="font-size:14px;margin:0px;"><strong>Mobile:</strong> ${regardsContactInfo}</p>`;
		}
		if( typeof regardsMailInfo !== 'undefined' ){
			bestRegards += `<p style="font-size:14px;margin:0px;"><strong>Email:</strong> ${regardsMailInfo}</p>`;
		} 
	}else{
		bestRegards += `Corporate HR`;
	}

	// console.log( regardsName );
	// return false;

     const msgBody = `<!DOCTYPE html>
<html>
<head>
	<meta charset="utf-8">
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<title>Congratulations! You Have Been Shortlisted</title>
	<link href="https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap" rel="stylesheet">

</head>
<body style="font-family: 'Poppins', sans-serif; color: #585858;">
	<table style="max-width: 700px;" center>
		<tr>
			<td style="text-align: center;border-bottom:1px solid #34209B; padding: 10px;">
				<img src="${companyLogo}"  width="175px" >
			</td>
		</tr>
		<tr>
			<td>
				<table style="padding: 20px;">
					<tr>
						<td>
							<p style="font-size:14px;">Dear ${name},</p>
							<p style="font-size:14px;">We are excited to inform you that you have been shortlisted for the position of ${position} at ${companyName}. Your skills and experience align well with our organization's goals, and we are eager to explore the possibility of having you join our team.</p>
							<p style="font-size:14px;">Below is a link to a small quiz we would like you to tackle which should take no more than 20 minutes. This will help us to understand the way you work and also give us some insight into your skills. </p>
							<p style="font-size:14px;">We would like to invite you for an interview to discuss your application further. Please share your availability for the coming week, and we will do our best to accommodate your schedule. </p>
							<p style="font-size:14px;">Thank you for considering a career with ${companyName}. We look forward to the opportunity to speak with you soon!</p>
							<p style="font-size:14px;">Position Details:</p>
							<p style="font-size:14px;">Designation: ${jobTitle}</p>
							<p style="font-size:14px;">Location: ${location}</p>

							<p style="font-size:14px;">Please complete the applicant form at your earliest convenience by clicking the link below:</p>
						</td>
					</tr>

					<tr>
						<td style="text-align: center; padding: 10px;">
							<p><a href="${process.env.CANDIDATE_PANEL_URL}login" style="font-size:14px;background: #00B957;border-radius: 5px;padding: 10px;color: #fff; text-decoration: none;">Go To Login Panel</a></p>
							<p style="font-size:14px">Username: ${email}</p>
							<p><br/><br/></p>
						</td>
					</tr> 
					 
					<tr>
						<td>
							<p style="margin:0px;font-size:14px;">Best regards,</p>
							 ${bestRegards} 
						</td>
					</tr>
				</table>
			</td>
		</tr>
		<tr>
			<td>
				<table style="border-spacing:0">
					<td style="border-top:1px solid #34209B; padding: 10px;"><img src="${companyLogo}"  width="175px" ></td>
					<td style="border-top:1px solid #34209B; padding: 10px;">
						<p style="font-size:12px;">The content of this email is confidential and intended for the recipient specified in message only. It is strictly forbidden to share any part of this message with any third party, without a written consent of the sender. If you received this message by mistake, please reply to this message and follow with its deletion, so that we can ensure such a mistake does not occur in the future.</p>
					</td>
				</table>
			</td>
		</tr>
	</table>

</body>
</html>`;

  const mailSubject = `Dear ${name} You Have Been Shortlisted for ${position}!`;
  const ccEmail = mailRegards ? mailRegards?.email : null;

    if( email !=='' && process.env.ACTIVATE_LIVE_EMAIL_ACCOUNTS === 'YES'){
		//emailSystem(email, msgBody, mailSubject, null, ccEmail );
	}else{
		//emailSystem( 'anil.duplextechnology@gmail.com' , msgBody, mailSubject, null, ccEmail );
	}

	return msgBody;
}

module.exports = router;