const express = require('express');
const router = express.Router();
const fs 	  = require('fs');
const dotenv    = require('dotenv'); 
dotenv.config({path:'config.env'});

const { emailSystem } = require('../middlewares/smsMailSystem');
const { generateJwtTokenByManualTime } = require('../middlewares/verifyToken.js');

const ADMIN_PANEL_URL = process.env.ADMIN_PANEL_URL;

router.referenceCheckMail = ( email, name, position, approval_note_doc_id, candidate_doc_id , applied_job_doc_id, referenceStatus , mailRegards = null )=>{ 

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

	 

	const default_hr_enable_status = process.env.DEFAULT_HR_ENABLE_STATUS; 
	 

	/*Best Regards*/
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
		bestRegards += `${companyName} Recruitment Team`;
	}

    var dueDate = '';


    const tokenPayload = {}
    tokenPayload.approval_note_doc_id = approval_note_doc_id; 
    tokenPayload.candidate_doc_id = candidate_doc_id; 
    tokenPayload.applied_job_doc_id = applied_job_doc_id; 
    const token = generateJwtTokenByManualTime( tokenPayload , '150hr' );
    const CombineStringApprove = `${approval_note_doc_id}|${candidate_doc_id}|${applied_job_doc_id}|${email}|${referenceStatus}|${token}`;

    const referenceCheckFormLink = `${ADMIN_PANEL_URL}referenceCheck/${btoa(CombineStringApprove)}`;

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
							<p style="font-size:14px;">We hope this message finds you well. As part of our onboarding process for the position of <strong>${position}</strong> at <strong>${companyName}</strong>, we kindly request you to complete a short reference check form to verify your details and past work experience.</p>

                            <p style="font-size:14px;">Please click the link below to access the portal and complete the required form:</p>
                            <p style="font-size:14px;">
                                <a href="${referenceCheckFormLink}" target="_blank" style="font-size:14px;background: #00B957;border-radius: 5px;padding: 10px;color: #fff; text-decoration: none;">Click here to fill the Reference Check Form</a>
                            </p>
                            <p style="font-size:14px;">It should take no more than 10 minutes to complete. Kindly submit the form by <strong>${dueDate}</strong> to ensure a smooth onboarding process.</p>
                            <p style="font-size:14px;">If you have any questions or need assistance, feel free to reply to this email.</p>
                            <p style="font-size:14px;">Thank you for your cooperation and support.</p>

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

	const mailSubject = `Verify Candidate for the position of "${position}"!`;
	const ccEmail = mailRegards ? mailRegards?.email : null;

	if( email !=='' && process.env.ACTIVATE_LIVE_EMAIL_ACCOUNTS === 'YES'){
		emailSystem(email, msgBody, mailSubject , null, ccEmail);
	}else{
		emailSystem( process.env.TEST_EMAIL_ACCOUNTS , msgBody, mailSubject , null, ccEmail );
	} 

	return msgBody;
}

module.exports = router;