const express = require('express');
const router = express.Router();
const { body } = require('express-validator');

//Upload middleware 
const { uploadPDFDocxFile } = require('../../../fileUploads');
var uploadPDFDocxFileData = uploadPDFDocxFile.single('filename');


const allowedStatuses = ['Pending', 'Approved', 'Reject'];

router.validateAddRequisitionData = [
    uploadPDFDocxFileData,
    body('project_id')
        .notEmpty()
        .withMessage('Please enter project Document ID'),
    body('project_name')
        .notEmpty()
        .withMessage('Please enter project name'),
    body('designation_id')
        .notEmpty()
        .withMessage('Please enter designation id'),
    body('designation_name')
        .notEmpty()
        .withMessage('Please enter designation name'),
    body('department_id')
        .notEmpty()
        .withMessage('Please enter department id'),
    body('department_name')
        .notEmpty()
        .withMessage('Please enter department name'),
    body('ctc_per_annum')
        .notEmpty()
        .withMessage('Please enter CTC proposed per annum'),
    body('ctc_per_month')
        .notEmpty()
        .withMessage('Please enter CTC proposed per month'),
    body('grade')
        .notEmpty()
        .withMessage('Please enter Grade'),
    body('minimum_experience')
        .notEmpty()
        .withMessage('Please enter minimum experience'),
    body('maximum_experience')
        .notEmpty()
        .withMessage('Please enter maximum experience'),
    body('no_of_vacancy')
        .notEmpty()
        .withMessage('Please enter no of vacancy'),
    body('reporting_structure')
        .notEmpty()
        .withMessage('Please enter reporting structure'),
    body('reporting_structure_id')
        .notEmpty()
        .withMessage('Please enter reporting structure id'),
    body('vacancy_frame')
        .notEmpty()
        .withMessage('Please enter vacancy frame'),
    body('place_of_posting')
        .notEmpty()
        .withMessage('Please enter place of posting'),
    body('job_description')
        .notEmpty()
        .withMessage('Please enter job description'),
    body('qualification')
        .notEmpty()
        .withMessage('Please enter qualification'),
    body('skills')
        .notEmpty()
        .withMessage('Please enter skills'),
    body('raised_on')
        .notEmpty()
        .withMessage('Please enter raised date'),
    body('raised_by')
        .notEmpty()
        .withMessage('Please enter raised by name'),
    body('raised_by_designation')
        .notEmpty()
        .withMessage('Please enter raised by designation name'),
    body('raised_by_mobile')
        .notEmpty()
        .withMessage('Please enter raised by Mobile No'),
    body('status')
        .notEmpty()
        .withMessage('Please enter status'),
    body('status')
        .isIn(allowedStatuses)
        .withMessage(`Status must be one of: ${allowedStatuses.join(', ')}`),
    body('type_of_opening')
        .isIn(['new', 'replacement', 'planned_non_budgeted'])
        .withMessage(`Status must be one of: ${['new', 'replacement', 'planned_non_budgeted'].join(', ')}`)
];


