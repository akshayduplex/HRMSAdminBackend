const ProjectCl = require('../../../models/ProjectCl.js');
const DesignationCl = require('../../../models/DesignationCl.js');
const EmployeeCI = require('../../../models/EmployeeCI.js');


const { dbObjectId, dbObjectIdValidate } = require('../../../models/dbObject.js');
const dotenv = require("dotenv");
dotenv.config({ path: '../src/config.env' });
const { dbDateFormat, updateDatesInArray, replaceNullUndefined, lettersOnly, removeFile, getHumanReadableDate, convertToDbDate, calculateDaysBetweenDates } = require('../../../middlewares/myFilters.js');

const { validationResult } = require('express-validator');
const JobCl = require('../../../models/JobsCI.js');
const JobAppliedCandidateCl = require('../../../models/JobAppliedCandidateCl.js');
const ApprovalNoteCI = require('../../../models/ApprovalNoteCI.js');

/** Default Scopes for Fetch Data**/
const defaultScopesFields = ["_id", "title", "duration", "location", "logo", "extend_date_list", "extend_budget_list", "start_date", "end_date", "budget", "budget_estimate_list"];


const controller = {};

/********* Add New Project Data **********/
controller.addProjectData = (req, res) => {
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
        saveData.logo = req.file.filename;
    }

    if (typeof req.body.location !== 'undefined' && req.body.location.length > 0) {
        saveData.location = JSON.parse(req.body.location).map((item) => {
            const push = {}
            push.id = dbObjectId(item.id);
            if (typeof item.state_id !== 'undefined' && item.state_id !== '') {
                push.state_id = dbObjectId(item.state_id);
            }
            if (typeof item.state_name !== 'undefined' && item.state_name !== '') {
                push.state_name = item.state_name;
            }
            push.name = item.name;
            return push;
        });
    }

    if (typeof req.body.manager_data !== 'undefined' && req.body.manager_data.length > 0) {
        saveData.manager_list = JSON.parse(req.body.manager_data).map((item) => {
            const push = {}
            push.emp_id = dbObjectId(item.emp_doc_id);
            push.emp_code = item.emp_code;
            if (typeof item.emp_name !== 'undefined' && item.emp_name !== '') {
                push.emp_name = item.emp_name;
            }
            return push;
        });
        saveData.manager_name = JSON.parse(req.body.manager_data).map(item => item.emp_name).join(', ');
    }

    if (typeof req.body.in_charge_data !== 'undefined' && req.body.in_charge_data.length > 0) {
        saveData.in_charge_list = JSON.parse(req.body.in_charge_data).map((item) => {
            const push = {}
            push.emp_id = dbObjectId(item.emp_doc_id);
            push.emp_code = item.emp_code;
            if (typeof item.emp_name !== 'undefined' && item.emp_name !== '') {
                push.emp_name = item.emp_name;
            }
            return push;
        });
        saveData.incharge_name = JSON.parse(saveData.in_charge_data).map(item => item.emp_name).join(', ');
    }

    saveData.start_date = convertToDbDate(req.body.start_date);
    saveData.end_date = convertToDbDate(req.body.end_date);
    saveData.add_date = dbDateFormat();
    saveData.updated_on = dbDateFormat();



    ProjectCl.findOne({ title: saveData.title })
        .then((ckData) => {
            if (ckData) {
                return res.status(409).send({ 'status': false, 'message': 'Project Already Added' });
            }

            const instData = new ProjectCl(saveData);
            instData.save()
                .then((data) => {
                    return res.status(200).send({ 'status': true, 'message': 'Project Created Successfully' });
                })
                .catch((error) => {
                    return res.status(403).send({ 'status': false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE });
                });
        }).catch((error) => {
            return res.status(403).send({ 'status': false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE });
        });

}

controller.editProject = (req, res) => {

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

    let saveData = {}
    saveData = req.body;
    saveData.updated_on = dbDateFormat();

    if (req.file && req.file.filename) {
        saveData.logo = req.file.filename;
        //delete old file 
        if (typeof req.body.old_filename !== 'undefined' && req.body.old_filename !== '') {
            removeFile(req.body.old_filename);
        }
    }

    if (typeof req.body.location !== 'undefined' && req.body.location.length > 0) {
        saveData.location = JSON.parse(req.body.location).map((item) => {
            const push = {}
            push.id = dbObjectId(item.id);
            if (typeof item.state_id !== 'undefined' && item.state_id !== '') {
                push.state_id = dbObjectId(item.state_id);
            }
            if (typeof item.state_name !== 'undefined' && item.state_name !== '') {
                push.state_name = item.state_name;
            }
            push.name = item.name;
            return push;
        });
    }

    if (typeof req.body.manager_data !== 'undefined' && req.body.manager_data.length > 0) {
        saveData.manager_list = JSON.parse(req.body.manager_data).map((item) => {
            const push = {}
            push.emp_id = dbObjectId(item.emp_doc_id);
            push.emp_code = item.emp_code;
            if (typeof item.emp_name !== 'undefined' && item.emp_name !== '') {
                push.emp_name = item.emp_name;
            }
            return push;
        });
        saveData.manager_name = JSON.parse(req.body.manager_data).map(item => item.emp_name).join(', ');
    }

    if (typeof req.body.in_charge_data !== 'undefined' && req.body.in_charge_data.length > 0) {
        saveData.in_charge_list = JSON.parse(req.body.in_charge_data).map((item) => {
            const push = {}
            push.emp_id = dbObjectId(item.emp_doc_id);
            push.emp_code = item.emp_code;
            if (typeof item.emp_name !== 'undefined' && item.emp_name !== '') {
                push.emp_name = item.emp_name;
            }
            return push;
        });
        saveData.incharge_name = JSON.parse(saveData.in_charge_data).map(item => item.emp_name).join(', ');
    }



    saveData.start_date = convertToDbDate(req.body.start_date)
    saveData.end_date = convertToDbDate(req.body.end_date);

    if (typeof req.body.old_filename !== 'undefined' && req.file && req.file.filename) {
        removeFile(req.body.old_filename);
    }



    ProjectCl.updateOne({ _id: dbObjectId(_id) }, { $set: saveData })
        .then((data) => {

            if (data.modifiedCount === 1) {
                return res.status(200).send({ 'status': true, 'message': 'Project Updated Successfully' });
            } else if (data.modifiedCount === 0) {
                return res.status(304).send({ 'status': false, 'message': 'No Action Performed' });
            } else {
                return res.status(403).send({ 'status': false, 'message': process.env.DEFAULT_ERROR_MESSAGE });
            }
        }).catch((error) => {
            return res.status(403).send({ 'status': false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE });
        });
}

