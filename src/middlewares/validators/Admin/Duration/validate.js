const { body } = require('express-validator');

const express = require('express');
const router = express.Router();

const allowedStatuses = ['Active', 'Inactive'];


/*** Validate Duration Add ********/
router.validateAddDuration = [
    body('duration')
        .notEmpty()
        .withMessage('Please provide Duration name'),
    body('status')
        .notEmpty()
        .withMessage('Please provide status'),
    body('status')
        .isIn(allowedStatuses)
        .withMessage(`Status must be one of: ${allowedStatuses.join(', ')}`)
];

/*** Validate Duration Edit ********/
router.validateEditDuration = [
    body('_id')
        .notEmpty()
        .withMessage('Document ID required'),
    body('duration')
        .notEmpty()
        .withMessage('Please provide Duration name'),
    body('status')
        .notEmpty()
        .withMessage('Please provide status'),
    body('status')
        .isIn(allowedStatuses)
        .withMessage(`Status must be one of: ${allowedStatuses.join(', ')}`)
];

router.validateDeleteDuration = [
    body('_id')
        .notEmpty()
        .withMessage('Please provide document ID')
];

router.validateDurationById = [
    body('_id')
        .notEmpty()
        .withMessage('Please provide document ID') 
];

/*** Validate Duration Change Status ********/
router.validateChangeDurationStatus = [
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


/*** Validate Duration List ********/
router.validateDurationList = [
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