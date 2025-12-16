const express = require('express');
const fs 	  = require('fs');
const router  = express.Router();
const dotenv  = require('dotenv'); 
dotenv.config({path:'config.env'}); 
const { getHumanReadableDate, formatDateToWeekOf, formatDateToMonthFullNameDateYear, removeDuplicatesRecordsFromList } = require('../middlewares/myFilters.js');

const ADMIN_PANEL_URL = process.env.ADMIN_PANEL_URL;

router.ApprovalNoteDownloadFormat = ( data )=>{
    
    const modeOfInterview = data?.interview_type ==='Online' ? 'Virtual' : 'On-site';
    const replaceJobType = data.mpr_offer_type === 'replacement' ? '☑' : '';
    const newJobType = data.mpr_offer_type === 'new'  ? '☑' : '';
    const FundedJobType = data.mpr_fund_type === 'Funded' ? '☑' : '';
    const nonFundedJobType = data.mpr_fund_type === 'Non Funded' ? '☑' : '';
    const jobAppliedFrom = data.applied_from; 
    const candidateDesignation = data.job_designation;
    const projectName = data.project_name;
    const interviewerList = removeDuplicatesRecordsFromList( data.interviewer_list ,'name');
    const candidateList = data.candidate_list;
    const panelMembersList = data.panel_members_list; 
   

    const generalConfig = JSON.parse( fs.readFileSync('./src/config/general_config_file.txt', 'utf8' ) ); 
    const organizationConfig = JSON.parse( fs.readFileSync('./src/config/organization_config_file.txt', 'utf8' ) );  
    const hrConfig = JSON.parse( fs.readFileSync('./src/config/hr_config_file.txt', 'utf8' ) );  
    const addressConfigFile = JSON.parse( fs.readFileSync('./src/config/address_config_file.txt', 'utf8' ) ); 
 
    const companyName =  organizationConfig?.organization_name;
    const companyLogo =  process.env.IMAGE_PATH +''+generalConfig.logo_image;
    const officeCity =  addressConfigFile?.office_city;
    const companyShortName =  process.env.COMPANY_SHORT_NAME; 
    var ceoSignature = hrConfig?.ceo_digital_signature; 

     
    var msgBody = `<!DOCTYPE html>
<html>
<head>
	<meta charset="utf-8">
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<title>Approval Note</title>
	<link href="https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap" rel="stylesheet">

</head>
<body style="font-family: 'Poppins', sans-serif; color: #000;">
	<table style="width:800px; max-width:800px; margin: 0 auto;" center>
		<tr>
			<td>
				<table style="padding:10px; width:100%; border-bottom:1px solid #34209B;">
					<tr>
						<td style="text-align: left; padding:10px;">
							<img src="${companyLogo}">
						</td>
						
						<td style="float: right;">
							<table style="padding:0px; width:100%;">
								<tr>
									<td style="text-align:center;">
									   <table style="border-collapse: collapse;">
									   	  <tr>
									   	  	<td style="border:1px solid #000;font-size:14px;padding:8px;text-align:left; font-weight:500;">New Position ${newJobType}</td>
									   	  	<td style="border:1px solid #000;font-size:14px;padding:8px;text-align:left; font-weight:500;">Replacement${replaceJobType}</td>
									   	  </tr> 
									   	  <tr>
									   	  	<td style="border:1px solid #000;font-size:14px;padding:8px;text-align:left; font-weight:500;">Funded ${FundedJobType}</td>
									   	  	<td style="border:1px solid #000;font-size:14px;padding:8px;text-align:left; font-weight:500;">Non Funded Project ${nonFundedJobType}</td>
									   	  </tr>
									   	  <tr>
									   	  	<td style="border:1px solid #000;font-size:14px;padding:8px;text-align:left; font-weight:500;">Job Portal </td>
									   	  	<td style="border:1px solid #000;font-size:14px;padding:8px;text-align:left; font-weight:500;">${jobAppliedFrom}</td>
									   	  </tr>

									   </table>
									</td>
								</tr>
							 </table>
						</td>
					</tr>
					<tr> 
						<td colspan="2" style="text-align: center; vertical-align: middle;">
                                <h4 style="margin-top: 0; margin-bottom: 0;">Approval Note</h4>
                        </td> 
					</tr>
				 </table>
			</td>
		</tr>
		<tr>
			<td> <p style="text-align: right; font-weight: 600;">Date: ${formatDateToMonthFullNameDateYear( new Date() )}</p> </td>
		</tr>
		<tr>
			<td>
			  <h3 style="width: 90%; text-align: center; margin:0 auto 10px;">Sub: Approval for Selection of ${candidateDesignation}, ${projectName}.</h3>
			</td>
		</tr>

		<tr>
			<td>
				<p>This has reference to the requirement of <strong>${candidateDesignation}, ${projectName}</strong>. It has been proposed to appoint following candidates as per the details given below: </p>
			</td>
		</tr>
		<tr>
			<td>
				<p style="text-decoration:underline;color: #000; font-weight:600">Interviewer Panel List</p>
			</td>
		</tr>
		<tr>
			<td>
					<table style="width:100%;border-collapse: collapse;">
							<tr>
						  	  	<td style="border:1px solid #000;font-size:14px;padding:8px;text-align:left; font-weight:500;">Sr. No.</td>
								<td style="border:1px solid #000;font-size:14px;padding:8px;text-align:left; font-weight:500;">NAME</td>
								<td style="border:1px solid #000;font-size:14px;padding:8px;text-align:left; font-weight:500;">DESIGNATION</td>
								<td style="border:1px solid #000;font-size:14px;padding:8px;text-align:left; font-weight:500;">Mode of interview</td>
							</tr>`;
							if( interviewerList ){ 
                                interviewerList.forEach((item, index )=>{
                                    if( item.designation !=='CEO' ){
                                        msgBody += `<tr>
                                                        <td style="border:1px solid #000;font-size:14px;padding:8px;text-align:left; font-weight:500;">${index+1}</td>
                                                        <td style="border:1px solid #000;font-size:14px;padding:8px;text-align:left; font-weight:500;">${item.name}</td>
                                                        <td style="border:1px solid #000;font-size:14px;padding:8px;text-align:left; font-weight:500;">${item.designation}</td>
                                                        <td style="border:1px solid #000;font-size:14px;padding:8px;text-align:left; font-weight:500;">${modeOfInterview }  Interview</td>
                                                    </tr>`;
                                    }
                                });
                            } 
		 msgBody += `</table>
			</td>
		</tr>

		<tr>
			<td>
				<p style="text-decoration:underline;color: #000; font-weight:600">Candidate(s) List</p>
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
                            if( candidateList ){ 
                                candidateList.forEach((item, index )=>{ 
									var jobType = ['OnContract','On Contract'].includes( item?.job_type) ? 'On-Consultant' : 'On-Role';
									var jobStatus = ['','Waiting'].includes( item?.interview_shortlist_status) ? 'Waiting' : 'Selected';
                                        msgBody += `<tr>
                                            <td style="border:1px solid #000;font-size:14px;padding:8px;text-align:left; font-weight:500;">${index+1}</td>
                                            <td style="border:1px solid #000;font-size:14px;padding:8px;text-align:left; font-weight:500;">${item.name}</td>
                                            <td style="border:1px solid #000;font-size:14px;padding:8px;text-align:left; font-weight:500;">${candidateDesignation}</td>
                                            <td style="border:1px solid #000;font-size:14px;padding:8px;text-align:left; font-weight:500;">${officeCity}</td>
                                            <td style="border:1px solid #000;font-size:14px;padding:8px;text-align:left; font-weight:500;">Rs.${item.offer_ctc}/- per annum</td>
                                            <td style="border:1px solid #000;font-size:14px;padding:8px;text-align:left; font-weight:500;">${formatDateToWeekOf(item.onboarding_date)}</td>
											<td style="border:1px solid #000;font-size:14px;padding:8px;text-align:left; font-weight:500;">${jobType}</td>
                                            <td style="border:1px solid #000;font-size:14px;padding:8px;text-align:left; font-weight:500;">New Position</td>
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
				<p>Submitted for your kind approval, please</p>
			</td>
		</tr>`;

        msgBody += `<tr>
        <td>
            <table style="padding:20px 0; width:100%">`; 
                panelMembersList.forEach((item, index) => {
            
                    if (index % 2 === 0) {
                        msgBody += `<tr style="margin-bottom:20px" >`;
                    }
                    const alignment = index % 2 === 0 ? "left" : "right";

                    var approveStatus = '';
                    if( item?.approval_status == ''){
                        //approveStatus = `<span style="font-size:14px; display:block;">Pending</span>`;
                    }else if( ['Approved','Rejected'].includes( item?.approval_status) ){
                        //approveStatus = `<span style="font-size:14px; display:block;">Approved</span>`;
                        approveStatus = `<span style="font-size:14px; display:block;">${getHumanReadableDate( item?.approved_date ,'date')}</span>`;
                    }
                
                    // Add the panel member details
                    if( item.designation !== 'CEO'){
                    var digitalSignature = item?.signature !=='' ? process.env.IMAGE_PATH +''+item.signature : '';
                    var digitalSignatureImg = ['Approved','Rejected'].includes(item?.approval_status ) ? `<img src="${digitalSignature}" width="100px" />` : '';
                    msgBody += `
                        <td style="text-align: ${alignment}; vertical-align: top;">
                            <span style="font-size:18px; color:#000; min-width:80px; display:block; font-weight: 600;">${item?.name}</span>
                            <span style="font-size:18px; display:block;">${item?.designation}</span>
                            ${approveStatus}
                            ${digitalSignatureImg}
                            <br/><br/>
                        </td>`;
                    }else if( item.designation === 'CEO' && process.env.IS_A_HLFPPT_PANEL === 'YES' ){
                        var digitalSignature = ceoSignature !=='' ? process.env.IMAGE_PATH +''+ceoSignature : '';
                        var digitalSignatureImg = ['Approved','Rejected'].includes(item?.approval_status ) ? `<img src="${digitalSignature}" width="100px" />` : '';

                        msgBody += `
                        <td style="text-align: ${alignment}; vertical-align: top;">
                            <span style="font-size:18px; color:#000; min-width:80px; display:block; font-weight: 600;">Sharad Agarwal</span>
                            <span style="font-size:18px; display:block;">Chief Executive Officer</span>
                            ${approveStatus}
                            ${digitalSignatureImg}<br/><br/>
                        </td>`;
                    }

                    // Close the row after 2 items or at the last item
                    if (index % 2 === 1 || index === panelMembersList.length - 1) {
                        msgBody += `</tr>`;
                    }
                });
		
	msgBody += `</table> 

</body>
</html>`; 
 
    return msgBody;
}


module.exports = router;