controller.deleteProject = (req, res) => {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(409).json({ status: false, message: errors.array()[0].msg });
    }

    const { _id } = req.body;

    ProjectCl.deleteOne({ _id: dbObjectId(_id) })
        .then((data) => {
            if (data.deletedCount === 1) {
                if (typeof req.body.filename !== 'undefined' && req.body.filename !== '') {
                    removeFile(req.body.filename);
                }

                return res.status(200).send({ 'status': true, 'message': 'Project Deleted Successfully' });
            } else if (data.deletedCount === 0) {
                return res.status(304).send({ 'status': false, 'message': 'No Action Performed' });
            } else {
                return res.status(403).send({ 'status': false, 'message': process.env.DEFAULT_ERROR_MESSAGE });
            }
        }).catch((error) => {
            return res.status(403).send({ 'status': false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE });
        });
}

controller.getProjectById = async (req, res) => {

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

    try {

        const data = await ProjectCl.find({ _id: dbObjectId(_id) }, fetchKeys);

        // console.log( data );
        if (data.length > 0) {

            let combinedEmpIds = [];

            if (Array.isArray(data[0]?.manager_list) && data[0].manager_list.length > 0) {
                combinedEmpIds = combinedEmpIds.concat(
                    data[0].manager_list.map(item => item.emp_id)
                );
            }

            if (Array.isArray(data[0]?.in_charge_list) && data[0].in_charge_list.length > 0) {
                combinedEmpIds = combinedEmpIds.concat(
                    data[0].in_charge_list.map(item => item.emp_id)
                );
            }

            let getAllFilteredEmpList = [];

            if (combinedEmpIds.length > 0) {
                const empKeys = { _id: 1, designation: 1, designation_id: 1 }
                getAllFilteredEmpList = await EmployeeCI.find({ '_id': { $in: combinedEmpIds } }, empKeys);
                console.log(getAllFilteredEmpList);
            }

            if (Array.isArray(data[0]?.in_charge_list) && data[0].in_charge_list.length > 0) {
                data[0].in_charge_list = data[0].in_charge_list.map((item) => {
                    var matchItem = getAllFilteredEmpList.find((elm) => elm._id.toString() === item.emp_id.toString());
                    let push = {}
                    push.emp_id = item.emp_id;
                    push.emp_code = item.emp_code;
                    push.emp_name = item.emp_name;
                    push.designation = typeof matchItem !== 'undefined' && matchItem?.designation !== '' ? matchItem?.designation : '';
                    push.designation_id = typeof matchItem !== 'undefined' && matchItem?.designation_id !== '' ? matchItem?.designation_id : '';
                    return push;
                });
            }

            if (Array.isArray(data[0]?.manager_list) && data[0].manager_list.length > 0) {
                data[0].manager_list = data[0].manager_list.map((item) => {
                    var matchItem = getAllFilteredEmpList.find((elm) => elm._id.toString() === item.emp_id.toString());
                    let push = {}
                    push.emp_id = item.emp_id;
                    push.emp_code = item.emp_code;
                    push.emp_name = item.emp_name;
                    push.designation = typeof matchItem !== 'undefined' && matchItem?.designation !== '' ? matchItem?.designation : '';
                    push.designation_id = typeof matchItem !== 'undefined' && matchItem?.designation_id !== '' ? matchItem?.designation_id : '';
                    return push;
                });
            }



            const outPutData = updateDatesInArray(replaceNullUndefined(data), ['add_date', 'updated_on'], 'datetime');
            return res.status(200).send({ 'status': true, 'data': outPutData[0], 'message': 'API Accessed Successfully' });
        } else {
            return res.status(304).send({ 'status': false, 'message': 'No record matched' });
        }

    } catch (error) {
        const errorMessage = error?.message || process.env.DEFAULT_ERROR_MESSAGE || 'Something went wrong.';
        return res.status(403).send({ status: false, message: errorMessage });
    };
}

controller.changeProjectStatus = (req, res) => {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(409).json({ status: false, message: errors.array()[0].msg });
    }

    const { _id } = req.body;

    let saveData = {}
    saveData = req.body;
    saveData.updated_on = dbDateFormat();

    ProjectCl.updateOne({ _id: dbObjectId(_id) }, { $set: saveData })
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

