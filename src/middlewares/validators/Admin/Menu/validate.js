const { body } = require('express-validator');

const express = require('express');
const router = express.Router();

const allowedStatuses = ['Active', 'Inactive'];


/*** Validate  Add ********/
router.validateAddMenu = [
    body('name')
        .notEmpty()
        .withMessage('Please provide menu name'),
    body('slug')
        .notEmpty()
        .withMessage('Please provide menu slug'),
    body('priority')
        .notEmpty()
        .withMessage('Please provide menu priority'),
    body('status')
        .notEmpty()
        .withMessage('Please provide status'),
    body('status')
        .isIn(allowedStatuses)
        .withMessage(`Status must be one of: ${allowedStatuses.join(', ')}`)
];

/*** Validate Edit Item ********/
router.validateEditMenu = [
    body('_id')
        .notEmpty()
        .withMessage('Document ID required'),
    body('name')
        .notEmpty()
        .withMessage('Please provide menu name'),
    body('slug')
        .notEmpty()
        .withMessage('Please provide menu slug'),
    body('priority')
        .notEmpty()
        .withMessage('Please provide menu priority'),
    body('status')
        .notEmpty()
        .withMessage('Please provide status'),
    body('status')
        .isIn(allowedStatuses)
        .withMessage(`Status must be one of: ${allowedStatuses.join(', ')}`)
];

router.validateDeleteMenuById = [
    body('_id')
        .notEmpty()
        .withMessage('Please provide document ID')
];

router.validateMenuById = [
    body('_id')
        .notEmpty()
        .withMessage('Please provide document ID') 
];

/*** Validate Change Status ********/
router.validateChangeMenuStatus = [
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


/*** Validate List ********/
router.validateMenuList = [
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