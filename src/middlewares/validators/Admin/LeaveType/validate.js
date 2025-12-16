const { body } = require('express-validator');

const express = require('express');
const router = express.Router();

const allowedStatuses = ['Active', 'Inactive'];


/*** Validate Leave Type Add ********/
router.validateAddLeaveType = [
    body('name')
        .notEmpty()
        .withMessage('Please provide designation name'),
    body('sort_name')
        .notEmpty()
        .withMessage('Please provide sort name'),
    body('leave_type')
        .notEmpty()
        .withMessage('Please provide leave type'),
    body('leave_type')
        .isIn(['Paid','Unpaid'])
        .withMessage(`Status must be one of: ${['Paid','Unpaid'].join(', ')}`),
    body('allowed_for_five_days')
        .notEmpty()
        .withMessage('Please provide 5 days working allowed Leaves'),
    body('allowed_for_six_days')
        .notEmpty()
        .withMessage('Please provide 6 days working allowed Leaves'),
    body('status')
        .notEmpty()
        .withMessage('Please provide status'),
    body('status')
        .isIn(allowedStatuses)
        .withMessage(`Status must be one of: ${allowedStatuses.join(', ')}`)
];

/*** Validate Leave Type Edit ********/
router.validateEditLeaveType = [
    body('_id')
        .notEmpty()
        .withMessage('Document ID required'),
    body('name')
        .notEmpty()
        .withMessage('Please provide designation name'),
    body('sort_name')
        .notEmpty()
        .withMessage('Please provide sort name'),
    body('leave_type')
        .notEmpty()
        .withMessage('Please provide leave type'),
    body('leave_type')
        .isIn(['Paid','Unpaid'])
        .withMessage(`Status must be one of: ${['Paid','Unpaid'].join(', ')}`),
    body('allowed_for_five_days')
        .notEmpty()
        .withMessage('Please provide 5 days working allowed Leaves'),
    body('allowed_for_six_days')
        .notEmpty()
        .withMessage('Please provide 6 days working allowed Leaves'),
    body('status')
        .notEmpty()
        .withMessage('Please provide status'),
    body('status')
        .isIn(allowedStatuses)
        .withMessage(`Status must be one of: ${allowedStatuses.join(', ')}`)
];

router.validateDeleteLeaveType = [
    body('_id')
        .notEmpty()
        .withMessage('Please provide document ID')
];

router.validateLeaveTypeById = [
    body('_id')
        .notEmpty()
        .withMessage('Please provide document ID') 
];

/*** Validate item Change Status ********/
router.validateChangeLeaveTypeStatus = [
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


/*** Validate leave Type List ********/
router.validateLeaveTypeList = [
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