controller.getProjectList = (req, res) => {

    const { page_no, per_page_record, scope_fields } = req.body;

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
        where['status'] = req.body.status;
    }

    /**********  filter Manual Search ***********/
    if (req.body.hasOwnProperty('project_id') && req.body.project_id !== '') {
        where['_id'] = dbObjectId(req.body.project_id);
    }
    if (req.body.hasOwnProperty('state_id') && req.body.state_id !== '') {
        where['location.state_id'] = dbObjectId(req.body.state_id);
    }
    if (req.body.hasOwnProperty('location_id') && req.body.location_id !== '') {
        where['location.id'] = dbObjectId(req.body.location_id);
    }
    if (req.body.hasOwnProperty('end_date') && req.body.end_date !== '') {
        where['end_date'] = { $eq: new Date(req.body.end_date) };
    }
    if (req.body.hasOwnProperty('designation') && req.body.designation !== '') {
        where['budget_estimate_list.designation'] = req.body.designation;
    }

    const pageOptions = {
        page: parseInt(((page_no ? page_no : 1) - 1)) || 0,
        limit: parseInt(per_page_record) || 10
    }

    ProjectCl.find(where, fetchKeys)
        .skip(pageOptions.page * pageOptions.limit)
        .limit(pageOptions.limit)
        .sort({ status: 1, _id: -1 })
        .then((data) => {
            if (data.length > 0) {
                const outPutData = updateDatesInArray(replaceNullUndefined(data), ['add_date', 'updated_on'], 'datetime');
                return res.status(200).send({ 'status': true, 'data': outPutData, 'message': 'API Accessed Successfully' });
            } else {
                return res.status(204).send({ 'status': false, 'message': 'No record matched' });
            }
        }).catch((error) => {
            return res.status(403).send({ 'status': false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE });
        });
}

controller.extendProjectDuration = (req, res) => {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(409).json({ status: false, message: errors.array()[0].msg });
    }

    const { _id, from_date, to_date } = req.body;

    let saveData = {}
    saveData.updated_on = dbDateFormat();
    saveData.end_date = convertToDbDate(to_date);
    const saveExtendDate = {}
    saveExtendDate.from = convertToDbDate(from_date);
    saveExtendDate.to = convertToDbDate(to_date);
    saveExtendDate.add_date = convertToDbDate(to_date);

    ProjectCl.findOne({ _id: dbObjectId(_id) }, { 'extend_date_list': 1, 'start_date': 1 })
        .then((responseData) => {

            if (responseData.extend_date_list.length > 0) {
                const matchRecord = responseData.extend_date_list.find(record =>
                    getHumanReadableDate(record.from, 'date') === getHumanReadableDate(convertToDbDate(from_date), 'date') && getHumanReadableDate(record.to, 'date') === getHumanReadableDate(convertToDbDate(to_date), 'date')
                );

                if (matchRecord) {
                    return res.status(409).send({ 'status': false, 'message': 'Date Range Already Added' });
                }
            }

            //calculate Total Project Duration
            const totalDays = calculateDaysBetweenDates(responseData.start_date, saveExtendDate.to);
            saveData.duration = `${totalDays} days`;

            ProjectCl.updateOne({ _id: dbObjectId(_id) }, { $set: saveData, $push: { 'extend_date_list': saveExtendDate } })
                .then((data) => {

                    if (data.modifiedCount === 1) {
                        const fetchKeys = {}
                        defaultScopesFields.forEach(field => { fetchKeys[field] = 1; });
                        ProjectCl.findOne({ _id: dbObjectId(_id) }, fetchKeys)
                            .then((respData) => {
                                return res.status(200).send({ 'status': true, 'data': respData, 'message': 'Date Extended Successfully' });
                            }).catch((error) => {
                                return res.status(403).send({ 'status': false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE });
                            });
                    } else if (data.modifiedCount === 0) {
                        return res.status(304).send({ 'status': false, 'message': 'No Action Performed' });
                    } else {
                        return res.status(403).send({ 'status': false, 'message': process.env.DEFAULT_ERROR_MESSAGE });
                    }
                }).catch((error) => {
                    return res.status(403).send({ 'status': false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE });
                });
        }).catch((error) => {
            return res.status(403).send({ 'status': false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE });
        });
}

