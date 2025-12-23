const express = require('express');
const router = express.Router();

const RoleUserController = require('../../controllers/Admin/RoleUser/RoleController');
const { verifyToken } = require('../../middlewares/verifyToken');
const { validateUserRegistration, validateAssignSpecialPermission, validateUserLoginWithPassword, validateRoleUserList, validateRoleUserProfileStatus, validateGetRoleUserByID, validateMenuAssign, validateUserLoginWithEmail, validateUserEdit, validateUserPassword, validateLoginOTP } = require('../../middlewares/validators/Admin/RoleUser/validate');
const { asyncErrorHandler } = require('../../utils/asyncErrorHandler');
const { generateHashPassword } = require('../../middlewares/myFilters');

router.post('/generateToken', RoleUserController.generateToken);
router.post('/verifyExistingToken', RoleUserController.verifyExistingToken);

/************** This is Cron job commond to run every 5 minutes to fetch records from Naukri ****************/
//https://hrapi.hlfppt.org/v1/admin/naukri/get_job_applicants_list
/************** This is Cron job commond to run every 5 minutes to fetch records from Naukri ************** */

/**
 * @description Role User Login with Email Password APIs //deprecated
 */
//router.post('/loginUserWithPassword', validateUserLoginWithPassword, RoleUserController.loginUserWithPassword ); 
//router.post( '/changeUserPassword', verifyToken, validateUserPassword , generateHashPassword, asyncErrorHandler( RoleUserController.changeUserPassword ));

/**
 * @description Role User APIs
*/
router.post('/loginUserWithEmail', validateUserLoginWithEmail, RoleUserController.checkLoginUserWithEmail);
router.post('/verifyLoginOtp', validateLoginOTP, RoleUserController.verifyOTP);
router.post('/addUser', verifyToken, validateUserRegistration, generateHashPassword, asyncErrorHandler(RoleUserController.addRoleUser));
router.post('/editUser', verifyToken, validateUserEdit, asyncErrorHandler(RoleUserController.editRoleUser));
router.post('/assignMenuPermission', verifyToken, validateMenuAssign, asyncErrorHandler(RoleUserController.assignMenuPermission));
router.post('/getRoleUserList', verifyToken, validateRoleUserList, asyncErrorHandler(RoleUserController.getRoleUserList));
router.post('/getRoleUserById', verifyToken, validateGetRoleUserByID, asyncErrorHandler(RoleUserController.getRoleUserById));
router.post('/changeRoleUserProfileStatus', verifyToken, validateRoleUserProfileStatus, asyncErrorHandler(RoleUserController.changeRoleUserProfileStatus));
router.post('/assignSpecialPermission', verifyToken, validateAssignSpecialPermission, asyncErrorHandler(RoleUserController.assignSpecialPermission));


/**
 * @description Manage CMS APIs/ controllers/ Validation/ Routers
 */
const CmsController = require('../../controllers/Admin/Cms/CmsController');
const { validateAddCms, validateEditCms, validateDeleteCms, validateCmsSlug, validateChangeCmsStatus } = require('../../middlewares/validators/Admin/Cms/validate');

router.post('/addCms', verifyToken, validateAddCms, asyncErrorHandler(CmsController.addCmsData));
router.post('/editCms', verifyToken, validateEditCms, asyncErrorHandler(CmsController.editCmsData));
router.post('/deleteCms', verifyToken, validateDeleteCms, asyncErrorHandler(CmsController.deleteCmsData));
router.post('/getCmsDataBySlug', verifyToken, validateCmsSlug, asyncErrorHandler(CmsController.getCmsDataBySlug));
router.post('/changeCmsStatus', verifyToken, validateChangeCmsStatus, asyncErrorHandler(CmsController.changeCmsStatus));
router.post('/allCmsList', verifyToken, asyncErrorHandler(CmsController.getAllCmsList));

/**
 * @description Manage Location Address APIs/ controllers/ Validation/ Routers
 */
const LocationController = require('../../controllers/Admin/Location/LocationController');
const { validateAddLocation, validateEditLocation, validateLocationWithStateList, validateDeleteLocation, validateLocationById, validateChangeLocationStatus, validateLocationList } = require('../../middlewares/validators/Admin/Location/validate');

router.post('/addLocation', verifyToken, validateAddLocation, asyncErrorHandler(LocationController.addLocationData));
router.post('/editLocation', verifyToken, validateEditLocation, asyncErrorHandler(LocationController.editLocation));
router.post('/deleteLocation', verifyToken, validateDeleteLocation, asyncErrorHandler(LocationController.deleteLocation));
router.post('/getLocationById', verifyToken, validateLocationById, asyncErrorHandler(LocationController.getLocationById));
router.post('/changeLocationStatus', verifyToken, validateChangeLocationStatus, asyncErrorHandler(LocationController.changeLocationStatus));
router.post('/getLocationList', verifyToken, validateLocationList, asyncErrorHandler(LocationController.getLocationList));
router.post('/getLocationWithStateList', verifyToken, validateLocationWithStateList, asyncErrorHandler(LocationController.getLocationWithStateList));

/**
 * @description Manage Designation APIs/ controllers/ Validation/ Routers
 */
const DesignationController = require('../../controllers/Admin/Designation/DesignationController');
const { validateAddDesignation, validateEditDesignation, validateProjectWiseDesignationPriority, validateProjectWiseDesignationList, validateDeleteDesignation, validateDesignationById, validateChangeDesignationStatus, validateDesignationList } = require('../../middlewares/validators/Admin/Designation/validate');

router.post('/addDesignation', verifyToken, validateAddDesignation, asyncErrorHandler(DesignationController.addDesignationData));
router.post('/editDesignation', verifyToken, validateEditDesignation, asyncErrorHandler(DesignationController.editDesignation));
router.post('/deleteDesignation', verifyToken, validateDeleteDesignation, asyncErrorHandler(DesignationController.deleteDesignation));
router.post('/getDesignationById', verifyToken, validateDesignationById, asyncErrorHandler(DesignationController.getDesignationById));
router.post('/changeDesignationStatus', verifyToken, validateChangeDesignationStatus, asyncErrorHandler(DesignationController.changeDesignationStatus));
router.post('/getDesignationList', verifyToken, validateDesignationList, asyncErrorHandler(DesignationController.getDesignationList));
router.post('/getProjectWiseDesignationList', verifyToken, validateProjectWiseDesignationList, asyncErrorHandler(DesignationController.getProjectWiseDesignationList));
router.post('/saveProjectWiseDesignationPriority', verifyToken, validateProjectWiseDesignationPriority, asyncErrorHandler(DesignationController.saveProjectWiseDesignationPriority));

/**
 * @description Manage Duration Master APIs/ controllers/ Validation/ Routers
 */
const DurationController = require('../../controllers/Admin/Duration/DurationController');
const { validateAddDuration, validateEditDuration, validateDeleteDuration, validateDurationById, validateChangeDurationStatus, validateDurationList } = require('../../middlewares/validators/Admin/Duration/validate');

router.post('/addDuration', verifyToken, validateAddDuration, asyncErrorHandler(DurationController.addDurationData));
router.post('/editDuration', verifyToken, validateEditDuration, asyncErrorHandler(DurationController.editDuration));
router.post('/deleteDuration', verifyToken, validateDeleteDuration, asyncErrorHandler(DurationController.deleteDuration));
router.post('/getDurationById', verifyToken, validateDurationById, asyncErrorHandler(DurationController.getDurationById));
router.post('/changeDurationStatus', verifyToken, validateChangeDurationStatus, asyncErrorHandler(DurationController.changeDurationStatus));
router.post('/getDurationList', verifyToken, validateDurationList, asyncErrorHandler(DurationController.getDurationList));

/**
 * @description Manage Project Master APIs/ controllers/ Validation/ Routers
 */
const ProjectController = require('../../controllers/Admin/Project/ProjectController');
const { validateAddProject, validateEditProject, validateProjectEmploymentList, validateEditProjectBudget, validateCloseProject, validateDeleteProject, validateProjectById, validateChangeProjectStatus, validateProjectList, validateProjectExtensionDate, validateProjectBudgetExtension } = require('../../middlewares/validators/Admin/Project/validate');

router.post('/addProject', verifyToken, validateAddProject, asyncErrorHandler(ProjectController.addProjectData));
router.post('/editProject', verifyToken, validateEditProject, asyncErrorHandler(ProjectController.editProject));
router.post('/deleteProject', verifyToken, validateDeleteProject, asyncErrorHandler(ProjectController.deleteProject));
router.post('/getProjectById', verifyToken, validateProjectById, asyncErrorHandler(ProjectController.getProjectById));
router.post('/changeProjectStatus', verifyToken, validateChangeProjectStatus, asyncErrorHandler(ProjectController.changeProjectStatus));
router.post('/getProjectList', verifyToken, validateProjectList, asyncErrorHandler(ProjectController.getProjectList));
router.post('/extendProjectDuration', verifyToken, validateProjectExtensionDate, asyncErrorHandler(ProjectController.extendProjectDuration));
router.post('/extendProjectBudget', verifyToken, validateProjectBudgetExtension, asyncErrorHandler(ProjectController.extendProjectBudget));
router.post('/closeProject', verifyToken, validateCloseProject, asyncErrorHandler(ProjectController.closeProject));
router.post('/editProjectBudget', verifyToken, validateEditProjectBudget, asyncErrorHandler(ProjectController.editProjectBudget));
router.post('/addProjectBudgetLedger', verifyToken, asyncErrorHandler(ProjectController.addProjectBudgetLedger));

router.post('/editProjectLocation', verifyToken, asyncErrorHandler(ProjectController.editProjectLocation));
router.post('/getProjectEmploymentList', verifyToken, validateProjectEmploymentList, asyncErrorHandler(ProjectController.getProjectEmploymentList));

/**
 * @description Manage Holiday Calender / 
 */
const HolidaysController = require('../../controllers/Admin/Holidays/HolidaysController');
const { validateAddHolidays, validateEditHolidays, validateDeleteHolidays, validateHolidaysById, validateChangeHolidaysStatus, validateHolidaysList } = require('../../middlewares/validators/Admin/Holidays/validate');

