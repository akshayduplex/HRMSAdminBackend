const { body } = require('express-validator');

const express = require('express');
const router = express.Router();

const allowedStatuses = ['Active', 'Inactive'];

/*** Validate Job Template Add ********/
router.validateAddJobsTemplate = [
    body('title')
        .notEmpty()
        .withMessage('Please provide template title'),
    body('designation_id')
        .notEmpty()
        .withMessage('Please provide designation id'),
    body('designation_name')
        .notEmpty()
        .withMessage('Please provide designation name'),
    body('department_id')
        .notEmpty()
        .withMessage('Please provide department id'),
    body('department_name')
        .notEmpty()
        .withMessage('Please provide department name'),
    body('description')
        .notEmpty()
        .withMessage('Please provide description'),
    body('status')
        .notEmpty()
        .withMessage('Please provide status'),
    body('status')
        .isIn(allowedStatuses)
        .withMessage(`Status must be one of: ${allowedStatuses.join(', ')}`)
];

/*** Validate Job Template Edit ********/
router.validateEditJobsTemplate = [
    body('_id')
        .notEmpty()
        .withMessage('Document ID required'),
        body('title')
        .notEmpty()
        .withMessage('Please provide template title'),
    body('designation_id')
        .notEmpty()
        .withMessage('Please provide designation id'),
    body('designation_name')
        .notEmpty()
        .withMessage('Please provide designation name'),
    body('department_id')
        .notEmpty()
        .withMessage('Please provide department id'),
    body('department_name')
        .notEmpty()
        .withMessage('Please provide department name'),
    body('description')
        .notEmpty()
        .withMessage('Please provide description'),
    body('status')
        .notEmpty()
        .withMessage('Please provide status'),
    body('status')
        .isIn(allowedStatuses)
        .withMessage(`Status must be one of: ${allowedStatuses.join(', ')}`)
];

router.validateDeleteJobsTemplate = [
    body('_id')
        .notEmpty()
        .withMessage('Please provide document ID')
];

router.validateJobsTemplateById = [
    body('_id')
        .notEmpty()
        .withMessage('Please provide document ID') 
];

/*** Validate Job template Change Status ********/
router.validateChangeJobsTemplateStatus = [
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

/*** Validate Job template List ********/
router.validateJobsTemplateList = [
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


module.exports = router;