const RequisitionFormCI = require('../../../models/RequisitionFormCI.js');
const { dbObjectId, dbObjectIdValidate } = require('../../../models/dbObject.js');
const EmployeeCI = require('../../../models/EmployeeCI.js');
const ProjectCl = require('../../../models/ProjectCl.js');
const JobCl = require('../../../models/JobsCI.js');

const dotenv = require("dotenv");
dotenv.config({ path: '../src/config.env' });
const { dbDateFormat, updateDatesInArray, replaceNullUndefined, lettersOnly, removeFile, getHumanReadableDate, convertToDbDate, calculateDaysBetweenDates, allDateFormat } = require('../../../middlewares/myFilters.js');
const { requisitionFormApprovalMail } = require('../../../helpers/RequisitionFormMail.js');
const { createRequisitionFormMail } = require('../../../helpers/CreateRequisitionFormMail.js');
const { RequisitionFormApprovedByCeo } = require('../../../helpers/RequisitionFormApprovedByCeo.js');
const { needToDiscussAtMprMail } = require('../../../helpers/NeedToDisscuss.js');
const { validationResult } = require('express-validator');
const fs = require('fs');

const IMAGE_PATH = process.env.IMAGE_PATH;

const controller = {};

/********* Add New Requisition form From backend **********/
controller.AddRequisitionData = async (req, res) => {

    if (req.body && typeof req.body === 'object') {
        req.body = JSON.parse(JSON.stringify(req.body));
    }

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        if (req.file && req.file.filename) {
            removeFile(req.file.filename);
        }
        return res.status(402).json({ status: false, message: errors.array()[0].msg });
    }


    saveData = {};
    saveData = req.body;
    if (req.file && req.file.filename) {
        saveData.requisition_form = req.file.filename;
    }

    if (typeof req.body.project_id !== 'undefined' && req.body.project_id !== '') {
        saveData.project_id = dbObjectId(req.body.project_id);
    }
    if (typeof req.body.department_id !== 'undefined' && req.body.department_id !== '') {
        saveData.department_id = dbObjectId(req.body.department_id);
    }
    if (typeof req.body.designation_id !== 'undefined' && req.body.designation_id !== '') {
        saveData.designation_id = dbObjectId(req.body.designation_id);
    }
    if (typeof req.body.reporting_structure_id !== 'undefined' && req.body.reporting_structure_id !== '') {
        saveData.reporting_structure_id = dbObjectId(req.body.reporting_structure_id);
    }


    const firstLettersFromJobTitle = saveData.designation_name.split(" ").filter(word => /^[a-zA-Z]+$/.test(word)).map(word => word[0].toUpperCase());
    const DesignationCode = firstLettersFromJobTitle.join("") !== '' ? firstLettersFromJobTitle.join("") : 'DFLT';


    var saveDataTitle = '';
    if (typeof req.body.type_of_opening !== 'undefined' && req.body.type_of_opening === 'new') {
        saveDataTitle = `MPR-${DesignationCode}-${allDateFormat(dbDateFormat(), 'DDMMYYYY')}`;
    }
    else if (typeof req.body.type_of_opening !== 'undefined' && req.body.type_of_opening === 'replacement') {
        saveDataTitle = `MPR-${DesignationCode}-${allDateFormat(dbDateFormat(), 'DDMMYYYY')}`;
    }
    else if (typeof req.body.type_of_opening !== 'undefined' && req.body.type_of_opening === 'planned_non_budgeted') {
        saveDataTitle = `MPR-${DesignationCode}-${allDateFormat(dbDateFormat(), 'DDMMYYYY')}`;
    }


    //check duplicate mpr number
    const countSameMPR = await RequisitionFormCI.countDocuments({ 'title': saveDataTitle });
    if (countSameMPR > 0) {
        saveData.title = `${saveDataTitle}-${countSameMPR}`;
    } else {
        saveData.title = saveDataTitle;
    }


    if (typeof saveData.place_of_posting !== 'undefined' && saveData.place_of_posting.length > 0) {
        saveData.place_of_posting = JSON.parse(req.body.place_of_posting).map((item) => {
            const push = {}
            if (typeof item.state_id !== 'undefined' && item.state_id !== '') {
                push.state_id = dbObjectId(item.state_id);
            }
            if (typeof item.state_name !== 'undefined' && item.state_name !== '') {
                push.state_name = item.state_name;
            }
            if (typeof item.location_id !== 'undefined' && item.location_id !== '') {
                push.location_id = dbObjectId(item.location_id);
            }
            push.location_name = item.location_name;
            return push;
        });
    }

    if (typeof req.body.raised_on !== 'undefined' && req.body.raised_on !== '') {
        saveData.raised_on = convertToDbDate(req.body.raised_on);
    }

    if (req.body.hasOwnProperty('mode_of_employment') && req.body.mode_of_employment !== '') {
        saveData.mode_of_employment = req.body.mode_of_employment;
    }

    saveData.add_date = dbDateFormat();
    saveData.updated_on = dbDateFormat();


    const checkWhere = {}
    checkWhere.project_id = saveData.project_id;
    checkWhere.department_id = saveData.department_id;
    checkWhere.designation_id = saveData.designation_id;
    checkWhere.reporting_structure_id = saveData.reporting_structure_id;
    checkWhere.type_of_opening = saveData.type_of_opening;
    checkWhere.grade = saveData.grade;

    //prepare activity data 
    const activityData = [];

    var activityDataPush = {}
    activityDataPush.employee_doc_id = 'NONE';
    activityDataPush.priority = 0;
    activityDataPush.name = req.body.raised_by;
    activityDataPush.designation = 'Corporate HR';
    activityDataPush.employee_designation = 'Corporate HR';
    activityDataPush.type = 'raised';
    activityDataPush.status = 'Approved';
    activityDataPush.comment = '';
    activityDataPush.mobile = req.body.raised_by_mobile;
    activityDataPush.comment_date = dbDateFormat();
    activityDataPush.added_date = dbDateFormat();
    activityData.push(activityDataPush);

    //prepare ceo data 
    var activityDataPush = {}
    // activityDataPush.name = 'CEO';
    // activityDataPush.designation = 'CEO';
    // activityDataPush.type = 'entry';
    // activityDataPush.status = 'Pending';
    // activityDataPush.comment = '';
    // activityDataPush.added_date =  dbDateFormat();
    // activityData.push( activityDataPush );

    //prepare Hod data 
    // var activityDataPush = {}
    // activityDataPush.name = 'HOD';
    // activityDataPush.designation = 'HOD';
    // activityDataPush.type = 'entry';
    // activityDataPush.status = 'Pending';
    // activityDataPush.comment = '';
    // activityDataPush.added_date =  dbDateFormat();
    // activityData.push( activityDataPush ); 


    //prepare HR data 
    // var activityDataPush = {}
    // if(['HR','hr','Hr'].includes( req.body.raised_by_designation )){
    //     activityDataPush.name = req.body.raised_by;
    //     activityDataPush.mobile = req.body.raised_by_mobile;
    // }else{
    //  activityDataPush.name = process.env.DEFAULT_HR_NAME;
    //  activityDataPush.mobile = process.env.DEFAULT_HR_MOBILE_NO;
    // }

    // activityDataPush.designation = 'HR';
    // activityDataPush.sub_designation = process.env.DEFAULT_HR_DESIGNATION;
    // activityDataPush.type = 'entry';
    // activityDataPush.status = 'Pending';
    // activityDataPush.comment = '';
    // activityDataPush.added_date =  dbDateFormat();
    //activityData.push( activityDataPush ); 

    saveData.activity_data = activityData;

    const RegardsData = saveData.activity_data.find((item) => item.type === 'raised');

    ProjectCl.findOne({ _id: saveData.project_id }, { 'duration': 1 })
        .then((projectData) => {

            saveData.project_duration = typeof projectData.duration !== 'undefined' ? projectData.duration : '';

            RequisitionFormCI.findOne(checkWhere)
                .then((ckData) => {
                    if (ckData) {
                        return res.status(409).send({ 'status': false, 'message': 'Requisition Form Already Added' });
                    }

                    const instData = new RequisitionFormCI(saveData);
                    instData.save()
                        .then((dataInsert) => {

                            const insertId = dataInsert._id;
                            saveData._id = insertId;
                            //console.log( saveData );
                            /*
                            ProjectCl.findOne( {_id: saveData.project_id, manager_list: {$exists: true} }, {'manager_list':1})
                            .then( (data)=>{ 
        
                                if( data && typeof data.manager_list !=='undefined' && data.manager_list.length > 0 ){
                                    const EmpIds = data.manager_list.map((item)=>{
                                        return item.emp_id;
                                    });
                                
                                    const checkEmpWhere = {}
                                    //checkEmpWhere.project_id = saveData.project_id;
                                    checkEmpWhere._id = {$in: EmpIds };
                                    checkEmpWhere.status = 'Active';
        
                                        EmployeeCI.find( checkEmpWhere ,{email:1,name: 1, designation: 1})
                                        .then((empData)=>{
                                            if( empData && empData.length > 0 ){
                                                empData.forEach((item, index) => {  
                                                    setTimeout(async () => {
                                                        try { 
                                                             requisitionFormApprovalMail( saveData , item.email, 'HOD', RegardsData, true, item.name, '', item.designation );
                                                        } catch (error) {
                                                            console.error("Error sending mail:", error);
                                                        }
                                                    }, 500 * index);
                                                });                                                 
                                            } 
        
                                            return res.status(200).send( {'status':true, 'message': 'Requisition Form Data Saved Successfully'} );
                                        })
                                        .catch( (error)=>{ 
                                            return res.status(200).send( {'status':true, 'message': 'Requisition Form Data Saved Successfully'} );
                                        });
                                }else{
                                    return res.status(200).send( {'status':true, 'message': 'Requisition Form Data Saved Successfully'} );
                                } 
                            })
                            .catch( (error)=>{ 
                                return res.status(200).send( {'status':true, 'message': 'Requisition Form Data Saved Successfully'} );
                            });*/

                            //ADDED ON 27-jUNE-2024
                            return res.status(200).send({ 'status': true, 'message': 'Requisition Form Data Saved Successfully' });
                        })
                        .catch((error) => {
                            return res.status(403).send({ 'status': false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE });
                        });
                }).catch((error) => {
                    return res.status(403).send({ 'status': false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE });
                });
        }).catch((error) => {
            return res.status(403).send({ 'status': false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE });
        });

}

