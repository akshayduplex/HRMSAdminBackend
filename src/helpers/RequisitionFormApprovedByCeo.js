const express = require('express');
const fs 	  = require('fs');
const router = express.Router();
const dotenv    = require('dotenv'); 
dotenv.config({path:'config.env'});
const { emailSystem } = require('../middlewares/smsMailSystem'); 
const { getHumanReadableDate } = require('../middlewares/myFilters.js');
 
router.RequisitionFormApprovedByCeo = ( data, email, name  )=>{
     
const mpr_id = data.title;
const projectName = data.project_name;
const designationName = data.designation_name;
const departmentName = data.department_name;
const numberOfVacancies = data.no_of_vacancy;
const perAnnumCTC = data.ctc_per_annum;
const projectDuration = data.project_duration;
const approvalDateTime = data.activity_data?.find((item)=>item.designation ==='CEO' && item.status === 'Approved' );
const approvalDate = approvalDateTime ? getHumanReadableDate( approvalDateTime.comment_date ,'date') : getHumanReadableDate( new Date() ,'date');

const generalConfig = JSON.parse( fs.readFileSync('./src/config/general_config_file.txt', 'utf8' ) ); 
const organizationConfig = JSON.parse( fs.readFileSync('./src/config/organization_config_file.txt', 'utf8' ) );  
const hrConfig = JSON.parse( fs.readFileSync('./src/config/hr_config_file.txt', 'utf8' ) ); 
const employeeName = ['CEO','Sharad Agarwal','Sharad Agarwal Sir'].includes(name) ? 'Respected Sir' :  `${name} Sir/Madam`;


const regardsName =  hrConfig?.default_hr_details?.name;
const regardsDesignation =  hrConfig?.default_hr_details?.designation;
const regardsContactInfo =  hrConfig?.default_hr_details?.mobile_no;
const regardsMailInfo =  hrConfig?.default_hr_details?.email_id; 
 
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
                            <p>We are pleased to inform you that the Manpower Requisition Form (MPR ID: ${mpr_id}) submitted for the position ${designationName} in the ${departmentName} has been approved by the CEO Sir.</p>
                        </td>
                    </tr>
                    <tr>
                        <td>
                        <p style="font-size:14px;"> <strong>Details of the Requisition:</strong></p>
                            <p style="font-size:13px;"><strong>Project Name:</strong> <span>${projectName}</span> </p>
                            <p style="font-size:13px;"><strong>Department:</strong> <span>${departmentName}</span> </p>
                            <p style="font-size:13px;"><strong>Designation:</strong> <span>${designationName}</span> </p>
                            <p style="font-size:13px;"><strong>Number of Positions:</strong> <span>${numberOfVacancies}</span> </p>
                            <p style="font-size:13px;"><strong>MPR ID:</strong> <span>${mpr_id}</span> </p>
                            <p style="font-size:13px;"><strong>Per Annum CTC:</strong> <span>${perAnnumCTC}</span> </p>
                            <p style="font-size:13px;"><strong>Duration:</strong> <span>${projectDuration}</span> </p>
                            <p style="font-size:13px;"><strong>Approval Date:</strong> <span>${approvalDate}</span> </p>
                        </td>
                    </tr> 
                    <tr>
                        <td> 
                            <p style="font-size:14px;margin-top:0px;">Please proceed with the next steps of the hiring process as per the organizational guidelines. Should you require any further clarification or support, kindly reach out to the HR department.</p>
                        </td>
                    </tr>
                    <tr>
                        <td> 
                            <p style="font-size:14px;margin-top:0px;">Thank you for your cooperation and prompt action.</p>
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

    const mailSubject = `Manpower Requisition Approved by CEO Sir, for ${projectName} Project`;

    if( email !=='' && process.env.ACTIVATE_LIVE_EMAIL_ACCOUNTS === 'YES' ){
        emailSystem( email, msgBody, mailSubject );
    }else{
        emailSystem( process.env.TEST_EMAIL_ACCOUNTS , msgBody, mailSubject );
    }
    return msgBody;
}
 


module.exports = router;