const { body } = require('express-validator');

const express = require('express');
const router = express.Router();

//Upload middleware 
const { uploadPDFDocxJpegFile, uploadPDFDocxJpegFileName } = require('../../../fileUploads');
var uploadMultipleImage = uploadPDFDocxJpegFile.any();
var uploadMultipleImageFileName = uploadPDFDocxJpegFileName.any();

const allowedStatuses = ['Active', 'Inactive'];
const allowedTemplateFor = ['Offer Letter', 'Joining Kit', 'Appointment Letter', 'Joining Intimation'];


/********* Validate Add Settings Template *******/
router.validateAddTemplateSettings = [
    uploadMultipleImageFileName,
    body('job_type')
        .notEmpty()
        .withMessage('Job Type is Required'),
    body('template')
        .notEmpty()
        .withMessage('Template is Required'),
    body('template_for')
        .notEmpty()
        .withMessage('Template for is Required'),
    body('status')
        .notEmpty()
        .withMessage('Please provide status'),
    body('status')
        .isIn(allowedStatuses)
        .withMessage(`Status must be one of: ${allowedStatuses.join(', ')}`),
    body('template_for')
        .notEmpty()
        .withMessage('Please provide template for'),
    body('template_for')
        .isIn(allowedTemplateFor)
        .withMessage(`Template for must be one of: ${allowedTemplateFor.join(', ')}`),
    /*body('esic_status')
        .notEmpty()
        .withMessage('Please Provide ESIC Status'),
    body('esic_status')
        .isIn(['Yes','No'])
        .withMessage(`ESIC Status must be one of: ${['Yes','No'].join(', ')}`)*/
];



/*** Validate item List ********/
router.validateGetTemplateSettingsList = [
    body('page_no')
        .notEmpty()
        .withMessage('Page number is required')
        .isInt({ min: 1 })
        .withMessage('Page number must be a positive integer'),
    body('per_page_record')
        .notEmpty()
        .withMessage('Per page record is required')
        .isInt({ min: 1 })
        .withMessage('Per page record must be a positive integer')
];

/*** Validate item By ID ********/
router.validateGetTemplateSettingsById = [
    body('doc_id')
        .notEmpty()
        .withMessage('Document ID is required')
];

/*** Validate remove item By ID ********/
router.validateRemoveTemplateSettingsById = [
    body('doc_id')
        .notEmpty()
        .withMessage('Document ID is required')
];

/*** Validate remove item By ID ********/
router.validateRemoveAttachmentDocFromTSById = [
    body('doc_id')
        .notEmpty()
        .withMessage('Document ID is required'),
    body('attachment_id')
        .notEmpty()
        .withMessage('Attachment ID is required'),
];

/*** Validate remove item By name and job type ********/
router.validateGetTemplateSettingsByDocName = [
    body('job_type')
        .notEmpty()
        .withMessage('Job type is required'),
    body('template_for')
        .notEmpty()
        .withMessage('Please provide template for'),
    body('template_for')
        .isIn(allowedTemplateFor)
        .withMessage(`Template name must be one of: ${allowedTemplateFor.join(', ')}`),
];

/*** Validate get template by approval note id  ********/
router.validateGetTemplateSettingsByApprovalNote = [
    body('approval_note_doc_id')
        .notEmpty()
        .withMessage('Approval Note Doc ID is required'),
    body('candidate_id')
        .notEmpty()
        .withMessage('Candidate Doc ID is required'),
    body('template_for')
        .notEmpty()
        .withMessage('Please provide template for'),
    body('template_for')
        .isIn(allowedTemplateFor)
        .withMessage(`Template name must be one of: ${allowedTemplateFor.join(', ')}`),
];

module.exports = router;