/********* Add New Requisition form From backend **********/
controller.AddRequisitionDataWithOldMpr = async (req, res) => {

    if (req.body && typeof req.body === 'object') {
        req.body = JSON.parse(JSON.stringify(req.body));
    }

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        if (req.file && req.file.filename) {
            removeFile(req.file.filename);
        }
        return res.status(402).json({ status: false, message: errors.array()[0].msg });
    }



    saveData = {};
    saveData = req.body;
    if (req.file && req.file.filename) {
        saveData.requisition_form = req.file.filename;
    }

    if (typeof req.body.project_id !== 'undefined' && req.body.project_id !== '') {
        saveData.project_id = dbObjectId(req.body.project_id);
    }
    if (typeof req.body.department_id !== 'undefined' && req.body.department_id !== '') {
        saveData.department_id = dbObjectId(req.body.department_id);
    }
    if (typeof req.body.designation_id !== 'undefined' && req.body.designation_id !== '') {
        saveData.designation_id = dbObjectId(req.body.designation_id);
    }
    if (typeof req.body.reporting_structure_id !== 'undefined' && req.body.reporting_structure_id !== '') {
        saveData.reporting_structure_id = dbObjectId(req.body.reporting_structure_id);
    }


    const firstLettersFromJobTitle = saveData.designation_name.split(" ").filter(word => /^[a-zA-Z]+$/.test(word)).map(word => word[0].toUpperCase());
    const DesignationCode = firstLettersFromJobTitle.join("") !== '' ? firstLettersFromJobTitle.join("") : 'DFLT';

    var saveDataTitle = '';
    if (typeof req.body.type_of_opening !== 'undefined' && req.body.type_of_opening === 'new') {
        saveDataTitle = `MPR-${DesignationCode}-${allDateFormat(dbDateFormat(), 'DDMMYYYY')}`;
    }
    else if (typeof req.body.type_of_opening !== 'undefined' && req.body.type_of_opening === 'replacement') {
        saveDataTitle = `MPR-${DesignationCode}-${allDateFormat(dbDateFormat(), 'DDMMYYYY')}`;
    }
    else if (typeof req.body.type_of_opening !== 'undefined' && req.body.type_of_opening === 'planned_non_budgeted') {
        saveDataTitle = `MPR-${DesignationCode}-${allDateFormat(dbDateFormat(), 'DDMMYYYY')}`;
    }

    //check duplicate mpr number
    const countSameMPR = await RequisitionFormCI.countDocuments({ 'title': saveDataTitle });
    if (countSameMPR > 0) {
        saveData.title = `${saveDataTitle}-${countSameMPR}`;
    } else {
        saveData.title = saveDataTitle;
    }



    if (typeof saveData.place_of_posting !== 'undefined' && saveData.place_of_posting.length > 0) {
        saveData.place_of_posting = JSON.parse(req.body.place_of_posting).map((item) => {
            const push = {}
            if (typeof item.state_id !== 'undefined' && item.state_id !== '') {
                push.state_id = dbObjectId(item.state_id);
            }
            if (typeof item.state_name !== 'undefined' && item.state_name !== '') {
                push.state_name = item.state_name;
            }
            if (typeof item.location_id !== 'undefined' && item.location_id !== '') {
                push.location_id = dbObjectId(item.location_id);
            }
            push.location_name = item.location_name;
            return push;
        });
    }

    if (typeof req.body.raised_on !== 'undefined' && req.body.raised_on !== '') {
        saveData.raised_on = convertToDbDate(new Date(req.body.raised_on));
    }

    saveData.add_date = dbDateFormat();
    saveData.updated_on = dbDateFormat();

    if (typeof req.body.replacement_employee !== 'undefined' && JSON.parse(req.body.replacement_employee).length > 0) {
        saveData.replacement_employee_list = JSON.parse(req.body.replacement_employee).map((item) => {
            return item;
        });
    }

    if (typeof req.body.replacement_date !== 'undefined' && req.body.replacement_date !== '') {
        saveData.replacement_date = convertToDbDate(new Date(req.body.replacement_date));
    }

    if (typeof req.body.replacement_deadline !== 'undefined' && req.body.replacement_deadline !== '') {
        saveData.deadline_date = convertToDbDate(new Date(req.body.replacement_deadline));
    }


    if (req.body.hasOwnProperty('mode_of_employment') && req.body.mode_of_employment !== '') {
        saveData.mode_of_employment = req.body.mode_of_employment;
    }

    //  console.log( saveData );


    const checkWhere = {}
    checkWhere.project_id = saveData.project_id;
    checkWhere.department_id = saveData.department_id;
    checkWhere.designation_id = saveData.designation_id;
    checkWhere.reporting_structure_id = saveData.reporting_structure_id;
    checkWhere.type_of_opening = saveData.type_of_opening;
    checkWhere.grade = saveData.grade;
    checkWhere.title = saveData.title


    /*fetch old mpr data*/
    RequisitionFormCI.findOne({ '_id': dbObjectId(req.body.replacement_mpr_id) })
        .then((oldMprData) => {
            if (!oldMprData) {
                return res.status(409).send({ 'status': false, 'message': 'Requisition Form not found' });
            }

            //prepare activity data 

            saveData.activity_data = oldMprData.activity_data;
            //save old records
            saveData.replacement_mpr_details = {
                mpr_id: dbObjectId(req.body.replacement_mpr_id),
                mpr_title: oldMprData.title
            }

            const RegardsData = saveData.activity_data.find((item) => item.designation === 'HR');

            ProjectCl.findOne({ _id: saveData.project_id }, { 'duration': 1 })
                .then((projectData) => {

                    saveData.project_duration = typeof projectData.duration !== 'undefined' ? projectData.duration : '';

                    RequisitionFormCI.findOne(checkWhere)
                        .then((ckData) => {
                            if (ckData) {
                                return res.status(409).send({ 'status': false, 'message': `Requisition Form Already Added, MPR ID: ${ckData.title}` });
                            }

                            const instData = new RequisitionFormCI(saveData);
                            instData.save()
                                .then((dataInsert) => {

                                    //const insertId = dataInsert._id;
                                    // saveData._id = insertId;
                                    //console.log( saveData );
                                    return res.status(200).send({ 'status': true, 'message': 'Requisition Form Data Saved Successfully' });

                                })
                                .catch((error) => {
                                    return res.status(403).send({ 'status': false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE });
                                });
                        }).catch((error) => {
                            return res.status(403).send({ 'status': false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE });
                        });
                }).catch((error) => {
                    return res.status(403).send({ 'status': false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE });
                });

        }).catch((error) => {
            return res.status(403).send({ 'status': false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE });
        });

}


