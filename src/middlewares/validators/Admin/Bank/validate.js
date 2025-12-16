const { body } = require('express-validator');

const express = require('express');
const router = express.Router();

const allowedStatuses = ['Active', 'Inactive'];


/*** Validate Bank Add ********/
router.validateAddBank = [
    body('name')
        .notEmpty()
        .withMessage('Please provide bank name'),
    body('status')
        .notEmpty()
        .withMessage('Please provide status'),
    body('status')
        .isIn(allowedStatuses)
        .withMessage(`Status must be one of: ${allowedStatuses.join(', ')}`)
];

/*** Validate Bank Edit ********/
router.validateEditBank = [
    body('_id')
        .notEmpty()
        .withMessage('Document ID required'),
    body('name')
        .notEmpty()
        .withMessage('Please provide bank name'),
    body('status')
        .notEmpty()
        .withMessage('Please provide status'),
    body('status')
        .isIn(allowedStatuses)
        .withMessage(`Status must be one of: ${allowedStatuses.join(', ')}`)
];

router.validateDeleteBank = [
    body('_id')
        .notEmpty()
        .withMessage('Please provide document ID')
];

router.validateBankById = [
    body('_id')
        .notEmpty()
        .withMessage('Please provide document ID') 
];

/*** Validate Bank Change Status ********/
router.validateChangeBankStatus = [
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


/*** Validate Bank List ********/
router.validateBankList = [
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