const AttendanceCI = require('../../../models/AttendanceCI.js');
const { dbObjectId } = require('../../../models/dbObject.js');
const dotenv = require("dotenv");
dotenv.config({path:'../src/config.env'});
const { dbDateFormat, convertToDbDate, allDateFormat, removeFile, getUniqueMonthsFromList, getHumanReadableDate  } = require('../../../middlewares/myFilters.js');
const { readExcelFile } = require('../../../middlewares/ImportExport.js'); 
const { validationResult } = require('express-validator');
const EmployeeCI = require('../../../models/EmployeeCI.js');
const { emailSystem } = require('../../../middlewares/smsMailSystem');

const uploadsDir =  './uploads';

const controller = {};

/********* Apply Employee Leave **********/
controller.applyEmployeeLeave = async (req, res) => {
    try {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.status(402).json({ status: false, message: errors.array()[0].msg });
        }

        const { employee_doc_id, leave_dates, leave_category, time_off_type } = req.body;

        // Get unique months from leave dates
        const monthsList = getUniqueMonthsFromList(leave_dates);
         

        // Fetch employee data
        const empData = await EmployeeCI.findOne(
            { '_id': dbObjectId(employee_doc_id) },
            { name: 1, employee_code: 1, project_name: 1, salary_total: 1, deduction_data: 1, attendance: 1, project_id: 1 }
        );

        if (!empData) {
            return res.status(404).send({ status: false, message: 'No Employee Record Matched' });
        } else {

            const project_id = empData?.project_id?.toString();  
             
            for (const item of monthsList) { 
                const getMonthYearDate = new Date(`01-${item}`);

                let attendance_list = leave_dates
                    .filter(elm => allDateFormat(convertToDbDate(item), 'YYYY-MM') === allDateFormat(convertToDbDate(elm), 'YYYY-MM'))
                    .map(elm => ({
                        date_text: allDateFormat(convertToDbDate(elm), 'YYYY-MM-DD'),
                        date_on: new Date( allDateFormat(convertToDbDate(elm), 'YYYY-MM-DD') ),
                        status: 'L',
                        time_off_type,
                        leave_category,
                        leave_status: 'Applied'
                    }));


                const where = {
                    employee_id: dbObjectId(employee_doc_id),
                    project_id: dbObjectId(project_id),
                    month: String(getMonthYearDate.getMonth() + 1),
                    year: String(getMonthYearDate.getFullYear())
                };

                const attendData = await AttendanceCI.findOne(where);

                if (!attendData) {
                    const saveData = {
                        employee_id: dbObjectId(employee_doc_id),
                        project_id: dbObjectId(project_id),
                        project_name: empData.project_name,
                        employee_code: empData.employee_code,
                        name: empData.name,
                        ctc: empData.ctc,
                        month: String(getMonthYearDate.getMonth() + 1),
                        year: String(getMonthYearDate.getFullYear()),
                        add_date: dbDateFormat(),
                        deduction: empData.deduction_data?.total || 0,
                        check_in_default: '10:00 AM',
                        check_out_default: '06:00 PM',
                        attendance_list: attendance_list 
                    }; 

                    const instData = new AttendanceCI(saveData);
                    try {
                        const data = await instData.save();
                        //console.log(data);
                    } catch (error) {
                        //console.log(error);
                    }
                }else{
                    const getOldDates = attendData.attendance_list;
                    var prepareLeaveList = [];
                    for (const dateItem of attendance_list) {
                        const matchItem = getOldDates.find(elm => String(dateItem.date_text) === String(elm.date_text) );
                        if( typeof matchItem === 'undefined' ){
                            const pushElem = {}
                            pushElem.date_text = dateItem.date_text;
                            pushElem.date_on = dateItem.date_on;
                            pushElem.status = 'L';
                            pushElem.time_off_type = time_off_type;
                            pushElem.leave_category = leave_category;
                            pushElem.leave_status = 'Applied';
                            prepareLeaveList.push( pushElem );
                        }
                    }
                    
                    if(prepareLeaveList){
                        await AttendanceCI.updateOne(
                            { _id: attendData._id },
                            { $push: { 'attendance_list': { $each: prepareLeaveList} } }
                        );
                    }                   
                }
            } 
            return res.status(200).send({ status: true, message: 'Leave Applied Successfully' });
        }
    } catch (error) {
        return res.status(500).send({ status: false, message: 'An error occurred' });
    }
};