/********* Add Requisition form data from front **********/
controller.AddRequisitionDataFromFront = async (req, res) => {

    if (req.body && typeof req.body === 'object') {
        req.body = JSON.parse(JSON.stringify(req.body));
    }

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        if (req.file && req.file.filename) {
            removeFile(req.file.filename);
        }
        return res.status(402).json({ status: false, message: errors.array()[0].msg });
    }


    saveData = {};
    saveData = req.body;
    if (req.file && req.file.filename) {
        saveData.requisition_form = req.file.filename;
    }

    if (typeof req.body.project_id !== 'undefined' && req.body.project_id !== '') {
        saveData.project_id = dbObjectId(req.body.project_id);
    }
    if (typeof req.body.department_id !== 'undefined' && req.body.department_id !== '') {
        saveData.department_id = dbObjectId(req.body.department_id);
    }
    if (typeof req.body.designation_id !== 'undefined' && req.body.designation_id !== '') {
        saveData.designation_id = dbObjectId(req.body.designation_id);
    }
    if (typeof req.body.reporting_structure_id !== 'undefined' && req.body.reporting_structure_id !== '') {
        saveData.reporting_structure_id = dbObjectId(req.body.reporting_structure_id);
    }


    const firstLettersFromJobTitle = saveData.designation_name.split(" ").filter(word => /^[a-zA-Z]+$/.test(word)).map(word => word[0].toUpperCase());
    const DesignationCode = firstLettersFromJobTitle.join("") !== '' ? firstLettersFromJobTitle.join("") : 'DFLT';

    var saveDataTitle = '';
    if (typeof req.body.type_of_opening !== 'undefined' && req.body.type_of_opening === 'new') {
        saveDataTitle = `MPR-${DesignationCode}-${allDateFormat(dbDateFormat(), 'DDMMYYYY')}`;
    }
    else if (typeof req.body.type_of_opening !== 'undefined' && req.body.type_of_opening === 'replacement') {
        saveDataTitle = `MPR-${DesignationCode}-${allDateFormat(dbDateFormat(), 'DDMMYYYY')}`;
    }
    else if (typeof req.body.type_of_opening !== 'undefined' && req.body.type_of_opening === 'planned_non_budgeted') {
        saveDataTitle = `MPR-${DesignationCode}-${allDateFormat(dbDateFormat(), 'DDMMYYYY')}`;
    }


    //check duplicate mpr number
    const countSameMPR = await RequisitionFormCI.countDocuments({ 'title': saveDataTitle });
    if (countSameMPR > 0) {
        saveData.title = `${saveDataTitle}-${countSameMPR}`;
    } else {
        saveData.title = saveDataTitle;
    }


    if (typeof saveData.place_of_posting !== 'undefined' && saveData.place_of_posting.length > 0) {
        saveData.place_of_posting = JSON.parse(req.body.place_of_posting).map((item) => {
            const push = {}
            if (typeof item.state_id !== 'undefined' && item.state_id !== '') {
                push.state_id = dbObjectId(item.state_id);
            }
            if (typeof item.state_name !== 'undefined' && item.state_name !== '') {
                push.state_name = item.state_name;
            }
            if (typeof item.location_id !== 'undefined' && item.location_id !== '') {
                push.location_id = dbObjectId(item.location_id);
            }
            push.location_name = item.location_name;
            return push;
        });
    }

    if (typeof req.body.raised_on !== 'undefined' && req.body.raised_on !== '') {
        saveData.raised_on = convertToDbDate(req.body.raised_on);
    }


    if (req.body.hasOwnProperty('mode_of_employment') && req.body.mode_of_employment !== '') {
        saveData.mode_of_employment = req.body.mode_of_employment;
    }

    saveData.add_date = dbDateFormat();
    saveData.updated_on = dbDateFormat();


    const checkWhere = {}
    checkWhere.project_id = saveData.project_id;
    checkWhere.department_id = saveData.department_id;
    checkWhere.designation_id = saveData.designation_id;
    checkWhere.reporting_structure_id = saveData.reporting_structure_id;
    checkWhere.type_of_opening = saveData.type_of_opening;
    checkWhere.grade = saveData.grade;

    //prepare activity data 
    const activityData = [];

    var activityDataPush = {}
    activityDataPush.employee_doc_id = 'NONE'
    activityDataPush.priority = 0;
    activityDataPush.name = req.body.raised_by;
    activityDataPush.mobile = req.body.raised_by_mobile;
    activityDataPush.designation = 'Corporate HR';
    activityDataPush.employee_designation = 'Corporate HR';
    activityDataPush.type = 'raised';
    activityDataPush.status = 'Approved';
    activityDataPush.comment = '';
    activityDataPush.comment_date = dbDateFormat();
    activityDataPush.added_date = dbDateFormat();
    activityData.push(activityDataPush);

    //prepare ceo data 
    // var activityDataPush = {}
    // activityDataPush.name = 'CEO';
    // activityDataPush.designation = 'CEO';
    // activityDataPush.type = 'entry';
    // activityDataPush.status = 'Pending';
    // activityDataPush.comment = '';
    // activityDataPush.added_date =  dbDateFormat();
    // activityData.push( activityDataPush );

    //prepare Hod data 
    // var activityDataPush = {}
    // activityDataPush.name = 'HOD';
    // activityDataPush.designation = 'HOD';
    // activityDataPush.type = 'entry';
    // activityDataPush.status = 'Pending';
    // activityDataPush.comment = '';
    // activityDataPush.added_date =  dbDateFormat();
    // activityData.push( activityDataPush ); 


    //prepare HR data 
    // var activityDataPush = {}
    // activityDataPush.name = 'HR';
    // activityDataPush.designation = 'HR';
    // activityDataPush.type = 'entry';
    // activityDataPush.status = 'Pending';
    // activityDataPush.comment = '';
    // activityDataPush.added_date =  dbDateFormat();
    // activityData.push( activityDataPush ); 

    saveData.activity_data = activityData;

    const RegardsData = saveData.activity_data.find((item) => item.type === 'raised');

    ProjectCl.findOne({ _id: saveData.project_id }, { 'duration': 1 })
        .then((projectData) => {

            saveData.project_duration = typeof projectData.duration !== 'undefined' ? projectData.duration : '';

            RequisitionFormCI.findOne(checkWhere)
                .then((ckData) => {
                    if (ckData) {
                        return res.status(409).send({ 'status': false, 'message': 'Requisition Form Already Added' });
                    }

                    const instData = new RequisitionFormCI(saveData);
                    instData.save()
                        .then((dataInsert) => {
                            return res.status(200).send({ 'status': true, 'message': 'Requisition Form Data Saved Successfully' });
                        })
                        .catch((error) => {
                            return res.status(403).send({ 'status': false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE });
                        });
                }).catch((error) => {
                    return res.status(403).send({ 'status': false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE });
                });
        }).catch((error) => {
            return res.status(403).send({ 'status': false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE });
        });
}



controller.editRequisitionData = (req, res) => {

    if (req.body && typeof req.body === 'object') {
        req.body = JSON.parse(JSON.stringify(req.body));
    }

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        if (req.file && req.file.filename) {
            removeFile(req.file.filename);
        }
        return res.status(402).json({ status: false, message: errors.array()[0].msg });
    }

    const { _id } = req.body;

    saveData = {};
    saveData = req.body;
    if (req.file && req.file.filename) {
        saveData.requisition_form = req.file.filename;
        //delete old file 
        if (typeof req.body.old_filename !== 'undefined' && req.body.old_filename !== '') {
            removeFile(req.body.old_filename);
        }
    }

    if (typeof req.body.project_id !== 'undefined' && req.body.project_id !== '') {
        saveData.project_id = dbObjectId(req.body.project_id);
    }
    if (typeof req.body.department_id !== 'undefined' && req.body.department_id !== '') {
        saveData.department_id = dbObjectId(req.body.department_id);
    }
    if (typeof req.body.designation_id !== 'undefined' && req.body.designation_id !== '') {
        saveData.designation_id = dbObjectId(req.body.designation_id);
    }
    if (typeof req.body.reporting_structure_id !== 'undefined' && req.body.reporting_structure_id !== '') {
        saveData.reporting_structure_id = dbObjectId(req.body.reporting_structure_id);
    }


    const firstLettersFromJobTitle = saveData.designation_name.split(" ").filter(word => /^[a-zA-Z]+$/.test(word)).map(word => word[0].toUpperCase());
    const DesignationCode = firstLettersFromJobTitle.join("") !== '' ? firstLettersFromJobTitle.join("") : 'DFLT';

    if (typeof req.body.type_of_opening !== 'undefined' && req.body.type_of_opening === 'new') {
        //saveData.title = `MPR-${DesignationCode}-${allDateFormat(dbDateFormat(),'DDMMYYYY')}`;
    }
    else if (typeof req.body.type_of_opening !== 'undefined' && req.body.type_of_opening === 'replacement') {
        //saveData.title = `MPR-${DesignationCode}-${allDateFormat(dbDateFormat(),'DDMMYYYY')}`;
    }
    else if (typeof req.body.type_of_opening !== 'undefined' && req.body.type_of_opening === 'planned_non_budgeted') {
        //saveData.title = `MPR-${DesignationCode}-${allDateFormat(dbDateFormat(),'DDMMYYYY')}`;
    }

    if (req.body.hasOwnProperty('mode_of_employment') && req.body.mode_of_employment !== '') {
        saveData.mode_of_employment = req.body.mode_of_employment;
    }


    if (typeof saveData.place_of_posting !== 'undefined' && saveData.place_of_posting.length > 0) {
        saveData.place_of_posting = JSON.parse(req.body.place_of_posting).map((item) => {
            const push = {}
            if (typeof item.state_id !== 'undefined' && item.state_id !== '') {
                push.state_id = dbObjectId(item.state_id);
            }
            if (typeof item.state_name !== 'undefined' && item.state_name !== '') {
                push.state_name = item.state_name;
            }
            if (typeof item.location_id !== 'undefined' && item.location_id !== '') {
                push.location_id = dbObjectId(item.location_id);
            }
            push.location_name = item.location_name;
            return push;
        });
    }


    saveData.add_date = dbDateFormat();
    saveData.updated_on = dbDateFormat();

    ProjectCl.findOne({ _id: saveData.project_id }, { 'duration': 1 })
        .then((projectData) => {

            saveData.project_duration = typeof projectData.duration !== 'undefined' ? projectData.duration : '';
            RequisitionFormCI.updateOne({ _id: dbObjectId(_id) }, { $set: saveData })
                .then((upData) => {

                    RequisitionFormCI.findOne({ _id: dbObjectId(_id) })
                        .then((reqData) => {

                            const RegardsData = reqData.activity_data.find((item) => item.designation === 'HR');
                            /*
                                                    ProjectCl.findOne( {_id: reqData.project_id, manager_list: {$exists: true} }, {'manager_list':1})
                                                    .then( (ProData)=>{  
                            
                                                        if( ProData && typeof ProData.manager_list !=='undefined' && ProData.manager_list.length  > 0 ){
                                                            const EmpIds = ProData.manager_list.map((item)=>{
                                                                return item.emp_id;
                                                            });
                                                        
                                                            const checkEmpWhere = {}
                                                            //checkEmpWhere.project_id = saveData.project_id;
                                                            checkEmpWhere._id = {$in: EmpIds };
                                                            checkEmpWhere.status = 'Active';
                                        
                                                                EmployeeCI.find( checkEmpWhere ,{email:1,name: 1, designation: 1})
                                                                .then((empData)=>{
                                                                    if( empData && empData.length > 0 ){
                                                                        empData.forEach((item, index) => {  
                                                                            setTimeout(async () => {
                                                                                try { 
                                                                                    requisitionFormApprovalMail( saveData , item.email, 'HOD', RegardsData, true, item.name, '', item.designation );
                                                                                } catch (error) {
                                                                                    console.error("Error sending mail:", error);
                                                                                }
                                                                            }, 500 * index);
                                                                        });                                                 
                                                                    } 
                                        
                                                                    return res.status(200).send( {'status':true, 'message': 'Requisition Form Data Edited Successfully'} );
                                                                })
                                                                .catch( (error)=>{ 
                                                                    return res.status(200).send( {'status':true, 'message': 'Requisition Form Data Edited Successfully'} );
                                                                });
                                                        }else{
                                                            return res.status(200).send( {'status':true, 'message': 'Requisition Form Data Edited Successfully'} );
                                                        } 
                                                    })
                                                    .catch( (error)=>{ 
                                                        return res.status(200).send( {'status':true, 'message': 'Requisition Form Data Edited Successfully'} );
                                                    });
                            */
                            /*Added on 27 JUne-2025*/
                            return res.status(200).send({ 'status': true, 'message': 'Requisition Form Data Edited Successfully' });

                        }).catch((error) => {
                            return res.status(403).send({ 'status': false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE });
                        });

                }).catch((error) => {
                    return res.status(403).send({ 'status': false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE });
                });

        }).catch((error) => {
            return res.status(403).send({ 'status': false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE });
        });
}

