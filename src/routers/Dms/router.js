const express = require('express');
const router  = express.Router();

const { asyncErrorHandler } = require('../../utils/asyncErrorHandler');
const { verifyDmsToken } = require('../../middlewares/verifyToken');

const ProjectControllerDms = require('../../controllers/Admin/Project/ProjectController');
const { validateGetDmsProjectList } = require('../../middlewares/validators/Admin/Project/validate');


/*DMS API Path*/
router.post( '/getProjectList', verifyDmsToken, validateGetDmsProjectList, asyncErrorHandler( ProjectControllerDms.getDmsProjectList ));




module.exports = router;