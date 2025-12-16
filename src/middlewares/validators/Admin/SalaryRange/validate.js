const { body } = require('express-validator');

const express = require('express');
const router = express.Router();

const allowedStatuses = ['Active', 'Inactive'];

/*** Validate Salary Range Add ********/
router.validateAddSalaryRange = [
    body('label')
        .notEmpty()
        .withMessage('Please provide label name'),
    body('from')
        .notEmpty()
        .withMessage('Please provide from value'),
    body('to')
        .notEmpty()
        .withMessage('Please provide to value'),
    body('status')
        .notEmpty()
        .withMessage('Please provide status'),
    body('status')
        .isIn(allowedStatuses)
        .withMessage(`Status must be one of: ${allowedStatuses.join(', ')}`)
];

/*** Validate Salary Range Edit ********/
router.validateEditSalaryRange = [
    body('_id')
        .notEmpty()
        .withMessage('Document ID required'),
    body('label')
        .notEmpty()
        .withMessage('Please provide label name'),
    body('from')
        .notEmpty()
        .withMessage('Please provide from value'),
    body('to')
        .notEmpty()
        .withMessage('Please provide to value'),
    body('status')
        .notEmpty()
        .withMessage('Please provide status'),
    body('status')
        .isIn(allowedStatuses)
        .withMessage(`Status must be one of: ${allowedStatuses.join(', ')}`)
];

router.validateDeleteSalaryRange = [
    body('_id')
        .notEmpty()
        .withMessage('Please provide document ID')
];

router.validateSalaryRangeById = [
    body('_id')
        .notEmpty()
        .withMessage('Please provide document ID') 
];

/*** Validate Salary Range Change Status ********/
router.validateChangeSalaryRangeStatus = [
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


/*** Validate Salary Range List ********/
router.validateSalaryRangeList = [
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