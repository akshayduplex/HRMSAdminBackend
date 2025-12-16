const { body } = require('express-validator');

const express = require('express');
const router = express.Router();

const allowedStatuses = ['Active', 'Inactive'];

/*** Validate Role User Registration  ********/
router.validateUserRegistration = [
    body('name')
        .isLength({ min: 3 })
        .withMessage('Name must be at least 3 characters long'),
    body('mobile_no')
        .isLength({ min: 10 })
        .withMessage('Mobile No must be at 10 numbers long'),
    body('email')
        .isEmail()
        .withMessage('Please provide a valid email address'),
    body('designation')
        .notEmpty()
        .withMessage('Please provide designation name'),
    body('designation_id')
        .notEmpty()
        .withMessage('Please provide designation ID')
];

/*** Validate Role User Login with Password  ********/
router.validateUserLoginWithPassword = [ 
    body('username')
        .isEmail()
        .withMessage('Please provide a valid email address'),
    // body('password')
    //     .isLength({ min: 8 })
    //     .withMessage('Password must be at least 8 characters long')
];

/*** Validate Role User Login with Email/OTP  ********/
router.validateUserLoginWithEmail = [ 
    body('email_id')
        .isEmail()
        .withMessage('Please provide a valid email address')
];

/*** Validate Role User Edit Profile  ********/
router.validateUserEdit = [ 
    body('_id')
        .isLength({ min: 3 })
        .withMessage('User ID is Blank/Wrong' ),
    body('name')
        .isLength({ min: 3 })
        .withMessage('Name must be at least 3 characters long'),
    body('mobile_no')
        .isLength({ min: 10 })
        .withMessage('Mobile No must be at 10 numbers long'),
    body('email')
        .isEmail()
        .withMessage('Please provide a valid email address'),
    body('designation')
        .notEmpty()
        .withMessage('Please provide designation name'),
    body('designation_id')
        .notEmpty()
        .withMessage('Please provide designation ID')
];

/*** Validate Role User Edit Password  ********/
router.validateUserPassword = [ 
    body('_id')
        .isLength({ min: 3 })
        .withMessage('User ID is Blank/Wrong' ),
    body('password')
        .isLength({ min: 3 })
        .withMessage('Password is Blank')
];

/*** Verify Role User Login OTP  ********/
router.validateLoginOTP = [ 
    body('email_id')
        .isEmail()
        .withMessage('Please provide a valid email address'),
    body('otp')
        .isLength({ min: 4 })
        .withMessage('Please Enter 4 Digit OTP'),
    body('login_device')
        .isLength({ min: 1 })
        .withMessage('Please Enter Login Device Name')
];


/*********** Validate Assign menu to role  User ********/
router.validateMenuAssign = [ 
    body('_id')
        .notEmpty()
        .withMessage('Please provide document ID'),
    body('permissions')
        .notEmpty()
        .withMessage('Please provide permissions list')

];

/*** Validate Role User List ********/
router.validateRoleUserList = [
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

/*********** Validate get single record from db ********/
router.validateGetRoleUserByID = [ 
    body('_id')
        .notEmpty()
        .withMessage('Please provide document ID')
];


/*** Validate Role User Change Status ********/
router.validateRoleUserProfileStatus = [
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


/*** Validate Role User Login with Email/OTP  ********/
router.validateAssignSpecialPermission = [ 
    body('role_doc_id')
        .notEmpty()
        .withMessage('Please provide role user doc id')
];



module.exports = router;