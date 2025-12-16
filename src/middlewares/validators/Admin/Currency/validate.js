const { body } = require('express-validator');

const express = require('express');
const router = express.Router();

const allowedStatuses = ['Active', 'Inactive'];


/*** Validate Currency Add ********/
router.validateAddCurrency = [
    body('country')
        .notEmpty()
        .withMessage('Please provide country name'),
    body('currency')
        .notEmpty()
        .withMessage('Please provide currency name'),
    body('code')
        .notEmpty()
        .withMessage('Please provide currency code'),
    body('status')
        .notEmpty()
        .withMessage('Please provide status'),
    body('status')
        .isIn(allowedStatuses)
        .withMessage(`Status must be one of: ${allowedStatuses.join(', ')}`)
];

/*** Validate Currency Edit ********/
router.validateEditCurrency = [
    body('_id')
        .notEmpty()
        .withMessage('Document ID required'),
        body('country')
        .notEmpty()
        .withMessage('Please provide country name'),
    body('currency')
        .notEmpty()
        .withMessage('Please provide currency name'),
    body('code')
        .notEmpty()
        .withMessage('Please provide currency code'),
    body('status')
        .notEmpty()
        .withMessage('Please provide status'),
    body('status')
        .isIn(allowedStatuses)
        .withMessage(`Status must be one of: ${allowedStatuses.join(', ')}`)
];

router.validateDeleteCurrency = [
    body('_id')
        .notEmpty()
        .withMessage('Please provide document ID')
];

router.validateCurrencyById = [
    body('_id')
        .notEmpty()
        .withMessage('Please provide document ID') 
];

/*** Validate Currency Change Status ********/
router.validateChangeCurrencyStatus = [
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


/*** Validate Currency List ********/
router.validateCurrencyList = [
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