router.post('/addHoliday', verifyToken, validateAddHolidays, asyncErrorHandler(HolidaysController.addHolidayData));
router.post('/editHoliday', verifyToken, validateEditHolidays, asyncErrorHandler(HolidaysController.editHoliday));
router.post('/deleteHoliday', verifyToken, validateDeleteHolidays, asyncErrorHandler(HolidaysController.deleteHoliday));
router.post('/getHolidayById', verifyToken, validateHolidaysById, asyncErrorHandler(HolidaysController.getHolidayById));
router.post('/changeHolidayStatus', verifyToken, validateChangeHolidaysStatus, asyncErrorHandler(HolidaysController.changeHolidayStatus));
router.post('/getHolidayList', verifyToken, validateHolidaysList, asyncErrorHandler(HolidaysController.getHolidayList));
router.post('/getHolidayListByDateRange', verifyToken, validateHolidaysList, asyncErrorHandler(HolidaysController.getHolidayListDateRangeData));


/**
 * @description Manage JOb Types / 
 */
const JobTypesController = require('../../controllers/Admin/JobTypes/JobController');
const { validateAddJobType, validateEditJobType, validateDeleteJobType, validateJobTypeById, validateChangeJobTypeStatus, validateJobTypeList } = require('../../middlewares/validators/Admin/JobTypes/validate');

router.post('/addJobType', verifyToken, validateAddJobType, asyncErrorHandler(JobTypesController.AddJobTypesData));
router.post('/editJobType', verifyToken, validateEditJobType, asyncErrorHandler(JobTypesController.editJobTypeData));
router.post('/deleteJobTypeById', verifyToken, validateDeleteJobType, asyncErrorHandler(JobTypesController.deleteJobTypeById));
router.post('/getJobTypeById', verifyToken, validateJobTypeById, asyncErrorHandler(JobTypesController.getJobTypeById));
router.post('/changeJobTypeStatus', verifyToken, validateChangeJobTypeStatus, asyncErrorHandler(JobTypesController.changeJobTypeStatus));
router.post('/getJobTypeList', verifyToken, validateJobTypeList, asyncErrorHandler(JobTypesController.getJobTypeList));

/**
 * @description Manage Department Types / 
 */
const DepartmentController = require('../../controllers/Admin/Department/DepartmentController');
const { validateAddDepartment, validateEditDepartment, validateDeleteDepartment, validateDepartmentById, validateChangeDepartmentStatus, validateDepartmentList } = require('../../middlewares/validators/Admin/Department/validate');

router.post('/addDepartment', verifyToken, validateAddDepartment, asyncErrorHandler(DepartmentController.AddDepartmentData));
router.post('/editDepartment', verifyToken, validateEditDepartment, asyncErrorHandler(DepartmentController.editDepartmentData));
router.post('/deleteDepartmentById', verifyToken, validateDeleteDepartment, asyncErrorHandler(DepartmentController.deleteDepartmentById));
router.post('/getDepartmentById', verifyToken, validateDepartmentById, asyncErrorHandler(DepartmentController.getDepartmentById));
router.post('/changeDepartmentStatus', verifyToken, validateChangeDepartmentStatus, asyncErrorHandler(DepartmentController.changeDepartmentStatus));
router.post('/getDepartmentList', verifyToken, validateDepartmentList, asyncErrorHandler(DepartmentController.getDepartmentList));

/**
 * @description Manage Benefits Master / 
 */
const BenefitsController = require('../../controllers/Admin/Benefits/BenefitController');
const { validateAddBenefits, validateEditBenefits, validateDeleteBenefits, validateBenefitsById, validateChangeBenefitsStatus, validateBenefitsList } = require('../../middlewares/validators/Admin/Benefits/validate');

router.post('/addBenefits', verifyToken, validateAddBenefits, asyncErrorHandler(BenefitsController.AddBenefitsData));
router.post('/editBenefits', verifyToken, validateEditBenefits, asyncErrorHandler(BenefitsController.editBenefitsData));
router.post('/deleteBenefitById', verifyToken, validateDeleteBenefits, asyncErrorHandler(BenefitsController.deleteBenefitsById));
router.post('/getBenefitById', verifyToken, validateBenefitsById, asyncErrorHandler(BenefitsController.getBenefitsById));
router.post('/changeBenefitStatus', verifyToken, validateChangeBenefitsStatus, asyncErrorHandler(BenefitsController.changeBenefitsStatus));
router.post('/getBenefitList', verifyToken, validateBenefitsList, asyncErrorHandler(BenefitsController.getBenefitsList));

/**
 * @description Manage Salary Range / 
 */
const SalaryRangeController = require('../../controllers/Admin/SalaryRange/SalaryRangeController');
const { validateAddSalaryRange, validateEditSalaryRange, validateDeleteSalaryRange, validateSalaryRangeById, validateChangeSalaryRangeStatus, validateSalaryRangeList } = require('../../middlewares/validators/Admin/SalaryRange/validate');

router.post('/addSalaryRange', verifyToken, validateAddSalaryRange, asyncErrorHandler(SalaryRangeController.AddSalaryRangeData));
router.post('/editSalaryRange', verifyToken, validateEditSalaryRange, asyncErrorHandler(SalaryRangeController.editSalaryRangeData));
router.post('/deleteSalaryRangeById', verifyToken, validateDeleteSalaryRange, asyncErrorHandler(SalaryRangeController.deleteSalaryRangeById));
router.post('/getSalaryRangeById', verifyToken, validateSalaryRangeById, asyncErrorHandler(SalaryRangeController.getSalaryRangeById));
router.post('/changeSalaryRangeStatus', verifyToken, validateChangeSalaryRangeStatus, asyncErrorHandler(SalaryRangeController.changeSalaryRangeStatus));
router.post('/getSalaryRangeList', verifyToken, validateSalaryRangeList, asyncErrorHandler(SalaryRangeController.getSalaryRangeList));

/**
 * @description Manage Tags / 
 */
const TagsController = require('../../controllers/Admin/Tags/TagsController');
const { validateAddTag, validateEditTag, validateDeleteTag, validateTagById, validateChangeTagStatus, validateTagsList } = require('../../middlewares/validators/Admin/Tags/validate');

router.post('/addTag', verifyToken, validateAddTag, asyncErrorHandler(TagsController.AddTagData));
router.post('/editTag', verifyToken, validateEditTag, asyncErrorHandler(TagsController.editTagData));
router.post('/deleteTagById', verifyToken, validateDeleteTag, asyncErrorHandler(TagsController.deleteTagById));
router.post('/getTagById', verifyToken, validateTagById, asyncErrorHandler(TagsController.getTagById));
router.post('/changeTagStatus', verifyToken, validateChangeTagStatus, asyncErrorHandler(TagsController.changeTagStatus));
router.post('/getTagList', verifyToken, validateTagsList, asyncErrorHandler(TagsController.getTagList));

/**
 * @description Manage Education / 
 */
const EducationController = require('../../controllers/Admin/Education/EducationController');
const { validateAddEducation, validateEditEducation, validateDeleteEducation, validateEducationById, validateChangeEducationStatus, validateEducationList } = require('../../middlewares/validators/Admin/Education/validate');

router.post('/addEducation', verifyToken, validateAddEducation, asyncErrorHandler(EducationController.AddEducationData));
router.post('/editEducation', verifyToken, validateEditEducation, asyncErrorHandler(EducationController.editEducationData));
router.post('/deleteEducationById', verifyToken, validateDeleteEducation, asyncErrorHandler(EducationController.deleteEducationById));
router.post('/getEducationById', verifyToken, validateEducationById, asyncErrorHandler(EducationController.getEducationById));
router.post('/changeEducationStatus', verifyToken, validateChangeEducationStatus, asyncErrorHandler(EducationController.changeEducationStatus));
router.post('/getEducationList', verifyToken, validateEducationList, asyncErrorHandler(EducationController.getEducationList));

/**
 * @description Manage Jobs / 
 */
const JobController = require('../../controllers/Admin/Jobs/JobsController');
const { validateAddJob, validateEditJob, validateJobListPostedOnNaukri, validateDeleteJob, validateJobById, validateChangeJobStatus, validateJobList, validateCloneJobData } = require('../../middlewares/validators/Admin/Job/validate');

router.post('/addJob', verifyToken, validateAddJob, asyncErrorHandler(JobController.AddJobData));
router.post('/editJob', verifyToken, validateEditJob, asyncErrorHandler(JobController.editJobData));
router.post('/deleteJobById', verifyToken, validateDeleteJob, asyncErrorHandler(JobController.deleteJobById));
router.post('/getJobById', verifyToken, validateJobById, asyncErrorHandler(JobController.getJobById));
router.post('/changeJobStatus', verifyToken, validateChangeJobStatus, asyncErrorHandler(JobController.changeJobStatus));
router.post('/getJobList', verifyToken, validateJobList, asyncErrorHandler(JobController.getJobList));
router.post('/cloneJob', verifyToken, validateCloneJobData, asyncErrorHandler(JobController.cloneJobData));
router.post('/getJobDropDownList', verifyToken, validateJobList, asyncErrorHandler(JobController.getJobDropDownList));
router.post('/getJobListPostedOnNaukri', verifyToken, validateJobListPostedOnNaukri, asyncErrorHandler(JobController.getJobListPostedOnNaukri));

/**
 * @description Manage Candidate And Its Jobs / 
 */
const ApplyJobController = require('../../controllers/Admin/ApplyJobsCandidate/ApplyJobController');
const { validateAddApplyJob, validateEmployeeAcceptReject, validateApplyJobListHod, validateGetApprovalMemberListForCandidate, validateResendApplicantForm, validateSkipOfferJoiningLetter, validateApproveApprovalNoteByHodSir, validateApproveApprovalNoteByCeoSir, validateSaveCandidateIDcardData, validateSaveSkippedInterviewCandidateFeedback, validatePostJobOnDevnet, validateSendAppointmentLetterToCandidateAfterApproval, validateGetCandidateAppointmentEmailListInAdmin, validateGetCandidateEmailContent, validateUpdateInterviewDoneStatus, validateRemoveInterviewerFromScheduleInterView, validateAddInterviewerInScheduleInterView, validateScoringSheet, validateSaveDeclarationForm, validateSaveAnnexureElevenForm, validateSaveApplicantForm, validateUploadOnboardDocuments, validateVerifyOnBoardDocuments, validateRemoveOnboardDocuments, validateScheduleBulkInterView, validateGetOnboardDocuments, sendApprovalNoteOfferMailToCandidates, validateGetBulkCandidateListByJobId, validateApplyJobListCeo, validateImportCandidateDataJson, validateAddManualCandidate, validateGetCandidateJobRating, validateUpdateHireStatus, validatePutCandidateToWaitingOrSelected, validateApproveApprovalNoteByEmployee, validateAddJobOfferApprovalMember, validateGetJobOfferApprovalMemberList, validateSendJobOfferApprovalMailToMember, validateUpdateJobOfferAmount, validateOfferJob, validateExtendJobOfferDate, validateCandidateProfileStatus, validateImportCandidateData, validateUploadDocs, validateUploadResume, validateCandidateByNameEmail, validateCandidateInterviewList, validateVerifyOffer, validateRejectDocuments, validateSaveRecommendationStatus, validateSaveFeedback, validateEditApplyJob, validateCandidateById, validateDeleteApplyJob, validateDeleteAppliedJob, validateApplyJobById, validateChangeApplyJobStatus, validateApplyJobList, validateCandidateShortList, validateRejectDeleteInterview, validateScheduleInterView, validateGetUpcomingInterViewList, validateCountRecords } = require('../../middlewares/validators/Admin/ApplyJobsCandidate/validate');

