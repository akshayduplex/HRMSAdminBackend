const express = require("express"); 
const router = express.Router();
const fs = require('fs');
const path = require('path');

var multer  =   require('multer');   


function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}

const uploadsDir =  './uploads';
const employeeUploadsDir =  './employee_uploads';

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

if (!fs.existsSync(employeeUploadsDir)) {
  fs.mkdirSync(employeeUploadsDir);
}



const storage = multer.diskStorage({
    destination: (req, file, cb) => { 
      cb(null, uploadsDir );
    },
    filename: (req, file, cb) => {  
      const upFileName = file.originalname;
      const ext = upFileName.substring(upFileName.indexOf('.')+1).toLowerCase();  
      // const ext = file.mimetype.split("/")[1];
      //const fileName = file.originalname.toLowerCase().split(' ').join('-');
      const newFileName = `${Date.now()}_${getRandomInt(10000000,99999999)}_${getRandomInt(10000000,99999999)}.${ext}`;
      cb(null, newFileName);
    }
});

const storageFullName = multer.diskStorage({
    destination: (req, file, cb) => { 
      cb(null, uploadsDir );
    },
    filename: (req, file, cb) => {  
      //const upFileName = file.originalname;
      //const ext = upFileName.substring(upFileName.indexOf('.')+1).toLowerCase();   
      const newFileName = file.originalname.toLowerCase().split(' ').join('-');
      cb(null, newFileName);
    }
});

const storageEmployee = multer.diskStorage({
    destination: (req, file, cb) => { 
      cb(null, employeeUploadsDir );
    },
    filename: (req, file, cb) => {  
      const upFileName = file.originalname;
      const ext = upFileName.substring(upFileName.indexOf('.')+1).toLowerCase();  
      // const ext = file.mimetype.split("/")[1];
      //const fileName = file.originalname.toLowerCase().split(' ').join('-');
      const newFileName = `${Date.now()}_${getRandomInt(10000000,99999999)}_${getRandomInt(10000000,99999999)}.${ext}`;
      cb(null, newFileName);
    }
});

router.uploadFile = multer({
    storage: storage,
    limits: {
      fileSize: 52428800
    },
    fileFilter: (req, file, cb) => {  

      if (file.mimetype == "image/png" || file.mimetype == "image/jpg" || file.mimetype == "image/jpeg" ) {
        cb(null, true);
      } else {
        cb(null, false);
        return cb('Only .png, .jpg and .jpeg format allowed!');
      }
    }
});
 
 

/****************  Upload Multiple Images Start Script *****************/
/****************  Upload Multiple Images Start Script *****************/
router.uploadMultiple = multer({
  storage: storage,
  limits: { fileSize: 52428800 },
  fileFilter: function (req, file, cb) {
    checkFileType(file, cb);
  }
});


function checkFileType(file, cb) { 
  const filetypes = /jpeg|jpg|png|gif/; 
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase()); 
  const mimetype = filetypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb( 'Only .png, .jpg and .jpeg format allowed!' );
  }
}
/****************  Upload Multiple Images End Script *****************/
/****************  Upload Multiple Images End Script *****************/


/****************  Upload PDF Start Script *****************/
/****************  Upload PDF Start Script *****************/
router.uploadPDFFile = multer({
  storage: storage,
  limits: {
    fileSize: 52428800
  },
  fileFilter: (req, file, cb) => {

    if ( file.mimetype == "application/pdf" ) {
      cb(null, true);
    } else {
      cb(null, false);
      return cb('Only .pdf format allowed!');
    }
  }
});
/****************  Upload PDF End Script *****************/
/****************  Upload PDF End Script *****************/



/****************  Upload Excel Start Script *****************/
/****************  Upload Excel Start Script *****************/
router.uploadExcelFile = multer({
  storage: storage,
  limits: {
    fileSize: 52428800
  },
  fileFilter: (req, file, cb) => {

    if ( file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || file.mimetype === 'application/vnd.ms-excel' ) {
      cb(null, true);
    } else {
      cb(null, false);
      return cb('Only .excel format allowed!');
    }
  }
});
/****************  Upload Excel End Script *****************/
/****************  Upload Excel End Script *****************/


/****************  Upload PDF/Doc Start Script *****************/
/****************  Upload PDF/Doc Start Script *****************/
router.uploadPDFDocxFile = multer({
  storage: storage,
  limits: {
    fileSize: 52428800 // 50MB
  },
  fileFilter: (req, file, cb) => {  
    if (
      file.mimetype === "application/pdf" || 
      file.mimetype === "application/msword" || 
      file.mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      cb(null, true);
    } else {
      cb(null, false);
      return cb(new Error('Only .pdf, .doc, and .docx formats allowed!'));
    }
  }
});
/****************  Upload PDF/Doc End Script *****************/
/****************  Upload PDF/Doc End Script *****************/



/****************  Upload PDF/Doc/Png/Jpg Start Script *****************/
/****************  Upload PDF/Doc/Png/Jpg Start Script *****************/
router.uploadPDFDocxJpegFile = multer({
  storage: storage,
  limits: {
    fileSize: 52428800 // 50MB
  },
  fileFilter: (req, file, cb) => {  
    if ( 
      file.mimetype === "application/pdf" || 
      file.mimetype === "application/msword" || 
      file.mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      file.mimetype === "image/png" ||
      file.mimetype === "image/jpg" ||
      file.mimetype === "image/jpeg"
    ) {
      cb(null, true);
    } else {
      cb(null, false);
      return cb(new Error('Only .pdf, .doc, and .docx formats allowed!'));
    }
  }
});

router.uploadPDFDocxJpegFileName = multer({
  storage: storageFullName,
  limits: {
    fileSize: 52428800 // 50MB
  },
  fileFilter: (req, file, cb) => {  
    if ( 
      file.mimetype === "application/pdf" || 
      file.mimetype === "application/msword" || 
      file.mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      file.mimetype === "image/png" ||
      file.mimetype === "image/jpg" ||
      file.mimetype === "image/jpeg"
    ) {
      cb(null, true);
    } else {
      cb(null, false);
      return cb(new Error('Only .pdf, .doc, and .docx formats allowed!'));
    }
  }
});

/****************  Upload PDF/Doc/Png/Jpg End Script *****************/
/****************  Upload PDF/Doc/Png/Jpg End Script *****************/



/****************  Upload Employee PDF/Doc/Png/Jpg Start Script *****************/
/****************  Upload Employee PDF/Doc/Png/Jpg Start Script *****************/
router.uploadPDFDocxJpegFileForEmployee = multer({
  storage: storageEmployee,
  limits: {
    fileSize: 52428800 // 50MB
  },
  fileFilter: (req, file, cb) => {  
    if ( 
      file.mimetype === "application/pdf" || 
      file.mimetype === "application/msword" || 
      file.mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      file.mimetype === "image/png" ||
      file.mimetype === "image/jpg" ||
      file.mimetype === "image/jpeg"
    ) {
      cb(null, true);
    } else {
      cb(null, false);
      return cb(new Error('Only .pdf, .doc, and .docx formats allowed!'));
    }
  }
});



router.uploadPDFDocxFileTest = multer({
  storage: storage,
  limits: {
    fileSize: 52428800, // 50MB
  },
  fileFilter: (req, file, cb) => {
    try {
      if (
        file.mimetype === "application/pdf" ||
        file.mimetype === "application/msword" ||
        file.mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      ) {
        cb(null, true);
      } else {
        cb(null, false);
        cb(new Error('Only .pdf, .doc, and .docx formats allowed!'));
      }
    } catch (error) {
      cb(error);
    }
  }
})


  module.exports = router;