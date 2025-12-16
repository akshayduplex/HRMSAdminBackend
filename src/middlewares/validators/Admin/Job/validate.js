const { body } = require('express-validator');

const express = require('express');
const router = express.Router();

//Upload middleware 
const { uploadFile, uploadMultiple, uploadPDFDocxFile } = require('../../../fileUploads');
var uploadDoc = uploadFile.single('filename'); 
var uploadDocxPdf = uploadPDFDocxFile.single('filename');

const allowedStatuses = ['Published','Unpublished','Removed','Archived'];


/*** Validate Job Add ********/
router.validateAddJob = [ 
    body('project_id')
        .notEmpty()
        .withMessage('Project Document ID required'),
    body('project_name')
        .notEmpty()
        .withMessage('Please provide Project name'),
    body('department')
        .notEmpty()
        .withMessage('Please provide department name'),
    body('department_id')
        .notEmpty()
        .withMessage('Please provide department ID'),
    body('designation')
        .notEmpty()
        .withMessage('Please provide designation name'),
    body('designation_id')
        .notEmpty()
        .withMessage('Please provide designation ID'),
    body('requisition_form_id')
        .notEmpty()
        .withMessage('Please provide requisition form ID'),
    body('job_title')
        .notEmpty()
        .withMessage('Please provide Job Title'),
    body('job_type')
        .notEmpty()
        .withMessage('Please provide Job Type'),
    body('experience')
        .notEmpty()
        .withMessage('Please provide Experience'),
    body('location')
        .notEmpty()
        .withMessage('Please provide Location'),
    body('salary_range')
        .notEmpty()
        .withMessage('Please provide Salary Range'),
    body('deadline')
        .notEmpty()
        .withMessage('Please provide project deadline'),
    body('tags')
        .notEmpty()
        .withMessage('Please provide tags'),
    body('description')
        .notEmpty()
        .withMessage('Please provide Description'),
    body('benefits')
        .notEmpty()
        .withMessage('Please provide Benefits'),
    body('educations')
        .notEmpty()
        .withMessage('Please provide educations'),
    /*body('company')
        .notEmpty()
        .withMessage('Please provide company name'),*/
    body('form_personal_data')
        .notEmpty()
        .withMessage('Please provide Form Personal Data'),
    body('form_profile')
        .notEmpty()
        .withMessage('Please provide Form Profile Data'),
    body('form_social_links')
        .notEmpty()
        .withMessage('Please provide Form Social Links'),
    body('status')
        .notEmpty()
        .withMessage('Please provide status'),
    body('status')
        .isIn(allowedStatuses)
        .withMessage(`Status must be one of: ${allowedStatuses.join(', ')}`)
];

/*** Validate Department Edit ********/
router.validateEditJob = [ 
    body('_id')
        .notEmpty()
        .withMessage('Document ID required'),
        body('project_id')
        .notEmpty()
        .withMessage('Project Document ID required'),
    body('project_name')
        .notEmpty()
        .withMessage('Please provide Project name'),
    body('department')
        .notEmpty()
        .withMessage('Please provide department name'),
    body('department_id')
        .notEmpty()
        .withMessage('Please provide department ID'),
    body('designation')
        .notEmpty()
        .withMessage('Please provide designation name'),
    body('designation_id')
        .notEmpty()
        .withMessage('Please provide designation ID'),
    body('requisition_form_id')
        .notEmpty()
        .withMessage('Please provide requisition form ID'),
    body('job_title')
        .notEmpty()
        .withMessage('Please provide Job Title'),
    body('job_type')
        .notEmpty()
        .withMessage('Please provide Job Type'),
    body('experience')
        .notEmpty()
        .withMessage('Please provide Experience'),
    body('location')
        .notEmpty()
        .withMessage('Please provide Location'),
    body('salary_range')
        .notEmpty()
        .withMessage('Please provide Salary Range'),
    body('deadline')
        .notEmpty()
        .withMessage('Please provide project deadline'),
    body('tags')
        .notEmpty()
        .withMessage('Please provide tags'),
    body('description')
        .notEmpty()
        .withMessage('Please provide Description'),
    body('benefits')
        .notEmpty()
        .withMessage('Please provide Benefits'),
    body('educations')
        .notEmpty()
        .withMessage('Please provide educations'),
    /*body('company')
        .notEmpty()
        .withMessage('Please provide company name'),*/
    body('form_personal_data')
        .notEmpty()
        .withMessage('Please provide Form Personal Data'),
    body('form_profile')
        .notEmpty()
        .withMessage('Please provide Form Profile Data'),
    body('form_social_links')
        .notEmpty()
        .withMessage('Please provide Form Social Links'),
    body('status')
        .notEmpty()
        .withMessage('Please provide status'),
    body('status')
        .isIn(allowedStatuses)
        .withMessage(`Status must be one of: ${allowedStatuses.join(', ')}`)
];

router.validateDeleteJob = [
    body('_id')
        .notEmpty()
        .withMessage('Please provide document ID')
];

router.validateJobById = [
    body('_id')
        .notEmpty()
        .withMessage('Please provide document ID') 
];

router.validateJobBySlug = [
    body('slug')
        .notEmpty()
        .withMessage('Please provide Slug Value') 
];

/*** Validate Department Change Status ********/
router.validateChangeJobStatus = [
    body('_id')
        .notEmpty()
        .withMessage('Document ID Required'),
    body('status')
        .notEmpty()
        .withMessage('Please provide status'),
    body('status')
        .isIn(allowedStatuses)
        .withMessage(`Status must be one of: ${allowedStatuses.join(', ')}`)
];

/*** Validate Department List ********/
router.validateJobList = [
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

/*** Validate Department List ********/
router.validateJobListPostedOnNaukri = [
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
 
/*** Validate Clone Job Data ********/
router.validateCloneJobData = [
    body('job_id')
        .notEmpty()
        .withMessage('Document ID Required')
];

module.exports = router;