router.post('/applyJob', verifyToken, validateAddApplyJob, asyncErrorHandler(ApplyJobController.addApplyJob));
router.post('/editAppliedJob', verifyToken, validateEditApplyJob, asyncErrorHandler(ApplyJobController.editApplyJob));
router.post('/deleteAppliedJobById', verifyToken, validateDeleteAppliedJob, asyncErrorHandler(ApplyJobController.deleteAppliedJobById));
router.post('/getAppliedJobById', verifyToken, validateApplyJobById, asyncErrorHandler(ApplyJobController.getApplyJobById));
router.post('/changeApplyJobStatus', verifyToken, validateChangeApplyJobStatus, asyncErrorHandler(ApplyJobController.changeApplyJobStatus));
router.post('/changeCandidateProfileJobStatus', verifyToken, validateCandidateProfileStatus, asyncErrorHandler(ApplyJobController.changeCandidateProfileJobStatus));
router.post('/getAppliedJobList', verifyToken, validateApplyJobList, asyncErrorHandler(ApplyJobController.getApplyJobList));
router.post('/deleteCandidateById', verifyToken, validateDeleteApplyJob, asyncErrorHandler(ApplyJobController.deleteCandidateById));
router.post('/getCandidateById', verifyToken, validateCandidateById, asyncErrorHandler(ApplyJobController.getCandidateById));
// Activity Functionality
router.post('/rejectDeleteInterview', verifyToken, validateRejectDeleteInterview, asyncErrorHandler(ApplyJobController.RejectDeleteInterview));
router.post('/shortListCandidates', verifyToken, validateCandidateShortList, asyncErrorHandler(ApplyJobController.shortListCandidates));
router.post('/scheduleInterView', verifyToken, validateScheduleInterView, asyncErrorHandler(ApplyJobController.scheduleInterView));
router.post('/scheduleBulkInterView', verifyToken, validateScheduleBulkInterView, asyncErrorHandler(ApplyJobController.scheduleBulkInterView));
router.post('/getUpcomingInterViewList', verifyToken, validateGetUpcomingInterViewList, asyncErrorHandler(ApplyJobController.getUpcomingInterViewList));
router.post('/countInterviewRecords', verifyToken, validateCountRecords, asyncErrorHandler(ApplyJobController.countInterviewRecords));
router.post('/saveFeedback', verifyToken, validateSaveFeedback, asyncErrorHandler(ApplyJobController.saveFeedback));
router.post('/saveRecommendationStatus', verifyToken, validateSaveRecommendationStatus, asyncErrorHandler(ApplyJobController.saveRecommendationStatus));

router.post('/extendJobOffer', verifyToken, validateExtendJobOfferDate, asyncErrorHandler(ApplyJobController.extendJobOfferDate));
router.post('/rejectDocuments', verifyToken, validateRejectDocuments, asyncErrorHandler(ApplyJobController.rejectDocuments));
router.post('/getCandidateByEmailName', verifyToken, validateCandidateByNameEmail, asyncErrorHandler(ApplyJobController.getCandidateByEmailName));
router.post('/getInterviewCandidateList', verifyToken, validateCandidateInterviewList, asyncErrorHandler(ApplyJobController.getCandidateListForAdmin));
router.post('/uploadResume', verifyToken, validateUploadResume, asyncErrorHandler(ApplyJobController.uploadResume));
router.post('/uploadKycDocs', verifyToken, validateUploadDocs, asyncErrorHandler(ApplyJobController.uploadKycDocuments));
router.post('/importCandidatesData', verifyToken, validateImportCandidateData, asyncErrorHandler(ApplyJobController.importCandidatesData));
router.post('/importCandidatesDataJson', verifyToken, validateImportCandidateDataJson, asyncErrorHandler(ApplyJobController.importCandidatesDataJson));
router.post('/updateJobOfferAmount', verifyToken, validateUpdateJobOfferAmount, asyncErrorHandler(ApplyJobController.updateJobOfferAmount));
router.post('/sendJobOfferApprovalMailToMember', verifyToken, validateSendJobOfferApprovalMailToMember, asyncErrorHandler(ApplyJobController.sendJobOfferApprovalMailToMember));
router.post('/getJobOfferApprovalMemberList', verifyToken, validateGetJobOfferApprovalMemberList, asyncErrorHandler(ApplyJobController.getJobOfferApprovalMemberList));
router.post('/getApprovalMemberListForCandidate', verifyToken, validateGetApprovalMemberListForCandidate, asyncErrorHandler(ApplyJobController.getApprovalMemberListForCandidate));
router.post('/addJobOfferApprovalMember', verifyToken, validateAddJobOfferApprovalMember, asyncErrorHandler(ApplyJobController.addJobOfferApprovalMember));
router.post('/approveApprovalNoteByEmployee', verifyToken, validateApproveApprovalNoteByEmployee, asyncErrorHandler(ApplyJobController.approveApprovalNoteByEmployee));
router.post('/approveApprovalNoteByCeoSir', verifyToken, validateApproveApprovalNoteByCeoSir, asyncErrorHandler(ApplyJobController.approveApprovalNoteByCeoSir));
router.post('/approveApprovalNoteByHodSir', verifyToken, validateApproveApprovalNoteByHodSir, asyncErrorHandler(ApplyJobController.approveApprovalNoteByHodSir));
router.post('/moveInterviewCandidateToWaitingOrSelected', verifyToken, validatePutCandidateToWaitingOrSelected, asyncErrorHandler(ApplyJobController.moveInterviewCandidateToWaitingOrSelected));
router.post('/updateHireStatus', verifyToken, validateUpdateHireStatus, asyncErrorHandler(ApplyJobController.updateHireStatus));
router.post('/getCandidateJobRating', verifyToken, validateGetCandidateJobRating, asyncErrorHandler(ApplyJobController.getCandidateJobRating));
router.post('/addManualJobCandidate', verifyToken, validateAddManualCandidate, asyncErrorHandler(ApplyJobController.addManualJobCandidate));
router.post('/getBulkCandidateListByJobId', verifyToken, validateGetBulkCandidateListByJobId, asyncErrorHandler(ApplyJobController.getBulkCandidateListByJobId));
router.post('/updateInterviewDoneStatus', verifyToken, validateUpdateInterviewDoneStatus, asyncErrorHandler(ApplyJobController.updateInterviewDoneStatus));

router.post('/getApplyJobListCeo', verifyToken, validateApplyJobListCeo, asyncErrorHandler(ApplyJobController.getApplyJobListCeo));
router.post('/changeCandidateDataInApprovalNote', verifyToken, asyncErrorHandler(ApplyJobController.changeCandidateDataInApprovalNote));
router.post('/getApplyJobListHod', verifyToken, validateApplyJobListHod, asyncErrorHandler(ApplyJobController.getApplyJobListHod));

router.post('/getOnboardDocuments', verifyToken, validateGetOnboardDocuments, asyncErrorHandler(ApplyJobController.getOnboardDocuments));
router.post('/verifyOnBoardDocuments', verifyToken, validateVerifyOnBoardDocuments, asyncErrorHandler(ApplyJobController.verifyOnBoardDocuments));

router.post('/saveApplicantForm', verifyToken, validateSaveApplicantForm, asyncErrorHandler(ApplyJobController.saveApplicantForm));
router.post('/saveAnnexureElevenForm', verifyToken, validateSaveAnnexureElevenForm, asyncErrorHandler(ApplyJobController.saveAnnexureElevenForm));
router.post('/saveDeclarationForm', verifyToken, validateSaveDeclarationForm, asyncErrorHandler(ApplyJobController.saveDeclarationForm));
router.post('/scoringSheet', verifyToken, validateScoringSheet, asyncErrorHandler(ApplyJobController.scoringSheet));
router.post('/getInterviewerListByJobId', verifyToken, validateScoringSheet, asyncErrorHandler(ApplyJobController.getInterviewerListByJobId));
router.post('/addInterviewerInScheduleInterView', verifyToken, validateAddInterviewerInScheduleInterView, asyncErrorHandler(ApplyJobController.addInterviewerInScheduleInterView));
router.post('/removeInterviewerFromScheduleInterView', verifyToken, validateRemoveInterviewerFromScheduleInterView, asyncErrorHandler(ApplyJobController.removeInterviewerFromScheduleInterView));
router.post('/getCandidateAppointmentEmailList', verifyToken, validateGetCandidateAppointmentEmailListInAdmin, asyncErrorHandler(ApplyJobController.getCandidateAppointmentEmailList));
router.post('/sendAppointmentLetterToCandidateAfterApproval', verifyToken, validateSendAppointmentLetterToCandidateAfterApproval, asyncErrorHandler(ApplyJobController.sendAppointmentLetterToCandidateAfterApproval));
router.post('/saveIDCardDetailsInCandidateProfile', verifyToken, validateSaveCandidateIDcardData, asyncErrorHandler(ApplyJobController.saveIDCardDetailsInCandidateProfile));
router.post('/saveSkippedInterviewCandidateFeedback', verifyToken, validateSaveSkippedInterviewCandidateFeedback, asyncErrorHandler(ApplyJobController.saveSkippedInterviewCandidateFeedback));
router.post('/resendApplicantForm', verifyToken, validateResendApplicantForm, asyncErrorHandler(ApplyJobController.resendApplicantForm));
router.post('/acceptRejectInterview', verifyToken, validateEmployeeAcceptReject, asyncErrorHandler(ApplyJobController.employeeAcceptRejectInterview));


