const express = require('express');
const fs 	  = require('fs');
const router  = express.Router();
const dotenv  = require('dotenv'); 
dotenv.config({path:'config.env'});
const { emailSystem } = require('../middlewares/smsMailSystem');
const { generateJwtTokenByManualTime } = require('../middlewares/verifyToken.js');

const ADMIN_PANEL_URL = process.env.ADMIN_PANEL_URL;

router.createRequisitionFormMail = ( data, regardsData )=>{
	 
	const project_id = data.project_id;
	const user_id = data.user_id;
	const projectName = data.project_name;
	const sendFor = ['CEO','Sharad Agarwal','Sharad Agarwal Sir'].includes( data.name ) ? 'Respected' :  data.name ;
	const employeeName = ['CEO','Sharad Agarwal','Sharad Agarwal Sir'].includes(data.name) ? 'Respected Sir' :  `${data.name} Sir/Madam`;
    const email = data.email;
	const mobile_no = data.mobile_no;
	const designation = data.designation;

	const tokenPayload = {}
	tokenPayload.id = data.user_id;
	tokenPayload.name = data.name;
	tokenPayload.email = data.email;
	tokenPayload.designation = data.designation;
	const token = generateJwtTokenByManualTime( tokenPayload , '24hr' );
	const CombineString = `${project_id}|${user_id}|${sendFor}|${email}|${mobile_no}|${designation}|${token}`
	
	const manpowerRequisitionFormLink = `<a href="${ADMIN_PANEL_URL}rqForm/${btoa(CombineString)}">Create a New Requisition Form</a>`;
	

	const generalConfig = JSON.parse( fs.readFileSync('./src/config/general_config_file.txt', 'utf8' ) ); 
	const organizationConfig = JSON.parse( fs.readFileSync('./src/config/organization_config_file.txt', 'utf8' ) );  
	const hrConfig = JSON.parse( fs.readFileSync('./src/config/hr_config_file.txt', 'utf8' ) );  

	


	const regardsName = typeof regardsData.name !=='undefined' && !['','HR'].includes(regardsData.name) ? regardsData.name : hrConfig?.default_hr_details?.name;
	const regardsDesignation = typeof regardsData.designation !=='undefined' && regardsData.designation !=='' ? regardsData.designation : hrConfig?.default_hr_details?.designation;
	const regardsContactInfo = typeof regardsData.mobile !=='undefined' && regardsData.mobile !=='' ? regardsData.mobile : hrConfig?.default_hr_details?.mobile_no;
	const regardsMailInfo = typeof regardsData.email !=='undefined' && regardsData.email !=='' ? regardsData.email : hrConfig?.default_hr_details?.email_id;
	 	
	const companyName =  organizationConfig?.organization_name;
	const companyLogo =  process.env.IMAGE_PATH +''+generalConfig.logo_image;
	const companyShortName =  process.env.COMPANY_SHORT_NAME;
	const default_hr_enable_status = process.env.DEFAULT_HR_ENABLE_STATUS;


	/*Best Regards*/
	var bestRegards = '';
	if( default_hr_enable_status !== 'ACTIVE' ){
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

	 
	const msgBody = `
	<!DOCTYPE html>
	<html>
	<head>
		<meta charset="utf-8">
		<meta name="viewport" content="width=device-width, initial-scale=1">
		<title>Request to Create a New Requisition Form</title>
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
								<p style="font-size:14px;">Dear ${employeeName},</p>
								<p style="font-size:14px;">I hope this message finds you well.</p>
								<p style="font-size:14px;">We are reaching out to request your assistance in creating a new requisition form for <strong>${projectName}</strong>. This form is essential for processing and approving the necessary resources.</p>
							   
							</td>
						</tr> 
						<tr>
							<td>
								<p style="font-size:14px;">To proceed, kindly click the link below to create new manpower requisition form:</p>
								<p style="font-size:14px;">*${manpowerRequisitionFormLink}*</p>
								<p style="font-size:14px;margin-top:0px;">Thank you for your attention to this matter.</p>
							</td>
						</tr>
						<tr>
							<td>
								<p style="margin:0px;font-size:14px;">Best Regards,</p>
								${bestRegards}
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

		const mailSubject = `Request to Create a New Requisition Form for ${projectName}`;
		 
		if( email !=='' && process.env.ACTIVATE_LIVE_EMAIL_ACCOUNTS === 'YES' ){
			emailSystem( email, msgBody, mailSubject );
		}else{
			emailSystem( process.env.TEST_EMAIL_ACCOUNTS , msgBody, mailSubject ); 
		}

		return msgBody;
	}


module.exports = router;