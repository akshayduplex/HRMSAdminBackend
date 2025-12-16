const { body } = require('express-validator');

const express = require('express');
const router = express.Router();

//Upload middleware 
const { uploadExcelFile } = require('../../../fileUploads');
var uploadExcelF = uploadExcelFile.single('filename');  

const allowedStatuses = ['Present', 'Absent', 'Leave'];

/*** Validate Apply Leave ********/
router.validateApplyLeave = [
    body('employee_doc_id')
        .notEmpty()
        .withMessage('Please provide employee document ID'),
    body('leave_dates')
        .notEmpty()
        .withMessage('Please provide leave dates'), 
    body('time_off_type')
        .notEmpty()
        .withMessage('Please provide time off type'),
    body('time_off_type')
        .isIn(['FullDay', 'HalfDay'])
        .withMessage(`Status must be one of: ${['FullDay', 'HalfDay'].join(', ')}`)
];

router.validateImportEmployeeAttendance = [
    uploadExcelF,
    body('project_id')
        .notEmpty()
        .withMessage('Please provide project Document ID'),
    body('month_name')
        .notEmpty()
        .withMessage('Please provide month name')
];

router.validateSaveAttendanceInBulk = [ 
    body('project_id')
        .notEmpty()
        .withMessage('Please provide project Document ID'),
    body('month')
        .notEmpty()
        .withMessage('Please provide month number'),
    body('year')
        .notEmpty()
        .withMessage('Please provide year number'),
    body('data')
        .notEmpty()
        .withMessage('Please provide attendance data')
];

router.validateGetAttendanceByEmployeeID = [ 
    body('employee_doc_id')
        .notEmpty()
        .withMessage('Please provide project Document ID'),
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