/************** Deprecated API's Start Section ********/
//router.post( '/offerJob', verifyToken, validateOfferJob, asyncErrorHandler( ApplyJobController.offerJob ));
//this section is transfer to api name: send_approval_mail
/************** Deprecated API's End Section **********/
router.post('/send_joining_intimation_mail', verifyToken, asyncErrorHandler(ApplyJobController.sendJoiningIntimationMailToCandidates));
router.post('/send_approval_mail', verifyToken, sendApprovalNoteOfferMailToCandidates, asyncErrorHandler(ApplyJobController.sendApprovalNoteOfferMailToCandidates));
router.post('/uploadOnboardingDocuments', verifyToken, validateUploadOnboardDocuments, asyncErrorHandler(ApplyJobController.uploadOnboardingDocuments));
router.post('/removeOnboardingDocuments', verifyToken, validateRemoveOnboardDocuments, asyncErrorHandler(ApplyJobController.removeOnboardingDocuments));
router.post('/getCandidateEmailContent', verifyToken, validateGetCandidateEmailContent, asyncErrorHandler(ApplyJobController.getCandidateEmailContent));
router.post('/skipOfferJoiningLetter', verifyToken, validateSkipOfferJoiningLetter, asyncErrorHandler(ApplyJobController.skipOfferJoiningLetter));

router.post('/send_appointment_mail', verifyToken, asyncErrorHandler(ApplyJobController.sendAppointmentMailToCandidates));

/**
 * @description Send Rating mail to Employee / 
 */
const JobSchedulerController = require('../../controllers/Admin/CronJobs/JobSchedulerController.js');

router.post('/sendRatingMailForCandidate', verifyToken, asyncErrorHandler(JobSchedulerController.sendRatingMailForCandidate));



/**
 * @description Send a Mail To Davnet / 
 */
router.post('/postJobOnDevnet', verifyToken, validatePostJobOnDevnet, asyncErrorHandler(ApplyJobController.postJobOnDevnet));


/**
 * @description Manage Naukari Jobs publish/ 
 */
const PublishJobOnNaukri = require('../../controllers/Admin/NaukriPortal/PublishJob.js');
const { validateNaukriPublishJob, validateNaukriById, validateFetchApplications, validateNaukriUnPublishJob, validateNaukriSpecialization, validateNaukriPublishJobList, validateNaukriQualificationList } = require('../../middlewares/validators/Admin/NaukriPortal/validate.js');

router.get('/naukri/course_type_list', verifyToken, asyncErrorHandler(PublishJobOnNaukri.courseTypeList));
router.post('/naukri/qualification_list', verifyToken, validateNaukriQualificationList, asyncErrorHandler(PublishJobOnNaukri.qualificationList));
router.post('/naukri/specialization_list', verifyToken, validateNaukriSpecialization, asyncErrorHandler(PublishJobOnNaukri.specializationList));

router.post('/naukri/publish_job', verifyToken, validateNaukriPublishJob, asyncErrorHandler(PublishJobOnNaukri.publishJob));
router.post('/naukri/publish_job_details', verifyToken, validateNaukriUnPublishJob, asyncErrorHandler(PublishJobOnNaukri.getPublishJobDetails));
router.post('/naukri/unpublish_job', verifyToken, validateNaukriUnPublishJob, asyncErrorHandler(PublishJobOnNaukri.UnPublishJob));
router.post('/naukri/get_job_list', verifyToken, validateNaukriPublishJobList, asyncErrorHandler(PublishJobOnNaukri.getPublishJobList));
router.post('/naukri/fetchCandidates', verifyToken, validateNaukriById, asyncErrorHandler(PublishJobOnNaukri.fetchCandidatesFromNaukriByJobId));
router.get('/naukri/get_job_applicants_list', asyncErrorHandler(PublishJobOnNaukri.getApplicantsFromNaukriForCompany));



/**
 * @description Candidate Approval Note / 
 */
const ApprovalNoteController = require('../../controllers/Admin/ApprovalNote/ApprovalNoteController.js');
const { validateGetApprovalNoteById, validateApproveRejectAppointmentLetter, validateGetApprovalNoteFromListHod, validateGetPendingCandidateApprovalNotesListForHod, validateGetPendingCandidateApprovalNotesListForCeo, validateUpdateReferenceCheckFromAdmin, validateSkipReferenceCheckData, validateUpdateReferenceCheckDataByLink, validateUpdateReferenceCheckInApprovalNote, validateGetApprovalNoteFromListCeo, validateRemoveCandidateFromApprovalNoteById, validateDeleteApprovalNoteById, validateGetApprovalNoteFromList, validateDownloadApprovalNote } = require('../../middlewares/validators/Admin/ApprovalNote/validate.js');

router.post('/getAppraisalNoteById', verifyToken, validateGetApprovalNoteById, asyncErrorHandler(ApprovalNoteController.getAppraisalNoteById));
router.post('/getApprovalNoteFromList', verifyToken, validateGetApprovalNoteFromList, asyncErrorHandler(ApprovalNoteController.getApprovalNoteFromList));
router.post('/downloadApprovalNote', verifyToken, validateDownloadApprovalNote, asyncErrorHandler(ApprovalNoteController.downloadApprovalNote));
router.post('/deleteApprovalNoteById', verifyToken, validateDeleteApprovalNoteById, asyncErrorHandler(ApprovalNoteController.deleteApprovalNoteById));
router.post('/removeCandidateFromApprovalNoteById', verifyToken, validateRemoveCandidateFromApprovalNoteById, asyncErrorHandler(ApprovalNoteController.removeCandidateFromApprovalNoteById));
router.post('/getApprovalNoteFromListCeo', verifyToken, validateGetApprovalNoteFromListCeo, asyncErrorHandler(ApprovalNoteController.getApprovalNoteFromListCeo));
router.post('/getApprovalNoteFromListHod', verifyToken, validateGetApprovalNoteFromListHod, asyncErrorHandler(ApprovalNoteController.getApprovalNoteFromListHod));
router.post('/getPendingCandidateApprovalNotesListForCeo', verifyToken, validateGetPendingCandidateApprovalNotesListForCeo, asyncErrorHandler(ApprovalNoteController.getPendingCandidateApprovalNotesListForCeo));
router.post('/getPendingCandidateApprovalNotesListForHod', verifyToken, validateGetPendingCandidateApprovalNotesListForHod, asyncErrorHandler(ApprovalNoteController.getPendingCandidateApprovalNotesListForHod));
router.post('/getCountRecordsForApprovalNote', verifyToken, asyncErrorHandler(ApprovalNoteController.getCountRecordsForApprovalNote));
router.post('/updateReferenceCheckInApprovalNote', verifyToken, validateUpdateReferenceCheckInApprovalNote, asyncErrorHandler(ApprovalNoteController.updateReferenceCheckInApprovalNote));
router.post('/updateReferenceCheckDataByLink', verifyToken, validateUpdateReferenceCheckDataByLink, asyncErrorHandler(ApprovalNoteController.updateReferenceCheckDataByLink));
router.post('/skipReferenceCheckData', verifyToken, validateSkipReferenceCheckData, asyncErrorHandler(ApprovalNoteController.skipReferenceCheckData));
router.post('/updateReferenceCheckFromAdmin', verifyToken, validateUpdateReferenceCheckFromAdmin, asyncErrorHandler(ApprovalNoteController.updateReferenceCheckFromAdmin));
router.post('/approveRejectAppointmentLetter', verifyToken, validateApproveRejectAppointmentLetter, asyncErrorHandler(ApprovalNoteController.approveRejectAppointmentLetter));

router.post('/getAppraisalNoteDataById', verifyToken, validateGetApprovalNoteById, asyncErrorHandler(ApprovalNoteController.getAppraisalNoteDataById));

/**
 * @description Manage Candidate Discussion History / 
 */
const CandidateDiscussionController = require('../../controllers/Admin/CandidateDiscussionHistory/CandidateDiscussionController.js');
const { validateAddCandidateDiscussion, validateCandidateDiscussionList } = require('../../middlewares/validators/Admin/CandidateDiscussionHistory/validate.js');
router.post('/addCandidateDiscussion', verifyToken, validateAddCandidateDiscussion, asyncErrorHandler(CandidateDiscussionController.addCandidateDiscussion));
router.post('/CandidateDiscussionList', verifyToken, validateCandidateDiscussionList, asyncErrorHandler(CandidateDiscussionController.CandidateDiscussionList));


/*
 * @Description Manage Assessment And Its Tests / 
 */
const AssessmentController = require('../../controllers/Admin/Assessment/AssessmentController');
const { validateAddAssessment, validateDeleteAssessmentById, validateAssessmentList, validateEditAssessment, validateSingleAssessmentList, validateCheckAssessment } = require('../../middlewares/validators/Admin/Assessment/validate');

router.post('/addAssessment', verifyToken, validateAddAssessment, asyncErrorHandler(AssessmentController.addAssessment));
router.post('/editAssessment', verifyToken, validateEditAssessment, asyncErrorHandler(AssessmentController.editAssessment));
router.post('/getAssessmentList', verifyToken, validateApplyJobList, asyncErrorHandler(AssessmentController.getAssessmentList));
router.post('/getSingleAssessment', verifyToken, validateSingleAssessmentList, asyncErrorHandler(AssessmentController.getSingleAssessmentList));
router.post('/checkAssessment', verifyToken, validateCheckAssessment, asyncErrorHandler(AssessmentController.checkAssessmentData));
router.post('/getAssessmentList', verifyToken, validateAssessmentList, asyncErrorHandler(AssessmentController.getAssessmentList));
router.post('/deleteAssessmentById', verifyToken, validateDeleteAssessmentById, asyncErrorHandler(AssessmentController.deleteAssessmentById));


/**
 * @description Employee APIs
 */
const EmployeeController = require('../../controllers/Admin/Employee/EmployeeController');
const { validateEmployeeRegistration, validateDeleteEmployeeDocuments, validateUploadEmployeeSignature, validateImportEmployeeSalaryData, validateUploadEmployeeAppointmentLetter, validateUploadEmployeeOfferLetter, validateImportEmployeeDataSecond, validateUploadEmployeePhysicalForm, validateUploadEmployeeJoiningKit, validateAddInductionFormData, validateAddReferenceCheckData, validateAddEmployeeFamilyDetails, validateUploadEmployeeKycDocs, validateDeleteReportingManagerData, validateUpdateReportingManagerData, validateNoticeClose, validateEmployeeKPIKraData, validateEmployeeFnf, validateEmployeeKPIKraJdRecords, validateImportEmployeeData, validateEmployeeCountRecords, validateEmployeePFInfo, validateEmployeeAddressInfo, validateEmployeeSalaryInfo, validateEmployeeEducationInfo, validateEmployeeClassificationInfo, validateEmployeeExperienceInfo, validateEditEmployee, validateEmployeeGeneralInfo, validateDeleteEmployee, validateEmployeeById, validateChangeEmployeeStatus, validateEmployeeList } = require('../../middlewares/validators/Admin/Employee/validate');

