const express = require('express');
const router = express.Router();
const { body } = require('express-validator');

//Upload middleware 
const { uploadFile, uploadMultiple } = require('../../../fileUploads');
var uploadDoc = uploadFile.single('filename'); 
var uploadMultiDoc = uploadMultiple.array('files_name', 10 );


const allowedStatuses = ['Active', 'Closed'];


router.validateAddProject = [ 
    uploadDoc,
    body('title')
        .notEmpty()
        .withMessage('Please enter project title'),
    body('location')
        .notEmpty()
        .withMessage('Please enter project location'),
    /*body('manager_data')
        .notEmpty()
        .withMessage("Please choose the manager(s) name"),
    body('in_charge_data')
        .notEmpty()
        .withMessage("Please choose the In-charge(s)' name"),*/
    body('duration')
        .notEmpty()
        .withMessage('Please enter duration'),
    body('start_date')
        .notEmpty()
        .withMessage('Please choose start date'),
    body('end_date')
        .notEmpty()
        .withMessage('Please choose end date'),
    body('status')
        .notEmpty()
        .withMessage('Please enter status'),
    body('status')
        .isIn(allowedStatuses)
        .withMessage(`Status must be one of: ${allowedStatuses.join(', ')}`)
];

/*** Validate Project Edit ********/
router.validateEditProject = [
    uploadDoc,
    body('_id')
        .notEmpty()
        .withMessage('Document ID required'),
    body('title')
        .notEmpty()
        .withMessage('Please enter project title'),
    body('status')
        .notEmpty()
        .withMessage('Please enter status'),
    body('status')
        .isIn(allowedStatuses)
        .withMessage(`Status must be one of: ${allowedStatuses.join(', ')}`)
];

router.validateDeleteProject = [
    body('_id')
        .notEmpty()
        .withMessage('Please enter document ID')
];

router.validateProjectById = [
    body('_id')
        .notEmpty()
        .withMessage('Please enter document ID') 
];

/*** Validate Project Change Status ********/
router.validateChangeProjectStatus = [
    body('_id')
        .notEmpty()
        .withMessage('Document ID Required'),
    body('status')
        .notEmpty()
        .withMessage('Please enter status'),
    body('status')
        .isIn(allowedStatuses)
        .withMessage(`Status must be one of: ${allowedStatuses.join(', ')}`)
];


/*** Validate Project List ********/
router.validateProjectList = [
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

/*** Validate Project Add Extension Date ********/
router.validateProjectExtensionDate = [
    body('_id')
        .notEmpty()
        .withMessage('Document ID is required'),
    body('from_date')
        .notEmpty()
        .withMessage('From Date is required'),
    body('to_date')
        .notEmpty()
        .withMessage('To Date is required'),
];

/*** Validate Project Budget New Entry ********/
router.validateProjectBudgetExtension = [
    body('_id')
        .notEmpty()
        .withMessage('Document ID is required'),
    body('budget_list')
        .notEmpty()
        .withMessage('Budget List is required'),
    body('total_budget')
        .notEmpty()
        .withMessage('Total Budget is required'),
];

/*** Validate Close Project  ********/
router.validateCloseProject = [
    body('_id')
        .notEmpty()
        .withMessage('Document ID is required'),
    body('total_payout')
        .notEmpty()
        .withMessage('Total Payout is required'),
    body('closed_on')
        .notEmpty()
        .withMessage('Project Close Date is required')
];

/*** Validate Edit Project Budget ********/
router.validateEditProjectBudget = [
    body('_id')
        .notEmpty()
        .withMessage('Document ID is required'),
    body('sanctioned')
        .notEmpty()
        .withMessage('Sanctioned Budget Amount is required'),
    body('utilized')
        .notEmpty()
        .withMessage('Utilized Budget Amount is required'),
    body('available')
        .notEmpty()
        .withMessage('Available Budget Amount is required')
];

/*** Validate Project Employment List ********/
router.validateProjectEmploymentList = [
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


/*** Validate Project List ********/
router.validateGetDmsProjectList = [
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