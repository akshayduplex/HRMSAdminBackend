const express   = require("express"); 
const router    = express.Router();
const bcrypt    = require('bcryptjs');
const fs        = require('fs');
const path = require('path');
const moment = require('moment-timezone');

const uploadsDir =  './uploads';
const employeeUploadsDir =  './employee_uploads';

router.checkBody = (req, res )=>{ 
    if (Object.keys(req.body).length === 0) { 
        return res.status(200).send( {status:false, message:'Bad Request'} ); 
    }
}

router.numbersOnly = (str)=>{
    return str.toString().replace(/[^0-9\.]/g,'');
}

router.lettersOnly = (str)=>{
    var str = String( str );
    return str.toString().replace(/[^a-zA-Z\s]+$/g,'');
}

router.alphaNumOnly = (str)=>{
    var str = String( str );
    return str.replace(/[^A-Za-z0-9.\/\s]/g,'');
}

router.emailOnly = (str)=>{
    var str = String( str );
    return str.replace(/[^0-9a-zA-Z.@_]/g,' ');
}

router.commonOnly = (str)=>{
    var str = String( str );
    return str.replace(/[^A-Za-z0-9//,.\/\s]/g,'');
}

router.noSpace = (str)=>{
    var str = String( str );
    return str.replace(/[^A-Za-z0-9]+$/g,'');
}

router.filterAlphaNum = (str) => {  
    return str.replace(/[^A-Za-z0-9.\/\s]/g,'');
}

router.OTP = () =>{
    var a = Math.floor((Math.random() * 9999) + 999);
    a = String(a);
    a = a.substring(0, 4);
    return parseInt( a );
}

router.calculateTime = (valueStart,valueStop) => { 
    var timeStart = new Date( valueStart );
    var timeEnd = new Date( valueStop ); 
    var difference = timeEnd - timeStart;  
    difference = difference / 60 / 1000;
    return parseInt( difference );  
}

//Remove file from folder
router.removeFile = ( deleteFile )=>{ 
    var delFile = uploadsDir+'/'+ deleteFile ;
    if ( deleteFile && fs.existsSync(delFile)) {
       fs.rmSync( delFile, {
         force: true,
       });
    } 
    return true;
}

//Remove employee file from folder
router.removeEmployeeFile = ( deleteFile )=>{ 
    var delFile = employeeUploadsDir+'/'+ deleteFile ;
    if ( deleteFile && fs.existsSync(delFile)) {
       fs.rmSync( delFile, {
         force: true,
       });
    } 
    return true;
}

router.checkFileInFolder = (fileName) => {
    if (!fileName) {
      return false; // No file name provided
    }   
    const filePath = uploadsDir+'/'+ fileName ;
    const fileExists = fs.existsSync(filePath); 
    return fileExists;
}

router.allDateFormat  =  ( str, formatStr ) => {  
    var mnDate = moment( str ).tz('Asia/Kolkata').format( formatStr );  
    return mnDate ;
}

router.addDaysDate = ( str,days )=>{  
    var t = moment(str ).tz('Asia/Kolkata').add(days, 'days').format('YYYY-MM-DD HH:mm:ss'); 
    return t;
}

router.isValidEmail = ( email )=> {
    const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
}

router.isStrNumbers = ( str )=>{
    if (str.match(/^[0-9]+$/) === null) { 
        return false;
    }else{
        return true;
    }
}

router.createSlug = (str) => {
    return str
      .toLowerCase()  
      .replace(/\s+/g, '-')  
      .replace(/[^a-z0-9-]/g, '')  
      .replace(/-{2,}/g, '-') 
      .replace(/^-+|-+$/g, ''); 
}

router.removeAllCommaFromString = ( inputString ) =>{
    const resultString = inputString.replace(/,\s*/g, ', ');
    const NewResultString = resultString.replace(/,/g, '');
    return NewResultString;
}
  
router.removeMultipleSpaceFromString = ( inputString ) =>{
    const resultString = inputString.replace(/\s+/g, ' ');
    return resultString;
}

router.removePincodeFromString = (inputString) => { 
    const pinCodeRegex = /\b\d{6}\b/g; 
    const resultString = inputString.replace(pinCodeRegex, '');  
    const NewResultString = resultString.replace(/\s*,/g, ','); 
    const NewResultStrings = NewResultString.replace(/,/g, ',');
    return NewResultStrings;
}

router.dbDateFormat = ()=>{
   return new Date().toISOString();
}

router.generateHashPassword = ( req, res, next )=>{
    if( req.body.hasOwnProperty("password") && req.body.password !== '' ) { 
        const saltRounds = 10;
        bcrypt.genSalt(saltRounds, (err, salt) => {
            if (err){
                return res.status(200).json({status: false, message:'Hash Not Generated'});
            }
            bcrypt.hash(req.body.password, salt, (err, hash) => {
                if (err){
                    return res.status(200).json({status: false, message:'Hash Not Generated'});
                } 
                req.body.hashed_password = hash; 
                next();
            });
        });
    }else{
        next();
    }
}

/********** Collect Role User Data for Response *************/
router.roleUserResponseData = ( data, token )=>{
    const userData = {}
    userData._id = String( data._id );
    userData.name = String( data.name );
    userData.email = String( data.email );
    userData.mobile_no = String( data.mobile_no );
    userData.designation = String( data.designation );
    userData.profile_status = String( data.profile_status ); 
    userData.last_login = data.last_login ; 
    userData.token = String( token );
    userData.permissions =  data.permissions ;
    userData.employee_doc_id = String( data.employee_doc_id );
    return userData;
}

/********** Collect candidate User Data for Response *************/
router.candidateUserResponseData = ( data, token )=>{
    const userData = {}
    userData._id = String( data._id );
    userData.name = String( data.name );
    userData.email = String( data.email );
    userData.mobile_no = String( data.mobile_no );
    userData.profile_status = String( data.profile_status ); 
    userData.designation = String( data.designation );  
    userData.complete_profile_status = String( data.complete_profile_status ); 
    userData.profile_avg_rating = String( data.profile_avg_rating ); 
    userData.assessment_result = String( data.assessment_result ); 
    userData.resume_file = String( data.resume_file );
    userData.score = String( data.score );
    userData.page_steps = data.page_steps;
    userData.token = String( token );
    userData.user_type = String( 'role' );
    userData.assessment_apply_status = String( data.assessment_apply_status );
    return userData;
}

/********** Collect Employee User Data for Response *************/
router.employeeResponseData = ( data, token )=>{
    const userData = {}
    userData._id = String( data._id );
    userData.name = String( data.name );
    userData.email = String( data.email );
    userData.mobile_no = String( data.mobile_no );
    userData.designation = String( data.designation );
    userData.profile_status = String( data.profile_status ); 
    userData.token = String( token );
    userData.user_type = String( 'employee' );
    userData.employee_doc_id = String( data.employee_doc_id );
    return userData;
}

router.getHumanReadableDate = ( isoDate , type = null )=>{
        const date = new Date( isoDate );
        const dateFormat = type.toString();

        // Define options for toLocaleDateString and toLocaleTimeString to get a human-readable format
        const optionsDate = { year: 'numeric', month: 'numeric', day: 'numeric' }; 
        //const optionsTime = { hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: true };
        const optionsTime = { hour: 'numeric', minute: 'numeric', hour12: true };

        // Convert the date to a human-readable string
        const humanReadableDateFormat = date.toLocaleDateString(undefined, optionsDate);
        let [day, month, year] = humanReadableDateFormat.split('/'); 
        // Pad the day and month with leading zeros if needed
        day = day.padStart(2, '0');
        month = month.padStart(2, '0'); 
        // Return the formatted date
        const humanReadableDate = `${day}/${month}/${year}`;

        const humanReadableTime = date.toLocaleTimeString(undefined, optionsTime);
        if( dateFormat === 'date' ){
            //return `${humanReadableDate}`;
           return router.formatDateFromSystem( isoDate );
        }else if( dateFormat === 'time' ){
            return `${humanReadableTime}`;
        }else if( dateFormat === 'datetime' ){
            return `${humanReadableDate} , ${humanReadableTime}`;
        } 
}


router.formatDateFromSystem = (date)=>{
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
}



// router.replaceNullUndefined = ( arrAyList ) => { 
//     var output = JSON.stringify(arrAyList).replace(/null/g, '""');
//     output = JSON.parse(output);
//     return output;
//   }

router.replaceNullUndefined = (arrAyList) => {
    const output = JSON.parse(JSON.stringify(arrAyList, (key, value) => {
      if (value === null || Number.isNaN(value)) {
        return "";
      }
      return value;
    }));
    return output;
  };
  
router.updateDatesInArray = (arr, fields, dateFormat) => {
    const newDateFormat = typeof dateFormat !=='undefined' && dateFormat !=='' ? dateFormat : 'datetime'; 
    return arr.map(obj => {
        fields.forEach(field => {
            if (obj[field]) { 
                obj[field] = router.getHumanReadableDate( obj[field], newDateFormat ); 
            }
            
        }); 
        return obj;
    });
}

router.updateDatesInObject = (obj, fields, dateFormat) => {
    const newDateFormat = typeof dateFormat !== 'undefined' && dateFormat !== '' ? dateFormat : 'datetime';
    fields.forEach(field => {
        if (obj[field]) {
            obj[field] = router.getHumanReadableDate(obj[field], newDateFormat);
        }
    });
    return obj;
};

router.convertToDbDate = ( str )=>{
    return new Date( str ).toISOString();
}


router.convertBitsIntoKbMb = (bits)=>{
    const bitsInByte = 8;
    const bytesInKB = 1024;
    const bytesInMB = 1024 * 1024;
  
    const bytes = bits / bitsInByte;
  
    if (bytes >= bytesInMB) {
      return (bytes / bytesInMB).toFixed(2) + ' MB';
    } else {
      return (bytes / bytesInKB).toFixed(2) + ' KB';
    }
}

router.getImageType = (mimeType) => {
    if (typeof mimeType !== 'string') {
      return 'Invalid input: Expected a string';
    }
 
    const parts = mimeType.split('/');
    if (parts.length !== 2 || parts[0] === '') { 
      return 'Invalid input: Expected an image MIME type';
    }
  
    return parts[1];
  }


router.calculateDaysBetweenDates = (date1, date2) => {
   
    const firstDate = new Date(date1);
    const secondDate = new Date(date2); 
    const timeDifference = Math.abs(secondDate - firstDate); 
    const differenceInDays = Math.ceil(timeDifference / (1000 * 60 * 60 * 24)); 
    return differenceInDays;
}


router.convertDMYToYmdDateFormat = (dateString) => { 
    if( dateString !== '' ){
      const parts = dateString.split('-'); 
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }else{ 
        return ''; 
    }
}

router.convertExcelCustomDate = (dateString) => { 

    const monthMap = {
        'Jan': '01', 'Feb': '02', 'Mar': '03', 'Apr': '04',
        'May': '05', 'Jun': '06', 'Jul': '07', 'Aug': '08',
        'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dec': '12',
        'January': '01', 'February': '02', 'March': '03', 'April': '04',
        'May': '05', 'June': '06', 'July': '07', 'August': '08',
        'September': '09', 'October': '10', 'November': '11', 'December': '12'
    };

    // Normalize the input string
    dateString = dateString.replace(/'/g, '').trim();
    const parts = dateString.split(/[\s,]+/);

    if (parts.length < 2) {
        return '';
    }

    const [monthAbbr, yearPart] = parts;
    
    // Handle potential month abbreviation with extra characters
    const month = monthMap[monthAbbr] || monthMap[monthAbbr.slice(0, 3)];
    
    // Determine the full year based on the input
    let fullYear;
    const yearNumber = parseInt(yearPart, 10);
    
    if (yearNumber >= 0 && yearNumber <= 99) {
        // Assuming that years 25-99 are in the 2000s and 00-24 are in the 1900s
        fullYear = yearNumber >= 25 ? `20${yearNumber}` : `19${yearNumber}`;
    } else if (yearNumber >= 1925 && yearNumber <= 2099) {
        fullYear = yearNumber.toString();
    } else {
        return '';
    }
    
    if (!month || !fullYear) {
        return '';
    }

    return `${fullYear}-${month}-01`;
}

router.removeCommasFromNumberString = (numberString) => {
    if (typeof numberString !== 'string') { 
        return numberString;
    }

    // Remove commas from the string
    const cleanedString = numberString.replace(/,/g, '');

    // Convert the cleaned string to a number
    const number = parseFloat(cleanedString);

    if (isNaN(number)) { 
        return 0;
    }

    return number;
}


router.removeBlankValuesFromObject  = (obj) => {
    Object.keys(obj).forEach(key => {
      if (obj[key] === '' || obj[key] === null || obj[key] === undefined) {
        delete obj[key];
      }
    });
    return obj;
  }

router.getUniqueMonthsFromList = (dates) => {
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const uniqueMonths = new Set();

    dates.forEach(dateStr => {
        let date; 
        if (isNaN(Date.parse(dateStr))) { 
            const cleanedDateStr = dateStr
                .replace(/-/g, ' ') 
                .replace(/(October|Oct)/i, '10')
                .replace(/(November|Nov)/i, '11')
                .replace(/(December|Dec)/i, '12')
                .replace(/(January|Jan)/i, '01')
                .replace(/(February|Feb)/i, '02')
                .replace(/(March|Mar)/i, '03')
                .replace(/(April|Apr)/i, '04')
                .replace(/(May)/i, '05')
                .replace(/(June|Jun)/i, '06')
                .replace(/(July|Jul)/i, '07')
                .replace(/(August|Aug)/i, '08')
                .replace(/(September|Sep)/i, '09');
            date = new Date(cleanedDateStr);
        } else {
            date = new Date(dateStr);
        }
       
        const monthYear = `${monthNames[date.getMonth()]}-${date.getFullYear()}`;
        uniqueMonths.add(monthYear);
    });

    return Array.from(uniqueMonths);
}

router.changeJobTypeLabel  =  ( str ) => {  
     if( ['OnContract','onContract'].includes(str) ){
        return 'On Consultant' ;
     }else if( ['OnRole','onRole'].includes(str) ){
        return 'On Role' ;
     }   
}

router.getExactYearDifference = (date1, date2) => {
    const diffInMilliseconds = date2 - date1;
    const millisecondsInOneYear = 1000 * 60 * 60 * 24 * 365.25;
    return parseInt( Math.abs(diffInMilliseconds / millisecondsInOneYear) );
}


router.numbersToWords = ( num )=>{
    if (num === 0) return "Zero";

    const belowTwenty = [
        "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
        "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
        "Seventeen", "Eighteen", "Nineteen"
    ];

    const tens = [
        "", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"
    ];

    const scales = ["", "Thousand", "Lakh", "Crore"];

    function convertToWords(n) {
        if (n === 0) return "";

        if (n < 20) return belowTwenty[n];

        if (n < 100) {
            return tens[Math.floor(n / 10)] + (n % 10 > 0 ? " " + belowTwenty[n % 10] : "");
        }

        if (n < 1000) {
            return (
                belowTwenty[Math.floor(n / 100)] +
                " Hundred" +
                (n % 100 > 0 ? " and " + convertToWords(n % 100) : "")
            );
        }

        return "";
    }

    function convertIndianNumberSystem(n) {
        let result = "";

        const parts = [
            { divisor: 10000000, scale: "Crore" },
            { divisor: 100000, scale: "Lakh" },
            { divisor: 1000, scale: "Thousand" },
            { divisor: 1, scale: "" },
        ];

        for (let part of parts) {
            const quotient = Math.floor(n / part.divisor);
            if (quotient > 0) {
                result += convertToWords(quotient) + (part.scale ? " " + part.scale : "") + " ";
            }
            n %= part.divisor;
        }

        return result.trim();
    }

    return convertIndianNumberSystem(num);
}

router.formatIndianCurrency = (num) => { 
    let [integer, decimal] = num.toString().split("."); 
    integer = integer.replace(/\B(?=(\d{2})+(?!\d))/g, ","); 
    return decimal ? `${integer}.${decimal}` : integer;
}

router.writeDataInFile = (filePath, content )=>{
    const fullFilePath = './src/config/'+filePath;
    fs.writeFileSync( fullFilePath , content, { flag: 'w' }, (err) => {
        if (err) {
            //console.error('Error writing to the file:', err);
        } else {
           // console.log('File written successfully!');
        }
    });
}

router.getDomainNameFromUrl = (urlString) => {
    try {
      const url = new URL(urlString);
      return url.hostname;
    } catch (error) { 
      return null; 
    }
}

router.generateItemEntry = (base = 10000, count) => { 
    const itemNumber = String(base + count).padStart(5, '0');   
    return itemNumber;
  }


  router.getWeekOfMonth = (date) => {
    const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
    const dayOfWeek = startOfMonth.getDay(); // Day of the week for the 1st of the month
    const adjustedDate = date.getDate() + dayOfWeek; // Offset the day to the week
    return Math.ceil(adjustedDate / 7); // Calculate the week number
  };
  
  router.formatDateToWeekOf = (dateString) => {
    const date = new Date(dateString);
    const week = router.getWeekOfMonth(date);
    const month = date.toLocaleString('default', { month: 'long' });  
    const year = date.getFullYear();
    
    // Handle ordinal suffix for the week number
    const ordinalSuffix = ( n ) => {
      const s = ["th", "st", "nd", "rd"];
      const v = n % 100;
      return n + (s[(v - 20) % 10] || s[v] || s[0]);
    };
  
    return `${ordinalSuffix(week)} week of ${month}, ${year}`;
  };

// router.formatDateToMonthFullNameDateYear = (dateString) => {
//     const date = new Date(dateString);
//     if( date !== 'Invalid time value'){ 
//         const options = { year: 'numeric', month: 'long', day: 'numeric' };
//         return new Intl.DateTimeFormat('en-US', options).format(date);
//     }else{
//         return '';
//     } 
// }

router.formatDateToMonthFullNameDateYear = (dateString) => {
    const date = new Date(dateString);
    if (!isNaN(date.getTime())) { 
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return new Intl.DateTimeFormat('en-US', options).format(date);
    } else {
        return '';
    } 
}

router.removeDuplicatesRecordsFromList = (array, key) => {
    const seen = new Set();
    return array.filter(item => {
        const keyValue = item[key];
        if (seen.has(keyValue)) {
            return false;
        }
        seen.add(keyValue);
        return true;
    });
}

router.removeDuplicatesAppliedFrom = (arrayList) => {
    return [...new Set(arrayList)];
};

router.generateRandomEmail = (name, mobile) => { 
    const cleanName = name.toLowerCase().replace(/\s+/g, ''); 
    const shortName = cleanName.substring(0, 5); 
    const domain = "abc.com";
    return `${shortName}${mobile}@${domain}`;
};

router.writeDataInFileAnyPath = (filePath, content )=>{
    const fullFilePath = './src/temp_data';
    const fullFilePathWithData = fullFilePath+'/'+filePath;

    fs.mkdir( fullFilePath , { recursive: true }, (err) => {
        if (err) {
            //console.error('Error creating directory:', err);
        } else {
            //console.log('Directory created successfully!');
        }
    });

    fs.writeFileSync( fullFilePathWithData , content, { flag: 'w' }, (err) => {
        if (err) {
            //console.error('Error writing to the file:', err);
        } else {
           // console.log('File written successfully!');
        }
    });
}

router.getWriteDataFromFile = (filePath )=>{
    const fullFilePath = './src/temp_data'; 
    const getData = fs.readFileSync( fullFilePath+'/'+filePath , 'utf8' ); 
    return getData;
}

router.validateYearWithRange = (year) => {
    return /^\d{4}$/.test(year);
};

router.convertAnyDateFormat = (dateStr) => {

    const monthMap = {
        "January": "01", "February": "02", "March": "03", "April": "04",
        "May": "05", "June": "06", "July": "07", "August": "08",
        "September": "09", "October": "10", "November": "11", "December": "12",
        "Jan": "01", "Feb": "02", "Mar": "03", "Apr": "04",
        "May": "05", "Jun": "06", "Jul": "07", "Aug": "08",
        "Sep": "09", "Oct": "10", "Nov": "11", "Dec": "12"
    };

    // Check if already in "YYYY-MM-DD" format
    let match0 = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (match0) {
        return dateStr; // Already in correct format
    }

    // Check if the format is "DD-MM-YYYY" or "DD/MM/YYYY"
    let match1 = dateStr.match(/^(\d{2})[-\/](\d{2})[-\/](\d{4})$/);
    if (match1) {
        let [_, day, month, year] = match1;
        if (parseInt(day) > 12) {   
            return `${year}-${month}-${day}`;
        }
    }

    // Check if the format is "MM-DD-YYYY" or "MM/DD/YYYY"
    let match2 = dateStr.match(/^(\d{2})[-\/](\d{2})[-\/](\d{4})$/);
    if (match2) {
        let [_, month, day, year] = match2;
        return `${year}-${month}-${day}`;
    }

    // Check "YYYY-MMMM-DD"
    let match3 = dateStr.match(/^(\d{4})-([A-Za-z]+)-(\d{2})$/);
    if (match3) {
        let [_, year, monthName, day] = match3;
        let month = monthMap[monthName];
        if (month) {
            return `${year}-${month}-${day}`;
        }
    } 
    return ""; 
}

router.generateUnique10DigitNumbers = () => {
    return Math.floor(1000000000 + Math.random() * 9000000000);
}

router.getSalaryRange = (ctcPerAnnum) => {
    const maxSalary = ctcPerAnnum;
    const minSalary = Math.floor(ctcPerAnnum * 0.8); 
  
    return {
      minSalary,
      maxSalary
    };
}

router.normalizeEmployeeType = (input) => {
    const str = input.trim().toLowerCase(); 
    var job_code = str.toUpperCase().replace(/\s/g, '');  
    return job_code;
}

router.deleteMultipleUploadedImage = (  documents ) => { 
    if( documents.length > 0 ){
        documents.forEach((file) => {
            router.removeFile( file.file_name );
        });
    }
}

router.checkFileExistence = ( fileName )=>{ 
    var ckFile = uploadsDir+'/'+ fileName ;
    if ( fileName && fs.existsSync(ckFile)) {
        return true;
    }else{
        return false;
    }
}

router.formatFileSize = (bytes) => {
  const kb = 1024;
  const mb = kb * 1024;
  const gb = mb * 1024;

  if (bytes >= gb) {
    return (bytes / gb).toFixed(2) + ' GB';
  } else if (bytes >= mb) {
    return (bytes / mb).toFixed(2) + ' MB';
  } else if (bytes >= kb) {
    return (bytes / kb).toFixed(2) + ' KB';
  } else {
    return bytes + ' Bytes';
  }
}


router.copyFilesAndGetDetails = ( filesToCopy, destinationFolder) => {
  // Ensure destination folder exists
  if (!fs.existsSync(destinationFolder)) {
    fs.mkdirSync(destinationFolder, { recursive: true });
  }

  const results = [];

  filesToCopy.forEach((sourceFilePath) => {
    try {
      const fileName = path.basename(sourceFilePath);
      const destinationFilePath = path.join(destinationFolder, fileName);

      fs.copyFileSync(sourceFilePath, destinationFilePath); // Use sync version

      //const fileExtension = path.extname(fileName);
      const fileSize = fs.statSync(destinationFilePath).size;
      const fileSizeKB = router.formatFileSize( (fileSize / 1024).toFixed(2) );

      results.push({
        message: 'copied',
        file_name: fileName,
        file_extension: fileName.split('.').pop(),
        file_size_bytes: fileSizeKB
      });
    } catch (err) {
      results.push({
        message: `Error copying file: ${err.message}`,
        file_path: sourceFilePath
      });
    }
  });

  return results;
}

router.formatDateToCustomString = (isoDateStr) => {
    const date = new Date(isoDateStr);

    const day = date.getDate();
    const month = date.toLocaleString('en-US', { month: 'long' });
    const year = date.getFullYear();

    // Add suffix (st, nd, rd, th)
    const suffix = (day) => {
        if (day > 3 && day < 21) return 'th';
        switch (day % 10) {
            case 1: return 'st';
            case 2: return 'nd';
            case 3: return 'rd';
            default: return 'th';
        }
    };

    return `${day}${suffix(day)} ${month}, ${year}`;
}

router.formatDateToCustomStringNoComma = (isoDateStr) => {
    const date = new Date(isoDateStr);

    const day = date.getDate();
    const month = date.toLocaleString('en-US', { month: 'long' });
    const year = date.getFullYear();
    const yearData = String(year).substring(2); 

    // Add suffix (st, nd, rd, th)
    const suffix = (day) => {
        if (day > 3 && day < 21) return 'th';
        switch (day % 10) {
            case 1: return 'st';
            case 2: return 'nd';
            case 3: return 'rd';
            default: return 'th';
        }
    };

    return `${day}${suffix(day)} ${month} ${yearData}`;
}


router.formatDateDateFullMonthYear = (inputDate) => {
    if( inputDate ){ 
        // input format: dd/mm/yyyy
        const [day, month, year] = inputDate.split("/");

        // month names
        const monthNames = [
            "January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"
        ];

        // format output: dd/Month/yy
        return `${day}/${monthNames[parseInt(month) - 1]}/${year.slice(-2)}`;
    }
    else{
        return '';
    }
    
}

  
module.exports = router;