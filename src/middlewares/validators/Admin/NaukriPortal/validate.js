const { body } = require('express-validator');

const express = require('express');
const router = express.Router();

const allowedStatuses = ['Active', 'Inactive'];


router.validateNaukriPublishJob = [
    body('job_doc_id')
        .notEmpty().withMessage('job_doc_id is required')
        .isMongoId().withMessage('job_doc_id must be a valid Mongo ID'),

    body('work_type')
        .notEmpty().withMessage('work type is required')
        .isIn(['In office', 'Remote', 'Hybrid']).withMessage('work type must be valid'),
        
    body('action')
        .notEmpty().withMessage('action type is required')
        .isIn(['add', 'update']).withMessage('action type must be valid'),

    body('education_data').isArray({ min: 1 }).withMessage('education_data must be a non-empty array'),

    body('education_data.*.courseType')
        .notEmpty().withMessage('courseType is required'),

    body('education_data.*.qualification')
        .notEmpty().withMessage('qualification is required'),

    /*body('education_data.*.specialization')
        .notEmpty().withMessage('specialization is required')*/
];

router.validateFetchApplications = [
    body('job_doc_id')
        .notEmpty()
        .withMessage('Please provide job document ID'),
    body('page_no')
        .notEmpty()
        .withMessage('Please provide page no')
];

router.validateNaukriUnPublishJob = [
    body('job_doc_id')
        .notEmpty()
        .withMessage('Please provide job document ID')
];

router.validateNaukriPublishJobList = [
    body('page_no')
        .notEmpty()
        .withMessage('Please provide page no')
];

router.validateNaukriQualificationList = [
    body('course_type')
        .notEmpty()
        .withMessage('Please provide course type')
];

router.validateNaukriSpecialization = [
    body('course_type')
        .notEmpty()
        .withMessage('Please provide course type'),
    body('qualification')
        .notEmpty()
        .withMessage('Please provide qualification'),
];


router.validateNaukriById = [
    body('job_doc_id')
        .notEmpty()
        .withMessage('Please provide job document ID')
];


module.exports = router;