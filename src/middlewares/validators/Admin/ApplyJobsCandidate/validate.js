const { body } = require('express-validator');

const express = require('express');
const router = express.Router();

//Upload middleware 
const { uploadFile, uploadPDFFile, uploadExcelFile, uploadPDFDocxJpegFile, uploadPDFDocxJpegFileName } = require('../../../fileUploads');
var uploadDoc = uploadFile.single('filename');
var uploadPdfDoc = uploadPDFFile.single('filename');
var uploadExcelF = uploadExcelFile.single('filename');
var uploadMultipleImageFileName = uploadPDFDocxJpegFileName.any();

var uploadMultipleImage = uploadPDFDocxJpegFile.fields([
    { name: 'filename', maxCount: 1 },
    { name: 'photo', maxCount: 1 }
]);

var uploadMultipleAnyImage = uploadPDFDocxJpegFile.any();


const allowedStatuses = ['Applied', 'Shortlisted', 'Interview', 'Offer', 'Hired', 'Rejected', 'Deleted'];
const KYCSteps = ['Profile', 'Document', 'Complete'];


/*** Validate Apply Job Add ********/
router.validateAddApplyJob = [
    uploadMultipleImage,
    body('job_id')
        .notEmpty()
        .withMessage('Job Document ID required'),
    body('job_title')
        .notEmpty()
        .withMessage('Please provide Job title'),
    body('project_id')
        .notEmpty()
        .withMessage('Project Document ID required'),
    body('project_name')
        .notEmpty()
        .withMessage('Please provide Project name'),
    body('job_type')
        .notEmpty()
        .withMessage('Please provide Job Type'),
    body('name')
        .notEmpty()
        .withMessage('Please provide full name'),
    body('email')
        .notEmpty()
        .withMessage('Please provide email'),
    body('mobile_no')
        .notEmpty()
        .withMessage('Please provide mobile no'),
    /*body('designation')
        .notEmpty()
        .withMessage('Please provide designation'),
    body('current_employer')
        .notEmpty()
        .withMessage('Please provide current employer'),
    body('location')
        .notEmpty()
        .withMessage('Please provide full email'),
    body('total_experience')
        .notEmpty()
        .withMessage('Please provide Total Experience'),
    body('relevant_experience')
        .notEmpty()
        .withMessage('Please provide Relevant Experience'),
    body('current_ctc')
        .notEmpty()
        .withMessage('Please provide Current CTC'),*/
    /*body('expected_ctc')
        .notEmpty()
        .withMessage('Please provide Expected CTC'),
    body('notice_period')
        .notEmpty()
        .withMessage('Please provide Notice Period'),
    body('last_working_day')
        .notEmpty()
        .withMessage('Please provide last working day'),
    body('applied_from')
        .notEmpty()
        .withMessage('Please provide Applied from')*/
];

/*** Validate Apply Job Edit ********/
router.validateEditApplyJob = [
    uploadPdfDoc,
    body('_id')
        .notEmpty()
        .withMessage('Document ID required'),
    body('job_title')
        .notEmpty()
        .withMessage('Please provide Job Title'),
    body('job_type')
        .notEmpty()
        .withMessage('Please provide Job Type'),
    body('name')
        .notEmpty()
        .withMessage('Please provide full name'),
    body('email')
        .notEmpty()
        .withMessage('Please provide email'),
    body('mobile_no')
        .notEmpty()
        .withMessage('Please provide mobile no'),
    /*body('designation')
        .notEmpty()
        .withMessage('Please provide designation'),
    body('current_employer')
        .notEmpty()
        .withMessage('Please provide current employer'),
    body('location')
        .notEmpty()
        .withMessage('Please provide full email'),
    body('total_experience')
        .notEmpty()
        .withMessage('Please provide Total Experience'),
    body('relevant_experience')
        .notEmpty()
        .withMessage('Please provide Relevant Experience'),
    body('current_ctc')
        .notEmpty()
        .withMessage('Please provide Current CTC'),*/
    /* body('expected_ctc')
         .notEmpty()
         .withMessage('Please provide Expected CTC'),
     body('notice_period')
         .notEmpty()
         .withMessage('Please provide Notice Period'),
     body('last_working_day')
         .notEmpty()
         .withMessage('Please provide last working day'),
     body('applied_from')
         .notEmpty()
         .withMessage('Please provide Applied from')*/
];

router.validateDeleteAppliedJob = [
    body('_id')
        .notEmpty()
        .withMessage('Please provide document ID'),
    body('job_id')
        .notEmpty()
        .withMessage('Please provide Job ID')
];

router.validateDeleteApplyJob = [
    body('_id')
        .notEmpty()
        .withMessage('Please provide document ID')
];

router.validateApplyJobById = [
    body('_id')
        .notEmpty()
        .withMessage('Please provide document ID')
];