controller.extendProjectBudget = (req, res) => {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(409).json({ status: false, message: errors.array()[0].msg });
    }

    const { _id, budget_list, total_budget } = req.body;

    ProjectCl.findOne({ _id: dbObjectId(_id) }, { 'budget_estimate_list': 1, 'project_budget': 1 })
        .then((oldData) => {

            let saveData = {}
            saveData.updated_on = dbDateFormat();
            saveData.budget = parseInt(total_budget);

            /* Save Project Budget Data*/
            if (typeof oldData.project_budget !== 'undefined') {
                const project_budget = {}
                project_budget.sanctioned = parseInt(total_budget);
                project_budget.utilized = parseInt(oldData.project_budget.utilized);
                project_budget.available = parseInt(total_budget) - parseInt(oldData.project_budget.utilized);
                saveData.project_budget = project_budget;
            } else {
                const project_budget = {}
                project_budget.sanctioned = parseInt(total_budget);
                project_budget.utilized = 0;
                project_budget.available = parseInt(total_budget);
                saveData.project_budget = project_budget;
            }


            /********** Maintain Budget List*******/
            if (typeof oldData.budget_estimate_list !== 'undefined' && oldData.budget_estimate_list.length > 0) {

                const newRecords = budget_list;
                const oldRecords = oldData.budget_estimate_list;

                const collectData = [];

                for (var i = 0; i < newRecords.length; i++) {
                    const pushData = {}
                    pushData.designation = newRecords[i].designation;
                    pushData.no_of_positions = parseInt(newRecords[i].no_of_positions);
                    pushData.ctc = parseInt(newRecords[i].ctc);
                    pushData.total_ctc = parseInt(newRecords[i].total_ctc);
                    if (typeof newRecords[i].designation_id !== 'undefined' && newRecords[i].designation_id !== '') {
                        pushData.designation_id = dbObjectId(newRecords[i].designation_id);
                    }


                    const findItem = oldRecords.find((item) => item.designation === newRecords[i].designation);
                    if (findItem) {
                        pushData._id = findItem._id;
                        pushData.add_date = new Date(findItem.add_date);
                        pushData.hired = findItem.hired;
                        pushData.available_vacancy = parseInt(newRecords[i].no_of_positions) - parseInt(findItem.hired);
                        pushData.resigned = findItem.resigned;
                        pushData.regions = findItem.regions;
                        pushData.divisions = findItem.divisions;
                        pushData.employee_type = findItem.employee_type;
                        pushData.vacant_date = new Date(findItem.vacant_date);
                    } else {
                        pushData.add_date = dbDateFormat();
                        pushData.hired = 0;
                        pushData.available_vacancy = parseInt(newRecords[i].no_of_positions);
                        pushData.resigned = 0;
                        pushData.regions = [];
                        pushData.divisions = [];
                        pushData.employee_type = 'onRole';
                        pushData.vacant_date = dbDateFormat();
                    }
                    collectData.push(pushData);
                }
                var newBudgetData = collectData;

            } else {

                const collectData = [];
                for (var i = 0; i < budget_list.length; i++) {
                    const pushData = {}
                    pushData.designation = budget_list[i].designation;
                    if (typeof budget_list[i].designation_id !== 'undefined' && budget_list[i].designation_id !== '') {
                        pushData.designation_id = dbObjectId(budget_list[i].designation_id);
                    }
                    pushData.no_of_positions = parseInt(budget_list[i].no_of_positions);
                    pushData.ctc = parseInt(budget_list[i].ctc);
                    pushData.total_ctc = parseInt(budget_list[i].total_ctc);
                    pushData.add_date = dbDateFormat();
                    pushData.hired = 0;
                    pushData.available_vacancy = parseInt(budget_list[i].no_of_positions);
                    pushData.resigned = 0;
                    pushData.regions = [];
                    pushData.divisions = [];
                    pushData.employee_type = 'onRole';
                    pushData.vacant_date = dbDateFormat();;
                    collectData.push(pushData);
                }
                var newBudgetData = collectData;
            }

            //find total 
            saveData.total_vacancy = newBudgetData.reduce((accumulator, current) => {
                return parseInt(accumulator) + parseInt(current.no_of_positions);
            }, 0);

            saveData.hired = newBudgetData.reduce((accumulator, current) => {
                return parseInt(accumulator) + parseInt(current.hired);
            }, 0);

            saveData.available_vacancy = newBudgetData.reduce((accumulator, current) => {
                return parseInt(accumulator) + parseInt(current.available_vacancy);
            }, 0);

            saveData.per_month_budget = parseInt(newBudgetData.reduce((accumulator, current) => {
                return parseInt(accumulator) + (parseInt(current.ctc) / 12);
            }, 0));

            ProjectCl.updateOne({ _id: dbObjectId(_id) }, [
                { $set: saveData },
                { $set: { budget_estimate_list: [] } },
                { $set: { budget_estimate_list: { $concatArrays: ["$budget_estimate_list", newBudgetData] } } }
            ])
                .then((data) => {

                    if (data.modifiedCount === 1) {
                        const fetchKeys = {}
                        defaultScopesFields.forEach(field => { fetchKeys[field] = 1; });
                        ProjectCl.findOne({ _id: dbObjectId(_id) }, fetchKeys)
                            .then((respData) => {
                                return res.status(200).send({ 'status': true, 'data': respData, 'message': 'Budget Updated Successfully' });
                            }).catch((error) => {
                                return res.status(403).send({ 'status': false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE });
                            });
                    } else if (data.modifiedCount === 0) {
                        return res.status(304).send({ 'status': false, 'message': 'No Action Performed' });
                    } else {
                        return res.status(403).send({ 'status': false, 'message': process.env.DEFAULT_ERROR_MESSAGE });
                    }
                }).catch((error) => {
                    return res.status(403).send({ 'status': false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE });
                });

        }).catch((error) => {
            return res.status(403).send({ 'status': false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE });
        });
}

controller.closeProject = (req, res) => {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(403).json({ status: false, message: errors.array()[0].msg });
    }

    const { _id, closed_on, total_payout } = req.body;

    let saveData = {}
    saveData.updated_on = dbDateFormat();
    saveData.status = 'Closed';
    saveData.closed_on = convertToDbDate(closed_on);
    saveData.total_payout = total_payout;

    ProjectCl.updateOne({ _id: dbObjectId(_id) }, { $set: saveData })
        .then((data) => {

            let saveCloseData = {}
            saveCloseData.updated_on = dbDateFormat();
            saveCloseData.profile_status = 'Closed';
            saveCloseData.job_status = 'Closure';
            saveCloseData.date_of_leaving = dbDateFormat();
            EmployeeCI.updateMany({ project_id: dbObjectId(_id), job_status: 'joined', profile_status: 'Active' }, { $set: saveCloseData })
                .then((data) => {
                    return res.status(200).send({ 'status': true, 'message': 'Project Closed Successfully' });
                }).catch((error) => {
                    return res.status(403).send({ 'status': false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE });
                });

        }).catch((error) => {
            return res.status(403).send({ 'status': false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE });
        });
}

controller.editProjectBudget = (req, res) => {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(403).json({ status: false, message: errors.array()[0].msg });
    }

    const { _id, sanctioned, utilized, available } = req.body;

    let saveData = {}
    const projectBudget = {}
    projectBudget.sanctioned = parseFloat(sanctioned);
    projectBudget.utilized = parseFloat(utilized);
    projectBudget.available = parseFloat(available);

    saveData.project_budget = projectBudget;

    ProjectCl.updateOne({ _id: dbObjectId(_id) }, { $set: saveData })
        .then((data) => {
            return res.status(200).send({ 'status': true, 'message': 'Project Budget Updated Successfully' });
        }).catch((error) => {
            return res.status(403).send({ 'status': false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE });
        });
}

