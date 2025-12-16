const express = require('express');
const fs 	  = require('fs');
const router  = express.Router();
const dotenv  = require('dotenv'); 
dotenv.config({path:'config.env'});
const { emailSystem } = require('../middlewares/smsMailSystem');
const { generateJwtTokenByManualTime } = require('../middlewares/verifyToken.js');
const { getHumanReadableDate, formatDateToWeekOf, formatDateToMonthFullNameDateYear, allDateFormat } = require('../middlewares/myFilters.js');

const ADMIN_PANEL_URL = process.env.ADMIN_PANEL_URL;

router.FinalApprovalNoteMailToAddedByUser = ( data, status )=>{
    const addedByName = data?.add_by_details?.name; 
    const email = data?.add_by_details?.email;
    const employeeName = ['CEO','Sharad Agarwal','Sharad Agarwal Sir'].includes( addedByName ) ? 'Respected Sir' :  `${ addedByName } Sir/Madam`;
 
    const approvalNoteId = data.approval_note_id; 
    const job_designation = data.job_designation;
    const completeProcessDate = allDateFormat( new Date(),'MMMM DD, YYYY');  
    
    const generalConfig = JSON.parse( fs.readFileSync('./src/config/general_config_file.txt', 'utf8' ) ); 
    const organizationConfig = JSON.parse( fs.readFileSync('./src/config/organization_config_file.txt', 'utf8' ) );  
    const hrConfig = JSON.parse( fs.readFileSync('./src/config/hr_config_file.txt', 'utf8' ) );  
    const addressConfigFile = JSON.parse( fs.readFileSync('./src/config/address_config_file.txt', 'utf8' ) ); 

    const regardsName =  data?.add_by_details?.name;
    const regardsDesignation =   data?.add_by_details?.designation;
    const regardsContactInfo =  data?.add_by_details?.mobile;
    const regardsMailInfo =  data?.add_by_details?.email;
        
    const companyName =  organizationConfig?.organization_name;
    const companyLogo =  process.env.IMAGE_PATH +''+generalConfig.logo_image;
    const officeCity =  addressConfigFile?.office_city;  
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
      
     
    var msgBody = `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Job Offer Approval Mail</title>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap" rel="stylesheet">

</head>
<body style="font-family: 'Poppins', sans-serif; color: #000;">
    <table style="width:800px; max-width:800px; margin: 0 auto;" center>
        <tr>
            <td>
                <table style="padding:10px; width:100%; border-bottom:1px solid #34209B;">
                    <tr>
                        <td style="text-align: left; padding:10px;">
                             <img src="${companyLogo}" width="175px" >
                        </td> 
                    </tr> 
                 </table>
            </td>
        </tr>         

        <tr>
            <td>
                <p>Dear ${employeeName},</p>
            </td>
        </tr> 


        <tr>
            <td>
                <p> I hope this message finds you well. </p>
            </td>
        </tr> 

        <tr>
            <td>
                <p> This is to inform you that the approval note titled **${job_designation}** (ID: ${approvalNoteId}) has reached its final stage and the process has been completed. </p>
            </td>
        </tr> 

        <tr>
            <td>
                <p>**Final Status:** <strong>${status}</strong> </p>
                <p>**Completed On:** <strong>${completeProcessDate}</strong> </p>
            </td>
        </tr> 
        
        <tr>
            <td>
                <p>We appreciate your efforts and coordination throughout the approval process. Please feel free to reach out if you need any further details or documentation related to this approval note.</p>
            </td>
        </tr>  

        <tr>
            <td>
                <p style="margin:0px;font-size:14px;">Best regards,</p>
                    ${bestRegards} 
            </td>
        </tr>

    </table>
</body>
</html>`; 


        const mailSubject = `Final Status Update on Approval Note – ${approvalNoteId}.`;
        //emailSystem( 'anil@duplextech.com', msgBody, mailSubject );
        //emailSystem( 'deepaksingh@hlfppt.org', msgBody, mailSubject );
        if( email !=='' && process.env.ACTIVATE_LIVE_EMAIL_ACCOUNTS === 'YES' ){
            emailSystem( email, msgBody, mailSubject );
        }else{
            emailSystem( process.env.TEST_EMAIL_ACCOUNTS , msgBody, mailSubject ); 
        }

        return msgBody;
    }


module.exports = router;