const { body } = require('express-validator');


const express = require('express');
const router = express.Router();

//Upload middleware 
const { uploadExcelFile, uploadPDFDocxFile, uploadFile, uploadPDFDocxJpegFile , uploadPDFDocxJpegFileForEmployee } = require('../../../fileUploads');
var uploadExcelF = uploadExcelFile.single('filename');  
var uploadDoc = uploadFile.single('filename');  
var uploadPDFDocxJpeg = uploadPDFDocxJpegFile.single('filename');
var uploadPDFDocx = uploadPDFDocxFile.single('filename');
var uploadAssetHandOverForm = uploadPDFDocxFile.fields([{ name: 'asset_handover_form' },{ name: 'exit_interview_form' }]);   
var uploadEmployeePDFDocxJpegFile = uploadPDFDocxJpegFileForEmployee.single('filename');
const allowedStatuses = ['Active', 'Inactive'];


/*** Validate Employee Add ********/
router.validateImportEmployeeData = [
    uploadExcelF
];
 
router.validateImportEmployeeDataSecond = [
    body("employee_data").isArray().withMessage("employee_data must be an array"),

    /*body("employee_data.*.project_id")
        .trim()
        .notEmpty().withMessage("Project ID is required")
        .isMongoId().withMessage("Invalid Project ID format"), 
       
    body("employee_data.*.designation_id")
        .trim()
        .notEmpty().withMessage("Designation ID is required")
        .isMongoId().withMessage("Invalid Designation ID format"),
    */
    body("employee_data.*.designation_name")
        .trim()
        .notEmpty().withMessage("Designation Name is required")
        .isLength({ min: 2 }).withMessage("Designation Name must be at least 2 characters"),

    body("employee_data.*.employee_type")
        .trim()
        .notEmpty().withMessage("Employee Type is required")
        .isLength({ min: 2 }).withMessage("Employee Type must be at least 2 characters"),

    body("employee_data.*.employee_id")
        .notEmpty().withMessage("Employee ID is required")
        .isNumeric().withMessage("Employee ID must be a number"),

    body("employee_data.*.employee_name")
        .trim()
        .notEmpty().withMessage("Employee Name is required")
        .isLength({ min: 2 }).withMessage("Employee Name must be at least 2 characters"),

    /*body("employee_data.*.employee_email")
        .trim()
        .notEmpty().withMessage("Employee Email is required")
        .isEmail().withMessage("Invalid Email format"),

    body("employee_data.*.employee_mobile_no")
        .notEmpty().withMessage("Employee Mobile No is required")
        .isNumeric().withMessage("Mobile No must be a number")
        .isLength({ min: 10, max: 15 }).withMessage("Mobile No must be 10-15 digits"),*/

    body("employee_data.*.gender")
        .trim()
        .notEmpty().withMessage("Gender is required")
        .isIn(["male", "female", "other","Male","Female","Other","MALE","FEMALE","OTHER"]).withMessage("Gender must be male, female, or other"),

    body("employee_data.*.designation")
        .trim()
        .notEmpty().withMessage("Designation is required")
        .isLength({ min: 2 }).withMessage("Designation must be at least 2 characters"),

    body("employee_data.*.department_name")
        .trim()
        .notEmpty().withMessage("Department Name is required")
        .isLength({ min: 2 }).withMessage("Department Name must be at least 2 characters"),

    body("employee_data.*.division")
        .trim()
        .notEmpty().withMessage("Division is required")
        .isLength({ min: 2 }).withMessage("Division must be at least 2 characters"),

    body("employee_data.*.grade")
        .trim()
        .notEmpty().withMessage("Grade is required")
        .isLength({ min: 1 }).withMessage("Grade must be at least 1 character"),
];