/* this is test remove after use*/
controller.editProjectLocation = (req, res) => {

    const { _id } = req.body;

    let saveData = {}
    saveData = req.body;
    saveData.updated_on = dbDateFormat();


    if (typeof saveData.location !== 'undefined' && saveData.location.length > 0) {
        saveData.location = req.body.location.map((item) => {
            const push = {}
            push.id = dbObjectId(item.id);
            if (typeof item.state_id !== 'undefined' && item.state_id !== '') {
                push.state_id = dbObjectId(item.id);
            }
            if (typeof item.state_name !== 'undefined' && item.state_name !== '') {
                push.state_name = item.state_name;
            }
            push.name = item.name;
            return push;
        });
    }


    ProjectCl.updateOne({ _id: dbObjectId(_id) }, { $set: saveData })
        .then((data) => {

            if (data.modifiedCount === 1) {
                return res.status(200).send({ 'status': true, 'message': 'Project Updated Successfully' });
            } else if (data.modifiedCount === 0) {
                return res.status(304).send({ 'status': false, 'message': 'No Action Performed' });
            } else {
                return res.status(403).send({ 'status': false, 'message': process.env.DEFAULT_ERROR_MESSAGE });
            }
        }).catch((error) => {
            return res.status(403).send({ 'status': false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE });
        });
}


