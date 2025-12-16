const express = require('express');
const router  = express.Router();


const { verifyToken } = require('../../middlewares/verifyToken');
const { asyncErrorHandler } = require('../../utils/asyncErrorHandler');
const { generateHashPassword } = require('../../middlewares/myFilters');


const EmployeeAuth = require('../../controllers/Employee/Login/EmployeeAuth');
const { validateLoginWithEmail, validateLoginOTP } = require('../../middlewares/validators/Candidate/Login/validate');


/**
 * @description Candidate User Login APIs
*/
router.post('/loginWithEmail', validateLoginWithEmail,  EmployeeAuth.checkLoginUserWithEmail  ); 
router.post('/verifyLoginOtp', validateLoginOTP,  EmployeeAuth.verifyOTP  );


/**
 * @description Manage Jobs / 
 */
const EmpApplyJobController = require('../../controllers/Admin/ApplyJobsCandidate/ApplyJobController');
const { validateEmployeeInterviewList ,validateSaveFeedback,  validateGetCandidateAppointmentEmailList, validateEmployeeAcceptReject, validateScheduleInterViewDate,validateCandidateById  } = require('../../middlewares/validators/Admin/ApplyJobsCandidate/validate');

router.post( '/getInterviewCandidateList', verifyToken, validateEmployeeInterviewList , asyncErrorHandler( EmpApplyJobController.getCandidateListForEmployee ));
router.post( '/scheduleInterViewDate', verifyToken, validateScheduleInterViewDate , asyncErrorHandler( EmpApplyJobController.scheduleInterViewDate ));
router.post( '/acceptRejectInterview', verifyToken, validateEmployeeAcceptReject , asyncErrorHandler( EmpApplyJobController.employeeAcceptRejectInterview ));
router.post( '/getCandidateById', verifyToken, validateCandidateById , asyncErrorHandler( EmpApplyJobController.getCandidateById ));
router.post( '/saveFeedback', verifyToken, validateSaveFeedback, asyncErrorHandler( EmpApplyJobController.saveFeedback ));
router.post( '/getCandidateAppointmentEmailList', verifyToken, validateGetCandidateAppointmentEmailList, asyncErrorHandler( EmpApplyJobController.getCandidateAppointmentEmailList )); 


/*Get Approval Note List for Employee*/
const EmpApprovalNoteController = require('../../controllers/Admin/ApprovalNote/ApprovalNoteController.js');
const { validateGetApprovalNoteById, validateApproveRejectAppointmentLetter, validateGetApprovalNoteFromList  } = require('../../middlewares/validators/Admin/ApprovalNote/validate.js');
router.post( '/getApprovalNoteFromList', verifyToken, validateGetApprovalNoteFromList , asyncErrorHandler( EmpApprovalNoteController.getApprovalNoteFromListForEmployee ));
router.post( '/getApprovalNoteById', verifyToken, validateGetApprovalNoteById , asyncErrorHandler( EmpApprovalNoteController.getAppraisalNoteById ));
router.post( '/approveRejectAppointmentLetter', verifyToken, validateApproveRejectAppointmentLetter, asyncErrorHandler( EmpApprovalNoteController.approveRejectAppointmentLetter )); 


/**
 * @description Manage Requisition / 
*/
const EmpRequisitionController = require('../../controllers/Admin/Requisition/RequisitionController');
const { validateRequisitionDataListForEmployee, validateRequisitionDataById } = require('../../middlewares/validators/Admin/Requisition/validate');

router.post( '/getRequisitionDataList', verifyToken, validateRequisitionDataListForEmployee , asyncErrorHandler( EmpRequisitionController.getRequisitionDataListForEmployee ));
router.post( '/getRequisitionDataById', verifyToken, validateRequisitionDataById , asyncErrorHandler( EmpRequisitionController.getRequisitionDataById ));



/**
 * @description Manage Jobs / 
 */
const EmpJobController = require('../../controllers/Admin/Jobs/JobsController');
const { validateJobById } = require('../../middlewares/validators/Admin/Job/validate');
 
router.post( '/getJobById', verifyToken, validateJobById , asyncErrorHandler( EmpJobController.getJobById ));



/**
 * @description Manage Employee Leave/
 */
const EmpAttendanceController = require('../../controllers/Admin/Attendance/AttendanceController');
const { validateApplyLeave, validateGetAttendanceByEmployeeID } = require('../../middlewares/validators/Admin/Attendance/validate');

router.post( '/applyEmployeeLeave', verifyToken, validateApplyLeave, asyncErrorHandler( EmpAttendanceController.applyEmployeeLeave ));  
router.post( '/getAttendanceByEmployeeID', verifyToken, validateGetAttendanceByEmployeeID, asyncErrorHandler( EmpAttendanceController.getAttendanceByEmployeeID )); 



module.exports = router;