router.validateAddRequisitionDataWithOldMpr = [
    uploadPDFDocxFileData,
    body('replacement_mpr_id')
        .notEmpty()
        .withMessage('Please enter Old MPR Document ID'),
    /*body('replacement_employee')
        .isArray({ min: 1 })
        .withMessage('Replacement Employee must be an array with at least one entry'),*/
    body('project_id')
        .notEmpty()
        .withMessage('Please enter project Document ID'),
    body('project_name')
        .notEmpty()
        .withMessage('Please enter project name'),
    body('designation_id')
        .notEmpty()
        .withMessage('Please enter designation id'),
    body('designation_name')
        .notEmpty()
        .withMessage('Please enter designation name'),
    body('department_id')
        .notEmpty()
        .withMessage('Please enter department id'),
    body('department_name')
        .notEmpty()
        .withMessage('Please enter department name'),
    body('ctc_per_annum')
        .notEmpty()
        .withMessage('Please enter CTC proposed per annum'),
    body('ctc_per_month')
        .notEmpty()
        .withMessage('Please enter CTC proposed per month'),
    body('grade')
        .notEmpty()
        .withMessage('Please enter Grade'),
    body('minimum_experience')
        .notEmpty()
        .withMessage('Please enter minimum experience'),
    body('maximum_experience')
        .notEmpty()
        .withMessage('Please enter maximum experience'),
    body('no_of_vacancy')
        .notEmpty()
        .withMessage('Please enter no of vacancy'),
    body('reporting_structure')
        .notEmpty()
        .withMessage('Please enter reporting structure'),
    body('reporting_structure_id')
        .notEmpty()
        .withMessage('Please enter reporting structure id'),
    body('vacancy_frame')
        .notEmpty()
        .withMessage('Please enter vacancy frame'),
    body('place_of_posting')
        .notEmpty()
        .withMessage('Please enter place of posting'),
    body('job_description')
        .notEmpty()
        .withMessage('Please enter job description'),
    body('qualification')
        .notEmpty()
        .withMessage('Please enter qualification'),
    body('skills')
        .notEmpty()
        .withMessage('Please enter skills'),
    body('raised_on')
        .notEmpty()
        .withMessage('Please enter raised date'),
    body('raised_by')
        .notEmpty()
        .withMessage('Please enter raised by name'),
    body('raised_by_designation')
        .notEmpty()
        .withMessage('Please enter raised by designation name'),
    body('raised_by_mobile')
        .notEmpty()
        .withMessage('Please enter raised by Mobile No'),
    body('status')
        .notEmpty()
        .withMessage('Please enter status'),
    body('status')
        .isIn(allowedStatuses)
        .withMessage(`Status must be one of: ${allowedStatuses.join(', ')}`),
    body('type_of_opening')
        .isIn(['new', 'replacement', 'planned_non_budgeted'])
        .withMessage(`Status must be one of: ${['new', 'replacement', 'planned_non_budgeted'].join(', ')}`)
];


/*** Validate Requisition Edit ********/
router.validateEditRequisitionData = [
    uploadPDFDocxFileData,
    body('_id')
        .notEmpty()
        .withMessage('Document ID required'),
    body('status')
        .notEmpty()
        .withMessage('Please enter status'),
    body('status')
        .isIn(allowedStatuses)
        .withMessage(`Status must be one of: ${allowedStatuses.join(', ')}`)
];

router.validateDeleteRequisitionData = [
    body('_id')
        .notEmpty()
        .withMessage('Please enter document ID')
];

router.validateRequisitionDataById = [
    body('_id')
        .notEmpty()
        .withMessage('Please enter document ID')
];

router.validateGetRequisitionDataByIdViaMail = [
    body('_id')
        .notEmpty()
        .withMessage('Please enter document ID')
];

