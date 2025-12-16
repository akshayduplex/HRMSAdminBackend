const express = require('express');
const router = express.Router();
const fs 	  = require('fs');
const { emailSystem } = require('../middlewares/smsMailSystem');
const { getHumanReadableDate , calculateDaysBetweenDates, allDateFormat, numbersToWords, formatIndianCurrency } = require('../middlewares/myFilters'); 

router.jobAppointmentMail = ( data , action ='mail' )=>{

	const today = getHumanReadableDate( new Date(),'date');
	const todayWithMonth = allDateFormat( new Date(),'MMMM DD, YYYY');
	const fatherName = 'Mr. Raj Kumar Garg';
	const mrMrs = 'Mr.';
	const address = 'Kamla Nagar, Agra, Uttar Pradesh-282005';
	const employeeName = 'XYZ…';
	const email = '';
	const joiningDate = allDateFormat( new Date('June 21, 2023'),'MMMM DD, YYYY'); 
	const probationDate = allDateFormat( new Date('November 21, 2023'),'MMMM DD, YYYY'); 
	const contractEndDate = allDateFormat( new Date('July 31, 2024'),'MMMM DD, YYYY');
	const designationName = 'Assistant Manager- Finance';
	const jobType = 'contractual';
	const jobLocation = 'Noida'; 
	const ctc_Per_Annum = '5450556';
	const ctc_Per_Annum_in_words = `Rupees ${numbersToWords( ctc_Per_Annum )}`;
	const companyName = 'HINDUSTAN LATEX FAMILY PLANNING PROMOTION TRUST';
	const senderRegardsName = 'Awanish Awasthi';
	const senderRegardsDesignation = 'Team Leader- HR & Admin';
	//const ProbationTime = parseInt( calculateDaysBetweenDates( joiningDate, probationDate  )/28 )+' Months';
	const ProbationTime = 'six months';
	const basicSalary = formatIndianCurrency('19825.0');
	const basicHRA = formatIndianCurrency('9912.00');
	const specialAllowance = formatIndianCurrency('19757.66');
	const monthlyGross = formatIndianCurrency('49494.66');
	const annumGross =  formatIndianCurrency( parseInt('5,93,936.00') ) ;

	
     const msgBody = `<!DOCTYPE html>
<html>
<head>
	<meta charset="utf-8">
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<title>HRMS Portal</title>
	<link href="https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap" rel="stylesheet">

</head>
<body style="font-family: 'Poppins', sans-serif; color: #585858;">
	<table style="max-width: 700px;" center>
		<tr>
			<td style="text-align: center;border-bottom:1px solid #34209B; padding: 10px;">
				<img src="${process.env.COMPANY_LOGO}">
			</td>
		</tr>
		<tr>
			<td>
				<table style="padding:20px;">
					<tr>
						<td>
							<p style="font-size:14px;text-align: right;">Date:${today}</p>
							<p style="font-size:14px;">${mrMrs} ${employeeName}</p>
							<p style="font-size:14px; margin: 0;">S/O ${fatherName}, </p>
							<p style="font-size:14px;">${address}</p>
							  
							<p style="font-size:14px;">Welcome to ${process.env.COMPANY_SHORT_NAME}!</p>							
							<p style="font-size:14px; text-align:justify;">Based on your offer letter dated <strong>${todayWithMonth}</strong> we are pleased to offer you appointment as <strong>${designationName}, Corporate Office- ${jobLocation}</strong> on a ${jobType} basis for a fixed term with effect from <strong>${joiningDate} to ${contractEndDate} </strong>(or till the completion of the project whichever is earlier) so as to render your services to <strong>H</strong>industan <strong>L</strong>atex <strong>F</strong>amily <strong>P</strong>lanning <strong>P</strong>romotion <strong>T</strong>rust (abbreviated as ${process.env.COMPANY_SHORT_NAME}). This Appointment offer letter will be void in case you fail to join before <strong>${joiningDate}</strong>. You will be on probation for a period of <strong>${ProbationTime}</strong>, during which period your performance will be closely watched. In the course of the work, periodic reviews, and regularly reporting is required to be made to <strong>National Lead- Finance, Corporate Office- ${jobLocation}.</strong> </p>

							
							<p style="font-size:14px; text-align:justify;">Just as it gives us pleasure in bringing you into our fold, we wish to share with you the detailed terms and conditions of employment and employee related guidelines applicable to all employees of ${process.env.COMPANY_SHORT_NAME}.</p>

							<p style="font-size:14px;">We wish the very best for you in your career with us.</p>
							<p style="font-size:16px; font-weight: 600;">Terms and conditions of employment:</p>
							<p style="font-size:14px; text-align:justify;">1. It has been communicated and agreed that your appointment is purely on a contractual basis and for the aforesaid fixed period, on expiry of which, your appointment and contract between us will cease and come to an end 
							automatically, without any necessity of our giving you any notice or notice pay and 
							Without any liability on our part to pay you any retrenchment or other compensation or other amounts whatsoever. However, based on your performance, and the extension of the project, your contract can be reviewed for further extension. This is however, not obligatory on the part of the organization.
							</p>
							<p style="font-size:14px; text-align:justify;">2. You will have no right or lien on or in respect of the job or position to which you are temporarily appointed or any other job or position either in ${process.env.COMPANY_SHORT_NAME} or in HLL, and that ${process.env.COMPANY_SHORT_NAME} or HLL will not be obliged to in any manner or any account to offer you any regular or permanent employment in such job or position, even if there is any vacancy.</p>
							<p style="font-size:14px; text-align:justify;">3. Your appointment is subject to your being certified to be medically fit by any registered medical practitioner.</p>
							<p style="font-size:14px; text-align:justify;">4. During your appointment pursuant hereto, you will be required to do work as per the duty hours prescribed for <strong>Corporate Office</strong> based at <strong>${jobLocation}</strong> or as may be advised by us keeping in view the requirements of the organization.</p>

							<p style="font-size:14px; text-align:justify;">5. During your appointment as <strong>${designationName}</strong> for a fixed term you will be entitled for a annual gross salary of <strong>${ctc_Per_Annum} (${ctc_Per_Annum_in_words} Only)per annum.</strong></p>
							<p style="font-size:14px; text-align:justify;">6. You will be entitled for PF Contribution at the rate of 12% of the basic salary and an equal amount would be deducted by your basic salary as per the PF rules & regulations, as per break-up given in Annexure.</p>
							<p style="font-size:14px; text-align:justify;">7. Since you are not a permanent employee of the Organization, you will not be entitled to any of the Statutory Benefit plans such as LTA, Superannuation etc. The remuneration paid to you by the project is a matter purely between you and the organization and you shall maintain all information regarding your remuneration as personal and confidential..</p>
							<p style="font-size:14px; text-align:justify;">8. Your initial posting will be at <strong>${jobLocation}</strong> but your services during the period of your assignment are transferable to any other site, etc. of ${process.env.COMPANY_SHORT_NAME} or its Project deployed anywhere in India, in accordance with the project’s concerned policy and rules for the time being in force.</p>
							<p style="font-size:14px; text-align:justify;">9. Based on your performance, you will be eligible for annual increments in salary, which will be communicated to you.</p>
							<p style="font-size:14px; text-align:justify;">10. This appointment is made on the basis of and relying on the particulars and personal data submitted by you at the time of Interview and joining and will be deemed to be void ab initio in the event of any such particulars or data being false or incorrect. You shall inform the Human Resource Department, ${process.env.COMPANY_SHORT_NAME} of any changes in such particulars of the data within <strong>three days of any such change</strong>.</p>
							<p style="font-size:14px; text-align:justify;">11. You shall, during the period of your contractual appointment pursuant hereto, devote your whole time and attention to the work entrusted to you and shall not engage yourself directly or indirectly in any other business, work or service.</p>
							<p style="font-size:14px; text-align:justify;">12. All information pertaining to the organization / its project, affairs, operations and employees of the organization/project will be deemed to be secret and confidential and shall be maintained as such by you and your appointment pursuant hereto will be subject to your executing with the organization/project on your accepting this offer of temporary appointment, a formal agreement with regard to the maintenance of such secrecy and confidentiality and with regard to intellectual property rights etc. You will also keep us duly informed of any confidentiality agreement entered into by you with your previous employers or any others and keep us indemnified and harmless against any breach thereof by you and any consequences of any such breach.</p>

							<p style="font-size:14px; text-align:justify;">13. You will abide by all the applicable Service Rules and Regulations of ${process.env.COMPANY_SHORT_NAME}/its Project, including its personal conduct guidelines, in force from time to time, which you are deemed to have read, understood and agreed. The organization will have the right to vary or modify the same or all or any of the terms and conditions of your temporary appointment at any time, which will be binding on you, in the former case upon such variation or modification being made, and in the later case on our giving you notice of such variation of modification.</p>
							<p style="font-size:14px; text-align:justify;">14. Your appointment and service pursuant hereto may be terminated by either of us by giving to each other One - month written notice or by paying One - month Salary (Basic plus HRA) in lieu of such notice. However, in event of your giving such notice to the organization, we shall have the right to accept the same from the date prior to the expiry of the notice period. On acceptance of any notice of termination by the organization, you shall not be entitled to withdraw.</p>

							<p style="font-size:14px; text-align:justify;">15. Notwithstanding anything herein contained, in the event of any breach by you of any of the terms and conditions herein contained or of any Rules and Regulations of the organization, we will have the right to terminate your appointment and service without any notice or notice pay or compensation whatsoever.</p>
							<p style="font-size:14px; text-align:justify;">16. The tribunals and courts in Trivandrum will have the exclusive jurisdiction in respect of all matters pertaining to your contractual agreement with ${process.env.COMPANY_SHORT_NAME}.</p>
							<p style="font-size:14px; text-align:justify;">17. Please sign on all the pages of the duplicate copy of the letter in token of your acceptance of the terms and conditions herein contained and return it to us.</p>
						</td>
					</tr>
					<tr>
						<td  style="text-align:left;padding: 10px 0px;">
							  <p style="margin:0px;font-size:14px;">Thanking You,</p>
						</td>
					</tr>
					<tr>
						<td>
							<p style="margin:0px;font-size:14px;">Yours Sincerely,</p>
							<p style="font-size:14px;margin-top:0px;">For <strong>${companyName},</strong></p>
						</td>
					</tr>



					<tr>
						<td>
							<p style="font-size:14px;margin-bottom: 5px;font-weight: 600">${senderRegardsName}</p>
							<p style="font-size:14px;margin-top:0px;font-weight: 600">${senderRegardsDesignation}</p>
						</td>
					</tr>
					<tr>
						<td>
							<p style="font-size:14px;">I, __${employeeName}___, have joined on _____________ solemnly declare that I have read and understood thoroughly the rules of service and terms of appointment of my service, and I do hereby agree with all terms as above and I shall abide by all general rules of service which are now or hereafter to be in force and accordingly I accept the appointment of service with ${process.env.COMPANY_SHORT_NAME}.</p>
						</td>
					</tr>
					<tr>
						<td colspan="3">
							<p style="font-size:14px; margin: 0;padding-left: 2px;font-weight: 500;">Name</p>
						</td>
					</tr>
					<tr>
						<td>
							<table style="padding:0">
								<tr>
									<td colspan="2" style="width:80%"><p style="font-size:14px;font-weight: 500;">Date</p></td>
					             	<td colspan="1">
					             		<p style="font-size:14px;">___________________________</p>
					             		<span style="font-size:14px; text-align:center;display: block; ">(Signature)</span>
					             	</td>
								</tr>
							</table>
						</td>
					</tr>
					<tr>
						<td colspan="3">
							<p style="font-size:16px;font-weight: 600;">Detailed Salary Structure:</p>
						</td>
					</tr>
					<tr>
						<td colspan="3">
							<p style="font-size:14px;">
							 <strong style="padding-right:10px;font-weight: 600;">Name:</strong> <strong style="font-weight: 600;">${mrMrs} ${employeeName}</strong></p>
							<p style="font-size:14px;font-weight: 600;">
								<strong style="padding-right: 10px;font-weight: 600;">Designation:</strong> 
								<strong style="font-weight: 600;">${designationName}, Corporate Office- ${jobLocation}</strong> </p>
						</td>
					</tr>
                    <tr>
						<td>
							<table style="padding:0;width: 100%;border-collapse:collapse;">
								<tr>
									<td style="border:1px solid #000;padding: 7px;">
										<p style="font-size:14px;font-weight: 600;">Monthly Component</p>
									</td>
					             	<td style="border:1px solid #000;padding: 7px;">
					             		<p style="font-size:14px;font-weight: 600;">Amount in Rs</p>
					             	</td>
								</tr>
								 
								<tr>
									<td style="border:1px solid #000;padding: 7px;">
										<p style="font-size:14px;font-weight: 600;">Basic</p>
									</td>
					             	<td style="border:1px solid #000;padding: 7px;">
					             		<p style="font-size:14px;font-weight: 600;">${basicSalary}</p>
					             	</td>
								</tr>
								<tr>
									<td style="border:1px solid #000;padding: 7px;">
										<p style="font-size:14px;font-weight: 600;">HRA</p>
									</td>
					             	<td style="border:1px solid #000;padding: 7px;">
					             		<p style="font-size:14px;font-weight: 600;">${basicHRA}</p>
					             	</td>
								</tr>
								<tr>
									<td style="border:1px solid #000;padding: 7px;">
										<p style="font-size:14px;font-weight: 600;">Special Allowance</p>
									</td>
					             	<td style="border:1px solid #000;padding: 7px;">
					             		<p style="font-size:14px;font-weight: 600;">${specialAllowance}</p>
					             	</td>
								</tr>
								<tr>
									<td style="border:1px solid #000;padding: 7px;">
										<p style="font-size:14px;font-weight: 600;">Monthly Gross</p>
									</td>
					             	<td style="border:1px solid #000;padding: 7px;">
					             		<p style="font-size:14px;font-weight: 600;">${monthlyGross}</p>
					             	</td>
								</tr>
								<tr>
									<td style="border:1px solid #000;padding: 7px;">
										<p style="font-size:14px;font-weight: 600;">Annum Gross</p>
									</td>
					             	<td style="border:1px solid #000;padding: 7px;">
					             		<p style="font-size:14px;font-weight: 600;">${annumGross} (Round Off)</p>
					             	</td>
								</tr>

							</table>
						</td>
					</tr>
                    <tr>
						<td colspan="3">
							<p style="font-size:16px;margin:15px 0 0;font-weight: 600;">Additional Benefits:</p>
						</td>
					</tr>
					<tr>
						<td>
							<table style="padding:0">
								<tr>
									<td colspan="1" style="">
										<p style="font-size:14px;font-weight: 600;">Company’s Contribution towards PF (per annum) @ 12%</p>
									</td>
					             	<td colspan="1">
					             		<p style="font-size:14px;margin-top:0;">___________________</p>
					             	</td>
					             	<td colspan="1">
					             		<p style="font-size:14px;font-weight: 600;"> Rs.28,548.00</p>
					             	</td>
								</tr>
								<tr>
									<td colspan="1" style="">
										<p style="font-size:14px;font-weight: 600;">Mediclaim &Personal Accident Insurance Premium (Per annum)</p>
									</td>
					             	<td colspan="1">
					             		<p style="font-size:14px;margin-top:0;">___________________</p>
					             	</td>
					             	<td colspan="1">
					             		<p style="font-size:14px;font-weight: 600;"> Rs.16,068.00</p>
					             	</td>
								</tr>
								<tr>
									<td colspan="1" style="">
										<p style="font-size:14px;font-weight: 600;">Gratuity @ 4.81% of Basic (Per annum) - Notional Pay</p>
									</td>
					             	<td colspan="1">
					             		<p style="font-size:14px;margin-top:0;">___________________</p>
					             	</td>
					             	<td colspan="1">
					             		<p style="font-size:14px;font-weight: 600;"> Rs.11,448.00</p>
					             	</td>
								</tr>
								<tr>
									<td colspan="1" style="">
										<p style="font-size:14px;font-weight: 600;">
										 <strong>Total Annual Impact (CTC)</strong>
										</p>
									</td>
					             	<td colspan="1">
					             		<p style="font-size:14px;margin-top:0;">___________________</p>
					             	</td>
					             	<td colspan="1">
					             		<p style="font-size:14px;font-weight: 600;">Rs.6,50,000.00</p>
					             	</td>
								</tr>
							</table>
						</td>
					</tr>

                    <tr>
						<td>
							<p style="margin:0px;font-size:14px;font-weight: 600">Yours Sincerely,</p>
							<p style="font-size:14px;margin-top:0px;font-weight: 600; text-align:justify;">For <strong>HINDUSTAN LATEX FAMILY PLANNING PROMOTION TRUST,</strong></p>
						</td>
					</tr>



					<tr>
						<td>
							<p style="font-size:14px;margin-bottom: 5px;font-weight: 600">Awanish Awasthi</p>
							<p style="font-size:14px;margin-top:0px;font-weight: 600">Team Leader- HR & Admin</p>
						</td>
					</tr>
				</table>
			</td>
		</tr>
		<tr>
			<td>
				<table style="border-spacing:0">
					<td style="border-top:1px solid #34209B; padding: 10px;"><img src="${process.env.COMPANY_LOGO}"></td>
					<td style="border-top:1px solid #34209B; padding: 10px;">
						<p style="font-size:12px; text-align:justify;">The content of this email is confidential and intended for the recipient specified in message only. It is strictly forbidden to share any part of this message with any third party, without a written consent of the sender. If you received this message by mistake, please reply to this message and follow with its deletion, so that we can ensure such a mistake does not occur in the future.</p>
					</td>
				</table>
			</td>
		</tr>
	</table>

</body>
</html>`;

	if( action === 'print' ){
		return msgBody;
	}else{ 
		const mailSubject = `SUBJECT: OFFER CUM APPOINTMENT LETTER ON FIXED TERM CONTRACT WITH ${companyName}`;
	
		if( email !=='' && process.env.ACTIVATE_LIVE_EMAIL_ACCOUNTS === 'YES' ){
			emailSystem( email, msgBody, mailSubject );
		}else{
			emailSystem( process.env.TEST_EMAIL_ACCOUNTS , msgBody, mailSubject );
		}
	}
}

module.exports = router;