/*** Validate Employee salary Import Data  ********/
router.validateImportEmployeeSalaryData = [
    // body('job_type')
    //     .isIn(['onRole', 'onContract','Empaneled'])
    //     .withMessage('Job type must be either onRole or onContract or Empaneled'),
    body('job_type')
        .isLength({ min: 3 })
        .withMessage('Job type must be either onRole or onContract or Empaneled'),

    body('employee_salary').isArray().withMessage('Employee salary must be an array'),

    body('employee_salary.*.employee_id')
        .isNumeric().withMessage('Employee ID must be a number')
        .notEmpty().withMessage('Employee ID is required'),

    body('employee_salary.*.basic_salary')
        .isNumeric().withMessage('Basic salary must be a number')
        .notEmpty().withMessage('Basic salary is required')
        .custom((value) => value > 0).withMessage('Basic salary must be greater than zero'),

    body().custom((req) => {
        if (req.job_type === 'onRole') {
        const errors = [];

        req.employee_salary.forEach((salary, index) => {
            const requiredFields = [
            'basic_salary',
            'salary_total',
            'ctc_per_month',
            'ctc_per_anum',
            'salary_hra',
            'salary_da'
            ];

            requiredFields.forEach(field => {
            if (!salary[field]) {
                errors.push({
                msg: `${field} is required for onRole job type`,
                param: `employee_salary[${index}].${field}`,
                location: 'body'
                });
            }
            });
        });

        if (errors.length) {
            throw { errors };
        }
        }
        return true;
    })
];



/*** Validate Employee Registration  ********/
router.validateEmployeeRegistration = [
    body('name')
        .isLength({ min: 3 })
        .withMessage('Name must be at least 3 characters long'),
    body('mobile_no')
        .isLength({ min: 10 })
        .withMessage('Mobile No must be at 10 numbers long'),
    body('email')
        .isEmail()
        .withMessage('Please provide a valid email address')
];
 

/*** Validate Employee Edit Profile  ********/
router.validateEditEmployee = [ 
    body('_id')
        .isLength({ min: 3 })
        .withMessage('User ID is Blank/Wrong' ),
    body('name')
        .isLength({ min: 3 })
        .withMessage('Name must be at least 3 characters long'),
    body('mobile_no')
        .isLength({ min: 10 })
        .withMessage('Mobile No must be at 10 numbers long')
];

router.validateDeleteEmployee = [
    body('_id')
        .notEmpty()
        .withMessage('Please provide document ID')
];

router.validateEmployeeById = [
    body('_id')
        .notEmpty()
        .withMessage('Please provide document ID') 
];