controller.deleteRequisitionDataById = (req, res) => {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(409).json({ status: false, message: errors.array()[0].msg });
    }

    const { _id } = req.body;

    RequisitionFormCI.deleteOne({ _id: dbObjectId(_id) })
        .then((data) => {
            if (data.deletedCount === 1) {
                if (typeof req.body.filename !== 'undefined' && req.body.filename !== '') {
                    removeFile(req.body.filename);
                }

                return res.status(200).send({ 'status': true, 'message': 'Requisition Form Deleted Successfully' });
            } else if (data.deletedCount === 0) {
                return res.status(304).send({ 'status': false, 'message': 'No Action Performed' });
            } else {
                return res.status(403).send({ 'status': false, 'message': process.env.DEFAULT_ERROR_MESSAGE });
            }
        }).catch((error) => {
            return res.status(403).send({ 'status': false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE });
        });
}

controller.getRequisitionDataById = (req, res) => {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(402).json({ status: false, message: errors.array()[0].msg });
    }

    const { _id } = req.body;

    const fetchKeys = {}
    if (req.body.hasOwnProperty('scope_fields') && req.body.scope_fields.length > 0) {
        req.body.scope_fields.forEach(field => {
            fetchKeys[field] = 1;
        });
    } else {
        fetchKeys.__v = 0;
    }


    RequisitionFormCI.find({ _id: dbObjectId(_id) }, fetchKeys)
        .then((data) => {
            if (data.length > 0) {
                const outPutData = updateDatesInArray(replaceNullUndefined(data), ['add_date', 'updated_on', 'raised_on'], 'date');
                return res.status(200).send({ 'status': true, 'data': outPutData[0], 'message': 'API Accessed Successfully' });
            } else {
                return res.status(304).send({ 'status': false, 'message': 'No record matched' });
            }
        }).catch((error) => {
            return res.status(403).send({ 'status': false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE });
        });
}

controller.changeRequisitionDataStatus = (req, res) => {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(409).json({ status: false, message: errors.array()[0].msg });
    }

    const { _id } = req.body;

    let saveData = {}
    saveData = req.body;
    saveData.updated_on = dbDateFormat();

    RequisitionFormCI.updateOne({ _id: dbObjectId(_id) }, { $set: saveData })
        .then((data) => {

            if (data.modifiedCount === 1) {
                return res.status(200).send({ 'status': true, 'message': 'Status Updated Successfully' });
            } else if (data.modifiedCount === 0) {
                return res.status(304).send({ 'status': false, 'message': 'No Action Performed' });
            } else {
                return res.status(403).send({ 'status': false, 'message': process.env.DEFAULT_ERROR_MESSAGE });
            }
        }).catch((error) => {
            return res.status(403).send({ 'status': false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE });
        });
}

controller.getRequisitionDataList = (req, res) => {

    const { page_no, per_page_record, scope_fields, employee_doc_id } = req.body;


    const where = {}
    const fetchKeys = {}

    if (req.body.hasOwnProperty('scope_fields') && scope_fields.length > 0) {
        scope_fields.forEach(field => {
            fetchKeys[field] = 1;
        });
    } else {
        fetchKeys.__v = 0;
    }

    if (req.body.hasOwnProperty('keyword') && req.body.keyword !== '') {
        let searchKeyWord = new RegExp(lettersOnly(req.body.keyword));
        where['title'] = { $regex: searchKeyWord, $options: 'i' }
    }

    if (req.body.hasOwnProperty('status') && req.body.status !== '') {
        //where['status'] = req.body.status;
        where['status'] = { $in: [req.body.status] };
    }

    var filterTypeValue = [];
    if (req.body.hasOwnProperty('filter_type') && req.body.filter_type !== '' && ['PendingByCeo', 'ApprovedByCeo', ''].includes(req.body.filter_type)) {

        if (req.body.filter_type === 'ApprovedByCeo') {
            where['status'] = 'Approved';
            where['activity_data'] = {
                $elemMatch: {
                    status: "Approved",
                    designation: "CEO"
                }
            }
            filterTypeValue = ['Approved'];
        }
        else if (req.body.filter_type === 'PendingByCeo') {
            where['status'] = 'Pending';
            where['activity_data'] = {
                $elemMatch: {
                    status: "Pending",
                    designation: "CEO"
                }
            }
            filterTypeValue = ['Pending'];
        }
        else if (req.body.filter_type === 'listByCeo') {
            where['activity_data'] = {
                $elemMatch: {
                    designation: "CEO"
                }
            }
            filterTypeValue = ['Pending', 'Approved'];
        }
    } else if (req.body.hasOwnProperty('filter_type') && req.body.filter_type !== '' && ['listByHod', 'ApprovedByHod', 'PendingByHod'].includes(req.body.filter_type) && employee_doc_id !== '') {

        if (req.body.filter_type === 'ApprovedByHod') {
            where['status'] = 'Approved';
            where['activity_data'] = {
                $elemMatch: {
                    status: "Approved",
                    employee_doc_id: employee_doc_id
                }
            }
            filterTypeValue = ['Approved'];
        }
        else if (req.body.filter_type === 'PendingByHod') {
            where['status'] = 'Pending';
            where['activity_data'] = {
                $elemMatch: {
                    status: "Pending",
                    employee_doc_id: employee_doc_id
                }
            }
            filterTypeValue = ['Pending'];
        }
        else if (req.body.filter_type === 'listByHod') {
            where['activity_data'] = {
                $elemMatch: {
                    employee_doc_id: employee_doc_id
                }
            }
            filterTypeValue = ['Pending', 'Approved'];
        }
    }

    /****** Apply Manual Filter Start Script **********/
    if (req.body.hasOwnProperty('filter_keyword') && req.body.filter_keyword !== '') {
        let searchKeyFilter = new RegExp(req.body.filter_keyword);
        where['$or'] = [
            { title: { $regex: searchKeyFilter, $options: 'i' } },
            { project_name: { $regex: searchKeyFilter, $options: 'i' } },
            { designation_name: { $regex: searchKeyFilter, $options: 'i' } },
            { department_name: { $regex: searchKeyFilter, $options: 'i' } },
            //{ ctc_per_annum: { $regex: searchKeyFilter, $options: 'i' } },
            //{ ctc_per_month: { $regex: searchKeyFilter, $options: 'i' } },
            { grade: { $regex: searchKeyFilter, $options: 'i' } }
        ];
    }
    /********* Apply Manual Filter End Script ********/


    /**********  filter Manual Search ***********/
    if (req.body.hasOwnProperty('project_id') && req.body.project_id !== '') {
        where['project_id'] = dbObjectId(req.body.project_id);
    }
    if (req.body.hasOwnProperty('department_id') && req.body.department_id !== '') {
        where['department_id'] = dbObjectId(req.body.department_id);
    }
    if (req.body.hasOwnProperty('designation_id') && req.body.designation_id !== '') {
        where['designation_id'] = dbObjectId(req.body.designation_id);
    }



    const pageOptions = {
        page: parseInt(((page_no ? page_no : 1) - 1)) || 0,
        limit: parseInt(per_page_record) || 10
    }

    RequisitionFormCI.find(where, fetchKeys)
        .skip(pageOptions.page * pageOptions.limit)
        .limit(pageOptions.limit)
        .sort({ _id: -1, status: 1 })
        .then((data) => {


            if (data?.length > 0) {
                if (req.body.hasOwnProperty('filter_type') && req.body.filter_type !== '' && ['PendingByCeo', 'ApprovedByCeo', '', 'listByHod', 'ApprovedByHod', 'PendingByHod'].includes(req.body.filter_type)) {

                    const outPutData = updateDatesInArray(replaceNullUndefined(data), ['add_date', 'updated_on', 'raised_on'], 'date').map((item) => {
                        let pushData = {}
                        pushData = item;
                        pushData.requisition_form = `${IMAGE_PATH}${item.requisition_form}`;
                        return pushData;
                    }).filter(dataItem => dataItem?.activity_data.length > 0);

                    return res.status(200).send({ 'status': true, 'data': outPutData, 'message': 'API Accessed Successfully' });
                } else {
                    const outPutData = updateDatesInArray(replaceNullUndefined(data), ['add_date', 'updated_on', 'raised_on'], 'date').map((item) => {
                        let pushData = {}
                        pushData = item;
                        pushData.requisition_form = `${IMAGE_PATH}${item.requisition_form}`;
                        return pushData;
                    });
                    return res.status(200).send({ 'status': true, 'data': outPutData, 'message': 'API Accessed Successfully' });
                }
            } else {
                return res.status(204).send({ 'status': false, 'message': 'No record matched' });
            }
        }).catch((error) => {
            console.log(error);
            return res.status(403).send({ 'status': false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE });
        });
}

/********* Update Place of Posting ************/
controller.updatePlaceOfPosting = async (req, res) => {
    try {
        const { requisition_id, place_of_posting } = req.body;

        if (!dbObjectIdValidate(requisition_id)) {
            return res.status(400).json({
                status: false,
                message: 'Valid requisition_id is required'
            });
        }

        if (!Array.isArray(place_of_posting) || place_of_posting.length === 0) {
            return res.status(400).json({
                status: false,
                message: 'place_of_posting must be a non-empty array of objects'
            });
        }

        const sanitizedPlaceOfPosting = place_of_posting
            .filter(item => item && typeof item === 'object')
            .map(item => {
                const locationName = item.location_name?.toString().trim();
                const stateName = item.state_name?.toString().trim();

                const validLocationId = dbObjectIdValidate(item.location_id);

                return {
                    location_id: validLocationId ? dbObjectId(validLocationId) : null,
                    location_name: locationName && stateName ? `${locationName}, ${stateName}` : locationName || stateName || ''
                };
            })
            .filter(item => item.location_id && item.location_name);

        if (!sanitizedPlaceOfPosting.length) {
            return res.status(400).json({
                status: false,
                message: 'No valid place_of_posting data found'
            });
        }

        const updatedData = await RequisitionFormCI.findOneAndUpdate(
            { _id: dbObjectId(requisition_id) },
            {
                $set: {
                    place_of_posting: sanitizedPlaceOfPosting,
                    updated_on: new Date()
                }
            },
            { new: true }
        );

        if (!updatedData) {
            return res.status(404).json({
                status: false,
                message: 'Requisition not found'
            });
        }

        // AUTO-SYNC JOB LOCATION
        await syncJobLocationByRequisition(
            requisition_id,
            sanitizedPlaceOfPosting
        );

        return res.status(200).json({
            status: true,
            message: 'Place of posting & job locations updated successfully',
            data: updatedData.place_of_posting
        });

    } catch (error) {
        console.error('updatePlaceOfPosting error:', error);
        return res.status(500).json({
            status: false,
            message: error.message
        });
    }
};

