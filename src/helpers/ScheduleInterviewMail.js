const express = require('express');
const router = express.Router();
const fs 	  = require('fs');
const dotenv    = require('dotenv'); 
dotenv.config({path:'config.env'});
const { emailSystem } = require('../middlewares/smsMailSystem');
const { getHumanReadableDate, formatDateDateFullMonthYear, formatDateFromSystem } = require('../middlewares/myFilters');

router.ScheduleInterviewMail = ( email, name, position, interviewDateData, interviewType, meetLink ='', venueLocation = 'Noida', mailRegards = null )=>{
    const interviewDate = getHumanReadableDate(interviewDateData,'date'); 
    const interviewTime =  getHumanReadableDate(interviewDateData,'time');
    

    var platFormText = '';
    if( interviewType === 'Online' ){
        platFormText = `<p style="font-size:14px;">Platform: (Online) <a href="${meetLink}">Click here to start the meeting</a></p>
						<p style="font-size:14px;">This interview is virtual, please ensure you have a stable internet connection and a quiet place to take the call.</p>
						`;
    }else{
        platFormText = `<p style="font-size:14px;">Platform: Offline </p>
		<p style="font-size:14px;">Venue Location:  ${venueLocation}</p>`;
    }


	const generalConfig = JSON.parse( fs.readFileSync('./src/config/general_config_file.txt', 'utf8' ) ); 
	const organizationConfig = JSON.parse( fs.readFileSync('./src/config/organization_config_file.txt', 'utf8' ) );  
	const hrConfig = JSON.parse( fs.readFileSync('./src/config/hr_config_file.txt', 'utf8' ) ); 
	const socialLinks = JSON.parse( fs.readFileSync('./src/config/social_media_config_file.txt', 'utf8' ) ); 

	const companyName =  organizationConfig?.organization_name;
	const companyLogo =  process.env.IMAGE_PATH +''+generalConfig.logo_image;

	const companyPhone = organizationConfig?.organization_mobile_no;
    const companyEmail = organizationConfig?.organization_email_id;
	const companyShortName = process.env.COMPANY_SHORT_NAME; 

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
		bestRegards += `<p style="font-size:14px;margin:0px;">${companyName} Recruitment Team</p>`;
	}

	if( process.env.IS_A_HLFPPT_PANEL === 'YES'){ 
		bestRegards += `<p> 
Hindustan Latex Family Planning Promotion Trust (HLFPPT) <br/> 
Corporate Office- B-14 A, Second Floor, Sector 62, NOIDA, India<br/>
Website-   www.hlfppt.org </p>`;
	}



const msgBody = `<!DOCTYPE html>
<html>
<head>
	<meta charset="utf-8">
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<title>Candidate login</title>
	<link href="https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap" rel="stylesheet">

</head>
<body style="font-family: 'Poppins', sans-serif; color: #585858;">
	<table style="max-width: 700px;" center>
		<tr>
			<td style="text-align: center;border-bottom:1px solid #34209B; padding: 10px;">
				<img src="${companyLogo}" width="175px" >
			</td>
		</tr>
		<tr>
			<td>
				<table style="padding: 20px;">
					<tr>
						<td>
							<p style="font-size:14px;">Dear ${name},</p>
							<p style="font-size:14px;">
							With reference to your application for the position of ${position}, your profile has been shortlisted initially for the interview. , You are advised to attend for Interview on ${formatDateDateFullMonthYear(interviewDate)} at ${interviewTime}.</p>
							 
							<p style="font-size:14px;">Date: ${formatDateDateFullMonthYear(interviewDate)} </p>
							<p style="font-size:14px;">Time: ${interviewTime}</p>
                            ${platFormText}
							<p style="font-size:14px;">Kindly fill the application form before attending the interview.</p>
							<p style="font-size:14px;">Link for application form.</p>
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
    
    var mailSubject = `Interview Scheduled for ${position}`;
    const ccEmail = mailRegards ? mailRegards?.email : null;
    //email = 'anil@duplextech.com';
	if( email !=='' && process.env.ACTIVATE_LIVE_EMAIL_ACCOUNTS === 'YES'){
		emailSystem(email, msgBody, mailSubject , null, ccEmail );
	}else{
		emailSystem( process.env.TEST_EMAIL_ACCOUNTS , msgBody, mailSubject, null, ccEmail );
	}
}

module.exports = router;