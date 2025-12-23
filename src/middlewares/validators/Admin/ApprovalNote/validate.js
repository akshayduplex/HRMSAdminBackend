const { body } = require('express-validator');

const express = require('express');
const router = express.Router();

/*********** get Appraisal note List Data Validation *****************/
router.validateGetApprovalNoteById = [
    body('approval_note_doc_id')
        .notEmpty()
        .withMessage('Please provide approval note doc ID')
];

router.validateGetApprovalNoteDataById = [
    body('approval_note_doc_id')
        .notEmpty()
        .notEmpty()
        .withMessage('Please provide approval note doc ID'),
];

router.validateGetApprovalNoteFromList = [
    /*body('job_id')
        .notEmpty()
        .withMessage('Please provide Job ID'),*/
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

router.validateGetApprovalNoteFromListCeo = [

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

router.validateGetPendingCandidateApprovalNotesListForCeo = [

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

router.validateDownloadApprovalNote = [
    body('approval_note_doc_id')
        .notEmpty()
        .withMessage('Please provide approval note doc ID')
];

router.validateDeleteApprovalNoteById = [
    body('approval_note_doc_id')
        .notEmpty()
        .withMessage('Please provide approval note doc ID'),
    body('approval_note_id')
        .notEmpty()
        .withMessage('Please provide approval note ID')
];

router.validateRemoveCandidateFromApprovalNoteById = [
    body('approval_note_doc_id')
        .notEmpty()
        .withMessage('Please provide approval note doc ID'),
    body('approval_note_id')
        .notEmpty()
        .withMessage('Please provide approval note ID'),
    body('candidate_doc_id')
        .notEmpty()
        .withMessage('Please provide Candidate ID')
];


router.validateUpdateReferenceCheckInApprovalNote = [
    body('candidate_id')
        .notEmpty()
        .withMessage('Please provide Candidate ID'),
    body('approval_note_doc_id')
        .notEmpty()
        .withMessage('Please provide Approval Note ID'),
    body('name')
        .notEmpty()
        .withMessage('Please provide reference Name'),
    body('designation')
        .notEmpty()
        .withMessage('Please provide reference designation'),
    body('mobile')
        .notEmpty()
        .withMessage('Please provide reference mobile no'),
    body('email')
        .notEmpty()
        .withMessage('Please provide reference email ID'),
    body('referenceStatus')
        .notEmpty()
        .withMessage('Please provide reference status'),
    body('referenceStatus')
        .isIn(['previous', 'current', 'hrhead'])
        .withMessage(`Reference status for must be one of: ${['previous', 'current', 'hrhead'].join(', ')}`),
];



router.validateUpdateReferenceCheckDataByLink = [
    body('candidate_doc_id')
        .notEmpty()
        .withMessage('Please provide Candidate ID'),
    body('approval_note_doc_id')
        .notEmpty()
        .withMessage('Please provide Approval Note ID'),
    body('applied_job_doc_id')
        .notEmpty()
        .withMessage('Please provide Applied Job Doc ID'),
    body('email')
        .notEmpty()
        .withMessage('Please provide reference email ID'),
    body('referenceStatus')
        .notEmpty()
        .withMessage('Please provide reference status'),
    body('referenceStatus')
        .isIn(['previous', 'current', 'hrhead'])
        .withMessage(`Reference status for must be one of: ${['previous', 'current', 'hrhead'].join(', ')}`),
    body('referenceStatus')
        .notEmpty()
        .withMessage('Please provide reference status')
];

router.validateUpdateReferenceCheckFromAdmin = [
    body('candidate_doc_id')
        .notEmpty()
        .withMessage('Please provide Candidate ID'),
    body('approval_note_doc_id')
        .notEmpty()
        .withMessage('Please provide Approval Note ID'),
    body('applied_job_doc_id')
        .notEmpty()
        .withMessage('Please provide Applied Job Doc ID'),
    body('contact_person_name')
        .notEmpty()
        .withMessage('Please provide contact person name'),
    body('contact_person_mobile')
        .notEmpty()
        .withMessage('Please provide contact person mobile'),
    body('referenceStatus')
        .notEmpty()
        .withMessage('Please provide reference status'),
    body('referenceStatus')
        .isIn(['previous', 'current', 'hrhead'])
        .withMessage(`Reference status for must be one of: ${['previous', 'current', 'hrhead'].join(', ')}`),
    body('referenceStatus')
        .notEmpty()
        .withMessage('Please provide reference status')
];


router.validateSkipReferenceCheckData = [
    body('referenceStatus')
        .notEmpty()
        .withMessage('Please provide reference Status'),
    body('candidate_doc_id')
        .notEmpty()
        .withMessage('Please provide Candidate ID'),
    body('approval_note_doc_id')
        .notEmpty()
        .withMessage('Please provide Approval Note ID'),
    body('name')
        .notEmpty()
        .withMessage('Please provide Applied Job Doc ID'),
    body('email')
        .notEmpty()
        .withMessage('Please provide reference email ID'),
    body('designation')
        .notEmpty()
        .withMessage('Please provide designation')
];


/*********** Validate candidate appointment letter approval *********/
router.validateApproveRejectAppointmentLetter = [
    body('approval_note_doc_id')
        .notEmpty()
        .withMessage('Approval Note Document ID required'),
    body('candidate_id')
        .notEmpty()
        .withMessage('Candidate Document ID required'),
    body('employee_id')
        .notEmpty()
        .withMessage('Employee Document ID required'),
    body('status')
        .notEmpty()
        .withMessage('Status id required')
]


router.validateGetApprovalNoteFromListHod = [
    body('employee_id')
        .notEmpty()
        .withMessage('Employee Document ID required'),
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

router.validateGetPendingCandidateApprovalNotesListForHod = [
    body('employee_id')
        .notEmpty()
        .withMessage('Employee Document ID required'),
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