const syncJobLocationByRequisition = async (requisitionId, placeOfPosting) => {
    try {
        if (
            !dbObjectIdValidate(requisitionId) ||
            !Array.isArray(placeOfPosting)
        ) return;

        const locations = placeOfPosting
            .filter(p =>
                p &&
                p.location_id &&
                p.location_name &&
                dbObjectIdValidate(p.location_id)
            )
            .map(p => ({
                loc_id: dbObjectId(p.location_id),
                name: p.location_name.trim()
            }));

        if (!locations.length) return;

        await JobCl.updateMany(
            {
                requisition_form_id: dbObjectId(requisitionId)
            },
            {
                $set: {
                    location: locations,
                    updated_on: new Date()
                }
            }
        );

    } catch (error) {
        console.error('syncJobLocationByRequisition error:', error);
    }
};

/********* Update Approval Status ************/
controller.approveRejectRequisitionForm = (req, res) => {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(409).json({ status: false, message: errors.array()[0].msg });
    }

    const { _id, designation, status, comment, employee_doc_id } = req.body;

    RequisitionFormCI.find({ _id: dbObjectId(_id) })
        .then((data) => {

            if (data.length > 0) {

                const findDesignationData = data[0].activity_data.find((item) => item.employee_doc_id === employee_doc_id && item.type === 'entry');
                const isAnyPending = data[0].activity_data.filter((item) => item.type === 'entry' && item.status === 'Pending');
                const isAnyRejected = data[0].activity_data.find((item) => item.status === 'Reject' && item.type === 'entry');

                const RegardsData = data[0].activity_data.find((item) => item.type === 'raised');

                if (findDesignationData) {

                    let arrayFilters = { 'arrayFilters': [{ 'one._id': findDesignationData._id }] }

                    let where = {}
                    where['_id'] = dbObjectId(_id);
                    where['activity_data._id'] = findDesignationData._id;
                    var saveData = {}
                    if (typeof req.body.hod_name !== 'undefined' && req.body.hod_name !== '') {
                        saveData['activity_data.$[one].name'] = req.body.hod_name;
                    }
                    if (typeof req.body.hod_designation !== 'undefined' && req.body.hod_designation !== '') {
                        saveData['activity_data.$[one].sub_designation'] = req.body.hod_designation;
                    }
                    saveData['activity_data.$[one].status'] = status;
                    saveData['activity_data.$[one].comment'] = comment;
                    saveData['activity_data.$[one].comment_date'] = dbDateFormat();
                    if (isAnyPending && isAnyPending.length === 1 && status === 'Approved') {
                        //saveData['status'] = 'Approved';
                    }
                    else if (isAnyRejected && status === 'Reject') {
                        saveData['status'] = 'Reject';
                    }

                    if (designation === 'CEO') {
                        saveData['status'] = status;
                    }

                    RequisitionFormCI.updateOne({ _id: dbObjectId(_id) }, { $set: saveData }, arrayFilters)
                        .then((upData) => {

                            if (['HR'].includes(designation) && status === 'Approved') {
                                /*Send To CEO */
                                RequisitionFormCI.findOne({ _id: dbObjectId(_id) })
                                    .then((mprData) => {
                                        requisitionFormApprovalMail(mprData, '', 'CEO', RegardsData, true, 'CEO', mprData.activity_data, 'CEO', 'NA');
                                        return res.status(200).send({ 'status': true, 'message': 'Feedback Updated Successfully' });
                                    }).catch((error) => {
                                        return res.status(403).send({ 'status': false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE });
                                    });
                            } else if (designation === 'CEO' && status === 'Approved') {

                                ProjectCl.findOne({ _id: data[0].project_id }, { 'manager_list': 1, 'in_charge_list': 1 })
                                    .then((ProData) => {

                                        if (ProData && typeof ProData.manager_list !== 'undefined' && ProData.manager_list.length > 0) {
                                            const managersIds = ProData.manager_list.map((item) => item.emp_id);
                                            const inChargeIds = ProData.in_charge_list.map((item) => item.emp_id);
                                            const collectAllEmpIds = [...managersIds, ...inChargeIds];

                                            const checkEmpWhere = {}
                                            //checkEmpWhere.project_id = saveData.project_id;
                                            checkEmpWhere._id = { $in: collectAllEmpIds };
                                            checkEmpWhere.status = 'Active';

                                            EmployeeCI.find(checkEmpWhere, { email: 1, name: 1, designation: 1 })
                                                .then((empData) => {
                                                    if (empData && empData.length > 0) {
                                                        empData.forEach((item, index) => {
                                                            setTimeout(async () => {
                                                                try {
                                                                    RequisitionFormApprovedByCeo(data[0], item.email, item.name);
                                                                } catch (error) {
                                                                    console.error("Error sending mail:", error);
                                                                }
                                                            }, 500 * index);
                                                        });
                                                    }
                                                    return res.status(200).send({ 'status': true, 'message': 'Feedback Updated Successfully' });
                                                })
                                                .catch((error) => {
                                                    return res.status(200).send({ 'status': true, 'message': 'Feedback Updated Successfully' });
                                                });
                                        } else {
                                            return res.status(200).send({ 'status': true, 'message': 'Feedback Updated Successfully' });
                                        }
                                    })
                                    .catch((error) => {
                                        return res.status(200).send({ 'status': true, 'message': 'Feedback Updated Successfully' });
                                    });

                            } else {
                                return res.status(200).send({ 'status': true, 'message': 'Feedback Updated Successfully' });
                            }
                        }).catch((error) => {
                            return res.status(403).send({ 'status': false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE });
                        });

                } else {
                    return res.status(403).send({ 'status': false, 'message': 'No Action Performed' });
                }
            } else {
                return res.status(403).send({ 'status': false, 'message': 'No Action Performed' });
            }
        }).catch((error) => {
            return res.status(403).send({ 'status': false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE });
        });
}



var updateMprStatusByIdForBulk = async (employee_id, status, remark, mpr_doc_id) => {

    const mprData = await RequisitionFormCI.findOne({ _id: dbObjectId(mpr_doc_id) }, { _id: 1, activity_data: 1 });

    if (!mprData) {
        return { status: false, message: "MPR Ids not matched" }
    }

    const newDesignation = employee_id === 'NA' ? 'CEO' : 'HOD';

    const findDesignationData = mprData.activity_data.find((item) => item.employee_doc_id === employee_id && item.type === 'entry');
    const isAnyPending = mprData.activity_data.filter((item) => item.type === 'entry' && item.status === 'Pending');
    const isAnyRejected = mprData.activity_data.find((item) => item.type === 'entry' && item.status === 'Reject');

    const RegardsData = mprData.activity_data.find((item) => item.type === 'raised');

    if (findDesignationData && ['Pending'].includes(findDesignationData?.status)) {
        // console.log( findDesignationData );
        let arrayFilters = { 'arrayFilters': [{ 'one._id': findDesignationData._id }] }

        let where = {}
        where['_id'] = dbObjectId(mpr_doc_id);
        where['activity_data._id'] = findDesignationData._id;
        var saveData = {}
        // if(typeof req.body.hod_name !=='undefined' && req.body.hod_name !== '' ){
        //     saveData['activity_data.$[one].name'] =  req.body.hod_name;  
        // }
        // if(typeof req.body.hod_designation !=='undefined' && req.body.hod_designation !== '' ){
        //     saveData['activity_data.$[one].sub_designation'] =  req.body.hod_designation;  
        // }
        saveData['activity_data.$[one].status'] = status;
        saveData['activity_data.$[one].comment'] = remark;
        saveData['activity_data.$[one].comment_date'] = dbDateFormat();
        if (isAnyPending && isAnyPending.length === 1 && status === 'Approved') {
            //saveData['status'] = 'Approved';
        }
        else if (isAnyRejected && status === 'Reject') {
            saveData['status'] = 'Reject';
        }

        if (newDesignation === 'CEO') {
            saveData['status'] = status;
        }


        /*  manage signature */
        if (newDesignation === 'CEO' && status === 'Approved' && findDesignationData?.signature === '') {
            const hrConfig = JSON.parse(fs.readFileSync('./src/config/hr_config_file.txt', 'utf8'));
            if (hrConfig?.ceo_digital_signature !== '') {
                saveData['activity_data.$[one].signature'] = hrConfig?.ceo_digital_signature;
            }
        } else if (employee_id !== '' && status === 'Approved' && findDesignationData?.signature === '') {
            const empDataSingle = await EmployeeCI.findOne({ _id: dbObjectId(employee_id) }, { docs: 1 });
            if (empDataSingle) {
                const empSignature = empDataSingle.docs.find((item) => item.doc_category === 'Signature');
                if (empSignature && empSignature?.file_name !== '') {
                    saveData['activity_data.$[one].signature'] = empSignature?.file_name;
                }
            }
        }

        //update record
        await RequisitionFormCI.updateOne(where, { $set: saveData }, arrayFilters);


        if (newDesignation === 'CEO' && status === 'Approved') {

            const ProData = await ProjectCl.findOne({ _id: mprData.project_id }, { 'manager_list': 1, 'in_charge_list': 1 });


            if (ProData && typeof ProData.manager_list !== 'undefined' && ProData.manager_list.length > 0) {
                const managersIds = ProData.manager_list.map((item) => item.emp_id);
                const inChargeIds = ProData.in_charge_list.map((item) => item.emp_id);
                const collectAllEmpIds = [...managersIds, ...inChargeIds];

                const checkEmpWhere = {}
                //checkEmpWhere.project_id = saveData.project_id;
                checkEmpWhere._id = { $in: collectAllEmpIds };
                checkEmpWhere.status = 'Active';

                const empData = await EmployeeCI.find(checkEmpWhere, { email: 1, name: 1, designation: 1 })

                if (empData && empData.length > 0) {
                    empData.forEach((item, index) => {
                        setTimeout(async () => {
                            try {
                                RequisitionFormApprovedByCeo(mprData, item.email, item.name);
                            } catch (error) {
                                console.error("Error sending mail:", error);
                            }
                        }, 100 * index);
                    });
                    return { 'status': true, 'message': 'Feedback Updated Successfully' };
                } else {
                    return { 'status': false, 'message': 'Manager List not Found' };
                }

            } else {
                return { 'status': false, 'message': 'Manager List not Found' };
            }


        } else if (employee_id !== 'NA' && status === 'Approved') {
            /*Send To CEO */
            var mprDataNew = await RequisitionFormCI.findOne({ _id: dbObjectId(mpr_doc_id) })
            if (mprDataNew) {
                requisitionFormApprovalMail(mprDataNew, '', 'CEO', RegardsData, true, 'CEO', mprDataNew.activity_data, 'CEO', 'NA');
                return { 'status': true, 'message': 'Feedback Updated Successfully' };
            }
        } else {
            return { 'status': true, 'message': 'Feedback Updated Successfully' };
        }

    } else {
        return { 'status': false, 'message': 'No Action Performed' };
    }

}
/********* Update bulk Approval Status ************/
controller.BulkApprovedMprByCeoOrHodSir = async (req, res) => {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(409).json({ status: false, message: errors.array()[0].msg });
    }

    //const { _id , designation , status, comment, employee_doc_id } = req.body;  
    const { designation, status, remark, employee_id } = req.body;


    const mprIds = req.body?.mpr_ids;

    if (!Array.isArray(mprIds) || mprIds.length === 0) {
        return res.status(403).json({ status: false, message: "MPR Ids must be a non-empty array" });
    }


    const mprListIds = mprIds.map((item) => { return dbObjectId(item) });

    /* add new condition need to discuss*/
    if (status === 'need_to_discusss') {

        const where = {}
        where['_id'] = { $in: mprListIds }

        const findMprData = await RequisitionFormCI.find(where,
            {
                project_name: 1,
                designation_name: 1,
                job_title: 1,
                department_name: 1,
                grade: 1,
                type_of_opening: 1,
                mode_of_employment: 1,
                title: 1
            }
        );

        if (findMprData.length > 0) {
            needToDiscussAtMprMail(findMprData, remark);
        }

        return res.status(200).json({ status: true, message: "Mail Sent to Corporate HR" });

    }


    try {

        mprIds.forEach((item, index) => {
            setTimeout(async () => {
                try {
                    updateMprStatusByIdForBulk(employee_id, status, remark, item);
                } catch (error) {
                    console.error("Error sending mail:", error);
                }
            }, 10 * index);

        });

        return res.status(200).send({ 'status': true, 'message': 'Status Updated Successfully' });

    } catch (error) {
        return res.status(403).send({ 'status': false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE });
    }
}


