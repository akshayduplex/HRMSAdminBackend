const express = require('express');
const router  = express.Router(); 

const { verifyFrontToken } = require('../../middlewares/verifyToken');
const { asyncErrorHandler } = require('../../utils/asyncErrorHandler');


/**
 * @description Fetch Location Address APIs Router
 */
const GBLocationController = require('../../controllers/Admin/Location/LocationController');
const { validateLocationList } = require('../../middlewares/validators/Admin/Location/validate');
router.post( '/getLocationList', verifyFrontToken, validateLocationList , asyncErrorHandler( GBLocationController.getLocationList ));

/**
 * @description Fetch Salary Package APIs Router
 */
const GBSalaryRangeController = require('../../controllers/Admin/SalaryRange/SalaryRangeController');
const { validateSalaryRangeList  } = require('../../middlewares/validators/Admin/SalaryRange/validate');
router.post( '/getSalaryRangeList', verifyFrontToken, validateSalaryRangeList , asyncErrorHandler( GBSalaryRangeController.getSalaryRangeList ));

/**
 * @description Fetch Job Types /
 */
const GBJobTypesController = require('../../controllers/Admin/JobTypes/JobController');
const { validateJobTypeList } = require('../../middlewares/validators/Admin/JobTypes/validate');
router.post( '/getJobTypeList', verifyFrontToken, validateJobTypeList , asyncErrorHandler( GBJobTypesController.getJobTypeList ));

/**
 * @description Fetch Designation APIs/ Validation/ Routers
 */
const GBDesignationController = require('../../controllers/Admin/Designation/DesignationController');
const { validateDesignationList } = require('../../middlewares/validators/Admin/Designation/validate');
router.post( '/getDesignationList', verifyFrontToken, validateDesignationList , asyncErrorHandler( GBDesignationController.getDesignationList ));

/**
 * @description Fetch Department APIs/ Validation/ Routers
 */
const GBDepartmentController = require('../../controllers/Admin/Department/DepartmentController');
const { validateDepartmentList  } = require('../../middlewares/validators/Admin/Department/validate');
router.post( '/getDepartmentList', verifyFrontToken, validateDepartmentList , asyncErrorHandler( GBDepartmentController.getDepartmentList ));

/**
 * @description Fetch Education List APIs/ Validation/ Routers
 */
const GBEducationController = require('../../controllers/Admin/Education/EducationController');
const { validateEducationList  } = require('../../middlewares/validators/Admin/Education/validate'); 
router.post( '/getEducationList', verifyFrontToken, validateEducationList , asyncErrorHandler( GBEducationController.getEducationList ));


module.exports = router;