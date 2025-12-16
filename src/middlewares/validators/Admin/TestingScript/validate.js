const { body } = require('express-validator');

const express = require('express');
const router = express.Router();

//Upload middleware 
const { uploadFile, uploadPDFFile, uploadExcelFile, uploadPDFDocxFile, uploadPDFDocxFileTest } = require('../../../fileUploads');
var uploadDoc = uploadFile.single('filename'); 
var uploadPdfDoc = uploadPDFFile.single('filename'); 
var uploadExcelF = uploadExcelFile.single('filename'); 
var uploadPDFDocxFileData = uploadPDFDocxFile.single('filename'); 
var uploadPDFDocxFileDataTest = uploadPDFDocxFileTest.single('filename');  

const allowedStatuses = ['Applied','Shortlisted','Interview','Offer','Hired','Rejected','Deleted'];
const KYCSteps =  ['Profile','Document','Complete'];


/********* Validate ********/
router.validateTestOne = [
    uploadExcelF
];

/********* Validate ********/
router.validateTestDummyFile = [
    uploadPDFDocxFileDataTest
];


module.exports = router;