/*** Validate Apply Job Change Status ********/
router.validateChangeApplyJobStatus = [
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

/*** Validate Change Profile Status ********/
router.validateCandidateProfileStatus = [
    body('candidate_id')
        .notEmpty()
        .withMessage('Document ID Required'),
    body('profile_status')
        .notEmpty()
        .withMessage('Please provide status'),
    body('profile_status')
        .isIn(['Active', 'Inactive', 'Blocked'])
        .withMessage(`Status must be one of: ${['Active', 'Inactive', 'Blocked'].join(', ')}`)
];

/*** Validate Apply Job List ********/
router.validateApplyJobList = [
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

/*** Validate Complete Profile Edit ********/
router.validateEditProfile = [
    uploadDoc,
    body('_id')
        .notEmpty()
        .withMessage('Document ID required'),
    body('name')
        .notEmpty()
        .withMessage('Please provide full name'),
    body('email')
        .notEmpty()
        .withMessage('Please provide email'),
    body('mobile_no')
        .notEmpty()
        .withMessage('Please provide mobile no'),
    /*body('current_employer')
         .notEmpty()
         .withMessage('Please provide current employer'),
     body('designation')
         .notEmpty()
         .withMessage('Please provide designation'), */
    body('location')
        .notEmpty()
        .withMessage('Please provide Location'),
    body('total_experience')
        .notEmpty()
        .withMessage('Please provide Total Experience'),
    body('relevant_experience')
        .notEmpty()
        .withMessage('Please provide Relevant Experience'),
    /*body('current_ctc')
        .notEmpty()
        .withMessage('Please provide Current CTC'),*/
    body('expected_ctc')
        .notEmpty()
        .withMessage('Please provide Expected CTC'),
    body('notice_period')
        .notEmpty()
        .withMessage('Please provide Notice Period'),
    /*body('last_working_day')
        .notEmpty()
        .withMessage('Please provide last working day'),*/
    body('applied_from')
        .notEmpty()
        .withMessage('Please provide Applied from'),
    body('education')
        .notEmpty()
        .withMessage('Please provide Education')
];

/*** Validate Upload Docs ********/
router.validateUploadDocs = [
    uploadDoc,
    body('_id')
        .notEmpty()
        .withMessage('Document ID required'),
    body('doc_category')
        .notEmpty()
        .withMessage('Please provide Document Category'),
    body('doc_name')
        .notEmpty()
        .withMessage('Please provide Document Name')
];

router.validateCandidateById = [
    body('_id')
        .notEmpty()
        .withMessage('Document ID required')
];

/*** Validate Candidate KYC Steps Status ********/
router.validateKycSteps = [
    body('_id')
        .notEmpty()
        .withMessage('Document ID Required'),
    body('kyc_steps')
        .notEmpty()
        .withMessage('Please provide KYC status'),
    body('kyc_steps')
        .isIn(KYCSteps)
        .withMessage(`Status must be one of: ${KYCSteps.join(', ')}`)
];

router.validateEmployeeInterviewList = [
    body('employee_id')
        .notEmpty()
        .withMessage('Employee Document ID Required'),
    body('page_no')
        .notEmpty()
        .withMessage('Please provide Page No'),
    body('per_page_record')
        .notEmpty()
        .withMessage('Please provide Page No'),
    body('type')
        .notEmpty()
        .withMessage('Please provide Page type '),
    body('type')
        .isIn(['Upcoming', 'Today', 'All'])
        .withMessage(`Status must be one of: ${['Upcoming', 'Today', 'All'].join(', ')}`)
];

router.validateRejectDeleteInterview = [
    body('candidate_id')
        .notEmpty()
        .withMessage('Candidate Document ID Required'),
    body('applied_job_id')
        .notEmpty()
        .withMessage('Please provide Applied Job ID'),
    body('status')
        .isIn(['Rejected', 'Deleted', 'Hired'])
        .withMessage(`Status must be one of: ${['Rejected', 'Deleted', 'Hired'].join(', ')}`)
];

router.validateCandidateShortList = [
    body('role_user_id')
        .notEmpty()
        .withMessage("Role User Document ID Required"),
    body('candidate_ids')
        .notEmpty()
        .withMessage("Candidate Document ID's Required"),
    body('status')
        .notEmpty()
        .withMessage('Please provide Status'),
    body('status')
        .isIn(['Shortlisted'])
        .withMessage(`Status must be one of: ${['Shortlisted'].join(', ')}`)
];

router.validateScheduleInterView = [
    body('candidate_id')
        .notEmpty()
        .withMessage("Candidate Document ID Required"),
    body('applied_job_id')
        .notEmpty()
        .withMessage("Applied Job ID Required"),
    body('interview_host')
        .notEmpty()
        .withMessage("Please provide the interview Host"),
    body('stage')
        .notEmpty()
        .withMessage("Please provide the interview stage"),
    body('interview_type')
        .notEmpty()
        .withMessage("Please provide the interview Type"),
    body('interview_duration')
        .notEmpty()
        .withMessage("Please provide the interview duration"),
    body('interview_date')
        .notEmpty()
        .withMessage("Please provide the interview Date"),
    body('interviewer')
        .notEmpty()
        .withMessage("Please provide the interviewer List")
];

router.validateScheduleInterViewDate = [
    body('candidate_id')
        .notEmpty()
        .withMessage("Candidate Document ID Required"),
    body('applied_job_id')
        .notEmpty()
        .withMessage("Applied Job ID Required"),
    body('interview_duration')
        .notEmpty()
        .withMessage("Please provide the interview duration"),
    body('interview_date')
        .notEmpty()
        .withMessage("Please provide the interview Date")
];

router.validateEmployeeAcceptReject = [
    body('interviewer_id')
        .notEmpty()
        .withMessage('Employee Document ID Required'),
    body('candidate_id')
        .notEmpty()
        .withMessage("Candidate Document ID Required"),
    body('applied_job_id')
        .notEmpty()
        .withMessage("Applied Job ID Required"),
    body('status')
        .notEmpty()
        .withMessage('Please provide Page type '),
    body('status')
        .isIn(['Accept', 'Reject'])
        .withMessage(`Status must be one of: ${['Accept', 'Reject'].join(', ')}`)
];

router.validateGetUpcomingInterViewList = [
    body('page_no')
        .notEmpty()
        .withMessage('Please provide Page No'),
    body('per_page_record')
        .notEmpty()
        .withMessage('Please provide Page No')
];

router.validateCountRecords = [
    body('type')
        .notEmpty()
        .withMessage('Please provide Page No'),
    body('type')
        .isIn(['Total', 'Applied', 'Upcoming', 'Assessment'])
        .withMessage(`Status must be one of: ${['Total', 'Applied', 'Upcoming', 'Assessment'].join(', ')}`)
];

router.validateSaveFeedback = [
    body('candidate_id')
        .notEmpty()
        .withMessage('Please provide candidate id'),
    body('applied_job_id')
        .notEmpty()
        .withMessage('Please provide applied job id'),
    body('interviewer_id')
        .notEmpty()
        .withMessage('Please provide interviewer id'),
    body('comment')
        .notEmpty()
        .withMessage('Please provide comment'),
    body('job_match')
        .notEmpty()
        .withMessage('Please provide job match rating value'),
    body('job_knowledge')
        .notEmpty()
        .withMessage('Please provide job knowledge value'),
    body('creative_problem_solving')
        .notEmpty()
        .withMessage('Please provide creative problem solving value'),
    body('team_player')
        .notEmpty()
        .withMessage('Please provide team player value'),
    body('communication_skill')
        .notEmpty()
        .withMessage('Please provide communication skill value'),
    body('exposure_to_job_profile')
        .notEmpty()
        .withMessage('Please provide exposure to job profile value'),
    body('feedback_date')
        .notEmpty()
        .withMessage('Please provide feedback date value')
];

router.validateSaveRecommendationStatus = [
    body('candidate_id')
        .notEmpty()
        .withMessage('Please provide candidate id'),
    body('applied_job_id')
        .notEmpty()
        .withMessage('Please provide applied job id'),
    body('recommendation')
        .notEmpty()
        .withMessage('Please provide recommendation'),
    body('interview_status')
        .notEmpty()
        .withMessage('Please provide interview status'),
    body('interview_status')
        .isIn(['Pending', 'Rejected', 'Confirmed'])
        .withMessage(`Status must be one of: ${['Pending', 'Rejected', 'Confirmed'].join(', ')}`)
];

/*** Validate Resume Upload File ********/
router.validateUploadResume = [
    uploadPdfDoc,
    body('candidate_id')
        .notEmpty()
        .withMessage('Document ID required')
];

router.validateOfferJob = [
    body('candidate_id')
        .notEmpty()
        .withMessage('Please provide candidate id'),
    body('applied_job_id')
        .notEmpty()
        .withMessage('Please provide applied job id'),
    body('onboard_date')
        .notEmpty()
        .withMessage('Please provide onboard date'),
    body('offer_ctc')
        .notEmpty()
        .withMessage('Please provide offer ctc')
];

router.validateExtendJobOfferDate = [
    body('candidate_id')
        .notEmpty()
        .withMessage('Please provide candidate id'),
    body('applied_job_id')
        .notEmpty()
        .withMessage('Please provide applied job id'),
    body('onboard_date')
        .notEmpty()
        .withMessage('Please provide onboard date')
];

router.validateFinalDocumentSubmit = [
    body('candidate_id')
        .notEmpty()
        .withMessage('Please provide candidate id')
];

router.validateRejectDocuments = [
    body('candidate_id')
        .notEmpty()
        .withMessage('Please provide candidate id'),
    body('doc_list_ids')
        .notEmpty()
        .withMessage('Please Rejected Documents id')
];


router.validateVerifyOffer = [
    body('utm')
        .notEmpty()
        .withMessage('Please provide utm data'),
    body('type')
        .notEmpty()
        .withMessage('Please provide type'),
    body('type')
        .isIn(['accept', 'reject'])
        .withMessage(`Status must be one of: ${['accept', 'reject'].join(', ')}`)
];

router.validateCandidateByNameEmail = [
    body('keyword')
        .notEmpty()
        .withMessage('Please provide search keyword data')
];


router.validateCandidateInterviewList = [
    body('page_no')
        .notEmpty()
        .withMessage('Please provide Page No'),
    body('per_page_record')
        .notEmpty()
        .withMessage('Please provide Page No'),
    body('type')
        .notEmpty()
        .withMessage('Please provide Page type '),
    body('type')
        .isIn(['Upcoming', 'Today'])
        .withMessage(`Status must be one of: ${['Upcoming', 'Today'].join(', ')}`)
];


/*** Validate Candidate Add ********/
router.validateImportCandidateData = [
    uploadExcelF,
    body('project_id')
        .notEmpty()
        .withMessage('Project Document ID required'),
    body('job_id')
        .notEmpty()
        .withMessage('Please provide Job ID'),
    body('applied_from')
        .notEmpty()
        .withMessage('Please provide Applied From')
];

/*********** Validate Update job Offer Amount *********/
router.validateUpdateJobOfferAmount = [
    body('candidate_id')
        .notEmpty()
        .withMessage('Candidate Document ID required'),
    body('project_id')
        .notEmpty()
        .withMessage('Project ID required'),
    body('candidate_name')
        .notEmpty()
        .withMessage('candidate_name required'),
    body('applied_job_id')
        .notEmpty()
        .withMessage('Applied Job Document ID required'),
    body('onboard_date')
        .notEmpty()
        .withMessage('Onboarding Date required'),
    body('offer_ctc')
        .notEmpty()
        .withMessage('Offer Amount required'),
    body('interview_shortlist_status')
        .notEmpty()
        .withMessage('Please Provide Interview Status Type'),
    body('interview_shortlist_status')
        .isIn(['Waiting', 'Selected'])
        .withMessage(`Status must be one of: ${['Waiting', 'Selected'].join(', ')}`),
    // body('esic_status')
    //     .notEmpty()
    //     .withMessage('Please Provide ESIC Status'),
    // body('esic_status')
    //     .isIn(['Yes','No'])
    //     .withMessage(`ESIC Status must be one of: ${['Yes','No'].join(', ')}`),
    body('add_by_name')
        .notEmpty()
        .withMessage('Add by Name required'),
    body('add_by_designation')
        .notEmpty()
        .withMessage('Add by Designation required'),
    body('add_by_email')
        .notEmpty()
        .withMessage('Add by Email required'),
]

/*********** Validate Send Job Offer Approval Mail Amount *********/
router.validateSendJobOfferApprovalMailToMember = [
    body('approval_note_doc_id')
        .notEmpty()
        .withMessage('Approval NOte Document ID required'),
    body('employee_id')
        .notEmpty()
        .withMessage('Employee ID required')
]

/*********** Validate Job Offer Approval Member List *********/
router.validateGetJobOfferApprovalMemberList = [
    body('job_id')
        .notEmpty()
        .withMessage('Job Document ID required'),
    body('project_id')
        .notEmpty()
        .withMessage('Project Job ID required'),
    body('candidate_ids')
        .notEmpty()
        .withMessage('Candidate Data required')
        .isArray()
        .withMessage('Candidate Data must be an array')
        .custom((value) => {
            if (value.length === 0) {
                throw new Error('Candidate Data array must not be empty');
            }
            return true;
        })
]

/*********** Validate Add Member Job Offer Approval Member List *********/
router.validateAddJobOfferApprovalMember = [
    body('approval_note_doc_id')
        .notEmpty()
        .withMessage('Approval Note ID required'),
    body('employee_ids')
        .notEmpty()
        .withMessage('Employee IDs required')
        .isArray()
        .withMessage('Employee IDs must be an array')
        .custom((value) => {
            if (value.length === 0) {
                throw new Error('Employee ID array must not be empty');
            }
            return true;
        })
];

/*********** Validate Add Member Job Offer Approval Member List *********/
router.validateApproveApprovalNoteByEmployee = [
    body('approval_note_doc_id')
        .notEmpty()
        .withMessage('Approval Note ID required'),
    body('employee_id')
        .notEmpty()
        .withMessage('Employee ID required'),
    body('candidate_id')
        .notEmpty()
        .withMessage('candidate ID required'),
    body('status')
        .notEmpty()
        .withMessage('Please provide status'),
    body('status')
        .isIn(['Approved', 'Rejected'])
        .withMessage(`Status must be one of: ${['Approved', 'Rejected'].join(', ')}`)
];

/*********** Validate approve note in Approval Member List for CEO Sir *********/
router.validateApproveApprovalNoteByCeoSir = [
    body('employee_id')
        .notEmpty()
        .withMessage('Employee ID required'),
    body('candidate_ids')
        .notEmpty()
        .withMessage('candidate IDs are required'),
    body('status')
        .notEmpty()
        .withMessage('Please provide status'),
    body('status')
        .isIn(['Approved', 'Rejected', 'need_to_discusss'])
        .withMessage(`Status must be one of: ${['Approved', 'Rejected', 'need_to_discusss'].join(', ')}`)
];

/*********** Validate Add Member Job Offer Approval Member List *********/
router.validatePutCandidateToWaitingOrSelected = [
    body('candidate_data')
        .notEmpty()
        .withMessage('Candidate Data required')
        .isArray()
        .withMessage('Candidate Data must be an array')
        .custom((value) => {
            if (value.length === 0) {
                throw new Error('Candidate Data array must not be empty');
            }
            return true;
        }),
    body('status')
        .notEmpty()
        .withMessage('Please provide status'),
    body('status')
        .isIn(['Waiting', 'Selected'])
        .withMessage(`Status must be one of: ${['Waiting', 'Selected'].join(', ')}`),
    body('add_by_name')
        .notEmpty()
        .withMessage('Add By Name required'),
    body('add_by_email')
        .notEmpty()
        .withMessage('Add By Email required'),
    body('add_by_designation')
        .notEmpty()
        .withMessage('Add By Designation required'),
];

/*********** Validate Candidate Hire a Waiting *********/
router.validateUpdateHireStatus = [
    body('candidate_id')
        .notEmpty()
        .withMessage('Candidate Document ID required'),
    body('applied_job_id')
        .notEmpty()
        .withMessage('Applied Job ID required'),
    body('hiring_status')
        .notEmpty()
        .withMessage('Please provide status'),
    body('hiring_status')
        .isIn(['Approved', 'Hold'])
        .withMessage(`Status must be one of: ${['Approved', 'Hold'].join(', ')}`)
]

/*********** Validate Candidate Hire a Waiting *********/
router.validateGetCandidateJobRating = [
    body('approval_note_doc_id')
        .notEmpty()
        .withMessage('Approval Note Document ID required'),
    body('candidate_id')
        .notEmpty()
        .withMessage('Candidate Document ID required'),
    body('job_id')
        .notEmpty()
        .withMessage('Job ID required'),
]


/*** Validate Add Manual Candidate And Job Add ********/
router.validateAddManualCandidate = [
    uploadMultipleImage,
    body('job_id')
        .notEmpty()
        .withMessage('Job Document ID required'),
    body('job_title')
        .notEmpty()
        .withMessage('Please provide Job title'),
    body('project_id')
        .notEmpty()
        .withMessage('Project Document ID required'),
    body('project_name')
        .notEmpty()
        .withMessage('Please provide Project name'),
    body('job_type')
        .notEmpty()
        .withMessage('Please provide Job Type'),
    body('name')
        .notEmpty()
        .withMessage('Please provide full name'),
    // body('email')
    //     .notEmpty()
    //     .withMessage('Please provide email'),
    body('mobile_no')
        .notEmpty()
        .withMessage('Please provide mobile no'),
    /*body('designation')
        .notEmpty()
        .withMessage('Please provide designation'),
    body('current_employer')
        .notEmpty()
        .withMessage('Please provide current employer'),
    body('location')
        .notEmpty()
        .withMessage('Please provide full email'),
    body('total_experience')
        .notEmpty()
        .withMessage('Please provide Total Experience'),
    body('relevant_experience')
        .notEmpty()
        .withMessage('Please provide Relevant Experience'),
    body('current_ctc')
        .notEmpty()
        .withMessage('Please provide Current CTC'),*/
    /*body('expected_ctc')
        .notEmpty()
        .withMessage('Please provide Expected CTC'),
    body('notice_period')
        .notEmpty()
        .withMessage('Please provide Notice Period'),
    body('last_working_day')
        .notEmpty()
        .withMessage('Please provide last working day'),
    body('applied_from')
        .notEmpty()
        .withMessage('Please provide Applied from')*/
];

/*** Validate Candidate Import With JsonFormat ********/
router.validateImportCandidateDataJson = [
    body('project_id')
        .notEmpty()
        .withMessage('Project Document ID required'),

    body('job_id')
        .notEmpty()
        .withMessage('Please provide Job ID'),

    body('applied_from')
        .notEmpty()
        .withMessage('Please provide Applied From'),

    body('candidate_data')
        .isArray()
        .withMessage('Candidate Data must be an array')
        .notEmpty()
        .withMessage('Candidate Data is required')
        .bail()
        .custom((value) => {
            // Validate each candidate object inside the array
            value.forEach((candidate, index) => {
                if (!candidate.name) {
                    throw new Error(`Candidate Name is required for candidate at index ${index}`);
                }
                // if (!candidate.email) {
                //     throw new Error(`Email is required for candidate at index ${index}`);
                // }
                if (!candidate.mobile_no) {
                    throw new Error(`Mobile Number is required for candidate at index ${index}`);
                }
                if (!candidate.designation) {
                    throw new Error(`Current Designation is required for candidate at index ${index}`);
                }
                if (!candidate.current_employer) {
                    throw new Error(`Current Employer is required for candidate at index ${index}`);
                }
                if (!candidate.current_employer_mobile) {
                    throw new Error(`Current Employer Mobile No is required for candidate at index ${index}`);
                }
                if (!candidate.location) {
                    throw new Error(`Current Location is required for candidate at index ${index}`);
                }
                if (!candidate.total_experience) {
                    throw new Error(`Total Experience is required for candidate at index ${index}`);
                }
                if (!candidate.relevant_experience) {
                    throw new Error(`Relevant Experience is required for candidate at index ${index}`);
                }
                if (!candidate.current_ctc) {
                    throw new Error(`CTC is required for candidate at index ${index}`);
                }
                if (!candidate.expected_ctc) {
                    throw new Error(`Expected CTC is required for candidate at index ${index}`);
                }
                if (!candidate.department) {
                    throw new Error(`Department is required for candidate at index ${index}`);
                }
                // Add other fields validations as required
            });
            return true;
        })
];


/*** Validate Filter Job Listing For CEO  ********/
router.validateApplyJobListCeo = [
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


/*** Validate get bulk candidate list by Job ID  ********/
router.validateGetBulkCandidateListByJobId = [
    body('candidate_ids')
        .isArray({ min: 1 }) // Ensure it's a non-empty array
        .withMessage('Candidate IDs must be a non-empty array'),

    body('candidate_ids.*') // Validate each element in the array
        .isMongoId()
        .withMessage('Each candidate ID must be a valid MongoDB ObjectId'),

    body('job_id')
        .notEmpty()
        .withMessage('Job ID is required')
        .isMongoId()
        .withMessage('Job ID must be a valid MongoDB ObjectId'),

    body('project_id')
        .notEmpty()
        .withMessage('Project ID is required')
        .isMongoId()
        .withMessage('Project ID must be a valid MongoDB ObjectId')
];

/*** Validate schedule bulk candidates interview ********/
router.validateScheduleBulkInterView = [
    body('candidate_ids')
        .isArray({ min: 1 })
        .withMessage('Candidate IDs must be a non-empty array'),
    body('interview_host')
        .notEmpty()
        .withMessage("Please provide the interview Host"),
    body('stage')
        .notEmpty()
        .withMessage("Please provide the interview stage"),
    body('interview_type')
        .notEmpty()
        .withMessage("Please provide the interview Type"),
    body('interview_duration')
        .notEmpty()
        .withMessage("Please provide the interview duration"),
    body('interview_date')
        .notEmpty()
        .withMessage("Please provide the interview Date"),
    body('interviewer')
        .notEmpty()
        .withMessage("Please provide the interviewer List")
];

/********* Validate Send Offer And Other Mail to Candidate *******/
router.sendApprovalNoteOfferMailToCandidates = [
    uploadMultipleImageFileName,
    body('approval_note_id')
        .notEmpty()
        .withMessage('Approval note id is Required'),
    body('contents')
        .notEmpty()
        .withMessage('Template content is Required'),
    body('template_id')
        .notEmpty()
        .withMessage('Template ID is Required')
];

/*** Validate get bulk candidate list by Job ID  ********/
router.validateGetOnboardDocuments = [
    body('candidate_id')
        .notEmpty()
        .withMessage('Candidate ID is Required')
];

/********* Validate upload onboarding Documents of the Candidate *******/
router.validateUploadOnboardDocuments = [
    uploadMultipleAnyImage,
    body('approval_note_id')
        .notEmpty()
        .withMessage('Approval note id is Required'),
    body('candidate_id')
        .notEmpty()
        .withMessage('Candidate ID is Required'),
    body('onboard_doc_id')
        .notEmpty()
        .withMessage('Document ID is Required')
];

/********* Validate Remove onboarding Documents of the Candidate *******/
router.validateRemoveOnboardDocuments = [
    body('approval_note_id')
        .notEmpty()
        .withMessage('Approval note id is Required'),
    body('candidate_id')
        .notEmpty()
        .withMessage('Candidate ID is Required'),
    body('onboard_doc_id')
        .notEmpty()
        .withMessage('Document ID is Required')
];

/*** Validate verify on boarding document ********/
router.validateVerifyOnBoardDocuments = [
    body('candidate_doc_id')
        .notEmpty()
        .withMessage('Candidate ID is Required'),
    body('onboard_doc_id')
        .notEmpty()
        .withMessage('Document ID is Required'),
    body('add_by_name')
        .notEmpty()
        .withMessage('Document ID is Required'),
    body('add_by_email')
        .notEmpty()
        .withMessage('Document ID is Required'),
    body('add_by_mobile')
        .notEmpty()
        .withMessage('Document ID is Required'),
    body('add_by_designation')
        .notEmpty()
        .withMessage('Document ID is Required'),
    body('action')
        .notEmpty()
        .withMessage('Please provide action'),
    body('action')
        .isIn(['Accept', 'Reject'])
        .withMessage(`Action must be one of: ${['Accept', 'Reject'].join(', ')}`)
];


/********* Validate onboarding Documents Steps fron candidate Panel *****/
router.validateCandidateOnboardMailSteps = [
    body('candidate_doc_id')
        .notEmpty()
        .withMessage('Candidate id is Required'),
    body('applied_job_id')
        .notEmpty()
        .withMessage('Applied Job ID is Required'),
    body('action')
        .notEmpty()
        .withMessage('Please provide action'),
    body('action')
        .isIn(['offerletter', 'joiningkit', 'appointmentletter'])
        .withMessage(`Action must be one of: ${['offerletter', 'joiningkit', 'appointmentletter'].join(', ')}`)
];


/********* Validate Upload Applicant form Data of the Candidate *******/
router.validateSaveApplicantForm = [
    uploadMultipleAnyImage,
    body('candidate_id')
        .notEmpty()
        .withMessage('Candidate ID is Required'),
    body('first_name')
        .notEmpty()
        .withMessage('First Name is Required'),
    body('surname')
        .notEmpty()
        .withMessage('Surname is Required'),
    body('father_hushband_name')
        .notEmpty()
        .withMessage('Father/Husband Name is Required'),
    body('gender')
        .notEmpty()
        .withMessage('Gender is Required'),
    body('marital_status')
        .notEmpty()
        .withMessage('Marital Status is Required'),
    body('belongs_to_category')
        .notEmpty()
        .withMessage('Belongs to Category Required'),
    body('physically_handicapped')
        .notEmpty()
        .withMessage('Provide Physically Status Required'),
    body('relationship_associate_status')
        .notEmpty()
        .withMessage('Provide Associate Relationship Status'),
    body('arrested_convicted_by_court')
        .notEmpty()
        .withMessage('Provide Arrested/Convicted By Court Data if any!')
];



/********* Validate Upload Applicant form Data of the Candidate *******/
router.validateSaveAnnexureElevenForm = [
    uploadDoc,
    body('candidate_id')
        .notEmpty()
        .withMessage('Candidate ID is Required'),
    body('candidate_name')
        .notEmpty()
        .withMessage('Candidate Name is Required'),
    body('candidate_designation')
        .notEmpty()
        .withMessage('Candidate Designation is Required'),
    body('candidate_father_husband_name')
        .notEmpty()
        .withMessage('Father/Husband Name is Required'),
    body('candidate_gender')
        .notEmpty()
        .withMessage('Gender is Required'),
    body('candidate_doj')
        .notEmpty()
        .withMessage('Date Of Joining is Required'),
    body('candidate_dob')
        .notEmpty()
        .withMessage('Date of Birth is Required'),
    body('candidate_reporting_manager')
        .notEmpty()
        .withMessage('Provide Reporting Manager Name'),
    body('candidate_bank_details')
        .notEmpty()
        .withMessage('Provide Candidate Bank Details')
];


/********* Validate onboarding Documents Steps from candidate Panel *****/
router.validateAcceptRejectOffer = [
    body('candidate_id')
        .notEmpty()
        .withMessage('Candidate ID is Required'),
    body('applied_job_id')
        .notEmpty()
        .withMessage('Applied Job ID is Required'),
    body('action')
        .notEmpty()
        .withMessage('Please provide action'),
    body('action')
        .isIn(['accept', 'reject'])
        .withMessage(`Action must be one of: ${['accept', 'reject'].join(', ')}`)
];

/********* Validate Upload Applicant form Data of the Candidate *******/
router.validateSaveDeclarationForm = [
    body('candidate_id')
        .notEmpty()
        .withMessage('Candidate ID is Required'),
    body('applied_job_id')
        .notEmpty()
        .withMessage('Applied Job ID is Required'),
    body('is_agree')
        .notEmpty()
        .withMessage('Are You Agree is Required'),
];

/********* Validate Scoring sheet Data *******/
router.validateScoringSheet = [
    body('job_id')
        .notEmpty()
        .withMessage('JOb ID is Required')
];


/********* Validate Schedule interview *******/
router.validateAddInterviewerInScheduleInterView = [
    body('candidate_id')
        .notEmpty()
        .withMessage("Candidate Document ID Required"),
    body('applied_job_id')
        .notEmpty()
        .withMessage("Applied Job ID Required"),
    body('interviewer_id')
        .notEmpty()
        .withMessage("Please provide the interviewer ID"),
    body('stage')
        .notEmpty()
        .withMessage("Please provide the stage Data")
];

/********* Validate  remove interviewer from Schedule interview *******/
router.validateRemoveInterviewerFromScheduleInterView = [
    body('candidate_id')
        .notEmpty()
        .withMessage("Candidate Document ID Required"),
    body('applied_job_id')
        .notEmpty()
        .withMessage("Applied Job ID Required"),
    body('interviewer_id')
        .notEmpty()
        .withMessage("Please provide the interviewer ID"),
    body('stage')
        .notEmpty()
        .withMessage("Please provide the stage Data")
];


router.validateUpdateInterviewDoneStatus = [
    body('candidate_doc_id')
        .notEmpty()
        .withMessage('Please provide candidate document ID'),
    body('applied_job_doc_id')
        .notEmpty()
        .withMessage('Please provide Job ID')
];


router.validateUpdateOnboardStatusOfApprovalTimeLine = [
    body('approval_note_id')
        .notEmpty()
        .withMessage('Please provide approval note id'),
    body('candidate_id')
        .notEmpty()
        .withMessage('Please provide candidate document ID'),
    body('form_step')
        .notEmpty()
        .withMessage('Please provide form step'),
    body('add_by_name')
        .notEmpty()
        .withMessage('Please provide add by name'),
    body('add_by_mobile')
        .notEmpty()
        .withMessage('Please provide add by mobile'),
    body('add_by_email')
        .notEmpty()
        .withMessage('Please provide add by email'),
    body('add_by_designation')
        .notEmpty()
        .withMessage('Please provide add by designation')
];


/********* Validate Get Candidate Email Content *******/
router.validateGetCandidateEmailContent = [
    body('candidate_id')
        .notEmpty()
        .withMessage("Candidate Document ID Required"),
    body('doc_category')
        .notEmpty()
        .withMessage("Document Category"),
    body('approval_note_id')
        .notEmpty()
        .withMessage("Please provide approval note ID")
];


/********* Validate Post Job On Devenet *******/
router.validatePostJobOnDevnet = [
    body('job_id')
        .notEmpty()
        .withMessage("Job Document ID Required")
];


/*********** Validate Candidate Appointment Letter List *********/
router.validateGetCandidateAppointmentEmailList = [
    body('page_no')
        .notEmpty()
        .withMessage('Approval Note Document ID required'),
    body('per_page_record')
        .notEmpty()
        .withMessage('Per page record required'),
    body('employee_id')
        .notEmpty()
        .withMessage('Employee id required')
]

/*********** Validate Candidate Appointment Letter List for admin *********/
router.validateGetCandidateAppointmentEmailListInAdmin = [
    body('page_no')
        .notEmpty()
        .withMessage('Approval Note Document ID required'),
    body('per_page_record')
        .notEmpty()
        .withMessage('Per page record required')
]

/*********** Validate appointment letter send mail *********/
router.validateSendAppointmentLetterToCandidateAfterApproval = [
    body('approval_note_doc_id')
        .notEmpty()
        .withMessage('Approval Note Document ID required'),
    body('candidate_doc_id')
        .notEmpty()
        .withMessage('Candidate Document ID required'),
    body('add_by_name')
        .notEmpty()
        .withMessage('Add By Name is required'),
    body('add_by_mobile')
        .notEmpty()
        .withMessage('Add By Mobile is required'),
    body('add_by_email')
        .notEmpty()
        .withMessage('Add By Email is required')
]

/*********** Validate ID card data *********/
router.validateSaveCandidateIDcardData = [
    uploadDoc,
    body('candidate_doc_id')
        .notEmpty()
        .withMessage('Candidate Document ID required'),
    body('add_by_name')
        .notEmpty()
        .withMessage('Add By Name is required'),
    body('add_by_mobile')
        .notEmpty()
        .withMessage('Add By Mobile is required'),
    body('add_by_email')
        .notEmpty()
        .withMessage('Add By Email is required'),
    body('add_by_designation')
        .notEmpty()
        .withMessage('Add By Email is required'),
    body('add_by_designation')
        .notEmpty()
        .withMessage('Add By Email is required')
]

/*********** Validate skipped interview data *********/
router.validateSaveSkippedInterviewCandidateFeedback = [
    body('candidate_id')
        .notEmpty()
        .withMessage('Candidate Document ID required'),
    body('applied_job_id')
        .notEmpty()
        .withMessage('Applied Job Document ID required'),
    body('interviewer_id')
        .notEmpty()
        .withMessage('Interviewer ID required'),
    body('add_by_name')
        .notEmpty()
        .withMessage('Add By Name is required'),
    body('add_by_mobile')
        .notEmpty()
        .withMessage('Add By Mobile is required'),
    body('add_by_email')
        .notEmpty()
        .withMessage('Add By Email is required'),
    body('add_by_designation')
        .notEmpty()
        .withMessage('Add By Email is required')
]



/********* Validate  Skip Offer Joining Letter Candidate *******/
router.validateSkipOfferJoiningLetter = [
    body('approval_note_doc_id')
        .notEmpty()
        .withMessage('Approval note id is Required'),
    body('candidate_doc_id')
        .notEmpty()
        .withMessage('Candidate ID is Required'),
    body('skip_status_for')
        .notEmpty()
        .withMessage('Skip status for is Required'),
    body('skip_status_for')
        .isIn(['Offer Letter', 'Joining Kit'])
        .withMessage(`Action must be one of: ${['Offer Letter', 'Joining Kit'].join(', ')}`)
];

/********* Validate  Resend Applicant Form Mail Candidate *******/
router.validateResendApplicantForm = [
    body('applied_job_doc_id')
        .notEmpty()
        .withMessage('Applied Job Doc ID is Required'),
    body('candidate_doc_id')
        .notEmpty()
        .withMessage('Candidate ID is Required'),
    body('added_by_name')
        .notEmpty()
        .withMessage('Add By Name is Required'),
    body('added_by_mobile')
        .notEmpty()
        .withMessage('Add By Mobile is Required')
];

/*********** Validate approve note in Approval Member List for HOD Sir *********/
router.validateApproveApprovalNoteByHodSir = [
    body('employee_id')
        .notEmpty()
        .withMessage('Employee ID required'),
    body('candidate_ids')
        .notEmpty()
        .withMessage('candidate IDs are required'),
    body('status')
        .notEmpty()
        .withMessage('Please provide status'),
    body('status')
        .isIn(['Approved', 'Rejected', 'need_to_discuss'])
        .withMessage(`Status must be one of: ${['Approved', 'Rejected', 'need_to_discuss'].join(', ')}`)
];


router.validateGetApprovalMemberListForCandidate = [
    body('candidate_doc_id')
        .notEmpty()
        .withMessage('Please provide candidate id')
];

/*** Validate Filter Job Listing For HOD  ********/
router.validateApplyJobListHod = [
    body('employee_doc_id')
        .notEmpty()
        .withMessage('Employee ID required'),
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

router.sendApprovalNoteOfferMailToCandidates = [
    uploadMultipleImageFileName,

    body('approval_note_id')
        .notEmpty()
        .withMessage('Approval note id is required'),

    body('candidate_id')
        .notEmpty()
        .withMessage('Candidate id is required'),

    body('contents')
        .notEmpty()
        .withMessage('Mail contents are required'),

    body('selected_doc')
        .optional()
        .isString()
        .withMessage('Selected document must be a string'),

    body('salary_structure')
        .optional()
        .custom((value) => {
            if (typeof value === 'string') {
                try {
                    JSON.parse(value);
                } catch (e) {
                    throw new Error('salary_structure must be valid JSON');
                }
            }
            return true;
        })
];

module.exports = router;