/********* Send Approval Mail To CEO Sir ************/
controller.sendRequisitionApprovalEmailToCeo = (req, res) => {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(409).json({ status: false, message: errors.array()[0].msg });
    }

    const { mpr_doc_id, project_id, add_by_name, add_by_mobile, add_by_designation, add_by_email } = req.body;

    const designation = 'CEO';
    RequisitionFormCI.find({ _id: dbObjectId(mpr_doc_id) })
        .then((data) => {

            if (data.length > 0) {
                const RegardsData = {}
                RegardsData.name = add_by_name;
                RegardsData.sub_designation = add_by_designation;
                RegardsData.mobile = add_by_mobile;
                RegardsData.email = add_by_email;

                /*Send To CEO */
                requisitionFormApprovalMail(data[0], '', 'CEO', RegardsData, true, 'CEO', '', 'CEO', 'NA');

                return res.status(200).send({ 'status': true, 'message': 'Mail Send Successfully' });
            } else {
                return res.status(403).send({ 'status': false, 'message': 'No Record Found' });
            }

        }).catch((error) => {
            return res.status(403).send({ 'status': false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE });
        });
}


/********* Send Approval Mail To HOD ************/
controller.sendRequisitionApprovalEmailToSingleEmployee = (req, res) => {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(409).json({ status: false, message: errors.array()[0].msg });
    }

    const { mpr_doc_id, employee_doc_id, add_by_name, add_by_mobile, add_by_designation, add_by_email } = req.body;

    RequisitionFormCI.findOne({ _id: dbObjectId(mpr_doc_id) })
        .then((data) => {

            if (data) {
                const RegardsData = {}
                RegardsData.name = add_by_name;
                RegardsData.sub_designation = add_by_designation;
                RegardsData.mobile = add_by_mobile;
                RegardsData.email = add_by_email;

                const OldRecords = data.activity_data;
                const findEmployeeInList = OldRecords?.find((item) => typeof item?.employee_doc_id !== 'undefined' && item?.employee_doc_id.toString() === employee_doc_id.toString());
                //var designationName = findEmployeeInList?.designation && ['HOD','HR'].includes( findEmployeeInList?.designation ) ? findEmployeeInList?.designation : 'HOD'; 
                var designationName = findEmployeeInList?.designation;
                //console.log( designationName );

                if (designationName === 'CEO') {
                    return res.status(403).send({ 'status': false, 'message': 'Not Allowed' });
                }

                const checkEmpWhere = {}
                checkEmpWhere._id = dbObjectId(employee_doc_id);
                checkEmpWhere.status = 'Active';


                EmployeeCI.findOne(checkEmpWhere, { email: 1, name: 1, designation: 1, mobile_no: 1 })
                    .then((empData) => {

                        if (empData && empData.email) {
                            requisitionFormApprovalMail(data, empData.email, designationName, RegardsData, true, empData.name, '', empData.designation, empData._id);
                            return res.status(200).send({ 'status': true, 'message': 'Mail Send Successfully' });
                        }
                        else {
                            return res.status(403).send({ 'status': false, 'message': 'No Employee Record Found' });
                        }
                    }).catch((error) => {
                        console.log(error);
                        return res.status(403).send({ 'status': false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE });
                    });


            } else {
                return res.status(403).send({ 'status': false, 'message': 'No Record Found' });
            }

        }).catch((error) => {
            console.log(error);
            return res.status(403).send({ 'status': false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE });
        });
}


/********* Send Mail TO Create Requisition Form To All Related Candidates ************/
controller.sendRequisitionCreateFormMail = (req, res) => {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(409).json({ status: false, message: errors.array()[0].msg });
    }


    const { project_id, add_by_name, add_by_mobile, add_by_designation } = req.body;

    ProjectCl.findOne({ _id: dbObjectId(project_id) }, { 'title': 1, 'manager_list': 1, 'in_charge_list': 1 })
        .then((data) => {

            var managerEmpIds = [];
            var inChargeEmpIds = [];
            const RegardsData = {}
            RegardsData.name = add_by_name;
            RegardsData.mobile = add_by_mobile;
            RegardsData.designation = add_by_designation;

            /*Collet Manager Ids*/
            if (data && typeof data.manager_list !== 'undefined' && data.manager_list.length > 0) {
                managerEmpIds = data.manager_list.map((item) => {
                    return item.emp_id;
                });
            }

            /*Collet InCharge Ids*/
            if (data && typeof data.in_charge_list !== 'undefined' && data.in_charge_list.length > 0) {
                inChargeEmpIds = data.in_charge_list.map((item) => {
                    return item.emp_id;
                });
            }

            var collectEmpIds = managerEmpIds.concat(inChargeEmpIds);

            const checkEmpWhere = {}
            checkEmpWhere._id = { $in: collectEmpIds };
            checkEmpWhere.status = 'Active';

            EmployeeCI.find(checkEmpWhere, { email: 1, name: 1, designation: 1, mobile_no: 1 })
                .then((empData) => {
                    if (empData && empData.length > 0) {
                        empData.map((item) => {
                            var mailPayload = {}
                            mailPayload.project_id = project_id;
                            mailPayload.project_name = data.title;
                            mailPayload.user_id = item._id.toString();
                            mailPayload.name = item.name;
                            mailPayload.email = item.email;
                            mailPayload.mobile_no = item.mobile_no;
                            mailPayload.designation = item.designation;
                            createRequisitionFormMail(mailPayload, RegardsData);
                        });
                    }

                    return res.status(200).send({ 'status': true, 'message': 'Email Sent Successfully' });
                })
                .catch((error) => {
                    return res.status(200).send({ 'status': true, 'message': 'Email Sent Successfully' });
                });

        })
        .catch((error) => {
            return res.status(403).send({ 'status': true, 'message': 'Some Error Occurred' });
        });
}


/********* Send Mail To Create Requisition Form To Single Employee Related Candidates ************/
controller.sendRequisitionCreateFormMailByEmployeeID = (req, res) => {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(409).json({ status: false, message: errors.array()[0].msg });
    }

    const { project_id, employee_doc_id, add_by_name, add_by_mobile, add_by_designation, add_by_email } = req.body;

    ProjectCl.findOne({ _id: dbObjectId(project_id) }, { 'title': 1, 'manager_list': 1, 'in_charge_list': 1 })
        .then((data) => {

            const RegardsData = {}
            RegardsData.name = add_by_name;
            RegardsData.mobile = add_by_mobile;
            RegardsData.designation = add_by_designation;
            RegardsData.email = add_by_email;

            const checkEmpWhere = {}
            checkEmpWhere._id = dbObjectId(employee_doc_id);
            checkEmpWhere.status = 'Active';

            EmployeeCI.find(checkEmpWhere, { email: 1, name: 1, designation: 1, mobile_no: 1 })
                .then((empData) => {
                    if (empData && empData.length > 0) {
                        empData.map((item) => {
                            var mailPayload = {}
                            mailPayload.project_id = project_id;
                            mailPayload.project_name = data.title;
                            mailPayload.user_id = item._id.toString();
                            mailPayload.name = item.name;
                            mailPayload.email = item.email;
                            mailPayload.mobile_no = item.mobile_no;
                            mailPayload.designation = item.designation;
                            createRequisitionFormMail(mailPayload, RegardsData);
                        });
                    }

                    return res.status(200).send({ 'status': true, 'message': 'Email Sent Successfully' });
                })
                .catch((error) => {
                    return res.status(200).send({ 'status': true, 'message': 'Email Sent Successfully' });
                });

        })
        .catch((error) => {
            return res.status(403).send({ 'status': true, 'message': 'Some Error Occurred' });
        });
}


