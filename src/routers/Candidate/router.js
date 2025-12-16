const express = require('express');
const router  = express.Router();


const { verifyFrontToken, verifyToken } = require('../../middlewares/verifyToken');
const { asyncErrorHandler } = require('../../utils/asyncErrorHandler');
const { generateHashPassword } = require('../../middlewares/myFilters');


const CandidateController = require('../../controllers/Candidate/Login/CandidateAuth');
const { validateLoginWithEmail, validateLoginOTP } = require('../../middlewares/validators/Candidate/Login/validate');

router.post('/generateToken', CandidateController.generateToken );

/**
 * @description Candidate User Login APIs
*/
router.post('/loginWithEmail', validateLoginWithEmail,  CandidateController.checkLoginUserWithEmail  ); 
router.post('/verifyLoginOtp', validateLoginOTP,  CandidateController.verifyOTP  );


/**
 * @description Manage Apply Jobs/
*/
const CDJobController = require('../../controllers/Admin/ApplyJobsCandidate/ApplyJobController');
const {  validateEditProfile, validateSaveDeclarationForm, validateUpdateOnboardStatusOfApprovalTimeLine, validateSaveAnnexureElevenForm, validateAcceptRejectOffer, validateSaveApplicantForm, validateVerifyOffer,validateCandidateOnboardMailSteps, validateUploadOnboardDocuments, validateGetOnboardDocuments, validateUploadResume, validateFinalDocumentSubmit, validateUploadDocs, validateCandidateById , validateKycSteps } = require('../../middlewares/validators/Admin/ApplyJobsCandidate/validate');

router.post( '/editProfile', verifyToken, validateEditProfile , asyncErrorHandler( CDJobController.editProfile ));
router.post( '/uploadKycDocs', verifyToken, validateUploadDocs , asyncErrorHandler( CDJobController.uploadKycDocuments ));
router.post( '/getCandidateById', verifyToken, validateCandidateById , asyncErrorHandler( CDJobController.getCandidateById ));
router.post( '/changeKycSteps', verifyToken, validateKycSteps , asyncErrorHandler( CDJobController.changeKycStepStatus ));
router.post( '/uploadResume', verifyToken, validateUploadResume , asyncErrorHandler( CDJobController.uploadResume ));
router.post( '/updateFinalDocumentStatus', verifyToken, validateFinalDocumentSubmit , asyncErrorHandler( CDJobController.updateFinalDocumentStatus ));
router.post( '/verifyOffer', validateVerifyOffer, asyncErrorHandler( CDJobController.verifyOffer ));
router.post( '/getOnboardDocuments', verifyToken, validateGetOnboardDocuments, asyncErrorHandler( CDJobController.getOnboardDocuments ) );
router.post( '/uploadOnboardingDocuments', verifyToken, validateUploadOnboardDocuments, asyncErrorHandler( CDJobController.uploadOnboardingDocuments )); 
router.post( '/update_candidate_onboard_mail_steps', verifyToken, validateCandidateOnboardMailSteps, asyncErrorHandler( CDJobController.updateCandidateOnboardMailSteps )); 
router.post( '/saveApplicantForm', verifyToken, validateSaveApplicantForm, asyncErrorHandler( CDJobController.saveApplicantForm )); 
router.post( '/acceptRejectOffer', validateAcceptRejectOffer, asyncErrorHandler( CDJobController.acceptRejectOffer ));
router.post( '/saveAnnexureElevenForm', verifyToken, validateSaveAnnexureElevenForm, asyncErrorHandler( CDJobController.saveAnnexureElevenForm )); 
router.post( '/saveDeclarationForm', verifyToken, validateSaveDeclarationForm, asyncErrorHandler( CDJobController.saveDeclarationForm )); 
router.post( '/updateOnboardStatusOfApprovalTimeLine', verifyToken, validateUpdateOnboardStatusOfApprovalTimeLine, asyncErrorHandler( CDJobController.updateOnboardStatusOfApprovalTimeLine )); 



/**
 * @description Manage Assessment And Its Tests / 
*/
const CDAssessmentController = require('../../controllers/Admin/Assessment/AssessmentController');
const { validateSingleAssessmentList,validateCheckAssessment } = require('../../middlewares/validators/Admin/Assessment/validate');

router.post( '/getSingleAssessment', verifyToken, validateSingleAssessmentList , asyncErrorHandler( CDAssessmentController.getSingleAssessmentList )); 
router.post( '/checkAssessment', verifyToken, validateCheckAssessment , asyncErrorHandler( CDAssessmentController.checkAssessmentData )); 


/**
 * @description Manage Applied From Types / 
 */
const CDAppliedFromController = require('../../controllers/Admin/AppliedFrom/AppliedFromController');
const { validateAppliedFromList  } = require('../../middlewares/validators/Admin/AppliedFrom/validate');

router.post( '/getAppliedFromList', verifyToken, validateAppliedFromList , asyncErrorHandler( CDAppliedFromController.getAppliedFromList ));



/**
 * @description Manage Applied From Types / 
 */
const CDTestScriptController = require('../../controllers/Admin/TestingScript/TestScriptController');
router.post( '/getBoldSign', asyncErrorHandler( CDTestScriptController.getBoldSign ));
router.get( '/testBoldSign', asyncErrorHandler( CDTestScriptController.testBoldSign ));




module.exports = router;

