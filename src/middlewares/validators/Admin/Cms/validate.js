const { body } = require('express-validator');

const express = require('express');
const router = express.Router();

const allowedStatuses = ['Active', 'Inactive'];


/*** Validate Cms Add ********/
router.validateAddCms = [
    body('page_slug')
        .notEmpty()
        .withMessage('Cms Page Slug Required'),
    body('page_slug')
        .isLength({ min: 5 })
        .withMessage('Cms Page Slug must be at 5 characters long'),
    body('meta_title')
        .notEmpty()
        .withMessage('Please provide meta title'),
    body('meta_description')
        .notEmpty()
        .withMessage('Please provide meta description'),
    body('meta_keyword')
        .notEmpty()
        .withMessage('Please provide meta keyword'),
    body('h_one_heading')
        .notEmpty()
        .withMessage('Please provide H1 heading'),
    body('content_data')
        .notEmpty()
        .withMessage('Please provide content data'),
    body('status')
        .notEmpty()
        .withMessage('Please provide status'),
    body('status')
        .isIn(allowedStatuses)
        .withMessage(`Status must be one of: ${allowedStatuses.join(', ')}`)
];

/*** Validate Cms Edit ********/
router.validateEditCms = [
    body('_id')
        .notEmpty()
        .withMessage('Document ID Required'),
    body('page_slug')
        .isLength({ min: 5 })
        .withMessage('Cms Page Slug must be at 5 characters long'),
    body('meta_title')
        .notEmpty()
        .withMessage('Please provide meta title'),
    body('meta_description')
        .notEmpty()
        .withMessage('Please provide meta description'),
    body('meta_keyword')
        .notEmpty()
        .withMessage('Please provide meta keyword'),
    body('h_one_heading')
        .notEmpty()
        .withMessage('Please provide H1 heading'),
    body('content_data')
        .notEmpty()
        .withMessage('Please provide content data'),
    body('status')
        .notEmpty()
        .withMessage('Please provide status'),
    body('status')
        .isIn(allowedStatuses)
        .withMessage(`Status must be one of: ${allowedStatuses.join(', ')}`)
];

router.validateDeleteCms = [
    body('_id')
        .notEmpty()
        .withMessage('Please provide document ID')
];

router.validateCmsSlug = [
    body('page_slug')
        .notEmpty()
        .withMessage('Please provide page slug') 
];

/*** Validate Cms Edit ********/
router.validateChangeCmsStatus = [
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



module.exports = router;