/********* Import Attendance data from sheet **********/
controller.importEmployeeAttendanceData = async ( req, res )=>{

    if (req.body && typeof req.body === 'object') { 
        req.body = JSON.parse(JSON.stringify(req.body));
    }  

    console.log( req.body );

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        if( req.file &&  req.file.filename ){
            removeFile( req.file.filename );
        }
        return res.status(402).json({ status: false, message: errors.array()[0].msg });
    } 

    const getMonthYearDate = new Date(  req.body.month_name  );       
    const year = getMonthYearDate.getFullYear();
    const month = getMonthYearDate.getMonth() + 1;
    const getNoOfDays = (year, month) => new Date(year, month, 0).getDate();
    const daysInMonth = getNoOfDays(year, month);
 


    if( req.file && req.file.filename ){  
         
            const excelData = await readExcelFile( uploadsDir+'/'+req.file.filename  ); 
            removeFile( req.file.filename );
                // Extract headers
                const headers = excelData[0]; 
 
                let dayCounter = 1;   
                const updatedHeaders = headers.map((item, index) => {
                    if (item === "Date" ) {
                        return String(dayCounter++);  
                    }
                    if( index === 2 && item ==='Leave OB'){
                        item = String('SL');
                    }
                    if( index === 3 && item ==='Leave OB'){
                        item = String('CL');
                    }
                    if( index === 4 && item ==='Leave OB'){
                        item = String('OL');
                    }
                    if( index === 5 && item ==='Leave OB'){
                        item = String('EL');
                    }
                    return item;
                }); 
 
                const excelJsonData = excelData.slice(1).map(row => {
                        const obj = {};
                        updatedHeaders.forEach((updatedHeaders, index) => {
                            obj[updatedHeaders] = String(row[index]);
                        });
                        return obj;
                }); 

                const newExcelJsonData = excelJsonData.slice(1).map(row => { 
                    return row;
                }); 

                
        return res.status(200).send( {'status':true, 'month_days': String( daysInMonth ), month: String( month).padStart(2, '0'), year : String( year), 'data': newExcelJsonData, 'message': 'Data Formatted Successfully.'} );
    }
    else{
        return res.status(404).send( {'status':false, 'message': process.env.DEFAULT_ERROR_MESSAGE } ); 
    }
  
       

}


