const { body } = require('express-validator');

const express = require('express');
const router = express.Router();

const allowedStatuses = ['Active', 'Inactive'];

/*** Validate Project Wise Vacancy Chart ********/
router.validateProjectWiseVacancyChart = [
    body('name')
        .notEmpty()
        .withMessage('Please provide Benefit name'),
    body('status')
        .notEmpty()
        .withMessage('Please provide status'),
    body('status')
        .isIn(allowedStatuses)
        .withMessage(`Status must be one of: ${allowedStatuses.join(', ')}`)
];


module.exports = router;