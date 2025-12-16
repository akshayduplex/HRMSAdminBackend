const { body } = require('express-validator');

const express = require('express');
const router = express.Router();

const allowedStatuses = ['Active', 'Inactive'];


/*** Validate Designation Add ********/
router.validateAddDesignation = [
    body('name')
        .notEmpty()
        .withMessage('Please provide designation name'),
    body('status')
        .notEmpty()
        .withMessage('Please provide status'),
    body('status')
        .isIn(allowedStatuses)
        .withMessage(`Status must be one of: ${allowedStatuses.join(', ')}`)
];

/*** Validate Designation Edit ********/
router.validateEditDesignation = [
    body('_id')
        .notEmpty()
        .withMessage('Document ID required'),
    body('name')
        .notEmpty()
        .withMessage('Please provide designation name'),
    body('status')
        .notEmpty()
        .withMessage('Please provide status'),
    body('status')
        .isIn(allowedStatuses)
        .withMessage(`Status must be one of: ${allowedStatuses.join(', ')}`)
];

router.validateDeleteDesignation = [
    body('_id')
        .notEmpty()
        .withMessage('Please provide document ID')
];

router.validateDesignationById = [
    body('_id')
        .notEmpty()
        .withMessage('Please provide document ID') 
];

/*** Validate Designation Change Status ********/
router.validateChangeDesignationStatus = [
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


/*** Validate Designation List ********/
router.validateDesignationList = [
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


router.validateProjectWiseDesignationList = [
    body('project_id')
        .notEmpty()
        .withMessage('Please provide project document ID')
];

/*** Validate Project wise Designation Priority ********/
router.validateProjectWiseDesignationPriority = [
    body('_id')
        .notEmpty()
        .withMessage('Document ID Required'),
    body('project_id')
        .notEmpty()
        .withMessage('Please provide project id'),
    body('priority')
        .notEmpty()
        .withMessage('Please provide priority value'),
];



module.exports = router;