/********* Save Employee Attendance In Bulk **********/
controller.saveAttendanceInBulk = async (req, res) => {
    try {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.status(402).json({ status: false, message: errors.array()[0].msg });
        }

        //console.log( req.body ); 
 
        const { project_id, month, year, data } = req.body; 

        //Get the employee code in $in array  
        const employeeCodeList = data.map((item)=>{
            return typeof item['Employee ID'] !=='undefined' ? item['Employee ID'] : item['EmployeeID'];
        });

        console.log( employeeCodeList );
        // Get unique months from leave dates
        //const monthsList = getUniqueMonthsFromList(leave_dates); 

        // Fetch employee data
        const empDataList = await EmployeeCI.find(
            { 'employee_code': {$in : employeeCodeList } },
            { name: 1, employee_code: 1, project_name: 1, salary_total: 1, deduction_data: 1, attendance: 1 }
        );


        // Fetch employee data
        const empCurrentMonthAttendanceDataList = await AttendanceCI.find(
            { 'employee_code': {$in : employeeCodeList } },
            { name: 1, employee_code: 1, project_name: 1, salary_total: 1, deduction_data: 1, attendance: 1 }
        );

        //console.log( empDataList ); 
        //return res.status(404).send({ status: false, data: empDataList, message: 'No Employee Record Matched' });
       
 

        if (!empDataList) {
            return res.status(404).send({ status: false, message: 'No Employee Record Matched' });
        } else {
             
            for (const item of monthsList) { 
                const getMonthYearDate = new Date(`01-${item}`);

                let attendance_list = leave_dates
                    .filter(elm => allDateFormat(convertToDbDate(item), 'YYYY-MM') === allDateFormat(convertToDbDate(elm), 'YYYY-MM'))
                    .map(elm => ({
                        date_text: allDateFormat(convertToDbDate(elm), 'YYYY-MM-DD'),
                        date_on: new Date( allDateFormat(convertToDbDate(elm), 'YYYY-MM-DD') ),
                        status: 'L',
                        time_off_type,
                        leave_category,
                        leave_status: 'Applied'
                    }));


                const where = {
                    employee_id: dbObjectId(employee_doc_id),
                    project_id: dbObjectId(project_id),
                    month: String(getMonthYearDate.getMonth() + 1),
                    year: String(getMonthYearDate.getFullYear())
                };

                const attendData = await AttendanceCI.findOne(where);

                if (!attendData) {
                    const saveData = {
                        employee_id: dbObjectId(employee_doc_id),
                        project_id: dbObjectId(project_id),
                        project_name: empData.project_name,
                        employee_code: empData.employee_code,
                        name: empData.name,
                        ctc: empData.ctc,
                        month: String(getMonthYearDate.getMonth() + 1),
                        year: String(getMonthYearDate.getFullYear()),
                        add_date: dbDateFormat(),
                        deduction: empData.deduction_data?.total || 0,
                        check_in_default: '10:00 AM',
                        check_out_default: '06:00 PM',
                        attendance_list: attendance_list 
                    }; 

                    const instData = new AttendanceCI(saveData);
                    try {
                        const data = await instData.save();
                        //console.log(data);
                    } catch (error) {
                        //console.log(error);
                    }
                }else{
                    const getOldDates = attendData.attendance_list;
                    var prepareLeaveList = [];
                    for (const dateItem of attendance_list) {
                        const matchItem = getOldDates.find(elm => String(dateItem.date_text) === String(elm.date_text) );
                        if( typeof matchItem === 'undefined' ){
                            const pushElem = {}
                            pushElem.date_text = dateItem.date_text;
                            pushElem.date_on = dateItem.date_on;
                            pushElem.status = 'L';
                            pushElem.time_off_type = time_off_type;
                            pushElem.leave_category = leave_category;
                            pushElem.leave_status = 'Applied';
                            prepareLeaveList.push( pushElem );
                        }
                    }
                    
                    if(prepareLeaveList){
                        await AttendanceCI.updateOne(
                            { _id: attendData._id },
                            { $push: { 'attendance_list': { $each: prepareLeaveList} } }
                        );
                    }                   
                }
            } 
            return res.status(200).send({ status: true, message: 'Leave Applied Successfully' });
        }
    } catch (error) {
        return res.status(500).send({ status: false, message: 'An error occurred' });
    }
};


/********* get Employee Leave List **********/
controller.getAttendanceByEmployeeID = async (req, res) => {

    try {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.status(402).json({ status: false, message: errors.array()[0].msg });
        }

        const { from_date, to_date, employee_doc_id, page_no, per_page_record  } = req.body; 

        const pageOptions = {
            page: parseInt( ((page_no ? page_no : 1) - 1)) || 0,
            limit: parseInt( per_page_record) || 10
        } 


        const where = {}
        where.employee_id = dbObjectId( employee_doc_id );

        if( from_date !=='' && to_date !==''  ){
            const fromDate = new Date( from_date );
                   fromDate.setHours(0, 0, 0, 0); 
            const toDate = new Date( to_date );
                   toDate.setHours(0, 0, 0, 0);  
            where['attendance_list.date_on'] = { $gte: fromDate, $lte: toDate }
        } 

        // Fetch employee data
       const getRecords =  await AttendanceCI.aggregate([ 
                { $match: {employee_id: dbObjectId( employee_doc_id ) } },
                { $unwind: "$attendance_list" }, 
                {
                    $match: where
                },
 
                {
                    $project: {
                    _id: 0,
                    employee_id: 1,
                    name: 1,
                    employee_code: 1,
                    project_name: 1,
                    "attendance_list.date_text": 1,
                    "attendance_list.date_on": 1,
                    "attendance_list.status": 1,
                    "attendance_list.leave_category": 1,
                    "attendance_list.leave_status": 1,
                    "attendance_list.hours_worked": 1,
                    "attendance_list.overtime": 1
                    }
                },

                // Optionally sort by date
                {
                    $sort: {
                    "attendance_list.date_on": 1
                    }
                },
                { $skip: pageOptions.page * pageOptions.limit  }, 
                { $limit: pageOptions.limit }
                ]);
 

                if( getRecords.length > 0 ){ 
                    return res.status(200).send({ status: true, data: getRecords, message: 'API Accessed Successfully' });
                }else{
                    return res.status(204).send( {'status':false, 'message': 'No record matched'} );
                }
       
    } catch (error) {
        return res.status(500).send({ status: false, message: 'An error occurred' });
    }
};



module.exports = controller;
