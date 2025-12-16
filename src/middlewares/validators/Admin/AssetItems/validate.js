const { body } = require('express-validator');

const express = require('express');
const router = express.Router();

//Upload middleware 
const { uploadPDFDocxJpegFile  } = require('../../../fileUploads');
var uploadMultipleImage = uploadPDFDocxJpegFile.fields([
    { name: 'declaration_file', maxCount: 1 },
    { name: 'assets_images', maxCount: 10 } 
  ]);    

var uploadMultipleSingleImage = uploadPDFDocxJpegFile.fields([
    { name: 'assets_images', maxCount: 10 } 
  ]); 

const allowedStatuses = ['Active', 'Inactive'];
 

/*** Validate Assets Item Registration  ********/
router.validateAddAssetItem = [
    body('asset_name')
        .isLength({ min: 3 })
        .withMessage('Asset Name must be at least 3 characters long'),
    body('serial_no')
        .isLength({ min: 3 })
        .withMessage('Serial No. must be at 3 characters long'),
    body('asset_type')
        .isLength({ min: 1 })
        .withMessage('Please provide a valid asset type')
];
 

/*** Validate  Edit Asset item  ********/
router.validateEditAssetsItem = [ 
    body('_id')
        .isLength({ min: 3 })
        .withMessage('Item ID is Blank/Wrong' ),
    body('asset_name')
        .isLength({ min: 3 })
        .withMessage('Asset Name must be at least 3 characters long'),
    body('serial_no')
        .isLength({ min: 3 })
        .withMessage('Serial No. must be at 3 characters long'),
    body('asset_type')
        .isLength({ min: 1 })
        .withMessage('Please provide a valid asset type')
];

router.validateDeleteAssetItemById = [
    body('_id')
        .notEmpty()
        .withMessage('Please provide document ID')
];

router.validateAssetItemById = [
    body('_id')
        .notEmpty()
        .withMessage('Please provide document ID') 
];


/*** Validate Asset item Change Status ********/
router.validateChangeAssetItemStatus = [
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


/*** Validate Asset item List ********/
router.validateAssetItemList = [
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

/********* Validate Assign assets to employee *******/
router.validateAssignAssetToEmployee = [ 
    uploadMultipleImage, 
    body('asset_id')
        .notEmpty()
        .withMessage('Asset Document ID Required'),
    body('employee_doc_id')
        .notEmpty()
        .withMessage('Employee Document ID Required'),
    body('assign_date')
        .notEmpty()
        .withMessage('Assign Date Required'),
    body('assign_condition_status')
        .notEmpty()
        .withMessage('Assign Condition Status Required'),
];

/********* Validate return assets from employee *******/
router.validateReturnAssetToEmployee = [ 
    uploadMultipleSingleImage, 
    body('asset_id')
        .notEmpty()
        .withMessage('Asset Document ID Required'), 
    body('return_date')
        .notEmpty()
        .withMessage('Return Date Required'),
    body('return_condition')
        .notEmpty()
        .withMessage('Return Condition Data Required'),
    body('return_condition_status')
        .notEmpty()
        .withMessage('Return Condition Status Required'),
];


/*** Validate Employee Asset item List ********/
router.validateGetEmployeeAssets = [
    body('employee_doc_id')
        .notEmpty()
        .withMessage('Employee Document ID Required'),
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