controller.getProjectEmploymentList = (req, res) => {

    const { page_no, per_page_record, scope_fields } = req.body;

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
        where['status'] = req.body.status;
    }

    /**********  filter Manual Search ***********/
    if (req.body.hasOwnProperty('project_id') && req.body.project_id !== '') {
        where['_id'] = dbObjectId(req.body.project_id);
    }
    if (req.body.hasOwnProperty('state_id') && req.body.state_id !== '') {
        where['location.state_id'] = dbObjectId(req.body.state_id);
    }
    if (req.body.hasOwnProperty('location_id') && req.body.location_id !== '') {
        where['location.id'] = dbObjectId(req.body.location_id);
    }
    if (req.body.hasOwnProperty('end_date') && req.body.end_date !== '') {
        where['end_date'] = { $eq: new Date(req.body.end_date) };
    }
    const where2 = {}
    if (req.body.hasOwnProperty('designation') && req.body.designation !== '') {
        where2['budget_estimate_list.designation'] = req.body.designation;
    }
    if (req.body.hasOwnProperty('department_id') && req.body.department_id !== '') {
        where2['budget_estimate_list.department_id'] = dbObjectId(req.body.department_id);
    }
    if (req.body.hasOwnProperty('region') && req.body.region !== '') {
        where2['budget_estimate_list.regions'] = req.body.region;
    }
    if (req.body.hasOwnProperty('division') && req.body.division !== '') {
        where2['budget_estimate_list.divisions'] = req.body.division;
    }
    if (req.body.hasOwnProperty('employee_type') && req.body.employee_type !== '') {
        where2['budget_estimate_list.employee_type'] = req.body.employee_type;
    }


    const pageOptions = {
        page: parseInt(((page_no ? page_no : 1) - 1)) || 0,
        limit: parseInt(per_page_record) || 10
    }


    /*prepare pipeline */
    const pipeLine = [];
    if (where) {
        pipeLine.push({ $match: where });
    }

    pipeLine.push({ $unwind: "$budget_estimate_list" });

    if (where2) {
        pipeLine.push({ $match: where2 });
    }


    pipeLine.push({
        $project: {
            _id: 1,
            title: 1,
            status: 1,
            designation: "$budget_estimate_list.designation",
            no_of_positions: "$budget_estimate_list.no_of_positions",
            ctc: "$budget_estimate_list.ctc",
            total_ctc: "$budget_estimate_list.total_ctc",
            hired: "$budget_estimate_list.hired",
            available_vacancy: "$budget_estimate_list.available_vacancy",
            resigned: "$budget_estimate_list.resigned",
            add_date: "$budget_estimate_list.add_date",
            region: "$budget_estimate_list.regions",
            division: "$budget_estimate_list.divisions",
            vacant_date: "$budget_estimate_list.vacant_date",
            department: "$budget_estimate_list.department",
            department_id: "$budget_estimate_list.department_id",
            designation_id: "$budget_estimate_list.designation_id"
        }
    });

    pipeLine.push({
        $skip: pageOptions.page * pageOptions.limit
    });

    pipeLine.push({
        $limit: pageOptions.limit
    });


    ProjectCl.aggregate(pipeLine)
        .then((data) => {

            if (data.length > 0) {

                const resultData = [];
                for (var i = 0; i < data.length; i++) {
                    const push = {}
                    // if( req.body.hasOwnProperty('designation') && req.body.designation !== '' ){
                    //  if(req.body.designation.trim() === data[i].designation ){
                    push._id = data[i]._id;
                    push.title = data[i].title;
                    push.status = data[i].status;
                    push.designation = data[i].designation;
                    push.sanction_date = data[i].add_date ? data[i].add_date : new Date();
                    push.no_of_positions = parseInt(data[i].no_of_positions ? data[i].no_of_positions : 0);
                    push.ctc = data[i].ctc;
                    push.total_ctc = data[i].total_ctc;
                    push.hired = parseInt(data[i].hired ? data[i].hired : 0);
                    push.available_vacancy = parseInt(data[i].available_vacancy ? data[i].available_vacancy : 0);
                    push.resigned = parseInt(data[i].resigned ? data[i].resigned : 0);
                    push.region = typeof data[i].region !== 'undefined' ? data[i].region : [];
                    push.division = typeof data[i].division !== 'undefined' ? data[i].division : [];
                    push.vacant_date = typeof data[i].vacant_date !== 'undefined' ? data[i].vacant_date : '';
                    push.department = typeof data[i].department !== 'undefined' ? data[i].department : '';
                    push.department_id = typeof data[i].department_id !== 'undefined' ? data[i].department_id : '';
                    push.designation_id = typeof data[i].designation_id !== 'undefined' ? data[i].designation_id : '';
                    resultData.push(push);
                    // }
                    // }else {
                    //     push._id = data[i]._id;
                    //     push.title = data[i].title;
                    //     push.status = data[i].status;
                    //     push.designation = data[i].designation;
                    //     push.sanction_date = data[i].add_date ? data[i].add_date : new Date() ;
                    //     push.no_of_positions = parseInt( data[i].no_of_positions ? data[i].no_of_positions : 0 );
                    //     push.ctc = data[i].ctc;
                    //     push.total_ctc = data[i].total_ctc;
                    //     push.hired = parseInt( data[i].hired ? data[i].hired : 0 );
                    //     push.available_vacancy = parseInt( data[i].available_vacancy ? data[i].available_vacancy : 0  );
                    //     push.resigned = parseInt( data[i].resigned ? data[i].resigned : 0  );
                    //     push.region = typeof data[i].region !=='undefined' ? data[i].region  : [];
                    //     push.division = typeof data[i].division !=='undefined' ? data[i].division : [];
                    //     push.vacant_date = typeof data[i].vacant_date !=='undefined' ? data[i].vacant_date : '';
                    //     push.department = typeof data[i].department !=='undefined' ? data[i].department : '';
                    //     push.department_id = typeof data[i].department_id !=='undefined' ? data[i].department_id : '';
                    //     push.designation_id = typeof data[i].designation_id !=='undefined' ? data[i].designation_id : '';
                    //     resultData.push( push );
                    // }
                }


                if (resultData.length === 0) {
                    return res.status(204).send({ 'status': false, 'message': 'No record matched' });
                } else {
                    const outPutData = updateDatesInArray(replaceNullUndefined(resultData), ['add_date', 'updated_on', 'sanction_date', 'vacant_date'], 'date');
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

controller.getProjectBudgetChart = (req, res) => {

    const where = {}
    const fetchKeys = { title: 1, project_budget: 1, budget_ledger: 1 }

    where['status'] = 'Active';

    /**********  filter Manual Search ***********/
    if (req.body.hasOwnProperty('project_id') && req.body.project_id !== '') {
        where['_id'] = dbObjectId(req.body.project_id);
    }

    if (req.body.hasOwnProperty('from_date') && req.body.from_date !== '' && req.body.hasOwnProperty('to_date') && req.body.to_date !== '') {

        where['budget_ledger.salary_month_date'] = {
            $gte: new Date(req.body.from_date),
            $lte: new Date(req.body.to_date)
        }

        ProjectCl.aggregate([
            {
                $unwind: "$budget_ledger"
            },
            {
                $match: where
            },
            {
                $group: {
                    _id: "$_id",
                    title: { $first: "$title" },
                    sanctionedBudget: { $first: "$budget" },
                    utilizedAmount: { $sum: "$budget_ledger.utilized_amount" },
                    ledgerEntries: { $push: "$budget_ledger" }
                }
            },
            {
                $project: {
                    _id: 1,
                    title: 1,
                    project_budget: {
                        sanctioned: "$sanctionedBudget", // sanctioned budget
                        utilized: "$utilizedAmount", // total utilized amount from the group stage
                        available: { $subtract: ["$sanctionedBudget", "$utilizedAmount"] } // calculate available budget
                    }
                }
            }
        ]).then((data) => {

            if (data.length > 0) {
                const outPutData = replaceNullUndefined(data);
                return res.status(200).send({ 'status': true, 'data': outPutData, 'message': 'API Accessed Successfully' });
            } else {
                return res.status(200).send({ 'status': false, 'message': 'No record matched' });
            }
        }).catch((error) => {
            return res.status(200).send({ 'status': false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE });
        });

    } else {
        ProjectCl.find(where, fetchKeys)
            .sort({ _id: -1, status: 1 })
            .then((data) => {

                if (data.length > 0) {
                    const outPutData = replaceNullUndefined(data);
                    return res.status(200).send({ 'status': true, 'data': outPutData, 'message': 'API Accessed Successfully' });
                } else {
                    return res.status(200).send({ 'status': false, 'message': 'No record matched' });
                }
            }).catch((error) => {
                return res.status(200).send({ 'status': false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE });
            });
    }
}

controller.getProjectWiseVacancyChart = (req, res) => {

    if (req.body.hasOwnProperty('project_id') && req.body.project_id !== '') {

        const where = {}
        where['status'] = 'Active';

        DesignationCl.aggregate([
            {
                $match: where
            },
            {
                $unwind: "$priority_list"
            },
            {
                $match: { 'priority_list.project_id': dbObjectId(req.body.project_id) }
            },
            {
                $project: {
                    _id: '$_id',
                    name: '$name',
                    priority: "$priority_list.priority",
                }
            },
            {
                $sort: { priority: 1 }
            }
        ]).then((designationData) => {
            const where = {}
            where['status'] = 'Active';

            const pipeLine = [];
            pipeLine.push({ $match: where });

            pipeLine.push({ $unwind: "$budget_estimate_list" });

            const where2 = {}
            if (req.body.hasOwnProperty('employee_type') && req.body.employee_type !== '') {
                where2['budget_estimate_list.employee_type'] = req.body.employee_type;
                pipeLine.push({ $match: where2 });
            }

            pipeLine.push({
                $group: {
                    _id: "$budget_estimate_list.designation",
                    hired: { $sum: "$budget_estimate_list.hired" },
                    available_vacancy: { $sum: "$budget_estimate_list.available_vacancy" },
                    no_of_positions: { $sum: "$budget_estimate_list.no_of_positions" }
                }
            });

            pipeLine.push({
                $project: {
                    _id: 0,
                    designation: "$_id",
                    hired: 1,
                    available_vacancy: 1,
                    no_of_positions: 1
                }
            });

            ProjectCl.aggregate(pipeLine)
                .then((data) => {
                    if (data.length > 0) {
                        const outPutData = replaceNullUndefined(data);

                        const ResultData = [];
                        for (var i = 0; i < designationData.length; i++) {
                            const pushData = {}
                            const findData = outPutData.find((item) => item.designation === designationData[i].name);
                            if (findData && designationData[i].priority > 0) {
                                pushData.hired = parseInt(findData.hired);
                                pushData.available_vacancy = parseInt(findData.available_vacancy);
                                pushData.no_of_positions = parseInt(findData.no_of_positions);
                                pushData.designation = designationData[i].name;
                                pushData.priority = parseInt(designationData[i].priority);
                                ResultData.push(pushData);
                            }
                        }

                        return res.status(200).send({ 'status': true, 'data': ResultData, 'message': 'API Accessed Successfully' });
                    } else {
                        return res.status(200).send({ 'status': false, 'message': 'No record matched' });
                    }
                }).catch((error) => {
                    return res.status(200).send({ 'status': false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE });
                });
        }).catch((error) => {
            return res.status(200).send({ 'status': false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE });
        });


    } else {
        DesignationCl.find({ 'status': 'Active' }, { _id: 0, name: 1, priority: 1 })
            .sort({ 'priority': 1 })
            .then((designationData) => {

                const where = {}
                where['status'] = 'Active';

                const pipeLine = [];
                pipeLine.push({ $match: where });

                pipeLine.push({ $unwind: "$budget_estimate_list" });

                const where2 = {}
                if (req.body.hasOwnProperty('employee_type') && req.body.employee_type !== '') {
                    where2['budget_estimate_list.employee_type'] = req.body.employee_type;
                    pipeLine.push({ $match: where2 });
                }

                pipeLine.push({
                    $group: {
                        _id: "$budget_estimate_list.designation",
                        hired: { $sum: "$budget_estimate_list.hired" },
                        available_vacancy: { $sum: "$budget_estimate_list.available_vacancy" },
                        no_of_positions: { $sum: "$budget_estimate_list.no_of_positions" }
                    }
                });

                pipeLine.push({
                    $project: {
                        _id: 0,
                        designation: "$_id",
                        hired: 1,
                        available_vacancy: 1,
                        no_of_positions: 1
                    }
                });

                ProjectCl.aggregate(pipeLine)
                    .then((data) => {
                        if (data.length > 0) {
                            const outPutData = replaceNullUndefined(data);

                            const ResultData = [];
                            for (var i = 0; i < designationData.length; i++) {
                                const pushData = {}
                                const findData = outPutData.find((item) => item.designation === designationData[i].name);
                                if (findData) {
                                    pushData.hired = parseInt(findData.hired);
                                    pushData.available_vacancy = parseInt(findData.available_vacancy);
                                    pushData.no_of_positions = parseInt(findData.no_of_positions);
                                    pushData.designation = designationData[i].name;
                                    ResultData.push(pushData);
                                }
                            }

                            return res.status(200).send({ 'status': true, 'data': ResultData, 'message': 'API Accessed Successfully' });
                        } else {
                            return res.status(200).send({ 'status': false, 'message': 'No record matched' });
                        }
                    }).catch((error) => {
                        return res.status(200).send({ 'status': false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE });
                    });

            }).catch((error) => {
                return res.status(200).send({ 'status': false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE });
            });
    }
}

/********* Add  Project Budget Data Manual Delete After Use **********/
controller.addProjectBudgetLedger = (req, res) => {

    const { _id, salary_month_date, financial_year, utilized_amount } = req.body;

    const where = {}
    where._id = dbObjectId(_id);

    ProjectCl.findOne(where, { project_budget: 1, budget: 1, budget_ledger: 1 })
        .then((data) => {

            const availableBudget = typeof data.project_budget !== 'undefined' ? data.project_budget.available : data.budget;
            const utilizedBudget = typeof data.project_budget !== 'undefined' ? data.project_budget.utilized : 0;

            const checkDuplicateRecords = typeof data.budget_ledger !== 'undefined' ? data.budget_ledger.find((item) => item.financial_year === financial_year && getHumanReadableDate(item.salary_month_date, 'date') === getHumanReadableDate(convertToDbDate(salary_month_date), 'date')) : '';

            //check duplicate records 
            if (checkDuplicateRecords) {
                return res.status(200).send({ 'status': false, 'message': 'Budget already Added' });
            } else {

                const saveData = {};
                saveData.financial_year = financial_year;
                saveData.initial_amount = availableBudget;
                saveData.utilized_amount = parseInt(utilized_amount);
                saveData.available_amount = parseInt(availableBudget) - parseInt(utilized_amount);
                saveData.salary_month_date = convertToDbDate(salary_month_date);
                saveData.add_date = dbDateFormat();
                saveData.updated_on = dbDateFormat();


                const updateData = {}
                updateData.sanctioned = parseInt(data.budget);
                updateData.utilized = parseInt(utilizedBudget) + parseInt(utilized_amount);;
                updateData.available = parseInt(saveData.available_amount);


                ProjectCl.updateOne(where, { $set: { 'project_budget': updateData }, $push: { 'budget_ledger': saveData } })
                    .then((upData) => {
                        return res.status(200).send({ 'status': true, 'message': 'Project Created Successfully' });
                    })
                    .catch((error) => {
                        return res.status(403).send({ 'status': false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE });
                    });
            }
        })
        .catch((error) => {
            return res.status(403).send({ 'status': false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE });
        })

}


controller.getDmsProjectList = (req, res) => {

    const { page_no, per_page_record } = req.body;

    const where = {}
    const fetchKeys = {}

    fetchKeys.title = 1;
    fetchKeys.logo = 1;
    fetchKeys.start_date = 1;
    fetchKeys.end_date = 1;
    fetchKeys.duration = 1;
    fetchKeys.status = 1;
    fetchKeys.add_date = 1;
    fetchKeys.updated_on = 1;
    fetchKeys.in_charge_list = 1;
    fetchKeys.manager_list = 1;

    const pageOptions = {
        page: parseInt(((page_no ? page_no : 1) - 1)) || 0,
        limit: parseInt(per_page_record) || 10
    }

    ProjectCl.find(where, fetchKeys)
        .skip(pageOptions.page * pageOptions.limit)
        .limit(pageOptions.limit)
        .sort({ status: 1, _id: -1 })
        .then((data) => {
            if (data.length > 0) {
                const outPutData = updateDatesInArray(replaceNullUndefined(data), ['add_date', 'updated_on'], 'datetime');
                return res.status(200).send({ 'status': true, 'data': outPutData, 'message': 'API Accessed Successfully' });
            } else {
                return res.status(204).send({ 'status': false, 'message': 'No record matched' });
            }
        }).catch((error) => {
            return res.status(403).send({ 'status': false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE });
        });
}


controller.getProjectStatusCount = async (req, res) => {
    try {
        let { project_id } = req.body;

        project_id = dbObjectIdValidate(project_id);
        if (!project_id) {
            return res.status(400).json({
                status: false,
                message: 'Invalid project_id'
            });
        }

        const projectObjectId = dbObjectId(project_id);

        /* ---------------- Project ---------------- */
        const project = await ProjectCl.findById(projectObjectId)
            .select('title budget_estimate_list');

        if (!project) {
            return res.status(404).json({
                status: false,
                message: 'Project not found'
            });
        }

        /* ---------------- Published Jobs ---------------- */
        // Count all jobs for the project
        const publishedJobs = await JobCl.countDocuments({
            project_id: projectObjectId,
            status: { $in: ['Published', 'Unpublished'] }
        });

        /* ---------------- Approval Notes ---------------- */
        // Query approval notes directly from ApprovalNote model
        const approvalNotesCount = await ApprovalNoteCI.countDocuments({
            project_id: projectObjectId,
            status: { $ne: 'Deleted' }
        });

        /* ---------------- Candidate Stats ---------------- */
        const statsAgg = await JobAppliedCandidateCl.aggregate([
            // First unwind to get individual applied jobs
            { $unwind: '$applied_jobs' },

            // Match at the applied_jobs level for this project
            {
                $match: {
                    'applied_jobs.project_id': projectObjectId,
                    'applied_jobs.form_status': { $ne: 'Deleted' }
                }
            },

            // Group and count
            {
                $group: {
                    _id: null,

                    totalApplied: { $sum: 1 },

                    shortlisted: {
                        $sum: {
                            $cond: [
                                { $eq: ['$applied_jobs.form_status', 'Shortlisted'] },
                                1, 0
                            ]
                        }
                    },

                    interviews: {
                        $sum: {
                            $cond: [
                                { $eq: ['$applied_jobs.form_status', 'Interview'] },
                                1, 0
                            ]
                        }
                    },

                    offerLetter: {
                        $sum: {
                            $cond: [
                                { $eq: ['$applied_jobs.form_status', 'Offer'] },
                                1, 0
                            ]
                        }
                    },

                    approvalCandidates: {
                        $sum: {
                            $cond: [
                                { $eq: ['$applied_jobs.interview_shortlist_status', 'Selected'] },
                                1, 0
                            ]
                        }
                    },

                    appointmentLetter: {
                        $sum: {
                            $cond: [
                                { $eq: ['$onboarding_docs_stage', 'appointmentletter'] },
                                1, 0
                            ]
                        }
                    },

                    hired: {
                        $sum: {
                            $cond: [
                                { $eq: ['$applied_jobs.form_status', 'Hired'] },
                                1, 0
                            ]
                        }
                    },
                    joined: {
                        $sum: {
                            $cond: [
                                { $eq: ['$applied_jobs.mark_as_hired', 'Yes'] },
                                1,
                                0
                            ]
                        }
                    }
                }
            }
        ]);

        const stats = statsAgg[0] || {
            totalApplied: 0,
            shortlisted: 0,
            interviews: 0,
            approvalCandidates: 0,
            offerLetter: 0,
            appointmentLetter: 0,
            hired: 0,
            joined: 0
        };

        /* ---------------- Response ---------------- */
        return res.status(200).json({
            status: true,
            data: {
                project_name: project.title,
                published_jobs: publishedJobs,
                approval_notes: approvalNotesCount,
                total_applied: stats.totalApplied,
                shortlisted: stats.shortlisted,
                interviews: stats.interviews,
                approval_candidates: stats.approvalCandidates,
                offer_letter: stats.offerLetter,
                appointment_letter: stats.appointmentLetter,
                hired: stats.hired,
                joined: stats.joined,
                total_designation_status: project.budget_estimate_list.length
            }
        });

    } catch (err) {
        console.error('getProjectStatusCount error:', err);
        return res.status(500).json({
            status: false,
            message: 'Internal server error'
        });
    }
};


module.exports = controller;