router.post('/addEmployee', verifyToken, validateEmployeeRegistration, asyncErrorHandler(EmployeeController.addEmployeeUser));
router.post('/editEmployee', verifyToken, validateEditEmployee, asyncErrorHandler(EmployeeController.editEmployee));
router.post('/deleteEmployeeById', verifyToken, validateDeleteEmployee, asyncErrorHandler(EmployeeController.deleteEmployeeById));
router.post('/getEmployeeById', verifyToken, validateEmployeeById, asyncErrorHandler(EmployeeController.getEmployeeById));
router.post('/changeEmployeeStatus', verifyToken, validateChangeEmployeeStatus, asyncErrorHandler(EmployeeController.changeEmployeeStatus));
router.post('/getEmployeeList', verifyToken, validateEmployeeList, asyncErrorHandler(EmployeeController.getEmployeeList));
router.post('/addEmployeeGeneralInfo', verifyToken, validateEmployeeGeneralInfo, asyncErrorHandler(EmployeeController.addEmployeeGeneralInfo));
router.post('/getEmployeeAllList', verifyToken, validateEmployeeList, asyncErrorHandler(EmployeeController.getEmployeeAllList));
router.post('/addEmployeeEducationInfo', verifyToken, validateEmployeeEducationInfo, asyncErrorHandler(EmployeeController.addEmployeeEducationInfo));
router.post('/addEmployeeExperienceInfo', verifyToken, validateEmployeeExperienceInfo, asyncErrorHandler(EmployeeController.addEmployeeExperienceInfo));
router.post('/addEmployeeClassificationInfo', verifyToken, validateEmployeeClassificationInfo, asyncErrorHandler(EmployeeController.addEmployeeClassificationInfo));
router.post('/addEmployeePfInfo', verifyToken, validateEmployeePFInfo, asyncErrorHandler(EmployeeController.addEmployeePfInfo));
router.post('/addEmployeeAddressInfo', verifyToken, validateEmployeeAddressInfo, asyncErrorHandler(EmployeeController.addEmployeeAddressInfo));
router.post('/addEmployeeSalaryInfo', verifyToken, validateEmployeeSalaryInfo, asyncErrorHandler(EmployeeController.addEmployeeSalaryInfo));
router.post('/countEmployeeRecords', verifyToken, validateEmployeeCountRecords, asyncErrorHandler(EmployeeController.countEmployeeRecords));
router.post('/importEmployeeData', verifyToken, validateImportEmployeeData, asyncErrorHandler(EmployeeController.importEmployeeData));
router.post('/importEmployeeDataSecond', verifyToken, validateImportEmployeeDataSecond, asyncErrorHandler(EmployeeController.importEmployeeDataSecond));
router.post('/importEmployeeDataSecondUpdateDOBJoinDate', verifyToken, asyncErrorHandler(EmployeeController.importEmployeeDataSecondUpdateDOBJoinDate));

router.post('/updateKpiKraJdData', verifyToken, validateEmployeeKPIKraJdRecords, asyncErrorHandler(EmployeeController.updateKpiKraJdData));
router.post('/employeeFnf', verifyToken, validateEmployeeFnf, asyncErrorHandler(EmployeeController.employeeFnf));
router.post('/employeeNoticeClose', verifyToken, validateNoticeClose, asyncErrorHandler(EmployeeController.employeeNoticeClose));
router.post('/updateKpiKraBulkData', verifyToken, validateEmployeeKPIKraData, asyncErrorHandler(EmployeeController.updateKpiKraBulkData));
router.post('/updateReportingManagerData', verifyToken, validateUpdateReportingManagerData, asyncErrorHandler(EmployeeController.updateReportingManagerData));
router.post('/deleteReportingManagerData', verifyToken, validateDeleteReportingManagerData, asyncErrorHandler(EmployeeController.deleteReportingManagerData));
router.post('/getDesignationWiseEmployeeList', verifyToken, validateEmployeeList, asyncErrorHandler(EmployeeController.getDesignationWiseEmployeeList));
router.post('/uploadEmployeeKycDocs', verifyToken, validateUploadEmployeeKycDocs, asyncErrorHandler(EmployeeController.uploadEmployeeKycDocs));
router.post('/addEmployeeFamilyDetails', verifyToken, validateAddEmployeeFamilyDetails, asyncErrorHandler(EmployeeController.addEmployeeFamilyDetails));
router.post('/addReferenceCheckData', verifyToken, validateAddReferenceCheckData, asyncErrorHandler(EmployeeController.addReferenceCheckData));
router.post('/addInductionFormData', verifyToken, validateAddInductionFormData, asyncErrorHandler(EmployeeController.addInductionFormData));
router.post('/uploadEmployeeJoiningKit', verifyToken, validateUploadEmployeeJoiningKit, asyncErrorHandler(EmployeeController.uploadEmployeeJoiningKit));
router.post('/uploadEmployeePhysicalInductionForm', verifyToken, validateUploadEmployeePhysicalForm, asyncErrorHandler(EmployeeController.uploadEmployeePhysicalForm));
router.post('/importEmployeeSalaryData', verifyToken, validateImportEmployeeSalaryData, asyncErrorHandler(EmployeeController.importEmployeeSalaryData));
router.post('/uploadEmployeeOfferLetter', verifyToken, validateUploadEmployeeOfferLetter, asyncErrorHandler(EmployeeController.uploadEmployeeOfferLetter));
router.post('/uploadEmployeeAppointmentLetter', verifyToken, validateUploadEmployeeAppointmentLetter, asyncErrorHandler(EmployeeController.uploadEmployeeAppointmentLetter));
router.post('/uploadEmployeeSignature', verifyToken, validateUploadEmployeeSignature, asyncErrorHandler(EmployeeController.uploadEmployeeSignature));
router.post('/deleteEmployeeDocuments', verifyToken, validateDeleteEmployeeDocuments, asyncErrorHandler(EmployeeController.deleteEmployeeDocuments));


/** Delete employee By employee iD */
//router.post( '/deleteEmployeeBulkEmployee', verifyToken, asyncErrorHandler( EmployeeController.deleteEmployeeBulkEmployee ));


/**
 * @description Manage Applied From Types / 
 */
const AppliedFromController = require('../../controllers/Admin/AppliedFrom/AppliedFromController');
const { validateAddAppliedFrom, validateEditAppliedFrom, validateDeleteAppliedFrom, validateAppliedFromById, validateChangeAppliedFromStatus, validateAppliedFromList } = require('../../middlewares/validators/Admin/AppliedFrom/validate');

router.post('/addAppliedFrom', verifyToken, validateAddAppliedFrom, asyncErrorHandler(AppliedFromController.addAppliedFrom));
router.post('/editAppliedFrom', verifyToken, validateEditAppliedFrom, asyncErrorHandler(AppliedFromController.editAppliedFrom));
router.post('/deleteAppliedFromById', verifyToken, validateDeleteAppliedFrom, asyncErrorHandler(AppliedFromController.deleteAppliedFromById));
router.post('/getAppliedFromById', verifyToken, validateAppliedFromById, asyncErrorHandler(AppliedFromController.getAppliedFromById));
router.post('/changeAppliedFromStatus', verifyToken, validateChangeAppliedFromStatus, asyncErrorHandler(AppliedFromController.changeAppliedFromStatus));
router.post('/getAppliedFromList', verifyToken, validateAppliedFromList, asyncErrorHandler(AppliedFromController.getAppliedFromList));


/**
 * @description Manage Occupation Master
*/
const OccupationController = require('../../controllers/Admin/Occupation/Occupation');
const { validateAddOccupation, validateEditOccupation, validateDeleteOccupationById, validateGetOccupationById, validateChangeOccupationStatus, validateGetOccupationList } = require('../../middlewares/validators/Admin/Occupation/validate');

router.post('/addOccupation', verifyToken, validateAddOccupation, asyncErrorHandler(OccupationController.addOccupation));
router.post('/editOccupation', verifyToken, validateEditOccupation, asyncErrorHandler(OccupationController.editOccupation));
router.post('/deleteOccupationById', verifyToken, validateDeleteOccupationById, asyncErrorHandler(OccupationController.deleteOccupationById));
router.post('/getOccupationById', verifyToken, validateGetOccupationById, asyncErrorHandler(OccupationController.getOccupationById));
router.post('/changeOccupationStatus', verifyToken, validateChangeOccupationStatus, asyncErrorHandler(OccupationController.changeOccupationStatus));
router.post('/getOccupationList', verifyToken, validateGetOccupationList, asyncErrorHandler(OccupationController.getOccupationList));


/**
 * @description Manage Dispensary Master / 
 */
const DispensaryController = require('../../controllers/Admin/Dispensary/DispensaryController');
const { validateAddDispensary, validateEditDispensary, validateDeleteDispensary, validateDispensaryById, validateChangeDispensaryStatus, validateDispensaryList } = require('../../middlewares/validators/Admin/Dispensary/validate');

router.post('/addDispensary', verifyToken, validateAddDispensary, asyncErrorHandler(DispensaryController.addDispensary));
router.post('/editDispensary', verifyToken, validateEditDispensary, asyncErrorHandler(DispensaryController.editDispensary));
router.post('/deleteDispensaryById', verifyToken, validateDeleteDispensary, asyncErrorHandler(DispensaryController.deleteDispensaryById));
router.post('/getDispensaryById', verifyToken, validateDispensaryById, asyncErrorHandler(DispensaryController.getDispensaryById));
router.post('/changeDispensaryStatus', verifyToken, validateChangeDispensaryStatus, asyncErrorHandler(DispensaryController.changeDispensaryStatus));
router.post('/getDispensaryList', verifyToken, validateDispensaryList, asyncErrorHandler(DispensaryController.getDispensaryList));

/**
 * @description Manage Division Master / 
 */
const DivisionController = require('../../controllers/Admin/Division/DivisionController');
const { validateAddDivision, validateEditDivision, validateDeleteDivision, validateDivisionById, validateChangeDivisionStatus, validateDivisionList } = require('../../middlewares/validators/Admin/Division/validate');

router.post('/addDivision', verifyToken, validateAddDivision, asyncErrorHandler(DivisionController.addDivision));
router.post('/editDivision', verifyToken, validateEditDivision, asyncErrorHandler(DivisionController.editDivisionData));
router.post('/deleteDivisionById', verifyToken, validateDeleteDivision, asyncErrorHandler(DivisionController.deleteDivisionById));
router.post('/getDivisionById', verifyToken, validateDivisionById, asyncErrorHandler(DivisionController.getDivisionById));
router.post('/changeDivisionStatus', verifyToken, validateChangeDivisionStatus, asyncErrorHandler(DivisionController.changeDivisionStatus));
router.post('/getDivisionList', verifyToken, validateDivisionList, asyncErrorHandler(DivisionController.getDivisionList));


