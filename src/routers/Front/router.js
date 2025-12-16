const express = require('express');
const router  = express.Router(); 

const { verifyFrontToken } = require('../../middlewares/verifyToken');
const { asyncErrorHandler } = require('../../utils/asyncErrorHandler');

/**
 * @description Fetch Job List APIs Router
 */
const FRJobController = require('../../controllers/Admin/Jobs/JobsController');
const { validateJobList, validateJobById , validateJobBySlug } = require('../../middlewares/validators/Admin/Job/validate');
router.post( '/getJobList', verifyFrontToken, validateJobList , asyncErrorHandler( FRJobController.getJobList ));
router.post( '/getJobById', verifyFrontToken, validateJobById , asyncErrorHandler( FRJobController.getJobById ));
router.post( '/getJobBySlug', verifyFrontToken, validateJobBySlug , asyncErrorHandler( FRJobController.getJobBySlug ));

/**
 * @description Apply Jobs / 
 */
const FRApplyJobController = require('../../controllers/Admin/ApplyJobsCandidate/ApplyJobController');
const { validateAddApplyJob } = require('../../middlewares/validators/Admin/ApplyJobsCandidate/validate');

router.post( '/applyJob', verifyFrontToken, validateAddApplyJob, asyncErrorHandler( FRApplyJobController.addApplyJob ));


/**
 * @description Manage Applied From Types / 
 */
const FRAppliedFromController = require('../../controllers/Admin/AppliedFrom/AppliedFromController');
const { validateAppliedFromList  } = require('../../middlewares/validators/Admin/AppliedFrom/validate');

router.post( '/getAppliedFromList', verifyFrontToken, validateAppliedFromList , asyncErrorHandler( FRAppliedFromController.getAppliedFromList ));


/**
 * @description fetch setting records from web Setting / 
 */
const FRWebSettingController = require('../../controllers/Admin/WebSetting/WebSettingController');
router.post( '/getWebConfigData', asyncErrorHandler( FRWebSettingController.getWebConfigData ));


/**
 * @description fetch CMS APIs Routers
 */
const FRCmsController = require('../../controllers/Admin/Cms/CmsController');
const { validateCmsSlug } = require('../../middlewares/validators/Admin/Cms/validate');
router.post( '/getCmsDataBySlug', validateCmsSlug , asyncErrorHandler( FRCmsController.getCmsDataBySlug ));


module.exports = router;