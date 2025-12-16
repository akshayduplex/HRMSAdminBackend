const { body } = require('express-validator');

const express = require('express');
const router = express.Router();

//Upload middleware 
const { uploadExcelFile } = require('../../../fileUploads');
var uploadExcelF = uploadExcelFile.single('filename');  

const allowedStatuses = ['Active','Inactive'];
const allowedContentTypes = ['MCQ','Comprehensive'];


/*** Validate Assessment Add ********/
router.validateAddAssessment = [
    uploadExcelF,
    body('content_type')
        .notEmpty()
        .withMessage('Content Type Not Matched'),
    body('content_type')
        .isIn(allowedContentTypes)
        .withMessage(`Content Type must be one of: ${allowedContentTypes.join(', ')}`),
    body('status')
        .notEmpty()
        .withMessage('Please provide status'),
    body('status')
        .isIn(allowedStatuses)
        .withMessage(`Status must be one of: ${allowedStatuses.join(', ')}`),
    body('no_of_display_questions')
        .notEmpty()
        .withMessage('No of display questions required'),
    body('duration')
        .notEmpty()
        .withMessage('Please provide duration'), 
    body('marking_per_question')
        .notEmpty()
        .withMessage('Marking Per Question is required'),
    body('min_passing')
        .notEmpty()
        .withMessage('Minimum Passing Percent is Required'), 
    body('no_of_attempts')
        .notEmpty()
        .withMessage('No of Attempts Question is Required')
];

router.validateEditAssessment = [
    uploadExcelF,
    body('_id')
        .notEmpty()
        .withMessage('Document ID required'),
    body('content_type')
        .notEmpty()
        .withMessage('Content Type Not Matched'),
    body('content_type')
        .isIn(allowedContentTypes)
        .withMessage(`Content Type must be one of: ${allowedContentTypes.join(', ')}`),
    body('status')
        .notEmpty()
        .withMessage('Please provide status'),
    body('status')
        .isIn(allowedStatuses)
        .withMessage(`Status must be one of: ${allowedStatuses.join(', ')}`),
    body('no_of_display_questions')
        .notEmpty()
        .withMessage('No of display questions required'),
    body('duration')
        .notEmpty()
        .withMessage('Please provide duration'), 
    body('marking_per_question')
        .notEmpty()
        .withMessage('Marking Per Question is required'),
    body('min_passing')
        .notEmpty()
        .withMessage('Minimum Passing Percent is Required'), 
    body('no_of_attempts')
        .notEmpty()
        .withMessage('No of Attempts Question is Required')
]; 

 
router.validateSingleAssessmentList = [
    body('candidate_id')
        .notEmpty()
        .withMessage('Please provide candidate document ID'),
    body('content_type')
        .notEmpty()
        .withMessage('Please provide content type' ) 
];

router.validateCheckAssessment = [
    body('candidate_id')
        .notEmpty()
        .withMessage('Please provide candidate document ID'),
    body('assessment_id')
        .notEmpty()
        .withMessage('Please provide content type' ),
    body('answer_list')
        .notEmpty()
        .withMessage('Please provide content type' ) 
];



router.validateDeleteAssessmentById = [
    body('_id')
        .notEmpty()
        .withMessage('Please provide document ID')
];
/*** Validate Apply Assessment Change Status ********/
router.validateChangeAssessmentStatus = [
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

/*** Validate Assessment Job List ********/
router.validateAssessmentList = [
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