/**
 * @description Manage Bank Master / 
 */
const BankController = require('../../controllers/Admin/Bank/BankController');
const { validateAddBank, validateEditBank, validateDeleteBank, validateBankById, validateChangeBankStatus, validateBankList } = require('../../middlewares/validators/Admin/Bank/validate');

router.post('/addBank', verifyToken, validateAddBank, asyncErrorHandler(BankController.addBank));
router.post('/editBank', verifyToken, validateEditBank, asyncErrorHandler(BankController.editBank));
router.post('/deleteBankById', verifyToken, validateDeleteBank, asyncErrorHandler(BankController.deleteBankById));
router.post('/getBankById', verifyToken, validateBankById, asyncErrorHandler(BankController.getBankById));
router.post('/changeBankStatus', verifyToken, validateChangeBankStatus, asyncErrorHandler(BankController.changeBankStatus));
router.post('/getBankList', verifyToken, validateBankList, asyncErrorHandler(BankController.getBankList));


/**
 * @description Manage Currency Master / 
 */
const CurrencyController = require('../../controllers/Admin/Currency/CurrencyController.js');
const { validateAddCurrency, validateEditCurrency, validateDeleteCurrency, validateCurrencyById, validateChangeCurrencyStatus, validateCurrencyList } = require('../../middlewares/validators/Admin/Currency/validate.js');

router.post('/addCurrency', verifyToken, validateAddCurrency, asyncErrorHandler(CurrencyController.addCurrency));
router.post('/editCurrency', verifyToken, validateEditCurrency, asyncErrorHandler(CurrencyController.editCurrency));
router.post('/deleteCurrencyById', verifyToken, validateDeleteCurrency, asyncErrorHandler(CurrencyController.deleteCurrencyById));
router.post('/getCurrencyById', verifyToken, validateCurrencyById, asyncErrorHandler(CurrencyController.getCurrencyById));
router.post('/changeCurrencyStatus', verifyToken, validateChangeCurrencyStatus, asyncErrorHandler(CurrencyController.changeCurrencyStatus));
router.post('/getCurrencyList', verifyToken, validateCurrencyList, asyncErrorHandler(CurrencyController.getCurrencyList));


/**
 * @description Manage State Master / 
 */
const StateController = require('../../controllers/Admin/State/StateController');
const { validateAddState, validateEditState, validateDeleteState, validateStateById, validateChangeStateStatus, validateStateList } = require('../../middlewares/validators/Admin/State/validate');

router.post('/addState', verifyToken, validateAddState, asyncErrorHandler(StateController.addState));
router.post('/editState', verifyToken, validateEditState, asyncErrorHandler(StateController.editState));
router.post('/deleteStateById', verifyToken, validateDeleteState, asyncErrorHandler(StateController.deleteStateById));
router.post('/getStateById', verifyToken, validateStateById, asyncErrorHandler(StateController.getStateById));
router.post('/changeStateStatus', verifyToken, validateChangeStateStatus, asyncErrorHandler(StateController.changeStateStatus));
router.post('/getStateList', verifyToken, validateStateList, asyncErrorHandler(StateController.getStateList));

/**
 * @description Manage Region Master / 
*/
const RegionController = require('../../controllers/Admin/Region/RegionController');
const { validateAddRegion, validateEditRegion, validateDeleteRegion, validateRegionById, validateChangeRegionStatus, validateRegionList } = require('../../middlewares/validators/Admin/Region/validate');

router.post('/addRegion', verifyToken, validateAddRegion, asyncErrorHandler(RegionController.addRegion));
router.post('/editRegion', verifyToken, validateEditRegion, asyncErrorHandler(RegionController.editRegion));
router.post('/deleteRegionById', verifyToken, validateDeleteRegion, asyncErrorHandler(RegionController.deleteRegionById));
router.post('/getRegionById', verifyToken, validateRegionById, asyncErrorHandler(RegionController.getRegionById));
router.post('/changeRegionStatus', verifyToken, validateChangeRegionStatus, asyncErrorHandler(RegionController.changeRegionStatus));
router.post('/getRegionList', verifyToken, validateRegionList, asyncErrorHandler(RegionController.getRegionList));

/**
 * @description Manage Leave Master / 
 */
const LeaveTypeController = require('../../controllers/Admin/LeaveType/LeaveTypeController');
const { validateAddLeaveType, validateEditLeaveType, validateDeleteLeaveType, validateLeaveTypeById, validateChangeLeaveTypeStatus, validateLeaveTypeList } = require('../../middlewares/validators/Admin/LeaveType/validate');

router.post('/addLeaveType', verifyToken, validateAddLeaveType, asyncErrorHandler(LeaveTypeController.addLeaveType));
router.post('/editLeaveType', verifyToken, validateEditLeaveType, asyncErrorHandler(LeaveTypeController.editLeaveType));
router.post('/deleteLeaveTypeById', verifyToken, validateDeleteLeaveType, asyncErrorHandler(LeaveTypeController.deleteLeaveTypeById));
router.post('/getLeaveTypeById', verifyToken, validateLeaveTypeById, asyncErrorHandler(LeaveTypeController.getLeaveTypeById));
router.post('/changeLeaveTypeStatus', verifyToken, validateChangeLeaveTypeStatus, asyncErrorHandler(LeaveTypeController.changeLeaveTypeStatus));
router.post('/getLeaveTypeList', verifyToken, validateLeaveTypeList, asyncErrorHandler(LeaveTypeController.getLeaveTypeList));


/**
 * @description Manage Grade Master / 
 */
const GradeController = require('../../controllers/Admin/Grade/GradeController');
const { validateAddGrade, validateEditGrade, validateDeleteGrade, validateGradeById, validateChangeGradeStatus, validateGradeList } = require('../../middlewares/validators/Admin/Grade/validate');

router.post('/AddGradeData', verifyToken, validateAddGrade, asyncErrorHandler(GradeController.AddGradeData));
router.post('/editGradeData', verifyToken, validateEditGrade, asyncErrorHandler(GradeController.editGradeData));
router.post('/deleteGradeById', verifyToken, validateDeleteGrade, asyncErrorHandler(GradeController.deleteGradeById));
router.post('/getGradeById', verifyToken, validateGradeById, asyncErrorHandler(GradeController.getGradeById));
router.post('/changeGradeStatus', verifyToken, validateChangeGradeStatus, asyncErrorHandler(GradeController.changeGradeStatus));
router.post('/getGradeList', verifyToken, validateGradeList, asyncErrorHandler(GradeController.getGradeList));


/**
 * @description Manage Dashboard Chart Apis / 
 */
const CeoDashboardController = require('../../controllers/Admin/CeoDashboard/CeoDashboardController.js');
router.get('/dashboardCeo', verifyToken, asyncErrorHandler(CeoDashboardController.getRecords));


/**
 * @description Manage HOD Dashboard / 
 */
const HodDashboardController = require('../../controllers/Admin/HodDashboard/HodDashboardController.js');
router.get('/dashboardHod', verifyToken, asyncErrorHandler(HodDashboardController.getRecords));


/**
 * @description Manage Dashboard Chart Apis / 
 */
const { validateProjectWiseVacancyChart } = require('../../middlewares/validators/Admin/Chart/validate');

router.post('/getProjectBudgetChart', verifyToken, asyncErrorHandler(ProjectController.getProjectBudgetChart));
router.post('/getProjectWiseVacancyChart', verifyToken, asyncErrorHandler(ProjectController.getProjectWiseVacancyChart));
router.get('/getEmployeeGradeWiseListChart', verifyToken, asyncErrorHandler(EmployeeController.getEmployeeGradeWiseList));
router.post('/getEmployeeWithDepartmentWise', verifyToken, asyncErrorHandler(EmployeeController.getEmployeeWithDepartmentWise));
router.post('/getEmployeeByTenureChart', verifyToken, asyncErrorHandler(EmployeeController.getEmployeeByTenureChart));
router.post('/getEmployeeByJobTypeChart', verifyToken, asyncErrorHandler(EmployeeController.getEmployeeByJobTypeChart));
router.post('/getEmployeeByGenderChart', verifyToken, asyncErrorHandler(EmployeeController.getEmployeeByGenderChart));
router.post('/getEmployeeByYearWiseSlotChart', verifyToken, asyncErrorHandler(EmployeeController.getEmployeeByYearWiseSlotChart));
router.post('/getEmployeeByTerminationChart', verifyToken, asyncErrorHandler(EmployeeController.getEmployeeByTerminationChart));
router.post('/getEmployeeCountForMapChart', verifyToken, asyncErrorHandler(EmployeeController.getEmployeeCountForMapChart));
router.post('/getHrHiringJobListChart', verifyToken, asyncErrorHandler(JobController.getHrHiringJobListChart));
router.post('/getContractCloserChart', verifyToken, asyncErrorHandler(EmployeeController.getContractCloserChart));
router.post('/getOnRoleVsContractChart', verifyToken, asyncErrorHandler(EmployeeController.getOnRoleVsContractChart));
router.post('/getAppraisalCycleChart', verifyToken, asyncErrorHandler(EmployeeController.getAppraisalCycleChart));


/**
 * @description Manage Employee Leave/
 */
const AttendanceController = require('../../controllers/Admin/Attendance/AttendanceController');
const { validateApplyLeave, validateImportEmployeeAttendance, validateSaveAttendanceInBulk, validateGetAttendanceByEmployeeID } = require('../../middlewares/validators/Admin/Attendance/validate');

router.post('/applyEmployeeLeave', verifyToken, validateApplyLeave, asyncErrorHandler(AttendanceController.applyEmployeeLeave));
router.post('/importEmployeeAttendance', verifyToken, validateImportEmployeeAttendance, asyncErrorHandler(AttendanceController.importEmployeeAttendanceData));
router.post('/saveAttendanceInBulk', verifyToken, validateSaveAttendanceInBulk, asyncErrorHandler(AttendanceController.saveAttendanceInBulk));
router.post('/getAttendanceByEmployeeID', verifyToken, validateGetAttendanceByEmployeeID, asyncErrorHandler(AttendanceController.getAttendanceByEmployeeID));


