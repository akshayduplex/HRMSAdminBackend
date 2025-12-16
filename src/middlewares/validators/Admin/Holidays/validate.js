const { body } = require('express-validator');

const express = require('express');
const router = express.Router();

const allowedStatuses = ['Active', 'Inactive'];


/*** Validate Holiday Calender Add ********/
router.validateAddHolidays = [
    body('name')
        .notEmpty()
        .withMessage('Holiday Name Required'),
    body('schedule_date')
        .notEmpty()
        .withMessage('Holiday Schedule Name is Required'),
    body('state_list')
        .notEmpty()
        .withMessage('State Name Required'),
    body('status')
        .notEmpty()
        .withMessage('Please provide status'),
    body('status')
        .isIn(allowedStatuses)
        .withMessage(`Status must be one of: ${allowedStatuses.join(', ')}`)
];

/*** Validate Holiday Calender Edit ********/
router.validateEditHolidays = [
    body('_id')
        .notEmpty()
        .withMessage('Document ID Required'),
    body('name')
        .notEmpty()
        .withMessage('Holiday Name Required'),
    body('schedule_date')
        .notEmpty()
        .withMessage('Holiday Schedule Name is Required'),
    body('state_list')
        .notEmpty()
        .withMessage('State Name Required'), 
    body('status')
        .notEmpty()
        .withMessage('Please provide status'),
    body('status')
        .isIn(allowedStatuses)
        .withMessage(`Status must be one of: ${allowedStatuses.join(', ')}`)
];

router.validateDeleteHolidays = [
    body('_id')
        .notEmpty()
        .withMessage('Please provide document ID')
];


/*** Validate Holidays Edit ********/
router.validateChangeHolidaysStatus = [
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

router.validateHolidaysById = [
    body('_id')
        .notEmpty()
        .withMessage('Please enter document ID') 
];

/*** Validate Holidays List ********/
router.validateHolidaysList = [
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