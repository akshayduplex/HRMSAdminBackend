const express = require('express');
const fs 	  = require('fs');
const router = express.Router();
const dotenv    = require('dotenv'); 
dotenv.config({path:'config.env'});
const { emailSystem } = require('../middlewares/smsMailSystem');
const { generateJwtTokenByManualTime } = require('../middlewares/verifyToken.js');
const { getHumanReadableDate } = require('../middlewares/myFilters.js');

const ADMIN_PANEL_URL = process.env.ADMIN_PANEL_URL;

router.requisitionFormApprovalMail = ( data, email, sendFor, regardsData, sendApproveLink = null, name = null , activity_data = null, sub_designation = '', employee_id = '' )=>{
	 console.log( sendFor );
const req_form_id = data._id;
const projectName = data.project_name;
const designationName = data.designation_name;
const departmentName = data.department_name;
const numberOfVacancies = data.no_of_vacancy;
const perAnnumCTC = data.ctc_per_annum;
const projectDuration = data.project_duration;

var manpowerRequisitionFormLink = '';
if(sendApproveLink){

	const tokenPayload = {}
	tokenPayload.id = data._id;
	tokenPayload.name = name; 
	tokenPayload.designation = sendFor;
	tokenPayload.sub_designation = sub_designation;
	const token = generateJwtTokenByManualTime( tokenPayload, '96hr' );
	const CombineString = `${data._id}|${name}|${sendFor}|${token}|${sub_designation}|${employee_id}`

var manpowerRequisitionFormLink = `<p style="font-size:14px;">To proceed, please click the link below to approve the Manpower Requisition Form:</p>
							<p style="font-size:14px;">*<a href="${ADMIN_PANEL_URL}mprFrm/${btoa(CombineString)}">Manpower Requisition Form Link</a>*</p>`;
} 

const generalConfig = JSON.parse( fs.readFileSync('./src/config/general_config_file.txt', 'utf8' ) ); 
const organizationConfig = JSON.parse( fs.readFileSync('./src/config/organization_config_file.txt', 'utf8' ) );  
const hrConfig = JSON.parse( fs.readFileSync('./src/config/hr_config_file.txt', 'utf8' ) ); 

if(!email && sendFor ==='CEO' &&  typeof hrConfig.ceo_email_id !=='undefined' && hrConfig.ceo_email_id !=='' ){
	email = hrConfig.ceo_email_id;
}

const regardsName = typeof regardsData.name !=='undefined' ? regardsData.name : hrConfig?.default_hr_details?.name;
const regardsDesignation = typeof regardsData.sub_designation !=='undefined' && regardsData.sub_designation !=='' ? regardsData.sub_designation : hrConfig?.default_hr_details?.designation;
const regardsContactInfo = typeof regardsData.mobile !=='undefined' && regardsData.mobile !=='' ? regardsData.mobile : hrConfig?.default_hr_details?.mobile_no;
const regardsMailInfo = typeof regardsData.email !=='undefined' && regardsData.email !=='' ? regardsData.email : hrConfig?.default_hr_details?.email_id;

 
const companyName =  organizationConfig?.organization_name;
const companyLogo =  process.env.IMAGE_PATH +''+generalConfig.logo_image;

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

const employeeName = ['CEO','Sharad Agarwal','Sharad Agarwal Sir'].includes(name) ? 'Respected Sir' :  `${name} Sir/Madam`;


var msgBody = `
<!DOCTYPE html>
<html>
<head>
	<meta charset="utf-8">
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<title>Requisition Form Approval Mail</title>
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
							<p style="font-size:14px;">Dear ${employeeName},</p>
							<p style="font-size:14px;">We hope this email finds you well. We are writing to approve the Manpower Requisition for the <strong> ${projectName} </strong>.  Please find the details of the required positions below:</p>
						</td>
					</tr>
					<tr>
						<td>
							<p style="font-size:14px;"><strong>Project Name:</strong> <span>${projectName}</span> </p>
							<p style="font-size:14px;"><strong>Designation:</strong> <span>${designationName}</span> </p>
							<p style="font-size:14px;"><strong>Department:</strong> <span>${departmentName}</span> </p>
							<p style="font-size:14px;"><strong>Vacancies:</strong> <span>${numberOfVacancies}</span> </p>
							<p style="font-size:14px;"><strong>Per Annum CTC:</strong> <span>${perAnnumCTC}</span> </p>
							<p style="font-size:14px;"><strong>Duration:</strong> <span>${projectDuration}</span> </p>
						</td>
					</tr>`;
 
		if( activity_data && sendFor === 'CEO' ){
		msgBody += `<tr>
					<td>
					<p style="font-size:14px;margin-top:0px;">Approval Member List: </p>
						<table style="width:100%;border-collapse: collapse;">
							<tr>
						  	  	<td style="border:1px solid #000;font-size:12px;padding:8px;text-align:left; font-weight:500;">Sr. No.</td>
								<td style="border:1px solid #000;font-size:12px;padding:8px;text-align:left; font-weight:500;">Name</td>
								<td style="border:1px solid #000;font-size:12px;padding:8px;text-align:left; font-weight:500;">Designation</td>
								<td style="border:1px solid #000;font-size:12px;padding:8px;text-align:left; font-weight:500;">Approval Date</td>
								<td style="border:1px solid #000;font-size:12px;padding:8px;text-align:left; font-weight:500;">Status</td>
							</tr>`;
							var srNo = 0;
							for( var i = 0; i < activity_data.length; i++ ){
								if( activity_data[i].status === 'Approved' ){
									srNo += srNo + 1;
									var empName = typeof activity_data[i].name !== 'undefined' ? activity_data[i].name : '';
									var empDesignation = typeof activity_data[i].designation !== 'undefined' ? activity_data[i].designation : activity_data[i]?.sub_designation;
									var approvalDate = typeof activity_data[i].comment_date !== 'undefined' ? getHumanReadableDate( activity_data[i].comment_date ,'date') : ''; 
								msgBody += `<tr>
									<td style="border:1px solid #000;font-size:12px;padding:8px;text-align:left; font-weight:500;">${srNo}</td>
									<td style="border:1px solid #000;font-size:12px;padding:8px;text-align:left; font-weight:500;">${empName}</td>
									<td style="border:1px solid #000;font-size:12px;padding:8px;text-align:left; font-weight:500;">${empDesignation}</td>
									<td style="border:1px solid #000;font-size:12px;padding:8px;text-align:left; font-weight:500;">${approvalDate}</td>
									<td style="border:1px solid #000;font-size:12px;padding:8px;text-align:left; font-weight:500;">Approved</td>
								</tr>`;
								}
							}

		msgBody += `</table>
					</td>
					</tr>`;
		}

		msgBody += `<tr>
						<td>
							${manpowerRequisitionFormLink}
							<p style="font-size:14px;margin-top:0px;">Your prompt attention to this request is appreciated, and if you have any questions, feel free to contact us.</p>
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
 
	const mailSubject = `Manpower Requisition Approval Request for ${projectName} Project`;
	if( email !=='' && process.env.ACTIVATE_LIVE_EMAIL_ACCOUNTS === 'YES' ){
		emailSystem( email, msgBody, mailSubject );
	}else{
		emailSystem( process.env.TEST_EMAIL_ACCOUNTS , msgBody, mailSubject );
	}
	return msgBody;
}
 


module.exports = router;