/**
 * @description Manage Financial Year Master /
*/
const FinancialYearController = require('../../controllers/Admin/FinancialYear/FinancialYearController');
const { validateAddFinancialYear, validateEditFinancialYear, validateDeleteFinancialYear, validateFinancialYearById, validateChangeFinancialYearStatus, validateFinancialYearList } = require('../../middlewares/validators/Admin/FinancialYear/validate');

router.post('/AddFinancialYearData', verifyToken, validateAddFinancialYear, asyncErrorHandler(FinancialYearController.AddFinancialYearData));
router.post('/editFinancialYearData', verifyToken, validateEditFinancialYear, asyncErrorHandler(FinancialYearController.editFinancialYearData));
router.post('/deleteFinancialYearById', verifyToken, validateDeleteFinancialYear, asyncErrorHandler(FinancialYearController.deleteFinancialYearById));
router.post('/getFinancialYearById', verifyToken, validateFinancialYearById, asyncErrorHandler(FinancialYearController.getFinancialYearById));
router.post('/changeFinancialYearStatus', verifyToken, validateChangeFinancialYearStatus, asyncErrorHandler(FinancialYearController.changeFinancialYearStatus));
router.post('/getFinancialYearList', verifyToken, validateFinancialYearList, asyncErrorHandler(FinancialYearController.getFinancialYearList));

/**
 * @description Manage Appraisal Cycle Master / 
*/
const AppraisalCycleController = require('../../controllers/Admin/AppraisalCycle/AppraisalCycleController');
const { validateAddAppraisalCycle, validateEditAppraisalCycle, validateDeleteAppraisalCycle, validateAppraisalCycleById, validateChangeAppraisalCycleStatus, validateAppraisalCycleList } = require('../../middlewares/validators/Admin/AppraisalCycle/validate');

router.post('/AddAppraisalCycleData', verifyToken, validateAddAppraisalCycle, asyncErrorHandler(AppraisalCycleController.AddAppraisalCycleData));
router.post('/editAppraisalCycleData', verifyToken, validateEditAppraisalCycle, asyncErrorHandler(AppraisalCycleController.editAppraisalCycleData));
router.post('/deleteAppraisalCycleById', verifyToken, validateDeleteAppraisalCycle, asyncErrorHandler(AppraisalCycleController.deleteAppraisalCycleById));
router.post('/getAppraisalCycleById', verifyToken, validateAppraisalCycleById, asyncErrorHandler(AppraisalCycleController.getAppraisalCycleById));
router.post('/changeAppraisalCycleStatus', verifyToken, validateChangeAppraisalCycleStatus, asyncErrorHandler(AppraisalCycleController.changeAppraisalCycleStatus));
router.post('/getAppraisalCycleList', verifyToken, validateAppraisalCycleList, asyncErrorHandler(AppraisalCycleController.getAppraisalCycleList));


/**
 * @description Manage Requisition form  Master / 
*/
const RequisitionController = require('../../controllers/Admin/Requisition/RequisitionController');
const { validateAddRequisitionData, validateApproveRejectRequisitionFormViaMail, validateBulkApprovedMprByCeoOrHodSir, validateAssignEmployeeOnMPRForApproval, validateAddRequisitionDataWithOldMpr, validateSendRequisitionApprovalEmailToSingleEmployee, validateGetRequisitionDataByIdViaMail, validateSendRequisitionApprovalEmailToCeo, validateSendRequisitionCreateFormMail, validateSendRequisitionCreateFormMailByEmployeeID, validateApproveRejectRequisitionForm, validateEditRequisitionData, validateDeleteRequisitionData, validateRequisitionDataById, validateChangeRequisitionDataStatus, validateRequisitionDataList, validateUpdatePlaceOfPosting } = require('../../middlewares/validators/Admin/Requisition/validate');

router.post('/AddRequisitionData', verifyToken, validateAddRequisitionData, asyncErrorHandler(RequisitionController.AddRequisitionData));
router.post('/AddRequisitionDataWithOldMpr', verifyToken, validateAddRequisitionDataWithOldMpr, asyncErrorHandler(RequisitionController.AddRequisitionDataWithOldMpr));
router.post('/editRequisitionData', verifyToken, validateEditRequisitionData, asyncErrorHandler(RequisitionController.editRequisitionData));
router.post('/deleteRequisitionDataById', verifyToken, validateDeleteRequisitionData, asyncErrorHandler(RequisitionController.deleteRequisitionDataById));
router.post('/getRequisitionDataById', verifyToken, validateRequisitionDataById, asyncErrorHandler(RequisitionController.getRequisitionDataById));
router.post('/changeRequisitionDataStatus', verifyToken, validateChangeRequisitionDataStatus, asyncErrorHandler(RequisitionController.changeRequisitionDataStatus));
router.post('/getRequisitionDataList', verifyToken, validateRequisitionDataList, asyncErrorHandler(RequisitionController.getRequisitionDataList));
router.put('/update-place-of-posting', verifyToken, validateUpdatePlaceOfPosting, asyncErrorHandler(RequisitionController.updatePlaceOfPosting));
router.post('/approveRejectRequisitionForm', verifyToken, validateApproveRejectRequisitionFormViaMail, asyncErrorHandler(RequisitionController.approveRejectRequisitionForm));
router.post('/approveRejectRequisitionFormViaMail', validateApproveRejectRequisitionFormViaMail, asyncErrorHandler(RequisitionController.approveRejectRequisitionForm));
router.post('/getRequisitionDataByIdViaMail', validateGetRequisitionDataByIdViaMail, asyncErrorHandler(RequisitionController.getRequisitionDataById));
router.post('/sendRequisitionCreateFormMail', validateSendRequisitionCreateFormMail, asyncErrorHandler(RequisitionController.sendRequisitionCreateFormMail));
router.post('/AddRequisitionDataFromFront', verifyToken, validateAddRequisitionData, asyncErrorHandler(RequisitionController.AddRequisitionDataFromFront));
router.post('/sendRequisitionCreateFormMailByEmployeeID', validateSendRequisitionCreateFormMailByEmployeeID, asyncErrorHandler(RequisitionController.sendRequisitionCreateFormMailByEmployeeID));
router.post('/sendRequisitionApprovalEmailToCeo', validateSendRequisitionApprovalEmailToCeo, asyncErrorHandler(RequisitionController.sendRequisitionApprovalEmailToCeo));
router.post('/sendRequisitionApprovalEmailToSingleEmployee', validateSendRequisitionApprovalEmailToSingleEmployee, asyncErrorHandler(RequisitionController.sendRequisitionApprovalEmailToSingleEmployee));
router.post('/getCountRecordsOfMpr', asyncErrorHandler(RequisitionController.getCountRecordsOfMpr));
router.post('/assignEmployeeOnMPRForApproval', validateAssignEmployeeOnMPRForApproval, asyncErrorHandler(RequisitionController.assignEmployeeOnMPRForApproval));
router.post('/BulkApprovedMprByCeoOrHodSir', validateBulkApprovedMprByCeoOrHodSir, asyncErrorHandler(RequisitionController.BulkApprovedMprByCeoOrHodSir));

/**
 * @description Manage Batch ID Master / 
*/
const BatchIdController = require('../../controllers/Admin/BatchId/BatchIdController');
const { validateBatchIDData, validateEditBatchID, validateDeleteBatchID, validateBatchIDById, validateChangeBatchIDStatus, validateBatchIDList } = require('../../middlewares/validators/Admin/BatchId/validate');

router.post('/addBatchID', verifyToken, validateBatchIDData, asyncErrorHandler(BatchIdController.addBatchID));
router.post('/editBatchID', verifyToken, validateEditBatchID, asyncErrorHandler(BatchIdController.editBatchID));
router.post('/deleteBatchIDById', verifyToken, validateDeleteBatchID, asyncErrorHandler(BatchIdController.deleteBatchIDById));
router.post('/getBatchIDById', verifyToken, validateBatchIDById, asyncErrorHandler(BatchIdController.getBatchIDById));
router.post('/changeBatchIDStatus', verifyToken, validateChangeBatchIDStatus, asyncErrorHandler(BatchIdController.changeBatchIDStatus));
router.post('/getBatchIDList', verifyToken, validateBatchIDList, asyncErrorHandler(BatchIdController.getBatchIDList));

/**
 * @description Manage Job Templates Master / 
*/
const JobsTemplateController = require('../../controllers/Admin/JobsTemplate/JobsTemplateController');
const { validateAddJobsTemplate, validateEditJobsTemplate, validateDeleteJobsTemplate, validateJobsTemplateById, validateChangeJobsTemplateStatus, validateJobsTemplateList } = require('../../middlewares/validators/Admin/JobsTemplate/validate');

router.post('/addJobsTemplate', verifyToken, validateAddJobsTemplate, asyncErrorHandler(JobsTemplateController.addJobsTemplate));
router.post('/editJobsTemplate', verifyToken, validateEditJobsTemplate, asyncErrorHandler(JobsTemplateController.editJobsTemplate));
router.post('/deleteJobsTemplateById', verifyToken, validateDeleteJobsTemplate, asyncErrorHandler(JobsTemplateController.deleteJobsTemplateById));
router.post('/getJobsTemplateById', verifyToken, validateJobsTemplateById, asyncErrorHandler(JobsTemplateController.getJobsTemplateById));
router.post('/changeJobsTemplateStatus', verifyToken, validateChangeJobsTemplateStatus, asyncErrorHandler(JobsTemplateController.changeJobsTemplateStatus));
router.post('/getJobsTemplateList', verifyToken, validateJobsTemplateList, asyncErrorHandler(JobsTemplateController.getJobsTemplateList));


/**
 * @description Menu Master / 
*/
const MenuController = require('../../controllers/Admin/Menu/MenuController');
const { validateAddMenu, validateEditMenu, validateDeleteMenuById, validateMenuById, validateChangeMenuStatus, validateMenuList } = require('../../middlewares/validators/Admin/Menu/validate');

router.post('/addMenu', verifyToken, validateAddMenu, asyncErrorHandler(MenuController.addMenu));
router.post('/editMenu', verifyToken, validateEditMenu, asyncErrorHandler(MenuController.editMenu));
router.post('/deleteMenuById', verifyToken, validateDeleteMenuById, asyncErrorHandler(MenuController.deleteMenuById));
router.post('/getMenuById', verifyToken, validateMenuById, asyncErrorHandler(MenuController.getMenuById));
router.post('/changeMenuStatus', verifyToken, validateChangeMenuStatus, asyncErrorHandler(MenuController.changeMenuStatus));
router.post('/getMenuList', verifyToken, validateMenuList, asyncErrorHandler(MenuController.getMenuList));