controller.getCountRecordsOfMpr = async (req, res) => {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(403).json({ status: false, message: errors.array()[0].msg });
    }

    const { status } = req.body;

    const where = {}

    if (req.body.hasOwnProperty('status') && req.body.status !== '') {
        where['status'] = { $in: [req.body.status] };
    }

    if (req.body.hasOwnProperty('keyword') && req.body.keyword !== '') {
        let searchKeyWord = new RegExp(req.body.keyword);
        where['$or'] = [
            { mpr_offer_type: { $regex: searchKeyWord, $options: 'i' } },
            { mpr_fund_type: { $regex: searchKeyWord, $options: 'i' } },
            { approval_note_id: { $regex: searchKeyWord, $options: 'i' } },
            { status: { $regex: searchKeyWord, $options: 'i' } }
        ]
    }

    const totalRecords = await RequisitionFormCI.countDocuments(where);

    return res.status(200).json({ status: true, data: totalRecords, 'message': 'API Accessed Successfully' });
}


controller.getRequisitionDataListForEmployee = async (req, res) => {

    const { page_no, per_page_record, scope_fields, employee_doc_id, status } = req.body;

    const where = {}
    const fetchKeys = {}

    if (req.body.hasOwnProperty('scope_fields') && scope_fields.length > 0) {
        scope_fields.forEach(field => {
            fetchKeys[field] = 1;
        });
    } else {
        fetchKeys.__v = 0;
    }

    var filterTypeValue = [];
    if (status === 'Approved') {
        where['status'] = 'Approved';
        where['activity_data'] = {
            $elemMatch: {
                status: "Approved"
            }
        }
        filterTypeValue = ['Approved'];
    }
    else if (status === 'Pending') {
        where['status'] = 'Pending';
        where['activity_data'] = {
            $elemMatch: {
                status: "Pending"
            }
        }
        filterTypeValue = ['Pending'];
    }

    /****** Apply Manual Filter Start Script **********/
    if (req.body.hasOwnProperty('filter_keyword') && req.body.filter_keyword !== '') {
        let searchKeyFilter = new RegExp(req.body.filter_keyword);
        where['$or'] = [
            { title: { $regex: searchKeyFilter, $options: 'i' } },
            { project_name: { $regex: searchKeyFilter, $options: 'i' } },
            { designation_name: { $regex: searchKeyFilter, $options: 'i' } },
            { department_name: { $regex: searchKeyFilter, $options: 'i' } },
            { grade: { $regex: searchKeyFilter, $options: 'i' } }
        ];
    }
    /********* Apply Manual Filter End Script ********/


    /**********  filter Manual Search ***********/
    if (req.body.hasOwnProperty('project_id') && req.body.project_id !== '') {
        where['project_id'] = dbObjectId(req.body.project_id);
    }
    if (req.body.hasOwnProperty('department_id') && req.body.department_id !== '') {
        where['department_id'] = dbObjectId(req.body.department_id);
    }
    if (req.body.hasOwnProperty('designation_id') && req.body.designation_id !== '') {
        where['designation_id'] = dbObjectId(req.body.designation_id);
    }

    const pageOptions = {
        page: parseInt(((page_no ? page_no : 1) - 1)) || 0,
        limit: parseInt(per_page_record) || 10
    }


    try {

        /*Fetch project ids from employee ids*/
        const projectList = await ProjectCl.find({ 'manager_list.emp_id': { $in: [dbObjectId(employee_doc_id)] } }, { _id: 1 });


        if (projectList.length === 0) {
            return res.status(403).send({ 'status': false, 'message': 'No record matched' });
        }

        where['project_id'] = { $in: projectList.map((item) => item._id) }

        const getData = await RequisitionFormCI.find(where, fetchKeys)
            .skip(pageOptions.page * pageOptions.limit)
            .limit(pageOptions.limit)
            .sort({ _id: -1, status: 1 });

        if (getData.length === 0) {
            return res.status(204).send({ 'status': false, 'message': 'No record matched' });
        }


        const outPutData = updateDatesInArray(replaceNullUndefined(getData), ['add_date', 'updated_on', 'raised_on'], 'date').map((item) => {
            let pushData = {}
            pushData = item;
            pushData.requisition_form = `${IMAGE_PATH}${item.requisition_form}`;
            return pushData;
        });

        return res.status(200).send({ 'status': true, 'data': outPutData, 'message': 'API Accessed Successfully' });


    }
    catch (error) {
        //console.log( error );
        return res.status(403).send({ 'status': false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE });
    }
}


/********* Assign Employee on MPR For Approval ************/
controller.assignEmployeeOnMPRForApproval = async (req, res) => {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(409).json({ status: false, message: errors.array()[0].msg });
    }

    const { mpr_doc_id, employee_list, add_by_name, add_by_mobile, add_by_designation, add_by_email } = req.body;

    try {

        const data = await RequisitionFormCI.findOne({ _id: dbObjectId(mpr_doc_id) });
        const AddByEmpData = await EmployeeCI.findOne({ "$or": [{ mobile_no: add_by_mobile }, { email: add_by_email }, { name: add_by_name }] }, { 'name': 1, 'email': 1, 'mobile_no': 1, 'employee_code': 1, 'designation': 1, 'docs.doc_category': 1, 'docs.file_name': 1 });

        // console.log( AddByEmpData ); 
        if (data.length === 0) {
            return res.status(403).send({ 'status': false, 'message': 'No Record Found' });
        }

        const OldRecords = data.activity_data;
        const allEmployeeIds = employee_list.filter((item) => item.id !== 'NA').map((item) => dbObjectId(item.id));
        const allEmployeeIdsList = employee_list.filter((item) => item.id !== 'NA');

        /** collect raised by data */
        const OldRaisedByRecords = OldRecords.find((item) => item?.type.toString() === 'raised');

        // console.log( OldRaisedByRecords );


        const collectFinalData = [];

        const pushRaisedData = {}
        if (OldRaisedByRecords) {
            pushRaisedData.employee_doc_id = 'NONE';
            pushRaisedData.emp_code = 'NONE';
            pushRaisedData.name = OldRaisedByRecords.name;
            pushRaisedData.mobile = OldRaisedByRecords.mobile;
            pushRaisedData.email = OldRaisedByRecords.email;
            pushRaisedData.designation = OldRaisedByRecords.designation || 'Corporate HR';
            pushRaisedData.employee_designation = OldRaisedByRecords.employee_designation || 'Corporate HR';
            pushRaisedData.signature = OldRaisedByRecords.signature;
            pushRaisedData.status = 'Approved';
            pushRaisedData.priority = 0;
            pushRaisedData.added_date = OldRaisedByRecords.added_date;
            pushRaisedData.type = 'raised';
            pushRaisedData.comment = 'na';

        } else {
            const getEmpSignature = AddByEmpData?.docs.find((elm) => elm.doc_category === 'Signature');
            pushRaisedData.employee_doc_id = AddByEmpData._id.toString();
            pushRaisedData.name = AddByEmpData.name;
            pushRaisedData.mobile = AddByEmpData.mobile_no;
            pushRaisedData.email = AddByEmpData.email;
            pushRaisedData.designation = add_by_designation || 'Corporate HR';
            pushRaisedData.employee_designation = add_by_designation || 'Corporate HR';
            pushRaisedData.signature = typeof getEmpSignature?.file_name !== 'undefined' ? getEmpSignature.file_name : '';
            pushRaisedData.status = 'Approved';
            pushRaisedData.priority = 0;
            pushRaisedData.added_date = dbDateFormat();
            pushRaisedData.type = 'raised';
            pushRaisedData.comment = 'na';
        }


        collectFinalData.push(pushRaisedData);


        const empData = await EmployeeCI.find({ '_id': { $in: allEmployeeIds } }, { 'name': 1, 'email': 1, 'mobile_no': 1, 'employee_code': 1, 'designation': 1, 'docs.doc_category': 1, 'docs.file_name': 1 });

        //console.log( empData );

        allEmployeeIdsList.forEach((empItem, index) => {

            const findEmployeeInList = OldRecords.find((item) => typeof item?.employee_doc_id !== 'undefined' && item?.employee_doc_id.toString() === empItem.id.toString() && item?.type !== 'raised');
            const findEmployeeData = empData.find((item) => item._id.toString() === empItem.id.toString());
            const getSignature = findEmployeeData?.docs.find((elm) => elm.doc_category === 'Signature');
            const findEmployeeDataInRequest = allEmployeeIdsList.find((item) => item.id.toString() === empItem.id.toString());

            if (findEmployeeInList && findEmployeeData) {
                var push = {}
                push.employee_doc_id = findEmployeeData._id.toString();
                push.name = findEmployeeData.name;
                push.mobile = findEmployeeData.mobile_no;
                push.email = findEmployeeData.email;
                push.designation = empItem?.designation || findEmployeeInList.designation;
                push.employee_designation = findEmployeeInList?.employee_designation || empItem?.designation;
                push.priority = empItem.priority;
                push.status = findEmployeeInList.status;
                push.signature = typeof getSignature?.file_name !== 'undefined' ? getSignature.file_name : '';
                push.added_date = findEmployeeInList.added_date;
                push.type = findEmployeeInList.type;
                push.comment = findEmployeeInList.comment;
                if (findEmployeeInList?.comment_date) {
                    push.comment_date = findEmployeeInList.comment_date;
                }

                ///return push;
                collectFinalData.push(push);
            } else if (findEmployeeData) {
                var push = {}
                push.employee_doc_id = findEmployeeData._id.toString();
                push.name = findEmployeeData.name;
                push.mobile = findEmployeeData.mobile_no;
                push.email = findEmployeeData.email;
                push.designation = empItem?.designation || 'HOD';
                push.employee_designation = empItem?.designation || 'HOD';
                push.priority = empItem.priority;
                push.status = 'Pending';
                push.signature = typeof getSignature?.file_name !== 'undefined' ? getSignature.file_name : '';
                push.type = 'entry';
                push.added_date = dbDateFormat();
                push.comment = '';
                //return push;
                collectFinalData.push(push);
            }
        })

        const highestPriorityItem = employee_list.reduce((prev, current) => {
            return current.priority > prev.priority ? current : prev;
        });

        const hrConfig = JSON.parse(fs.readFileSync('./src/config/hr_config_file.txt', 'utf8'));
        //create ceo sir entry
        var pushCEOData = {}
        if (OldRecords.status === 'Approved') {
            const newCEOListData = OldRecords.find((item) => item.employee_doc_id.toString() === 'NA');
            pushCEOData.employee_doc_id = 'NA';
            pushCEOData.name = newCEOListData.name;
            pushCEOData.mobile = newCEOListData.mobile;
            pushCEOData.email = newCEOListData.email;
            pushCEOData.designation = newCEOListData.designation;
            pushCEOData.employee_designation = 'CEO';
            pushCEOData.priority = newCEOListData.priority;
            pushCEOData.status = newCEOListData.status;
            pushCEOData.signature = hrConfig?.ceo_digital_signature;
            pushCEOData.added_date = newCEOListData.added_date;
            pushCEOData.type = newCEOListData.type;
            if (newCEOListData?.comment_date) {
                pushCEOData.comment_date = newCEOListData.comment_date;
            }
            pushCEOData.comment = newCEOListData.comment;

        } else {
            pushCEOData.employee_doc_id = 'NA';
            pushCEOData.emp_code = 'CEO';
            pushCEOData.name = hrConfig?.ceo_name;
            pushCEOData.mobile = 'NA';
            pushCEOData.email = hrConfig?.ceo_email_id;
            pushCEOData.designation = 'CEO';
            pushCEOData.employee_designation = 'CEO';
            pushCEOData.signature = hrConfig?.ceo_digital_signature;
            pushCEOData.status = 'Pending';
            pushCEOData.priority = parseInt(highestPriorityItem.priority) + 1;
            pushCEOData.added_date = dbDateFormat();
            pushCEOData.type = 'entry';
            pushCEOData.comment = '';
        }

        collectFinalData.push(pushCEOData);

        const whereUpdate = {}
        whereUpdate._id = dbObjectId(mpr_doc_id);

        await RequisitionFormCI.updateOne(whereUpdate, { $set: { 'activity_data': collectFinalData } });

        return res.status(200).send({ 'status': true, 'message': 'Data Updated Successfully' });

    }
    catch (error) {
        console.log(error);
        return res.status(403).send({ 'status': false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE });
    };
}


