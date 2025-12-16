const express = require('express');
const fs 	  = require('fs');
const router  = express.Router();
const dotenv  = require('dotenv');
dotenv.config({path:'config.env'});
const { emailSystem } = require('../middlewares/smsMailSystem');

const { getHumanReadableDate, formatDateToWeekOf, formatDateToMonthFullNameDateYear, removeDuplicatesRecordsFromList } = require('../middlewares/myFilters.js');

const ADMIN_PANEL_URL = process.env.ADMIN_PANEL_URL;

router.needToDiscussMail = ( findCandidateData, remark )=>{
     

    var generalConfig = JSON.parse( fs.readFileSync('./src/config/general_config_file.txt', 'utf8' ) );   
 
    var companyLogo =  process.env.IMAGE_PATH +''+generalConfig.logo_image; 

     
    var msgBody = `<!DOCTYPE html>
	<html>
	<head>
		<meta charset="utf-8">
		<meta name="viewport" content="width=device-width, initial-scale=1">
		<title>Candidate Need To Discuss</title>
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
                <p style="text-decoration:underline;color: #000; font-weight:600">Need to Discuss on below Candidate(s) List</p>
            </td>
        </tr> 

        <tr>
            <td>
                    <table style="width:100%;border-collapse: collapse;">
                            <tr>
                                <td style="border:1px solid #000;font-size:14px;padding:8px;text-align:left; font-weight:500;">Sr. No.</td>
                                <td style="border:1px solid #000;font-size:14px;padding:8px;text-align:left; font-weight:500;">Name</td>
                                <td style="border:1px solid #000;font-size:14px;padding:8px;text-align:left; font-weight:500;">Designation</td>
                                <td style="border:1px solid #000;font-size:14px;padding:8px;text-align:left; font-weight:500;">Proposed Location</td>
                                <td style="border:1px solid #000;font-size:14px;padding:8px;text-align:left; font-weight:500;">Proposed CTC per annum</td>
                                <td style="border:1px solid #000;font-size:14px;padding:8px;text-align:left; font-weight:500;">Date of joining </td>
                                <td style="border:1px solid #000;font-size:14px;padding:8px;text-align:left; font-weight:500;">Employment Type</td>
                                <td style="border:1px solid #000;font-size:14px;padding:8px;text-align:left; font-weight:500;">Remark</td>
                                <td style="border:1px solid #000;font-size:14px;padding:8px;text-align:left; font-weight:500;">Status </td>
                                <td style="border:1px solid #000;font-size:14px;padding:8px;text-align:left; font-weight:500;">Contract Validity/Till the completion Project </td>
                            </tr>`;
                            if( findCandidateData ){
                                findCandidateData.forEach((item, index )=>{ 
                                    var jobType = ['OnContract','On Contract'].includes( item?.job_type) ? 'On-Consultant' : 'On-Role';
                                    var jobStatus = ['','Waiting'].includes( item?.interview_shortlist_status) ? 'Waiting' : 'Selected';
                                        msgBody += `<tr>
                                            <td style="border:1px solid #000;font-size:14px;padding:8px;text-align:left; font-weight:500;">${index+1}</td>
                                            <td style="border:1px solid #000;font-size:14px;padding:8px;text-align:left; font-weight:500;">${item.name}</td>
                                            <td style="border:1px solid #000;font-size:14px;padding:8px;text-align:left; font-weight:500;">${item.job_designation}</td>
                                            <td style="border:1px solid #000;font-size:14px;padding:8px;text-align:left; font-weight:500;">${item.proposed_location}</td>
                                            <td style="border:1px solid #000;font-size:14px;padding:8px;text-align:left; font-weight:500;">Rs.${item.offer_ctc}/- per annum</td>
                                            <td style="border:1px solid #000;font-size:14px;padding:8px;text-align:left; font-weight:500;">${formatDateToWeekOf(item.onboarding_date)}</td>
                                            <td style="border:1px solid #000;font-size:14px;padding:8px;text-align:left; font-weight:500;">${jobType}</td>
                                            <td style="border:1px solid #000;font-size:14px;padding:8px;text-align:left; font-weight:500;">${remark}</td>
                                            <td style="border:1px solid #000;font-size:14px;padding:8px;text-align:left; font-weight:500;">${jobStatus}</td>
                                            <td style="border:1px solid #000;font-size:14px;padding:8px;text-align:left; font-weight:500;">${formatDateToWeekOf(item.job_valid_date)}</td>
                                        </tr>`; 
                                });
                            }
                    msgBody += `</table>
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
        `; 
        
    msgBody += `</table> 

</body>
</html>`;  
 

    const mailSubject = "Need To Discuss!";
    var  email = process.env.DEFAULT_HR_EMAIL; 
    
    if( email !=='' && process.env.ACTIVATE_LIVE_EMAIL_ACCOUNTS === 'YES' ){
        emailSystem( email, msgBody, mailSubject );
    }else if( process.env.ACTIVATE_LIVE_EMAIL_ACCOUNTS === 'NO' ){
        emailSystem( process.env.TEST_EMAIL_ACCOUNTS , msgBody, mailSubject );
    }


 
    return msgBody;
}


