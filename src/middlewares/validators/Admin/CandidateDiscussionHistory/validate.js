const { body } = require('express-validator');

const express = require('express');
const router = express.Router();

const allowedStatuses = ['Active', 'Inactive'];


/*** Validate Add ********/
router.validateAddCandidateDiscussion = [
    body('candidate_id')
        .notEmpty()
        .withMessage('Please provide Candidate ID'),
    body('project_id')
        .notEmpty()
        .withMessage('Please provide Project ID'),
    body('candidate_name')
        .notEmpty()
        .withMessage('Please provide Candidate Name'),
    body('discuss_with')
        .notEmpty()
        .withMessage('Please provide discuss with Name'),
    body('discussion')
        .notEmpty()
        .withMessage('Please provide discussion data')
];

/*** Validate  List ********/
router.validateCandidateDiscussionList = [
    body('candidate_id')
        .notEmpty()
        .withMessage('Please provide Candidate ID'),
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