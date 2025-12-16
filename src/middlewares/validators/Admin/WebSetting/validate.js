const express = require('express');
const router = express.Router();
const { body } = require('express-validator');

//Upload middleware 
const { uploadFile, uploadMultiple } = require('../../../fileUploads');
var uploadDoc = uploadFile.single('filename'); 
var uploadLogoFavIcon = uploadFile.fields([{ name: 'logo_file' },{ name: 'favicon_file' },{ name: 'water_mark_file' }]);  

router.validateAddWebSetting = [ 
    uploadLogoFavIcon,
    body('site_title')
        .notEmpty()
        .withMessage('Site Title is required'),
    body('meta_title')
        .notEmpty()
        .withMessage('Meta Title is required'),
    body('meta_description')
        .notEmpty()
        .withMessage('Meta Description is required')
];

router.validateAddLetterHeadSettingData = [  
    uploadDoc,
    body('header_color')
        .notEmpty()
        .withMessage('Header Color is Required'),
    body('footer_color')
        .notEmpty()
        .withMessage('Footer Color is Required')
];

router.validateAddSmtpDetails = [
    body('smtp_host')
        .notEmpty()
        .withMessage('SMTP HOST is required'),
    body('smtp_port')
        .notEmpty()
        .withMessage('SMTP Port is required'),
    body('smtp_username')
        .notEmpty()
        .withMessage('SMTP Username is required'),
    body('smtp_password')
        .notEmpty()
        .withMessage('SMTP Password is required'),
    body('smtp_from_mail')
        .notEmpty()
        .withMessage('SMTP From Mail is required'),
    body('smtp_reply_mail')
        .notEmpty()
        .withMessage('Reply To Email ID is required'),
    body('smtp_encryption_type')
        .notEmpty()
        .withMessage('SMTP Encryption Type is required'),
    body('smtp_encryption_type')
        .isIn(['SSL','TLS'])
        .withMessage(`SMTP Encryption Type must be one of: ${['SSL','TLS'].join(', ')}`),
    body('smtp_email_content_type')
        .notEmpty()
        .withMessage('SMTP Email Content Type is required'),
    body('smtp_email_content_type')
        .isIn(['HTML','Text'])
        .withMessage(`SMTP Email Content Type must be one of: ${['HTML','Text'].join(', ')}`),
    body('smtp_enable_status')
        .notEmpty()
        .withMessage('SMTP Enable Status is required'),
    body('smtp_enable_status')
        .isIn(['enabled','disabled'])
        .withMessage(`SMTP Enable Status must be one of: ${['enabled','disabled'].join(', ')}`)
];

router.validateAddGooglePlacesApi = [ 
    body('google_places_api')
        .notEmpty()
        .withMessage('Google Places API Key is required')
];

router.validateAddSMSDetails = [
    body('sms_auth_key')
        .notEmpty()
        .withMessage('SMS Auth Key is required'),
    body('sms_route_id')
        .notEmpty()
        .withMessage('SMS Route ID is required'),
    body('sms_sender_id')
        .notEmpty()
        .withMessage('SMS Sender ID is required'),
    body('sms_enable_status')
        .notEmpty()
        .withMessage('SMS Enable Status is required'),
    body('sms_enable_status')
        .isIn(['enabled','disabled'])
        .withMessage(`SMS Enable Status must be one of: ${['enabled','disabled'].join(', ')}`)
];

router.validateAddOrganizationDetails = [
    body('organization_name')
        .notEmpty()
        .withMessage('Organization Name is required'),
    body('organization_email_id')
        .notEmpty()
        .withMessage('Organization Email ID is required'),
    body('organization_mobile_no')
        .notEmpty()
        .withMessage('Organization Mobile Number is required'),
    body('organization_whatsapp_no')
        .notEmpty()
        .withMessage('Organization Whatsapp Number is required')
];

router.validateAddOrganizationAddressDetails = [
    body('office_address')
        .notEmpty()
        .withMessage('Office Address is required'),
    body('office_city')
        .notEmpty()
        .withMessage('Office City is required'),
    body('office_latitude')
        .notEmpty()
        .withMessage('Office Latitude is required'),
    body('office_longitude')
        .notEmpty()
        .withMessage('Office Longitude is required'),
    body('currency')
        .notEmpty()
        .withMessage('Currency is required'),
    body('time_zone')
        .notEmpty()
        .withMessage('Time Zone is required')
];


router.validateAddHrWebSetting = [  
    uploadDoc,
    body('ceo_email_id')
        .notEmpty()
        .withMessage('CEO Email ID is Required'),
    body('ceo_name')
        .notEmpty()
        .withMessage('CEO Name is Required'),
    body('default_hr_name')
        .notEmpty()
        .withMessage('Default HR Name is Required'),
    body('default_hr_mobile_no')
        .notEmpty()
        .withMessage('Default HR Mobile No. is Required'),
    body('default_hr_designation')
        .notEmpty()
        .withMessage('Default HR Designation is Required'),
    body('default_hr_email_id')
        .notEmpty()
        .withMessage('Default HR Email ID is Required')
];



module.exports = router;