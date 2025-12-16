const express = require('express');
const router = express.Router();
const fs 	  = require('fs');
const dotenv    = require('dotenv'); 
dotenv.config({path:'config.env'});
const { emailSystem } = require('../middlewares/smsMailSystem'); 
const { getHumanReadableDate } = require('../middlewares/myFilters'); 
 

router.jobDeadlineAlertMail = ( projectName, jobTitle, sanctionedPositions, inPlaceVacancy, availableVacancy, deadLineDate, recipientName, recipientEmail  )=>{
	  
	const generalConfig = JSON.parse( fs.readFileSync('./src/config/general_config_file.txt', 'utf8' ) ); 
	const organizationConfig = JSON.parse( fs.readFileSync('./src/config/organization_config_file.txt', 'utf8' ) );  
	const hrConfig = JSON.parse( fs.readFileSync('./src/config/hr_config_file.txt', 'utf8' ) ); 
	const socialLinks = JSON.parse( fs.readFileSync('./src/config/social_media_config_file.txt', 'utf8' ) ); 

	const companyName =  organizationConfig?.organization_name;
	const companyLogo =  process.env.IMAGE_PATH +''+generalConfig.logo_image;

	const msgBody = `
	<!DOCTYPE html>
	<html>
	<head>
		<meta charset="utf-8">
		<meta name="viewport" content="width=device-width, initial-scale=1">
		<title>Reminder: Upcoming Job Application Deadline</title>
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
								<p style="font-size:14px;">Dear ${recipientName} Sir/Madam,</p>
								<p style="font-size:14px;">I hope this message finds you well.</p>
								<p style="font-size:14px;">I am writing to remind you that the application deadline for the following job openings is approaching. Please see the details below:</p>
							</td>
						</tr> 
						<tr>
							<td>
                                <p style="font-size:14px;">Project Name: ${projectName}</p>
                                <p style="font-size:14px;">Job Title: ${jobTitle}</p>
                                <p style="font-size:14px;">Sanctioned Position(s): ${sanctionedPositions}</p>
                                <p style="font-size:14px;">In-place: ${inPlaceVacancy}</p>
                                <p style="font-size:14px;">Available Vacancies: ${availableVacancy}</p>
                                <p style="font-size:14px;">Application Deadline: ${getHumanReadableDate(deadLineDate,'date')}</p>
							</td>
						</tr>
                        <tr>
							<td>
								<p style="font-size:14px;">It's important that we prioritize the review process to ensure we meet our hiring objectives. If there are any updates or if you require any assistance, please let me know.</p>
								<p style="font-size:14px;">Thank you for your attention to this matter.</p>
							</td>
						</tr> 
						<tr>
							<td>
								<p style="margin:0px;font-size:14px;">Best Regards,</p> 
								<p style="font-size:14px;margin:0px;">${companyName} System</p> 
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

		const mailSubject = `Reminder: Upcoming Job Application Deadline for ${projectName}`;
		 
		if( recipientEmail !=='' && process.env.ACTIVATE_LIVE_EMAIL_ACCOUNTS === 'YES' ){
			emailSystem( recipientEmail, msgBody, mailSubject );
		}else{
			emailSystem( process.env.TEST_EMAIL_ACCOUNTS , msgBody, mailSubject );
		}

		return msgBody;
	}


module.exports = router;