/**
 * @description Web Configuration Settings All  / 
*/
const WebSettingController = require('../../controllers/Admin/WebSetting/WebSettingController.js');
const { validateAddWebSetting, validateAddLetterHeadSettingData, validateAddSmtpDetails, validateAddHrWebSetting, validateAddOrganizationAddressDetails, validateAddGooglePlacesApi, validateAddSMSDetails, validateAddOrganizationDetails } = require('../../middlewares/validators/Admin/WebSetting/validate.js');

router.post('/addWebSettingData', verifyToken, validateAddWebSetting, asyncErrorHandler(WebSettingController.addWebSettingData));
router.post('/addSmtpDetails', verifyToken, validateAddSmtpDetails, asyncErrorHandler(WebSettingController.addSmtpDetails));
router.post('/addGooglePlacesApi', verifyToken, validateAddGooglePlacesApi, asyncErrorHandler(WebSettingController.addGooglePlacesApi));
router.post('/addSmsApiDetails', verifyToken, validateAddSMSDetails, asyncErrorHandler(WebSettingController.addSmsApiDetails));
router.post('/addOrganizationDetails', verifyToken, validateAddOrganizationDetails, asyncErrorHandler(WebSettingController.addOrganizationDetails));
router.post('/addOrganizationAddressDetails', verifyToken, validateAddOrganizationAddressDetails, asyncErrorHandler(WebSettingController.addOrganizationAddressDetails));
router.get('/getAllSettingData', verifyToken, asyncErrorHandler(WebSettingController.getAllSettingData));
router.post('/addHrWebSettingData', verifyToken, validateAddHrWebSetting, asyncErrorHandler(WebSettingController.addHrWebSettingData));
router.post('/getWebConfigData', asyncErrorHandler(WebSettingController.getWebConfigData));
router.post('/addSocialMediaLinks', verifyToken, asyncErrorHandler(WebSettingController.addSocialMediaLinks));
router.post('/addLetterHeadSettingData', verifyToken, validateAddLetterHeadSettingData, asyncErrorHandler(WebSettingController.addLetterHeadSettingData));


/**
 * @description Assets Type Master / 
*/
const AssetsTypeController = require('../../controllers/Admin/AssetsType/AssetsTypeController.js');
const { validateAddAssetType, validateEditAssetType, validateDeleteAssetTypeById, validateAssetTypeById, validateChangeAssetTypeStatus, validateAssetTypeList } = require('../../middlewares/validators/Admin/AssetType/validate.js');

router.post('/addAssetType', verifyToken, validateAddAssetType, asyncErrorHandler(AssetsTypeController.addAssetType));
router.post('/editAssetType', verifyToken, validateEditAssetType, asyncErrorHandler(AssetsTypeController.editAssetType));
router.post('/deleteAssetTypeById', verifyToken, validateDeleteAssetTypeById, asyncErrorHandler(AssetsTypeController.deleteAssetTypeById));
router.post('/getAssetTypeById', verifyToken, validateAssetTypeById, asyncErrorHandler(AssetsTypeController.getAssetTypeById));
router.post('/changeAssetTypeStatus', verifyToken, validateChangeAssetTypeStatus, asyncErrorHandler(AssetsTypeController.changeAssetTypeStatus));
router.post('/getAssetTypeList', verifyToken, validateAssetTypeList, asyncErrorHandler(AssetsTypeController.getAssetTypeList));

/**
 * @description Assets Type Master / 
*/
const AssetItemsController = require('../../controllers/Admin/AssetItems/AssetItemsController.js');
const { validateAddAssetItem, validateGetEmployeeAssets, validateEditAssetsItem, validateReturnAssetToEmployee, validateAssignAssetToEmployee, validateDeleteAssetItemById, validateAssetItemById, validateChangeAssetItemStatus, validateAssetItemList } = require('../../middlewares/validators/Admin/AssetItems/validate.js');

router.post('/addAssetItem', verifyToken, validateAddAssetItem, asyncErrorHandler(AssetItemsController.addAssetItem));
router.post('/editAssetItem', verifyToken, validateEditAssetsItem, asyncErrorHandler(AssetItemsController.editAssetItem));
router.post('/deleteAssetItemById', verifyToken, validateDeleteAssetItemById, asyncErrorHandler(AssetItemsController.deleteAssetItemById));
router.post('/getAssetItemById', verifyToken, validateAssetItemById, asyncErrorHandler(AssetItemsController.getAssetItemById));
router.post('/changeAssetItemStatus', verifyToken, validateChangeAssetItemStatus, asyncErrorHandler(AssetItemsController.changeAssetItemStatus));
router.post('/getAssetItemList', verifyToken, validateAssetItemList, asyncErrorHandler(AssetItemsController.getAssetItemList));

router.post('/assignAssetToEmployee', verifyToken, validateAssignAssetToEmployee, asyncErrorHandler(AssetItemsController.assignAssetToEmployee));
router.post('/returnAssetFromEmployee', verifyToken, validateReturnAssetToEmployee, asyncErrorHandler(AssetItemsController.returnAssetToEmployee));
router.post('/getEmployeeAssets', verifyToken, validateGetEmployeeAssets, asyncErrorHandler(AssetItemsController.getEmployeeAssets));



/**
 * @description Template Settings / 
*/
const TemplateSettingsController = require('../../controllers/Admin/TemplateSettings/TemplateSettingsController.js');
const { validateAddTemplateSettings, validateGetTemplateSettingsByApprovalNote, validateGetTemplateSettingsByDocName, validateGetTemplateSettingsList, validateGetTemplateSettingsById, validateRemoveTemplateSettingsById, validateRemoveAttachmentDocFromTSById } = require('../../middlewares/validators/Admin/TemplateSettings/validate.js');

router.post('/saveTemplateSettings', verifyToken, validateAddTemplateSettings, asyncErrorHandler(TemplateSettingsController.saveTemplateSettings));
router.post('/getTemplateSettingsList', verifyToken, validateGetTemplateSettingsList, asyncErrorHandler(TemplateSettingsController.getTemplateSettingsList));
router.post('/getTemplateSettingsById', verifyToken, validateGetTemplateSettingsById, asyncErrorHandler(TemplateSettingsController.getTemplateSettingsById));
router.post('/removeTemplateSettingsById', verifyToken, validateRemoveTemplateSettingsById, asyncErrorHandler(TemplateSettingsController.removeTemplateSettingsById));
router.post('/removeAttachmentDocFromTSById', verifyToken, validateRemoveAttachmentDocFromTSById, asyncErrorHandler(TemplateSettingsController.removeAttachmentDocFromTSById));
router.post('/getTemplateSettingsByDocName', verifyToken, validateGetTemplateSettingsByDocName, asyncErrorHandler(TemplateSettingsController.getTemplateSettingsByDocName));
router.post('/getTemplateSettingsByApprovalNote', verifyToken, validateGetTemplateSettingsByApprovalNote, asyncErrorHandler(TemplateSettingsController.getTemplateSettingsByApprovalNote));

/**Test Script Routes  can be removed on live server **/
const TestScriptController = require('../../controllers/Admin/TestingScript/TestScriptController');
//router.get( '/updateCandidateApprovalNote', asyncErrorHandler( TestScriptController.updateCandidateApprovalNote ));

const { validateTestOne, validateTestDummyFile } = require('../../middlewares/validators/Admin/TestingScript/validate.js');
//const testEmailSystem = require('../../../TestMail');
//router.get( '/testMaildata', asyncErrorHandler( testEmailSystem.testMaildata ));
//router.post( '/testjbcount', verifyToken,  asyncErrorHandler( ApplyJobController.updateCandidateJobRecordsd ));
router.post('/changeCandidateAnyInterviewStatus', asyncErrorHandler(ApplyJobController.changeCandidateAnyInterviewStatus));

const { birthdayWishMail } = require('../../helpers/birthdayWishMail.js');
const { workAnniversaryMail } = require('../../helpers/workAnniversaryMail.js');
const { jobAppointmentMail } = require('../../helpers/jobAppointmentMail.js');
const { loginCandidateMail } = require('../../helpers/loginCandidateMail.js');
const { ApprovalNoteDownloadFormat } = require('../../helpers/ApprovalNoteDownloadFormat.js');
const { requisitionFormApprovalMail } = require('../../helpers/RequisitionFormMail.js');
//router.post('/testDummyFile' , validateTestDummyFile , asyncErrorHandler( TestScriptController.checkPdfFileUpload ) );

// Route to handle file uploads
router.post('/testDummyFile', (req, res) => {
  // router.uploadPDFDocxFileTesting(req, res, (err) => {
  //   if (err) {
  //     if (err instanceof multer.MulterError) {
  //       // Multer-specific errors (e.g., file size exceeded)
  //       return res.status(400).json({ error: `Multer error: ${err.message}` });
  //     }
  //     // General errors
  //     return res.status(400).json({ error: `Error: ${err.message}` });
  //   }
  //   if (!req.file) {
  //     return res.status(400).json({ error: 'No file uploaded or invalid file format!' });
  //   }
  //   return res.status(200).json({ message: 'File uploaded successfully!', file: req.file });
  // });
});


router.all('/printHtml', (req, res) => {

  //return res.send( workAnniversaryMail('anil@duplextech.com','Anil Kumar','2023-11-18T00:00:00.000+00:00') );
  //return res.send( birthdayWishMail('anil@duplextech.com','Anil Kumar') );
  //return res.send( jobAppointmentMail( [], 'print' ) );
  //return res.send( loginCandidateMail( 'anil@duplextech.com','Anil Kumar','','Hlfppt','Manager HR', false ) );
  //return res.send( requisitionFormApprovalMail( {'_id':'674056c60b7c9cbf512a0e40','project_name':'Oil India Sparsh','designation_name':'Manager','department_name':'Manager','no_of_vacancy':'1','ctc_per_annum':'2000','project_duration':'25Days'}, 'anil@duplextech.com', 'CEO','', true, 'Mohit' ) );
  //return res.send( ApprovalNoteDownloadFormat(  data , ) );

  return res.send('done');
});
//router.post( '/importStateData', validateTestOne, asyncErrorHandler( TestScriptController.importStateData ));

//router.get( '/updateSignatureInmpr', asyncErrorHandler( RequisitionController.updateSignatureInMpr ));

/**Export Database collections from live server **/
const DbBackupController = require('../../controllers/Admin/CreateDbBackup/DbBackupController.js');
//router.get( '/exportDb', asyncErrorHandler( DbBackupController.exportCollectionData ));




module.exports = router;