router.needToDiscussAtMprMail = ( findMprData, remark )=>{
     

    var generalConfig = JSON.parse( fs.readFileSync('./src/config/general_config_file.txt', 'utf8' ) );   
 
    var companyLogo =  process.env.IMAGE_PATH +''+generalConfig.logo_image; 

     
    var msgBody = `<!DOCTYPE html>
	<html>
	<head>
		<meta charset="utf-8">
		<meta name="viewport" content="width=device-width, initial-scale=1">
		<title>Candidate Need To Discuss</title>
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
                <p style="text-decoration:underline;color: #000; font-weight:600">Need to Discuss on below MPR(s)</p>
            </td>
        </tr> 

        <tr>
            <td>
                    <table style="width:100%;border-collapse: collapse;">
                            <tr>
                                <td style="border:1px solid #000;font-size:14px;padding:8px;text-align:left; font-weight:500;">Sr. No.</td>
                                <td style="border:1px solid #000;font-size:14px;padding:8px;text-align:left; font-weight:500;">MPR No</td>
                                <td style="border:1px solid #000;font-size:14px;padding:8px;text-align:left; font-weight:500;">Project Name</td>
                                <td style="border:1px solid #000;font-size:14px;padding:8px;text-align:left; font-weight:500;">Designation</td>
                                <td style="border:1px solid #000;font-size:14px;padding:8px;text-align:left; font-weight:500;">Department</td>
                                <td style="border:1px solid #000;font-size:14px;padding:8px;text-align:left; font-weight:500;">Grade</td> 
                                <td style="border:1px solid #000;font-size:14px;padding:8px;text-align:left; font-weight:500;">Employment Type</td>
                                <td style="border:1px solid #000;font-size:14px;padding:8px;text-align:left; font-weight:500;">Remark</td> 
                            </tr>`;
                            if( findMprData ){
                                findMprData.forEach((item, index )=>{ 
                                    var jobType = ['OnContract','On Contract',''].includes( item?.mode_of_employment) ? 'On-Consultant' : 'On-Role'; 
                                        msgBody += `<tr>
                                            <td style="border:1px solid #000;font-size:14px;padding:8px;text-align:left; font-weight:500;">${index+1}</td>
                                            <td style="border:1px solid #000;font-size:14px;padding:8px;text-align:left; font-weight:500;">${item.title}</td>
                                            <td style="border:1px solid #000;font-size:14px;padding:8px;text-align:left; font-weight:500;">${item.project_name}</td>
                                            <td style="border:1px solid #000;font-size:14px;padding:8px;text-align:left; font-weight:500;">${item.designation_name}</td>
                                            <td style="border:1px solid #000;font-size:14px;padding:8px;text-align:left; font-weight:500;">${item.department_name}</td>
                                            <td style="border:1px solid #000;font-size:14px;padding:8px;text-align:left; font-weight:500;">${item.grade}</td> 
                                            <td style="border:1px solid #000;font-size:14px;padding:8px;text-align:left; font-weight:500;">${jobType}</td>
                                            <td style="border:1px solid #000;font-size:14px;padding:8px;text-align:left; font-weight:500;">${remark}</td>
                                        </tr>`; 
                                });
                            }
                    msgBody += `</table>
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
        `; 
        
    msgBody += `</table> 

</body>
</html>`;  
 

    const mailSubject = "Need To Discuss!";
    var  email = process.env.DEFAULT_HR_EMAIL; 
    
    if( email !=='' && process.env.ACTIVATE_LIVE_EMAIL_ACCOUNTS === 'YES' ){
        emailSystem( email, msgBody, mailSubject );
    }else if( process.env.ACTIVATE_LIVE_EMAIL_ACCOUNTS === 'NO' ){ 
        emailSystem( process.env.TEST_EMAIL_ACCOUNTS , msgBody, mailSubject );
    }
 
    return msgBody;
}

module.exports = router;