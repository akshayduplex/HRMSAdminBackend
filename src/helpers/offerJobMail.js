const express = require('express');
const router = express.Router();
const fs = require('fs');
const dotenv = require('dotenv');
dotenv.config({ path: 'config.env' });
const { emailSystem } = require('../middlewares/smsMailSystem');
const { getHumanReadableDate, dbDateFormat, changeJobTypeLabel, checkFileExistence, formatDateDateFullMonthYear } = require('../middlewares/myFilters');

router.offerJobMail = (email, name, jobData, token, regardsData = '', mailRegards = null, ccEmailList = null) => {
	const currentDate = getHumanReadableDate(dbDateFormat(), 'date');
	const panelLoginDetails = process.env.CANDIDATE_PANEL_URL + 'login';
	const onBoardingDateFormat = jobData?.onboard_date !== '' ? formatDateDateFullMonthYear(getHumanReadableDate(jobData?.onboard_date, 'date')) : '';


	const generalConfig = JSON.parse(fs.readFileSync('./src/config/general_config_file.txt', 'utf8'));
	const organizationConfig = JSON.parse(fs.readFileSync('./src/config/organization_config_file.txt', 'utf8'));
	const hrConfig = JSON.parse(fs.readFileSync('./src/config/hr_config_file.txt', 'utf8'));
	const socialLinks = JSON.parse(fs.readFileSync('./src/config/social_media_config_file.txt', 'utf8'));


	const faceBookLink = socialLinks?.social_media_links?.facebook_link;
	const twitterLink = socialLinks?.social_media_links?.twitter_link;
	const instaGramLink = socialLinks?.social_media_links?.instagram_link;
	const linkedInLink = socialLinks?.social_media_links?.linkedin_link;

	const companyName = organizationConfig?.organization_name;
	const companyLogo = process.env.IMAGE_PATH + '' + generalConfig.logo_image;

	/*Best Regards*/
	var regardsName = hrConfig?.default_hr_details?.name;
	var regardsDesignation = hrConfig?.default_hr_details?.designation;
	var regardsContactInfo = hrConfig?.default_hr_details?.mobile_no;
	var regardsMailInfo = hrConfig?.default_hr_details?.email_id;

	if (mailRegards) {
		var regardsName = mailRegards?.name || '';
		var regardsDesignation = mailRegards?.designation || '';
		var regardsContactInfo = mailRegards?.mobile || '';
		var regardsMailInfo = mailRegards?.email || '';
	}

	/*Best Regards*/
	var bestRegards = '';
	//if( default_hr_enable_status !== 'ACTIVE'  ){
	if (mailRegards) {
		if (typeof regardsName !== 'undefined') {
			bestRegards += `<p style="font-size:14px;margin:0px;">${regardsName}</p>`;
		}
		if (typeof regardsDesignation !== 'undefined') {
			bestRegards += `<p style="font-size:14px;margin:0px;">${regardsDesignation}</p>`;
		}
		if (typeof companyName !== 'undefined') {
			bestRegards += `<p style="font-size:14px;margin:0px;">${companyName}</p>`;
		}
		if (typeof regardsContactInfo !== 'undefined') {
			bestRegards += `<p style="font-size:14px;margin:0px;"><strong>Mobile:</strong> ${regardsContactInfo}</p>`;
		}
		if (typeof regardsMailInfo !== 'undefined') {
			bestRegards += `<p style="font-size:14px;margin:0px;"><strong>Email:</strong> ${regardsMailInfo}</p>`;
		}
	} else {
		bestRegards += `${companyName} Recruitment Team`;
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
							<p style="font-size:14px;">Dear ${name}:</p>
							<p style="font-size:14px;">I hope this message finds you well.</p>							
							<p style="font-size:14px;">We are pleased to inform you that your offer letter has been successfully issued and is now available for your review and acceptance. Please log in to your candidate portal or check your email inbox for further instructions on how to view and accept the offer.</p>
							<p style="font-size:14px;">Kindly review the details and confirm your acceptance at your earliest convenience. No attachments are included in this email—please access the offer letter through the provided system or link.</p>
							<p style="font-size:14px;">If you have any questions or require any clarification, feel free to reach out to us./p>
							<p style="font-size:14px;">We look forward to welcoming you to the team!</p>
							<p>This offer letter will be void in case you fail to accept before ${onBoardingDateFormat}.</p>
						</td>
					</tr>
					<tr>
						<td colspan="3" style="text-align:center;padding: 10px 0 20px;">
							<a href="${panelLoginDetails}" style="text-decoration: none;cursor: pointer; border:0; background:#00B957;color:#fff;border-radius:5px;padding:12px;min-width:120px; font-weight:600;">To Login Click Here</a>
							<p>Username: ${email}</p>
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

	const mailSubject = `Offer Letter Acceptance and Joining Confirmation`;

	const ccEmail = mailRegards ? mailRegards?.email : null; //Re-added on 03-October-2025 by Rahul Prajapati sir

	if (email !== '' && process.env.ACTIVATE_LIVE_EMAIL_ACCOUNTS === 'YES') {
		emailSystem(email, msgBody, mailSubject, null, ccEmail);
	} else {
		emailSystem(process.env.TEST_EMAIL_ACCOUNTS, msgBody, mailSubject, null, ccEmail);
	}
}


router.sendJobOfferMailToCandidateFromApprovalNote = (ApprovalNoteData, candidateData, templateContent, templateData, documents, token, templateFor, mailRegards = null, ccEmailList = null, document_status_for_db = null, selected_doc = Array(), email_subject = null) => {

	const currentDate = getHumanReadableDate(dbDateFormat(), 'date');
	const acceptPageUrlData = process.env.CANDIDATE_PANEL_URL + 'verify?utm=' + token + '&type=accept';
	const rejectPageUrlData = process.env.CANDIDATE_PANEL_URL + 'verify?utm=' + token + '&type=reject';

	const generalConfig = JSON.parse(fs.readFileSync('./src/config/general_config_file.txt', 'utf8'));
	const organizationConfig = JSON.parse(fs.readFileSync('./src/config/organization_config_file.txt', 'utf8'));
	const hrConfig = JSON.parse(fs.readFileSync('./src/config/hr_config_file.txt', 'utf8'));
	const socialLinks = JSON.parse(fs.readFileSync('./src/config/social_media_config_file.txt', 'utf8'));


	const faceBookLink = socialLinks?.social_media_links?.facebook_link;
	const twitterLink = socialLinks?.social_media_links?.twitter_link;
	const instaGramLink = socialLinks?.social_media_links?.instagram_link;
	const linkedInLink = socialLinks?.social_media_links?.linkedin_link;

	const companyName = organizationConfig?.organization_name;
	const companyLogo = process.env.IMAGE_PATH + '' + generalConfig.logo_image;
	const selectedAttachMents = selected_doc?.length > 1 ? JSON.parse(selected_doc) : [];

	var attachmentList = [];
	var sendAttachmentList = [];

	const attachments = templateData.attachments || [];
	const selectedAttachMentsSafe = selectedAttachMents || [];

	if (attachments.length > 0 && selectedAttachMentsSafe.length > 0) {
		attachments.forEach(item => {
			if (checkFileExistence(item.file_name) && item?._id?.toString() != '' && selectedAttachMentsSafe.includes(item?._id?.toString())) {
				const push = {};
				push.doc_name = item.doc_name;
				push.filename = item.file_name;
				push.is_html = item?.is_html || 'No';
				push.path = `${process.env.IMAGE_PATH}${item.file_name}`;
				attachmentList.push(push);
				sendAttachmentList.push(item);
			}
		});
	}

	if (documents.length > 0) {
		documents.forEach(item => {
			if (checkFileExistence(item.file_name)) {
				const push = {}
				push.doc_name = item.doc_name;
				push.filename = item.file_name;
				push.is_html = item?.is_html || 'No';
				push.path = `${process.env.IMAGE_PATH}${item.file_name}`;
				attachmentList.push(push);
				sendAttachmentList.push(item);
			}
		});
	}

	const email = candidateData?.email;

	const buttonLink = `<div style="text-align:center;padding: 10px 0 20px;">
							<a href="${acceptPageUrlData}" style="text-decoration: none;cursor: pointer; border:0; background:#00B957;color:#fff;border-radius:5px;padding:12px;min-width:120px; font-weight:600;">Accept</a>
							<a href="${rejectPageUrlData}" style="text-decoration: none;cursor: pointer; border:0; background:#ff2200;color:#fff;border-radius:5px;padding:12px; min-width:120px; font-weight: 600;">Reject</a>
						</div>`;

	const LoginUrlLink = `<a href="${process.env.CANDIDATE_PANEL_URL}login" style="text-decoration: underline; cursor: pointer; font-weight:600;">Click</a>`;

	//Replace the placeholder
	const updatedTemplateContent = templateContent.replace("{#page_link}", buttonLink).replace("{#login_url}", LoginUrlLink).replace("{#email_id}", email);

	var regardsName = hrConfig?.default_hr_details?.name;
	var regardsDesignation = hrConfig?.default_hr_details?.designation;
	var regardsContactInfo = hrConfig?.default_hr_details?.mobile_no;
	var regardsMailInfo = hrConfig?.default_hr_details?.email_id;

	if (mailRegards) {
		var regardsName = mailRegards?.name || '';
		var regardsDesignation = mailRegards?.designation || '';
		var regardsContactInfo = mailRegards?.mobile || '';
		var regardsMailInfo = mailRegards?.email || '';
	}

	/*Best Regards*/
	var bestRegards = '';
	//if( default_hr_enable_status !== 'ACTIVE'  ){
	if (mailRegards) {
		if (typeof regardsName !== 'undefined') {
			bestRegards += `<p style="font-size:14px;margin:0px;">${regardsName}</p>`;
		}
		if (typeof regardsDesignation !== 'undefined') {
			bestRegards += `<p style="font-size:14px;margin:0px;">${regardsDesignation}</p>`;
		}
		if (typeof companyName !== 'undefined') {
			bestRegards += `<p style="font-size:14px;margin:0px;">${companyName}</p>`;
		}
		if (typeof regardsContactInfo !== 'undefined') {
			bestRegards += `<p style="font-size:14px;margin:0px;"><strong>Mobile:</strong> ${regardsContactInfo}</p>`;
		}
		if (typeof regardsMailInfo !== 'undefined') {
			bestRegards += `<p style="font-size:14px;margin:0px;"><strong>Email:</strong> ${regardsMailInfo}</p>`;
		}
	} else {
		bestRegards += `${companyName} Recruitment Team`;
	}


	const msgBody = `<!DOCTYPE html>
	<html>
	<head>
		<meta charset="utf-8">
		<meta name="viewport" content="width=device-width, initial-scale=1">
		<title>Candidate ${templateData.template_for}</title>
		<link href="https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap" rel="stylesheet">

	</head>
	<body style="font-family: 'Poppins', sans-serif; color: #585858;">
		<table style="max-width: 700px;" center>
			<tr class="headerContent">
				<td style="text-align: center;border-bottom:1px solid #34209B; padding: 10px;">
					<img src="${companyLogo}" width="175px" >
				</td>
			</tr>
			<tr class="textContent">
				<td>
					<table style="padding: 20px;"> 
						<tr>
							<td class="templateContent" >${updatedTemplateContent}</td>
						</tr>
					</table>
				</td>
			</tr>
			<tr class="headerContent" >
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

	var mailSubject = `${templateData.template_for} for the position of ${ApprovalNoteData.job_designation} at ${companyName}`;
	if (templateData.template_for === 'Joining Kit') {
		mailSubject = `Joining Kit and Onboarding Details – ${companyName}`;
	}
	else if (templateData.template_for === 'Appointment Letter') {
		mailSubject = `Appointment Letter and Onboarding Details – ${companyName}`;
	}

	var ccEmail;
	if (['Offer Letter', 'Joining Kit'].includes(templateData.template_for)) {
		ccEmail = ccEmailList && ccEmailList.length > 0 ? ccEmailList : (mailRegards ? mailRegards?.email : null);
	} else {
		//ccEmail = mailRegards ? mailRegards?.email : null; 
		ccEmail = null;
	}


	if (email_subject) {
		mailSubject = email_subject;
	}



	if (document_status_for_db === 'mailsent' && email !== '' && process.env.ACTIVATE_LIVE_EMAIL_ACCOUNTS === 'YES') {
		emailSystem(email, msgBody, mailSubject, null, ccEmail);
	} else if (document_status_for_db === 'mailsent') {
		emailSystem(process.env.TEST_EMAIL_ACCOUNTS, msgBody, mailSubject, attachmentList, ccEmail);
	}

	return { body: msgBody, 'attachments': sendAttachmentList };
}


router.sendJobOfferAcceptMailToPanelist = (candidateName, jobPosition, onboardingDate, toEmailId, ccEmailList = null, jobLocation = null) => {

	const currentDate = getHumanReadableDate(dbDateFormat(), 'date');

	const generalConfig = JSON.parse(fs.readFileSync('./src/config/general_config_file.txt', 'utf8'));
	const organizationConfig = JSON.parse(fs.readFileSync('./src/config/organization_config_file.txt', 'utf8'));
	const hrConfig = JSON.parse(fs.readFileSync('./src/config/hr_config_file.txt', 'utf8'));
	const socialLinks = JSON.parse(fs.readFileSync('./src/config/social_media_config_file.txt', 'utf8'));

	const companyName = organizationConfig?.organization_name;
	const companyLogo = process.env.IMAGE_PATH + '' + generalConfig.logo_image;

	const onboardingDateFormat = onboardingDate ? formatDateDateFullMonthYear(getHumanReadableDate(onboardingDate, 'date')) : '';

	/*Best Regards*/
	var bestRegards = '';
	bestRegards += `${companyName} Recruitment Team`;

	if (process.env.IS_A_HLFPPT_PANEL === 'YES') {
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
		<title>Candidate Job Acceptance Mail</title>
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
							<p> Dear Sir/Madam,</p>

							<p>This is to inform you that ${candidateName} has accepted the offer for the ${jobPosition}, ${jobLocation} and supposed to join us by ${onboardingDateFormat}.</p>
 
							<p> Best Regards,<br/> </p>
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

	var mailSubject = `Offer accepted – ${candidateName} & ${jobPosition}`;

	const email = toEmailId;
	const ccEmail = ccEmailList && ccEmailList.length > 0 ? ccEmailList : null;

	if (email !== '' && process.env.ACTIVATE_LIVE_EMAIL_ACCOUNTS === 'YES') {
		emailSystem(email, msgBody, mailSubject, null, ccEmail);
	} else {
		emailSystem(process.env.TEST_EMAIL_ACCOUNTS, msgBody, mailSubject, null, ccEmailList);
	}
}


router.sendAppointmentLetterMailToCandidate = (toEmailId, candidateName, jobPosition, templateHtml = null, ccEmailList = null) => {

	var msgBody = templateHtml;

	var mailSubject = `Appointment Letter – ${candidateName} & ${jobPosition}`;

	const email = toEmailId;
	const ccEmail = ccEmailList && ccEmailList.length > 0 ? ccEmailList : null;

	if (email !== '' && process.env.ACTIVATE_LIVE_EMAIL_ACCOUNTS === 'YES') {
		emailSystem(email, msgBody, mailSubject, null, ccEmail);
	} else {
		emailSystem(process.env.TEST_EMAIL_ACCOUNTS, msgBody, mailSubject, null, ccEmailList);
	}
}

router.sendIntimationMailToPanelist = async (
	candidateName,
	jobPosition,
	toEmailId,
	ccEmailList = null,
	content = ''
) => {

	const generalConfig = JSON.parse(fs.readFileSync('./src/config/general_config_file.txt', 'utf8'));
	const organizationConfig = JSON.parse(fs.readFileSync('./src/config/organization_config_file.txt', 'utf8'));

	const companyName = organizationConfig?.organization_name;
	const companyLogo = `${process.env.IMAGE_PATH}${generalConfig.logo_image}`;

	/* Best Regards */
	let bestRegards = `${companyName} Recruitment Team`;

	if (process.env.IS_A_HLFPPT_PANEL === 'YES') {
		bestRegards += `
            <p>
                Hindustan Latex Family Planning Promotion Trust (HLFPPT)<br/>
                Corporate Office- B-14 A, Second Floor, Sector 62, NOIDA, India<br/>
                Website- www.hlfppt.org
            </p>`;
	}

	const msgBody = `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Candidate Job Acceptance Mail</title>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet">
</head>

<body style="font-family: 'Poppins', sans-serif; color: #585858;">
    <table style="max-width:700px;margin:auto;">
        <tr>
            <td style="text-align:center;border-bottom:1px solid #34209B;padding:10px;">
                <img src="${companyLogo}" width="175"/>
            </td>
        </tr>

        <tr>
            <td style="padding:20px;">
                ${content}
                ${bestRegards}
            </td>
        </tr>

        <tr>
            <td style="border-top:1px solid #34209B;padding:10px;">
                <img src="${companyLogo}" width="175"/>
                <p style="font-size:12px;">
                    This email is confidential and intended only for the recipient.
                </p>
            </td>
        </tr>
    </table>
</body>
</html>`;

	const mailSubject = `Joining Intimation Mail  – ${candidateName} & ${jobPosition}`;
	const email = toEmailId;
	const ccEmail = ccEmailList?.length ? ccEmailList : null;

	if (email && process.env.ACTIVATE_LIVE_EMAIL_ACCOUNTS === 'YES') {
		emailSystem(email, msgBody, mailSubject, null, ccEmail);
	} else {
		emailSystem(process.env.TEST_EMAIL_ACCOUNTS, msgBody, mailSubject, null, ccEmail);
	}
};

module.exports = router;