/*** Validate Change Status ********/
router.validateChangeRequisitionDataStatus = [
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

/*** Validate  List ********/
router.validateRequisitionDataList = [
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

router.validateUpdatePlaceOfPosting = [
    body('requisition_id')
        .notEmpty().withMessage('requisition_id is required')
        .isMongoId().withMessage('Invalid requisition_id'),
    body('place_of_posting')
        .exists().withMessage('place_of_posting is required')
        .isArray({ min: 1 }).withMessage('place_of_posting must be a non-empty array'),
    body('place_of_posting.*.location_name')
        .optional()
        .isString().withMessage('location_name must be a string')
        .trim(),
    body('place_of_posting.*.location_id')
        .notEmpty().withMessage('location_id is required for each place of posting')
        .isMongoId().withMessage('Invalid location_id in place of posting'),
    body('place_of_posting.*.state_name')
        .optional()
        .isString().withMessage('state_name must be a string')
        .trim(),

    body('place_of_posting.*.state_id')
        .optional()
        .isMongoId().withMessage('Invalid state_id in place of posting')
];

/*** Validate verify status of Requisition Form  ********/
router.validateApproveRejectRequisitionForm = [
    body('_id')
        .notEmpty()
        .withMessage('Document ID required'),
    body('designation')
        .notEmpty()
        .withMessage('Approved By( Designation ) is required'),
    body('designation')
        .isIn(['HOD', 'CEO', 'HR'])
        .withMessage(`Designation must be one of: ${['HOD', 'CEO', 'HR'].join(', ')}`),
    body('comment')
        .notEmpty()
        .withMessage('Comment is required'),
    body('status')
        .notEmpty()
        .withMessage('Please enter status'),
    body('status')
        .isIn(['Approved', 'Reject'])
        .withMessage(`Status must be one of: ${['Approved', 'Reject'].join(', ')}`)
];


/*** Validate verify status of Requisition Form  ********/
router.validateApproveRejectRequisitionFormViaMail = [
    body('_id')
        .notEmpty()
        .withMessage('Document ID required'),
    body('employee_doc_id')
        .notEmpty()
        .withMessage('Employee Doc ID is required'),
    body('comment')
        .notEmpty()
        .withMessage('Comment is required'),
    body('status')
        .notEmpty()
        .withMessage('Please enter status'),
    body('status')
        .isIn(['Approved', 'Reject'])
        .withMessage(`Status must be one of: ${['Approved', 'Reject'].join(', ')}`)
];

/*** Validate verify status of Requisition Form  ********/
router.validateBulkApprovedMprByCeoOrHodSir = [
    body('employee_id')
        .notEmpty()
        .withMessage('Employee ID required'),
    body('designation')
        .notEmpty()
        .withMessage('Designation required'),
    body('mpr_ids')
        .notEmpty()
        .withMessage('MPR IDs are required'),
    body('status')
        .notEmpty()
        .withMessage('Please provide status'),
    body('status')
        .isIn(['Approved', 'Reject', 'need_to_discusss'])
        .withMessage(`Status must be one of: ${['Approved', 'Reject', 'need_to_discusss'].join(', ')}`)
];


router.validateSendRequisitionCreateFormMail = [
    body('project_id')
        .notEmpty()
        .withMessage('Please enter project document ID'),
    body('add_by_name')
        .notEmpty()
        .withMessage('Added By Name is required'),
    body('add_by_mobile')
        .notEmpty()
        .withMessage('Added By Mobile No is required'),
    body('add_by_designation')
        .notEmpty()
        .withMessage('Added By Designation is required'),
];

router.validateSendRequisitionCreateFormMailByEmployeeID = [
    body('employee_doc_id')
        .notEmpty()
        .withMessage('Please enter employee document ID'),
    body('project_id')
        .notEmpty()
        .withMessage('Please enter project document ID'),
    body('add_by_name')
        .notEmpty()
        .withMessage('Added By Name is required'),
    body('add_by_mobile')
        .notEmpty()
        .withMessage('Added By Mobile No is required'),
    body('add_by_designation')
        .notEmpty()
        .withMessage('Added By Designation is required'),
];

router.validateSendRequisitionApprovalEmailToCeo = [
    body('mpr_doc_id')
        .notEmpty()
        .withMessage('Please enter MPR document ID'),
    body('project_id')
        .notEmpty()
        .withMessage('Please enter project document ID'),
    body('add_by_name')
        .notEmpty()
        .withMessage('Added By Name is required'),
    body('add_by_mobile')
        .notEmpty()
        .withMessage('Added By Mobile No is required'),
    body('add_by_designation')
        .notEmpty()
        .withMessage('Added By Designation is required'),
    body('add_by_email')
        .notEmpty()
        .withMessage('Added By Email is required'),
];

router.validateSendRequisitionApprovalEmailToSingleEmployee = [
    body('mpr_doc_id')
        .notEmpty()
        .withMessage('Please enter employee document ID'),
    body('employee_doc_id')
        .notEmpty()
        .withMessage('Please enter employee document ID'),
    body('project_id')
        .notEmpty()
        .withMessage('Please enter project document ID'),
    body('add_by_name')
        .notEmpty()
        .withMessage('Added By Name is required'),
    body('add_by_mobile')
        .notEmpty()
        .withMessage('Added By Mobile No is required'),
    body('add_by_designation')
        .notEmpty()
        .withMessage('Added By Designation is required'),
    body('add_by_email')
        .notEmpty()
        .withMessage('Added By Email is required'),
];


/*** Validate List For Employee********/
router.validateRequisitionDataListForEmployee = [
    body('employee_doc_id')
        .notEmpty()
        .withMessage('Please enter employee document ID'),
    body('status')
        .notEmpty()
        .withMessage('Please enter status'),
    body('status')
        .isIn(['Approved', 'Pending'])
        .withMessage(`Status must be one of: ${['Approved', 'Pending'].join(', ')}`),
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


/*********** Validate Assign Employee On MPR For Approval *********/
router.validateAssignEmployeeOnMPRForApproval = [
    body('mpr_doc_id')
        .notEmpty()
        .withMessage('MPR Document ID required'),
    body('employee_list')
        .notEmpty()
        .withMessage('Employee List required')
        .isArray()
        .withMessage('Employee IDs must be an array')
        .custom((value) => {
            if (value.length === 0) {
                throw new Error('Employee ID array must not be empty');
            }
            return true;
        })
];

module.exports = router;