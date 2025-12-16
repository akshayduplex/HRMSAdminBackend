const express = require('express');
const fs 	  = require('fs');
const router  = express.Router();
const dotenv  = require('dotenv'); 
dotenv.config({path:'config.env'});
const { emailSystem } = require('../middlewares/smsMailSystem');
const { generateJwtTokenByManualTime } = require('../middlewares/verifyToken.js');
const { getHumanReadableDate, formatDateToWeekOf, formatDateToMonthFullNameDateYear } = require('../middlewares/myFilters.js');

const ADMIN_PANEL_URL = process.env.ADMIN_PANEL_URL;

router.SendJobOfferApprovalMail = ( data, email, mailRegards = null )=>{
     
    const employeeName = ['CEO','Sharad Agarwal','Sharad Agarwal Sir'].includes(data?.employee_name) ? 'Respected Sir' :  `${data?.employee_name} Sir/Madam`;
    const project_id = data?.project_id || '' ;
    const approval_note_doc_id = data?.approval_note_doc_id || '' ;
    const emp_doc_id = data?.emp_doc_id || '' ;
    const candidateDesignation = data?.job_designation || '' ;
    const projectName = data?.project_name || '' ;
    const candidate_list = data?.candidate_list || [];
    const typeOfPosition = data?.mpr_offer_type ==='new' ? 'New Position' : 'Replacement';
    const approvalNoteID = data?.approval_note_id || '' ;

    const tokenPayload = {}
    tokenPayload.project_id = project_id;
    tokenPayload.approval_note_doc_id = approval_note_doc_id; 
    tokenPayload.emp_doc_id = emp_doc_id; 
    const token = generateJwtTokenByManualTime( tokenPayload , '96hr' );
    const CombineStringApprove = `${approval_note_doc_id}|${emp_doc_id}|${token}`;
    
    const approvalOfferFormLink = `<a href="${ADMIN_PANEL_URL}offerApprovalForm/${btoa(CombineStringApprove)}" style="font-size:14px;background: #00B957;border-radius: 5px;padding: 10px;color: #fff; text-decoration: none;">Approve Candidate(s)</a>`;

    const generalConfig = JSON.parse( fs.readFileSync('./src/config/general_config_file.txt', 'utf8' ) ); 
    const organizationConfig = JSON.parse( fs.readFileSync('./src/config/organization_config_file.txt', 'utf8' ) );  
    const hrConfig = JSON.parse( fs.readFileSync('./src/config/hr_config_file.txt', 'utf8' ) );  
    const addressConfigFile = JSON.parse( fs.readFileSync('./src/config/address_config_file.txt', 'utf8' ) ); 
 
    const companyName =  organizationConfig?.organization_name;
    const companyLogo =  process.env.IMAGE_PATH +''+generalConfig.logo_image;
    const officeCity =  addressConfigFile?.office_city;
    const default_hr_enable_status = process.env.DEFAULT_HR_ENABLE_STATUS;

    if( emp_doc_id === 'NA' ){
       email = hrConfig?.ceo_email_id;
    }


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
     
    /****** get payment type ********/
    var paymentType = '';
    for( var i = 0; i < candidate_list.length; i++ ){
        if( typeof candidate_list[i].payment_type !== 'undefined' && candidate_list[i].payment_type !== '' && paymentType === ''){
            paymentType = candidate_list[i].payment_type ;
        }
    }

    if( paymentType === '' ){
        paymentType = 'annum';
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
				<p> We have reviewed the shortlisted candidates for the ${candidateDesignation}, ${projectName} role and would like to suggest the following individuals for your final approval based on their qualifications and alignment with the role's requirements: </p>
            </td>
		</tr> 

        <tr>
			<td>
				<p>Approval Note ID: ${approvalNoteID}</p>
            </td>
		</tr> 

		<tr>
			<td>
				<p><strong>Suggested Candidates:</strong> </p>
			</td>
		</tr> 

		<tr>
			<td>
					<table style="width:100%;border-collapse: collapse;">
							<tr>
						  	  	<td style="border:1px solid #000;font-size:14px;padding:8px;text-align:left; font-weight:500;">Sr. No.</td>
								<td style="border:1px solid #000;font-size:14px;padding:8px;text-align:left; font-weight:500;">Candidate Name</td>
								<td style="border:1px solid #000;font-size:14px;padding:8px;text-align:left; font-weight:500;">Designation</td>
								<td style="border:1px solid #000;font-size:14px;padding:8px;text-align:left; font-weight:500;">Proposed Location</td>
								<td style="border:1px solid #000;font-size:14px;padding:8px;text-align:left; font-weight:500;">Proposed CTC per ${paymentType}</td>
								<td style="border:1px solid #000;font-size:14px;padding:8px;text-align:left; font-weight:500;">Proposed date of joining </td>
								<td style="border:1px solid #000;font-size:14px;padding:8px;text-align:left; font-weight:500;">Contract period (UPTO)</td>
                                <td style="border:1px solid #000;font-size:14px;padding:8px;text-align:left; font-weight:500;">Employment Nature</td>
								<td style="border:1px solid #000;font-size:14px;padding:8px;text-align:left; font-weight:500;">Status </td>
                                <td style="border:1px solid #000;font-size:14px;padding:8px;text-align:left; font-weight:500;">Type of position </td>
							</tr>`;

                            if( candidate_list ){ 
                                candidate_list.forEach((item, index )=>{
                                    var jobType = ['OnContract','On Contract'].includes( item?.job_type) ? 'Consultant' : 'On-Role';
									var jobStatus = ['','Waiting'].includes( item?.interview_shortlist_status) ? 'Waitlisted' : 'Selected';
                                    var proposedLocation = item?.proposed_location ? item?.proposed_location : officeCity;
                                     
                                    msgBody += `<tr>
                                        <td style="border:1px solid #000;font-size:14px;padding:8px;text-align:left; font-weight:500;">${index + 1}</td>
                                        <td style="border:1px solid #000;font-size:14px;padding:8px;text-align:left; font-weight:500;">${item.name}</td>
                                        <td style="border:1px solid #000;font-size:14px;padding:8px;text-align:left; font-weight:500;">${candidateDesignation}</td>
                                        <td style="border:1px solid #000;font-size:14px;padding:8px;text-align:left; font-weight:500;">${proposedLocation}</td>
                                        <td style="border:1px solid #000;font-size:14px;padding:8px;text-align:left; font-weight:500;">Rs.${item.offer_ctc}/- per ${paymentType} </td>
                                        <td style="border:1px solid #000;font-size:14px;padding:8px;text-align:left; font-weight:500;">${formatDateToWeekOf(item.onboarding_date)} </td>
                                        <td style="border:1px solid #000;font-size:14px;padding:8px;text-align:left; font-weight:500;">${getHumanReadableDate(item.job_valid_date,'date')} or till the completion of project</td>
                                        <td style="border:1px solid #000;font-size:14px;padding:8px;text-align:left; font-weight:500;">${jobType}</td>
                                        <td style="border:1px solid #000;font-size:14px;padding:8px;text-align:left; font-weight:500;">${jobStatus}</td>
                                        <td style="border:1px solid #000;font-size:14px;padding:8px;text-align:left; font-weight:500;">${typeOfPosition}</td>
                                    </tr>`;
                                });
                            } 

					msgBody += `</table>
			</td>
		</tr>
		<tr>
			<td>
				<p>These candidates stand out due to their relevant experience and potential to excel in this position.</p>
			</td>
		</tr>

        <tr>
			<td>
				<p>Next Steps:</p>
			</td>
		</tr>

        <tr>
			<td>
				<p>Approval Needed: Please review the suggested candidates and provide your approval to proceed with the final offer.</p>
			    <p>Click to Approve: ${approvalOfferFormLink}</p>
                <p>Feedback: If you have any reservations or alternative suggestions, kindly reply to this email.
Your prompt response is highly appreciated to move forward efficiently.</p>
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


        const mailSubject = `Approval for Selection of ${candidateDesignation}, ${projectName}.`;

        const ccEmail = mailRegards ? mailRegards?.email : null;

        //emailSystem( 'anil@duplextech.com', msgBody, mailSubject );
        //emailSystem( 'deepaksingh@hlfppt.org', msgBody, mailSubject );
        if( email !=='' && process.env.ACTIVATE_LIVE_EMAIL_ACCOUNTS === 'YES' ){
            emailSystem( email, msgBody, mailSubject , null, ccEmail );
        }else{
            emailSystem( process.env.TEST_EMAIL_ACCOUNTS , msgBody, mailSubject , null, ccEmail ); 
        }

        return msgBody;
    }


module.exports = router;