/*** Validate Employee Change Status ********/
router.validateChangeEmployeeStatus = [
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


/*** Validate Employee List ********/
router.validateEmployeeList = [
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


/*** Validate Employee OnBoarding  ********/
router.validateEmployeeGeneralInfo = [
    body('name')
        .isLength({ min: 3 })
        .withMessage('Name must be at least 3 characters long'),
    body('mobile_no')
        .isLength({ min: 10 })
        .withMessage('Mobile No must be at 10 numbers long'),
    body('email')
        .isEmail()
        .withMessage('Please provide a valid email address'),
    body('employee_code')
        .notEmpty()
        .withMessage('Employee Code is Required'),
    body('father_name')
        .notEmpty()
        .withMessage('Father Name is Required'),
    body('gender')
        .notEmpty()
        .withMessage('Gender is Required'),
    body('gender')
        .isIn(['Male','Female','Other'])
        .withMessage(`Gender must be one of: ${['Male','Female','Other'].join(', ')}`),
    body('marital_status')
        .notEmpty()
        .withMessage('Marital Status is Required'),
    body('marital_status')
        .isIn(['Single','Married'])
        .withMessage(`Marital Status must be one of: ${['Single','Married'].join(', ')}`),
    body('employee_type')
        .notEmpty()
        .withMessage('Employee Type is Required'),
    body('employee_type')
        .isIn(['onRole','onContract','emPanelled'])
        .withMessage(`Employee Type must be one of: ${['onRole','onContract','emPanelled'].join(', ')}`)
];



/*** Validate Employee Education Details  ********/
router.validateEmployeeEducationInfo = [
    body('_id')
        .notEmpty()
        .withMessage('Document ID is Blank'),
    body('education')
        .notEmpty()
        .withMessage('Education List is Blank')
];

/*** Validate Employee Experience Details  ********/
router.validateEmployeeExperienceInfo = [
    body('_id')
        .notEmpty()
        .withMessage('Document ID is Blank'),
    body('experience')
        .notEmpty()
        .withMessage('Experience List is Blank')
];

/*** Validate Employee Classification Details  ********/
router.validateEmployeeClassificationInfo = [
    body('_id')
        .notEmpty()
        .withMessage('Document ID is Blank'),
    body('joining_date')
        .notEmpty()
        .withMessage('Joining date is Blank'),
    body('probation_complete_date')
        .notEmpty()
        .withMessage('Probation complete date is Blank'),
    body('appraisal_date')
        .notEmpty()
        .withMessage('Appraisal date is Blank'),
    body('branch')
        .notEmpty()
        .withMessage('Branch is Blank'),
    body('department')
        .notEmpty()
        .withMessage('Department is Blank'),
    body('attendance')
        .notEmpty()
        .withMessage('Attendance is Blank'),
    /*body('division')
        .notEmpty()
        .withMessage('Division is Blank'),*/
    body('grade')
        .notEmpty()
        .withMessage('Grade is Blank')
];

/*** Validate Employee Pf /Bank  Details  ********/
router.validateEmployeePFInfo = [
    body('_id')
        .notEmpty()
        .withMessage('Document ID is Blank'),
    body('pan_number')
        .notEmpty()
        .withMessage('PAN Number is Blank'),
    body('bank_account_number')
        .notEmpty()
        .withMessage('Bank Account Number is Blank'),
    body('bank_name')
        .notEmpty()
        .withMessage('Bank Name is Blank'),
    body('bank_branch')
        .notEmpty()
        .withMessage('Bank Branch is Blank'),
    body('ifsc_code')
        .notEmpty()
        .withMessage('IFSC Code is Blank')
];

/*** Validate Employee Address Details  ********/
router.validateEmployeeAddressInfo = [
    body('_id')
        .notEmpty()
        .withMessage('Document ID is Blank'),
    body('present_address')
        .notEmpty()
        .withMessage('locality area is Blank')
];

/*** Validate Employee Salary Details  ********/
router.validateEmployeeSalaryInfo = [
    body('_id')
        .notEmpty()
        .withMessage('Document ID is Blank'),
];


/*** Validate Employee Count Details ********/
router.validateEmployeeCountRecords = [ 
    body('type')
        .notEmpty()
        .withMessage('Type is Required'),
    body('type')
        .isIn(['Total','onNotice','Resigned','AvailableJobs','workAnniversary','todayBirthday','inductionDue','appraisalDue','LeaveRequest'])
        .withMessage(`Type must be one of: ${['Total','onNotice','Resigned','AvailableJobs','workAnniversary','todayBirthday','inductionDue','appraisalDue','LeaveRequest'].join(', ')}`)
];

/*** Validate Employee kpi kra jd Details ********/
router.validateEmployeeKPIKraJdRecords = [ 
    body('_id')
        .notEmpty()
        .withMessage('Document ID is Required'),
    body('kpi_kra_jd_data')
        .notEmpty()
        .withMessage('Data is Required'),
    body('type')
        .isIn(['jd'])
        .withMessage(`Type must be one of: ${['jd'].join(', ')}`)
];

/*** Validate Employee FNF  Details ********/
router.validateEmployeeFnf = [ 
    uploadAssetHandOverForm,
    body('_id')
        .notEmpty()
        .withMessage('Document ID is required'),
    body('termination_mode')
        .notEmpty()
        .withMessage('Termination mode is required'),
    body('termination_mode')
        .isIn(['Terminated','Resigned','Retired','Contract-Closer','Project-Closer'])
        .withMessage(`Type must be one of: ${['Terminated','Resigned','Retired','Contract-Closer','Project-Closer'].join(', ')}`),
    body('ejection_mode')
        .notEmpty()
        .withMessage('Ejection mode is blank'), 
    body('ejection_mode')
        .isIn(['Immediate','Notice'])
        .withMessage(`Type must be one of: ${['Immediate','Notice'].join(', ')}`),
    body('termination_reason')
        .notEmpty()
        .withMessage('Termination reason is blank'),
    body('date_of_leaving')
        .notEmpty()
        .withMessage(`Date Of leaving is required`)
];


/*** Validate Employee Notice Close Details  ********/
router.validateNoticeClose = [
    body('_id')
        .notEmpty()
        .withMessage('Document ID is Blank'),
];

/*** Validate Employee kpi kra Details ********/
router.validateEmployeeKPIKraData = [ 
    body('_id')
        .notEmpty()
        .withMessage('Document ID is Required'),
    body('session_year')
        .notEmpty()
        .withMessage('Session Year is Required'),
    body('kpi_kra_data')
        .notEmpty()
        .withMessage('KPI KRA Data is Required'),  
];

/*** Validate Employee Reporting Details ********/
router.validateUpdateReportingManagerData = [ 
    body('_id')
        .notEmpty()
        .withMessage('Document ID is Required'),
    body('manager_id')
        .notEmpty()
        .withMessage('Manager ID is Required'),
    body('manager_name')
        .notEmpty()
        .withMessage('Manager Name is Required'),  
    body('work_type')
        .notEmpty()
        .withMessage('Work Type is Required'),  
];

/*** Validate Delete Reporting Manager of the Employee  ********/
router.validateDeleteReportingManagerData = [
    body('_id')
        .notEmpty()
        .withMessage('Document ID is Blank'),
    body('manager_id')
        .notEmpty()
        .withMessage('Manager Document ID is Blank'),
];


/*** Validate Upload Signature ********/
router.validateUploadEmployeeSignature = [
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

/*** Validate Upload Docs ********/
router.validateUploadEmployeeKycDocs = [
    uploadEmployeePDFDocxJpegFile,
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

/*** Validate Add Family Details ********/
router.validateAddEmployeeFamilyDetails = [
    body('employee_doc_id')
        .notEmpty()
        .withMessage('Document ID required'), 
    body('family_data')
        .notEmpty()
        .withMessage('Please add family data')
];

/*** Validate Reference checker form data ********/
router.validateAddReferenceCheckData = [
    body('employee_doc_id')
        .notEmpty()
        .withMessage('Document ID required'), 
    body('name_Of_candidate')
        .notEmpty()
        .withMessage('Name Of Candidate Required'),
    body('date')
        .notEmpty()
        .withMessage('Date Required'),
    body('designation_for_applied')
        .notEmpty()
        .withMessage('Designation For Applied Required'),
    body('referee_name')
        .notEmpty()
        .withMessage('Referee(s) Name Required'),
    body('name_of_organization')
        .notEmpty()
        .withMessage('Name Of Organization Required'),
    body('mode_of_reference')
        .notEmpty()
        .withMessage('Mode of Reference Check (Phone / Email) Required'),
    body('mentioned_contact_id')
        .notEmpty()
        .withMessage('Mentioned Contact Id Required'),
    body('how_long_you_know')
        .notEmpty()
        .withMessage('How Long You know Him / Her ? Required'),
    body('in_what_capacity')
        .notEmpty()
        .withMessage('In What Capacity Required'),
    body('worked_with_you_organization')
        .notEmpty()
        .withMessage('I Understand That He / She Worked with you Organization As Required'),
    body('worked_with_you_from_date')
        .notEmpty()
        .withMessage('From Date Required'),
    body('overall_work_performance')
        .notEmpty()
        .withMessage('Overall work performance Required')
];

/*** Validate Induction Form Data ********/
router.validateAddInductionFormData = [
    uploadEmployeePDFDocxJpegFile,
    body('employee_doc_id')
        .notEmpty()
        .withMessage('Document ID required'), 
    /*body('date')
        .notEmpty()
        .withMessage('Date Required'),
    body('duration')
        .notEmpty()
        .withMessage('Duration Required'),
    body('location')
        .notEmpty()
        .withMessage('Location Required'),
    body('location_id')
        .notEmpty()
        .withMessage('Location ID Required'),
    body('name_of_facilitators')
        .notEmpty()
        .withMessage('Name Of Facilitators Required'),
    body('venue')
        .notEmpty()
        .withMessage('Venue Required'),
    body('organization')
        .notEmpty()
        .withMessage('Please choose at-least one Option from Organization'),
    body('facilities_option_1')
        .notEmpty()
        .withMessage('Please choose at-least one Option from Facilities from point 1'),
    body('facilities_option_2')
        .notEmpty()
        .withMessage('Please choose at-least one Option from Facilities from point 2'),
    body('subject_content_1')
        .notEmpty()
        .withMessage('Please choose at-least one Option from Subject And Content from point 1'),
    body('subject_content_2')
        .notEmpty()
        .withMessage('Please choose at-least one Option from Subject And Content from point 2'),
    body('subject_content_3')
        .notEmpty()
        .withMessage('Please choose at-least one Option from Subject And Content from point 3'),
    body('subject_content_4')
        .notEmpty()
        .withMessage('Please choose at-least one Option from Subject And Content from point 4'),
    body('presentation_1')
        .notEmpty()
        .withMessage('Please choose at-least one Option from Presentation / Pedagogy from point 1'),
    body('presentation_2')
        .notEmpty()
        .withMessage('Please choose at-least one Option from Presentation / Pedagogy from point 2'),
    body('presentation_3')
        .notEmpty()
        .withMessage('Please choose at-least one Option from Presentation / Pedagogy from point 3'),
    body('over_all_usefulness_1')
        .notEmpty()
        .withMessage('Please choose at-least one Option from Over All / Usefulness from point 1'),
    body('over_all_usefulness_2')
        .notEmpty()
        .withMessage('Please choose at-least one Option from Over All / Usefulness from point 2'),
    body('others_1')
        .notEmpty()
        .withMessage('Please enter some Others Data in option 1'),
    body('others_2')
        .notEmpty()
        .withMessage('Please enter some Others Data in option 2'),
    body('participant_name')
        .notEmpty()
        .withMessage('Participant Name Required'),
    body('participant_designation')
        .notEmpty()
        .withMessage('Participant Designation Required'),
    body('participant_department')
        .notEmpty()
        .withMessage('Participant Department Required'),
    body('date_of_joining')
        .notEmpty()
        .withMessage('Date Of Joining Required'),
    body('employee_code')
        .notEmpty()
        .withMessage('Employee Code Required')*/
];

/*** Validate Joining Kit Data ********/
router.validateUploadEmployeeJoiningKit = [
    uploadEmployeePDFDocxJpegFile,
    body('document_name')
        .notEmpty()
        .withMessage('Document Name required'),
    body('employee_doc_id')
        .notEmpty()
        .withMessage('Employee Document ID required')
];

/*** Validate Offer Letter Data ********/
router.validateUploadEmployeeOfferLetter = [
    uploadEmployeePDFDocxJpegFile,
    body('document_name')
        .notEmpty()
        .withMessage('Document Name required'),
    body('employee_doc_id')
        .notEmpty()
        .withMessage('Employee Document ID required')
];

/*** Validate Physical Induction Form Data ********/
router.validateUploadEmployeePhysicalForm = [
    uploadEmployeePDFDocxJpegFile,
    body('document_name')
        .notEmpty()
        .withMessage('Document Name required'),
    body('employee_doc_id')
        .notEmpty()
        .withMessage('Employee Document ID required')
];

/*** Validate Appointment Letter Data ********/
router.validateUploadEmployeeAppointmentLetter = [
    uploadEmployeePDFDocxJpegFile,
    body('document_name')
        .notEmpty()
        .withMessage('Document Name required'),
    body('employee_doc_id')
        .notEmpty()
        .withMessage('Employee Document ID required')
];

/*** Validate delete documents Data ********/
router.validateDeleteEmployeeDocuments = [ 
    body('onboard_doc_id')
        .notEmpty()
        .withMessage('Onboard Document ID required'),
    body('employee_doc_id')
        .notEmpty()
        .withMessage('Employee Document ID required'),
    body('doc_type')
        .notEmpty()
        .withMessage('Document type is blank'), 
    body('doc_type')
        .isIn(['docs','joining_kit_docs','offer_letter_docs','appointment_letter_docs'])
        .withMessage(`Type must be one of: ${['docs','joining_kit_docs','offer_letter_docs','appointment_letter_docs'].join(', ')}`),
]

module.exports = router;