// controller.updateSignatureInMpr = async (req, res) => {
//     try {
//         // Fetch all MPR list
//         const mprList = await RequisitionFormCI.find({}, { _id: 1, activity_data: 1 });
//         const hrConfig = JSON.parse(fs.readFileSync('./src/config/hr_config_file.txt', 'utf8'));

//         for (const itemList of mprList) {
//             const OldRecords = itemList.activity_data;
//             var createPayload = [];
//             var priority = 0;
//             for (const itemActivity of OldRecords) {
//                 // Skip if mobile is not defined
//                 //if (!itemActivity?.mobile) continue;

//                 var getSignature = {}
//                 // Get employee data
//                  var findEmployeeData = await EmployeeCI.findOne(
//                     {  name: itemActivity.name },
//                     {
//                         name: 1,
//                         email: 1,
//                         mobile_no: 1,
//                         employee_code: 1,
//                         designation: 1,
//                         'docs.doc_category': 1,
//                         'docs.file_name': 1
//                     }
//                 ); 

//                 //if (!findEmployeeData) continue;
//                 if( findEmployeeData && findEmployeeData.name !== 'Saumya Kaushik' && itemActivity.designation !== 'NA'){

//                 getSignature = findEmployeeData?.docs?.find(elm => elm.doc_category === 'Signature');

//                 var push = {
//                     employee_doc_id: findEmployeeData._id.toString(),
//                     name: findEmployeeData.name,
//                     mobile: findEmployeeData.mobile_no,
//                     email: findEmployeeData.email,
//                     designation: (itemActivity.type === 'raised' ? 'Corporate HR' : 'HOD' ) || '',
//                     employee_designation: (itemActivity.type === 'raised' ? 'Corporate HR' : 'HOD' ) || '',
//                     priority: itemActivity.priority || 0,
//                     status: itemActivity.status,
//                     signature: getSignature?.file_name || '',
//                     added_date: itemActivity.added_date,
//                     type: itemActivity.type,
//                     comment: itemActivity.comment,
//                     comment_date: itemActivity.comment_date || itemActivity.added_date
//                 };

//                 createPayload.push(push);
//                 }
//             }

//             // Add CEO entry if exists
//             const newCEOListData = OldRecords.find(item => item.employee_doc_id?.toString() === 'NA');
//             if (newCEOListData) {
//                 createPayload.push({
//                     employee_doc_id: 'NA',
//                     name: newCEOListData.name,
//                     mobile: newCEOListData.mobile,
//                     email: newCEOListData.email,
//                     designation: newCEOListData.designation,
//                     employee_designation: 'CEO',
//                     priority: newCEOListData.priority,
//                     status: newCEOListData.status,
//                     signature: hrConfig?.ceo_digital_signature || '',
//                     added_date: newCEOListData.added_date,
//                     type: newCEOListData.type,
//                     comment_date: newCEOListData.comment_date || newCEOListData.added_date,
//                     comment: newCEOListData.comment
//                 });
//             }else{
//                  createPayload.push({
//                     employee_doc_id : 'NA',
//                     emp_code : 'CEO', 
//                     name : hrConfig?.ceo_name,
//                     mobile : 'NA',
//                     email : hrConfig?.ceo_email_id,
//                     designation : 'CEO', 
//                     employee_designation : 'CEO', 
//                     signature : hrConfig?.ceo_digital_signature,
//                     status : 'Pending',
//                     priority : parseInt( createPayload.length ) + 1,
//                     added_date : dbDateFormat(),
//                     type : 'entry',
//                     comment : ''
//                 });
//             }

//             //console.log( createPayload );

//             // Step 1: Group by email and keep best record (prefer 'raised' type)
//             const emailMap = new Map();

//             for (const record of createPayload) {
//             const existing = emailMap.get(record.email);

//             if (!existing) {
//                 emailMap.set(record.email, record);
//             } else {
//                 // Keep 'raised' type if available, or higher priority
//                 if (
//                 record.type === 'raised' && existing.type !== 'raised' ||
//                 record.priority < existing.priority
//                 ) {
//                 emailMap.set(record.email, record);
//                 }
//             }
//             }

//             // Step 2: Convert back to array and sort by priority ascending
//             let result = Array.from(emailMap.values()).sort((a, b) => a.priority - b.priority);

//             // Step 3: Reassign priorities 0,1,2,... and set type: 'raised' for top one
//             result = result.map((item, index) => {
//             return {
//                 ...item,
//                 priority: index,
//                 type: index === 0 ? 'raised' : item.type
//             };
//             });

//            // console.log( result );

//             // Update activity_data
//             await RequisitionFormCI.updateOne(
//                 { _id: itemList._id },
//                 { $set: { activity_data: result } }
//             );
//         }

//         return res.send('done');
//     } catch (error) {
//         console.error('Error in updateSignatureInMpr:', error);
//         return res.status(500).send('Internal server error');
//     }
// };
controller.updateSignatureInMpr = async (req, res) => {
    try {
        // Fetch all MPR list
        const mprList = await RequisitionFormCI.find({}, { _id: 1, activity_data: 1 });
        const hrConfig = JSON.parse(fs.readFileSync('./src/config/hr_config_file.txt', 'utf8'));

        for (const itemList of mprList) {
            const OldRecords = itemList.activity_data;
            var createPayload = [];
            var priority = 0;
            for (const itemActivity of OldRecords) {

                var push = {}
                push.employee_doc_id = itemActivity.employee_doc_id.toString();
                push.name = itemActivity.name;
                push.mobile = itemActivity.mobile;
                push.email = itemActivity.email;
                if (itemActivity.type === 'raised') {
                    push.designation = 'Corporate HR';
                    push.employee_designation = 'Corporate HR';
                }
                else if (itemActivity.employee_doc_id === 'NA') {
                    push.designation = 'CEO';
                    push.employee_designation = 'CEO';
                }
                else {
                    push.designation = itemActivity.designation;
                    push.employee_designation = itemActivity.designation;
                }

                push.priority = itemActivity.priority || 0;
                push.status = itemActivity.status;
                push.signature = itemActivity?.signature || '';
                push.added_date = itemActivity.added_date;
                push.type = itemActivity.type;
                push.comment = itemActivity.comment;
                push.comment_date = itemActivity.comment_date || itemActivity.added_date;

                createPayload.push(push);
            }


            //console.log( createPayload ); 


            // Step 2: Convert back to array and sort by priority ascending
            let result = Array.from(createPayload.values()).sort((a, b) => a.priority - b.priority);

            // Step 3: Reassign priorities 0,1,2,... and set type: 'raised' for top one
            result = result.map((item, index) => {
                return {
                    ...item,
                    priority: index,
                    type: index === 0 ? 'raised' : item.type
                };
            });

            //console.log( result );

            // Update activity_data
            await RequisitionFormCI.updateOne(
                { _id: itemList._id },
                { $set: { activity_data: result } }
            );
        }

        return res.send('done');
    } catch (error) {
        console.error('Error in updateSignatureInMpr:', error);
        return res.status(500).send('Internal server error');
    }
}

controller.printHtml = async (req, res) => {
    const TestEmpData = [];
    TestEmpData.push({ 'email': 'anil@duplextech.com' });
    //TestEmpData.push( {'email':'anil.duplextechnology@gmail.com'});

    //console.log( JSON.stringify( saveData ) );
    var html = '';
    const regardsData = {}
    regardsData.name = 'Anil Kumar';
    regardsData.designation = 'HR';
    regardsData.mobile = '8423873295';


    TestEmpData.map((item) => {
        console.log(item.email);
        //html = createRequisitionFormMail( '' , item.email, 'HOD', regardsData ); 
    });

    //const html = requisitionFormApprovalMail('','','');
    return res.send(html);
}



module.exports = controller;