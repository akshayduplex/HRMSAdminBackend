const ApprovalNoteCI = require('../../../models/ApprovalNoteCI.js');
const JobAppliedCandidateCl = require('../../../models/JobAppliedCandidateCl.js');

const { dbObjectId, dbObjectIdValidate } = require('../../../models/dbObject.js');
const EmployeeCI = require('../../../models/EmployeeCI.js');

const dotenv = require("dotenv");
dotenv.config({ path: '../src/config.env' });
const fs = require('fs');

const { dbDateFormat, updateDatesInArray, replaceNullUndefined, lettersOnly, commonOnly } = require('../../../middlewares/myFilters.js');

const { validationResult } = require('express-validator');
const { ApprovalNoteDownloadFormat } = require('../../../helpers/ApprovalNoteDownloadFormat.js');
const { referenceCheckMail } = require('../../../helpers/referenceCheckMail.js');

const controller = {};

controller.getAppraisalNoteById = (req, res) => {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(403).json({ status: false, message: errors.array()[0].msg });
    }

    const { approval_note_doc_id, scope_fields } = req.body;

    const where = {}
    where._id = dbObjectId(approval_note_doc_id);

    const fetchKeys = {}

    if (req.body.hasOwnProperty('scope_fields') && scope_fields.length > 0) {
        scope_fields.forEach(field => {
            fetchKeys[field] = 1;
        });
    } else {
        fetchKeys.__v = 0;
    }


    ApprovalNoteCI.findOne(where, fetchKeys)
        .then((data) => {

            data?.candidate_list.sort((a, b) => {
                const priority = { Selected: 1, Waiting: 2 };
                return priority[a.interview_shortlist_status] - priority[b.interview_shortlist_status];
            });
            return res.status(200).send({ 'status': true, 'data': data, 'message': `API Accessed Successfully` });
        }).catch((error) => {
            return res.status(403).send({ 'status': false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE });
        });

}


/* Create a function that update ceo signature and employee signature in list*/
const updateSignatureOfCEOSirInList = async (list) => {

    const hrConfig = JSON.parse(fs.readFileSync('./src/config/hr_config_file.txt', 'utf8'));

    for (var i = 0; i < list.length; i++) {
        let item = list[i];
        if (item._id && item.panel_members_list.length > 0) {

            item.panel_members_list.forEach((element) => {

                if ((typeof element.signature === 'undefined' || element.signature === '') && element.emp_doc_id === 'NA') {
                    const arrayFilters = { 'arrayFilters': [{ 'one._id': element._id }] }
                    const where = {}
                    where._id = item._id;
                    where['panel_members_list._id'] = element._id;

                    const saveData = {}
                    saveData['panel_members_list.$[one].signature'] = hrConfig?.ceo_digital_signature;

                    ApprovalNoteCI.updateOne(where, { $set: saveData }, arrayFilters)
                        .then((d) => {
                            //console.log( d );
                        });
                }
            });
        }

    }
}


controller.getApprovalNoteFromList = (req, res) => {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(403).json({ status: false, message: errors.array()[0].msg });
    }

    const { job_id, page_no, per_page_record, scope_fields } = req.body;

    const where = {}
    const fetchKeys = {}
    fetchKeys['_id'] = 1;

    if (req.body.hasOwnProperty('job_id') && req.body.job_id !== '') {
        where.job_id = dbObjectId(req.body.job_id);
    }

    if (req.body.hasOwnProperty('status') && req.body.status !== '') {
        where['status'] = { $in: [req.body.status] };
    }

    if (req.body.hasOwnProperty('scope_fields') && scope_fields.length > 0) {
        scope_fields.forEach(field => {
            fetchKeys[field] = 1;
        });
    } else {
        fetchKeys.__v = 0;
    }

    if (req.body.hasOwnProperty('keyword') && req.body.keyword !== '') {
        let searchKeyWord = new RegExp(req.body.keyword);
        where['$or'] = [
            { approval_note_id: { $regex: searchKeyWord, $options: 'i' } },
            { project_name: { $regex: searchKeyWord, $options: 'i' } },
            { job_title: { $regex: searchKeyWord, $options: 'i' } },
            { job_designation: { $regex: searchKeyWord, $options: 'i' } },
            { status: { $regex: searchKeyWord, $options: 'i' } },
            { mpr_offer_type: { $regex: searchKeyWord, $options: 'i' } },
            { mpr_fund_type: { $regex: searchKeyWord, $options: 'i' } }
        ]
    }

    const pageOptions = {
        page: parseInt(((page_no ? page_no : 1) - 1)) || 0,
        limit: parseInt(per_page_record) || 10
    }

    //console.log( where );

    ApprovalNoteCI.find(where, fetchKeys)
        .skip(pageOptions.page * pageOptions.limit)
        .limit(pageOptions.limit)
        .sort({ '_id': -1 })
        .then((data) => {

            if (data.length > 0) {

                /*update signature of ceo sir in list automatically*/
                updateSignatureOfCEOSirInList(data);

                const outPutData = updateDatesInArray(replaceNullUndefined(data), ['add_date', 'updated_on'], 'datetime');
                outPutData.map((item) => {
                    let push = {}
                    item?.candidate_list?.sort((a, b) => {
                        const priority = { Selected: 1, Waiting: 2 };
                        return priority[a.interview_shortlist_status] - priority[b.interview_shortlist_status];
                    });
                    push = item;
                    return push;
                })
                return res.status(200).send({ 'status': true, 'data': outPutData, 'message': 'API Accessed Successfully' });
            } else {
                return res.status(403).send({ 'status': false, 'message': 'No record matched' });
            }
        }).catch((error) => {
            return res.status(403).send({ 'status': false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE });
        });
}

controller.getApprovalNoteFromListCeo = (req, res) => {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(403).json({ status: false, message: errors.array()[0].msg });
    }

    const { job_id, page_no, per_page_record, scope_fields, filter_type } = req.body;

    const where = {}
    const fetchKeys = {}

    if (req.body.hasOwnProperty('job_id') && req.body.job_id !== '') {
        where.job_id = dbObjectId(req.body.job_id);
    }

    if (req.body.hasOwnProperty('scope_fields') && scope_fields.length > 0) {
        scope_fields.forEach(field => {
            fetchKeys[field] = 1;
        });
    } else {
        fetchKeys.__v = 0;
    }

    if (!req.body.hasOwnProperty('filter_type')) {
        return res.status(403).json({ status: false, message: 'Filter value is missing' });
    }

    if (req.body.hasOwnProperty('keyword') && req.body.keyword !== '') {
        let searchKeyWord = new RegExp(req.body.keyword);
        where['$or'] = [
            { mpr_offer_type: { $regex: searchKeyWord, $options: 'i' } },
            { project_name: { $regex: searchKeyWord, $options: 'i' } },
            { job_title: { $regex: searchKeyWord, $options: 'i' } },
            { job_designation: { $regex: searchKeyWord, $options: 'i' } },
            { mpr_fund_type: { $regex: searchKeyWord, $options: 'i' } },
            { approval_note_id: { $regex: searchKeyWord, $options: 'i' } },
            { status: { $regex: searchKeyWord, $options: 'i' } }
        ]
    }


    if (req.body.hasOwnProperty('filter_type') && req.body.filter_type !== '' && ['PendingByCeo', 'ApprovedByCeo', ''].includes(req.body.filter_type)) {
        if (req.body.filter_type === 'ApprovedByCeo') {
            where['status'] = 'Completed';
            where['panel_members_list'] = {
                $elemMatch: {
                    approval_status: "Approved",
                    designation: "CEO"
                }
            }
        }
        else if (req.body.filter_type === 'PendingByCeo') {
            where['status'] = 'Inprogress';
            where['panel_members_list'] = {
                $elemMatch: {
                    approval_status: "Pending",
                    designation: "CEO"
                }
            }
        }
        else if (req.body.filter_type === 'listByCeo') {

        }
    }


    const pageOptions = {
        page: parseInt(((page_no ? page_no : 1) - 1)) || 0,
        limit: parseInt(per_page_record) || 10
    }


    ApprovalNoteCI.find(where, fetchKeys)
        .skip(pageOptions.page * pageOptions.limit)
        .limit(pageOptions.limit)
        .sort({ '_id': 1 })
        .then((data) => {

            if (data.length > 0) {

                const outPutData = updateDatesInArray(replaceNullUndefined(data), ['add_date', 'updated_on'], 'datetime');
                outPutData.map((item) => {
                    let push = {}
                    item?.candidate_list?.sort((a, b) => {
                        const priority = { Selected: 1, Waiting: 2 };
                        return priority[a.interview_shortlist_status] - priority[b.interview_shortlist_status];
                    });
                    push = item;
                    return push;
                })
                return res.status(200).send({ 'status': true, 'data': outPutData, 'message': 'API Accessed Successfully' });
            } else {
                return res.status(403).send({ 'status': false, 'message': 'No record matched' });
            }
        }).catch((error) => {
            return res.status(403).send({ 'status': false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE });
        });
}

controller.getApprovalNoteFromListHod = (req, res) => {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(403).json({ status: false, message: errors.array()[0].msg });
    }


    const { job_id, page_no, per_page_record, scope_fields, filter_type, employee_id } = req.body;

    const where = {}
    const fetchKeys = {}

    if (req.body.hasOwnProperty('job_id') && req.body.job_id !== '') {
        where.job_id = dbObjectId(req.body.job_id);
    }

    if (req.body.hasOwnProperty('scope_fields') && scope_fields.length > 0) {
        scope_fields.forEach(field => {
            fetchKeys[field] = 1;
        });
    } else {
        fetchKeys.__v = 0;
    }

    if (!req.body.hasOwnProperty('filter_type')) {
        return res.status(403).json({ status: false, message: 'Filter value is missing' });
    }

    if (req.body.hasOwnProperty('keyword') && req.body.keyword !== '') {
        let searchKeyWord = new RegExp(req.body.keyword);
        where['$or'] = [
            { mpr_offer_type: { $regex: searchKeyWord, $options: 'i' } },
            { project_name: { $regex: searchKeyWord, $options: 'i' } },
            { job_title: { $regex: searchKeyWord, $options: 'i' } },
            { job_designation: { $regex: searchKeyWord, $options: 'i' } },
            { mpr_fund_type: { $regex: searchKeyWord, $options: 'i' } },
            { approval_note_id: { $regex: searchKeyWord, $options: 'i' } },
            { status: { $regex: searchKeyWord, $options: 'i' } }
        ]
    }


    if (req.body.hasOwnProperty('filter_type') && req.body.filter_type !== '' && ['ApprovedByHod', 'PendingByHod', 'listByHod', ''].includes(req.body.filter_type)) {
        if (req.body.filter_type === 'ApprovedByHod') {
            where['status'] = 'Completed';
            where['panel_members_list'] = {
                $elemMatch: {
                    approval_status: "Approved",
                    emp_doc_id: employee_id
                }
            }
        }
        else if (req.body.filter_type === 'PendingByHod') {
            where['status'] = 'Inprogress';
            where['panel_members_list'] = {
                $elemMatch: {
                    approval_status: "Pending",
                    emp_doc_id: employee_id
                }
            }
        }
        else if (req.body.filter_type === 'listByHod') {
            where['panel_members_list'] = {
                $elemMatch: {
                    emp_doc_id: employee_id
                }
            }
        }
    }


    const pageOptions = {
        page: parseInt(((page_no ? page_no : 1) - 1)) || 0,
        limit: parseInt(per_page_record) || 10
    }


    ApprovalNoteCI.find(where, fetchKeys)
        .skip(pageOptions.page * pageOptions.limit)
        .limit(pageOptions.limit)
        .sort({ '_id': 1 })
        .then((data) => {

            if (data.length > 0) {

                const outPutData = updateDatesInArray(replaceNullUndefined(data), ['add_date', 'updated_on'], 'datetime');
                outPutData.map((item) => {
                    let push = {}
                    item?.candidate_list?.sort((a, b) => {
                        const priority = { Selected: 1, Waiting: 2 };
                        return priority[a.interview_shortlist_status] - priority[b.interview_shortlist_status];
                    });
                    push = item;
                    return push;
                })
                return res.status(200).send({ 'status': true, 'data': outPutData, 'message': 'API Accessed Successfully' });
            } else {
                return res.status(403).send({ 'status': false, 'message': 'No record matched' });
            }
        }).catch((error) => {
            return res.status(403).send({ 'status': false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE });
        });
}


controller.getPendingCandidateApprovalNotesListForCeo = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(403).json({ status: false, message: errors.array()[0].msg });
        }

        const { job_id, page_no, per_page_record, filter_type, keyword } = req.body;
        const where = {};

        // 🔹 Job filter
        if (job_id && job_id !== '') {
            where.job_id = dbObjectId(job_id);
        }

        // 🔹 Keyword search
        if (keyword && keyword.trim() !== '') {
            const regex = new RegExp(keyword, 'i');
            where.$or = [
                { mpr_offer_type: regex },
                { project_name: regex },
                { job_title: regex },
                { job_designation: regex },
                { mpr_fund_type: regex },
                { approval_note_id: regex },
                { status: regex },
                { 'candidate_list.name': regex }
            ];
        }

        // 🔹 Filter type
        if (!filter_type) {
            return res.status(403).json({ status: false, message: 'Filter value is missing' });
        }

        if (filter_type === 'ApprovedByCeo') {
            where.status = 'Completed';
            where['panel_members_list'] = {
                $elemMatch: { approval_status: 'Approved', designation: 'CEO' }
            };
        } else if (filter_type === 'PendingByCeo') {
            where.status = 'Inprogress';
            where['panel_members_list'] = {
                $elemMatch: { approval_status: 'Pending', designation: 'CEO' }
            };
        }

        // 🔹 Pagination
        const page = parseInt(page_no) > 0 ? parseInt(page_no) - 1 : 0;
        const limit = parseInt(per_page_record) || 10;
        const skip = page * limit;

        // Aggregation pipeline
        const pipeline = [
            { $unwind: "$candidate_list" },
            { $match: where },
            { $sort: { _id: 1 } },
            { $skip: skip },
            { $limit: limit },
            {
                $project: {
                    _id: 1,
                    project_name: 1,
                    project_id: 1,
                    job_title: 1,
                    job_designation: 1,
                    mpr_offer_type: 1,
                    mpr_fund_type: 1,
                    approval_note_id: 1,
                    status: 1,
                    cand_doc_id: "$candidate_list.cand_doc_id",
                    candidate_name: "$candidate_list.name",
                    candidate_email: "$candidate_list.email",
                    proposed_location: "$candidate_list.proposed_location",
                    proposed_location_id: "$candidate_list.proposed_location_id",
                    payment_type: "$candidate_list.payment_type",
                    job_type: "$candidate_list.job_type",
                    onboarding_date: "$candidate_list.onboarding_date",
                    job_valid_date: "$candidate_list.job_valid_date",
                    offer_ctc: "$candidate_list.offer_ctc",
                    panel_members_list: "$panel_members_list",
                    interviewer_list: "$interviewer_list",
                    approval_history: "$candidate_list.approval_history",
                    interview_shortlist_status: "$candidate_list.interview_shortlist_status",
                    applied_from: "$candidate_list.applied_from",
                    interview_type: "$candidate_list.interview_type",
                    approval_date: "$candidate_list.approval_date"
                }
            }
        ];

        const data = await ApprovalNoteCI.aggregate(pipeline);

        if (!data.length) {
            return res.status(403).json({ status: false, message: 'No record matched' });
        }

        // 🔹 Post-processing
        const outPutData = updateDatesInArray(
            replaceNullUndefined(data),
            ['add_date', 'updated_on'],
            'datetime'
        );

        return res.status(200).json({
            status: true,
            data: outPutData,
            message: 'API Accessed Successfully'
        });

    } catch (error) {
        console.error(error);
        return res.status(403).json({
            status: false,
            message: error.message || process.env.DEFAULT_ERROR_MESSAGE
        });
    }
};


controller.getPendingCandidateApprovalNotesListForHod = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(403).json({ status: false, message: errors.array()[0].msg });
        }

        const { job_id, page_no, per_page_record, filter_type, keyword, employee_id } = req.body;
        const where = {};

        // 🔹 Job filter
        if (job_id && job_id !== '') {
            where.job_id = dbObjectId(job_id);
        }

        // 🔹 Keyword search
        if (keyword && keyword.trim() !== '') {
            const regex = new RegExp(keyword, 'i');
            where.$or = [
                { mpr_offer_type: regex },
                { project_name: regex },
                { job_title: regex },
                { job_designation: regex },
                { mpr_fund_type: regex },
                { approval_note_id: regex },
                { status: regex },
                { 'candidate_list.name': regex }
            ];
        }

        // 🔹 Filter type
        if (!filter_type) {
            return res.status(403).json({ status: false, message: 'Filter value is missing' });
        }

        if (filter_type === 'ApprovedByHod') {
            where.status = 'Completed';
            where['panel_members_list'] = {
                $elemMatch: { approval_status: 'Approved', emp_doc_id: employee_id }
            };
        } else if (filter_type === 'PendingByHod') {
            where.status = 'Inprogress';
            where['panel_members_list'] = {
                $elemMatch: { approval_status: 'Pending', emp_doc_id: employee_id }
            };
        }

        // 🔹 Pagination
        const page = parseInt(page_no) > 0 ? parseInt(page_no) - 1 : 0;
        const limit = parseInt(per_page_record) || 10;
        const skip = page * limit;


        // Aggregation pipeline
        const pipeline = [
            { $unwind: "$candidate_list" },
            { $match: where },
            { $sort: { _id: 1 } },
            { $skip: skip },
            { $limit: limit },
            {
                $project: {
                    _id: 1,
                    project_name: 1,
                    project_id: 1,
                    job_title: 1,
                    job_designation: 1,
                    mpr_offer_type: 1,
                    mpr_fund_type: 1,
                    approval_note_id: 1,
                    status: 1,
                    cand_doc_id: "$candidate_list.cand_doc_id",
                    candidate_name: "$candidate_list.name",
                    candidate_email: "$candidate_list.email",
                    proposed_location: "$candidate_list.proposed_location",
                    proposed_location_id: "$candidate_list.proposed_location_id",
                    payment_type: "$candidate_list.payment_type",
                    job_type: "$candidate_list.job_type",
                    onboarding_date: "$candidate_list.onboarding_date",
                    job_valid_date: "$candidate_list.job_valid_date",
                    offer_ctc: "$candidate_list.offer_ctc",
                    panel_members_list: "$panel_members_list",
                    interviewer_list: "$interviewer_list",
                    approval_history: "$candidate_list.approval_history",
                    interview_shortlist_status: "$candidate_list.interview_shortlist_status",
                    applied_from: "$candidate_list.applied_from",
                    interview_type: "$candidate_list.interview_type",
                    approval_date: "$candidate_list.approval_date",
                    candidate_list: ["$candidate_list"]
                }
            }
        ];

        const data = await ApprovalNoteCI.aggregate(pipeline);

        if (!data.length) {
            return res.status(403).json({ status: false, message: 'No record matched' });
        }

        // 🔹 Post-processing
        const outPutData = updateDatesInArray(
            replaceNullUndefined(data),
            ['add_date', 'updated_on'],
            'datetime'
        );

        return res.status(200).json({
            status: true,
            data: outPutData,
            message: 'API Accessed Successfully'
        });

    } catch (error) {
        console.error(error);
        return res.status(403).json({
            status: false,
            message: error.message || process.env.DEFAULT_ERROR_MESSAGE
        });
    }
};



controller.downloadApprovalNote = (req, res) => {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(403).json({ status: false, message: errors.array()[0].msg });
    }

    const { approval_note_doc_id } = req.body;

    // var approval_note_doc_id = '6773b875c8c374072c2132e5';

    const where = {}
    where._id = dbObjectId(approval_note_doc_id);

    ApprovalNoteCI.findOne(where)
        .then((data) => {

            const html = ApprovalNoteDownloadFormat(data);
            //return res.status(200).send( {'status':true, 'data' : JSON.stringify(html), 'message': `API Accessed Successfully`} );
            return res.status(200).send(html);
        }).catch((error) => {
            console.log(error);
            return res.status(403).send('error');
        });

}

controller.deleteApprovalNoteById = (req, res) => {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(403).json({ status: false, message: errors.array()[0].msg });
    }

    const { approval_note_doc_id, approval_note_id } = req.body;

    const where = {}
    where._id = dbObjectId(approval_note_doc_id);
    where.approval_note_id = approval_note_id;
    where['status'] = 'Inprogress';

    ApprovalNoteCI.deleteOne(where)
        .then((data) => {
            return res.status(200).send({ 'status': true, 'message': `Approval Note Removed Successfully` });
        }).catch((error) => {
            return res.status(403).send({ 'status': false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE });
        });

}


controller.removeCandidateFromApprovalNoteById = (req, res) => {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(403).json({ status: false, message: errors.array()[0].msg });
    }

    const { approval_note_doc_id, approval_note_id, candidate_doc_id } = req.body;

    const where = {}
    where._id = dbObjectId(approval_note_doc_id);
    where.approval_note_id = approval_note_id;
    where['status'] = 'Inprogress';

    ApprovalNoteCI.findOne(where)
        .then((noteData) => {

            if (noteData) {
                const findCandidate = noteData.candidate_list.find((item) => item.cand_doc_id.toString() === candidate_doc_id.toString());
                if (findCandidate) {

                    const countCandidate = parseInt(noteData.no_of_candidates) - 1;

                    ApprovalNoteCI.updateOne(where, { $set: { 'no_of_candidates': countCandidate }, $pull: { candidate_list: { _id: findCandidate._id } } })
                        .then((upData) => {
                            return res.status(200).send({ 'status': true, 'message': `Candidate Removed Successfully` });
                        }).catch((error) => {
                            console.log(error);
                            return res.status(403).send({ 'status': false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE });
                        });
                } else {
                    return res.status(403).send({ 'status': false, 'message': `Candidate not found` });
                }
            } else {
                return res.status(403).send({ 'status': false, 'message': `No record found` });
            }
        }).catch((error) => {
            console.log(error);
            return res.status(403).send({ 'status': false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE });
        });

}


controller.getCountRecordsForApprovalNote = async (req, res) => {

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

    const totalRecords = await ApprovalNoteCI.countDocuments(where);

    return res.status(200).json({ status: true, data: totalRecords, 'message': 'API Accessed Successfully' });
}


controller.getApprovalNoteFromListForEmployee = (req, res) => {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(403).json({ status: false, message: errors.array()[0].msg });
    }


    if (!req.body.hasOwnProperty('employee_id')) {
        return res.status(403).send({ 'status': false, 'message': 'Employee ID is Missing' });
    }
    else if (req.body.employee_id === '') {
        return res.status(403).send({ 'status': false, 'message': 'Employee ID is Blank' });
    }
    if (!req.body.hasOwnProperty('status')) {
        return res.status(403).send({ 'status': false, 'message': 'Status is Missing' });
    }
    else if (req.body.status === '') {
        return res.status(403).send({ 'status': false, 'message': 'Status is Blank' });
    }
    else if (!['Pending', 'Approved'].includes(req.body.status)) {
        return res.status(403).send({ 'status': false, 'message': 'Status is Invalid, pass only Pending, Approved' });
    }


    const { page_no, per_page_record, scope_fields, employee_id } = req.body;

    const where = {}
    const fetchKeys = {}
    fetchKeys['_id'] = 1;

    /*Apply employee ID*/
    where['panel_members_list.emp_doc_id'] = employee_id;

    if (req.body.hasOwnProperty('job_id') && req.body.job_id !== '') {
        where.job_id = dbObjectId(req.body.job_id);
    }

    if (req.body.hasOwnProperty('project_id') && req.body.project_id !== '') {
        where.project_id = dbObjectId(req.body.project_id);
    }

    if (req.body.hasOwnProperty('status') && req.body.status !== '') {
        where['panel_members_list'] = { $elemMatch: { emp_doc_id: employee_id, approval_status: { $in: [req.body.status] } } };
    }

    if (req.body.hasOwnProperty('scope_fields') && scope_fields.length > 0) {
        scope_fields.forEach(field => {
            fetchKeys[field] = 1;
        });
    } else {
        fetchKeys.__v = 0;
    }


    if (req.body.hasOwnProperty('keyword') && req.body.keyword !== '') {
        let searchKeyWord = new RegExp(req.body.keyword);
        where['$or'] = [
            { approval_note_id: { $regex: searchKeyWord, $options: 'i' } },
            { project_name: { $regex: searchKeyWord, $options: 'i' } },
            { job_title: { $regex: searchKeyWord, $options: 'i' } },
            { job_designation: { $regex: searchKeyWord, $options: 'i' } },
            { mpr_offer_type: { $regex: searchKeyWord, $options: 'i' } },
            { mpr_fund_type: { $regex: searchKeyWord, $options: 'i' } }
        ]
    }

    const pageOptions = {
        page: parseInt(((page_no ? page_no : 1) - 1)) || 0,
        limit: parseInt(per_page_record) || 10
    }

    ApprovalNoteCI.find(where, fetchKeys)
        .skip(pageOptions.page * pageOptions.limit)
        .limit(pageOptions.limit)
        .sort({ '_id': -1 })
        .then((data) => {

            if (data.length > 0) {

                const outPutData = updateDatesInArray(replaceNullUndefined(data), ['add_date', 'updated_on'], 'datetime');
                outPutData.map((item) => {
                    let push = {}
                    item?.candidate_list?.sort((a, b) => {
                        const priority = { Selected: 1, Waiting: 2 };
                        return priority[a.interview_shortlist_status] - priority[b.interview_shortlist_status];
                    });
                    push = item;
                    return push;
                })
                return res.status(200).send({ 'status': true, 'data': outPutData, 'message': 'API Accessed Successfully' });
            } else {
                return res.status(403).send({ 'status': false, 'message': 'No record matched' });
            }
        }).catch((error) => {
            return res.status(403).send({ 'status': false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE });
        });
}


/*update approval note Progress data in document*/
var updateProgressDataInApprovalNote = async (approval_note_doc_id, candidate_id, progressData) => {
    /*********Get Approval Note Data*****/
    var ApprovalNoteData = await ApprovalNoteCI.findOne({ _id: dbObjectId(approval_note_doc_id) });
    if (!ApprovalNoteData) {
        return false;
    }

    const JobId = ApprovalNoteData?.job_id;
    const ProjectId = ApprovalNoteData?.project_id;

    /*********Check in approval Note***********/
    const checkCandidateInApprovalNote = ApprovalNoteData?.candidate_list?.find((item) => item?.cand_doc_id?.toString() === candidate_id);

    /*********** Update in Approval Note*********/
    if (checkCandidateInApprovalNote) {
        const filterCondition = []
        filterCondition.push({ 'one._id': checkCandidateInApprovalNote._id });

        const arrayFilters = { 'arrayFilters': filterCondition }

        const where = {}
        where._id = dbObjectId(approval_note_doc_id);
        where['candidate_list._id'] = checkCandidateInApprovalNote._id;

        const saveData = {}
        saveData['$push'] = { 'candidate_list.$[one].progress_data': progressData }

        await ApprovalNoteCI.updateOne({ _id: dbObjectId(approval_note_doc_id) }, saveData, arrayFilters);
    }
    return true;
}

controller.updateReferenceCheckInApprovalNote = async (req, res) => {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(403).json({ status: false, message: errors.array()[0].msg });
    }

    const { name, designation, mobile, email, referenceStatus, candidate_id, approval_note_doc_id, add_by_name, add_by_mobile, add_by_designation, add_by_email } = req.body;
    console.log(req.body);
    try {

        /*********Get Candidate Data*****/
        var CandidateData = await JobAppliedCandidateCl.findOne({ _id: dbObjectId(candidate_id) });
        if (!CandidateData) {
            return res.status(403).json({ status: false, message: 'Candidate Not Found' });
        }

        /*********Get Approval Note Data*****/
        var ApprovalNoteData = await ApprovalNoteCI.findOne({ _id: dbObjectId(approval_note_doc_id) });
        if (!ApprovalNoteData) {
            return res.status(403).json({ status: false, message: 'Approval Note Not Found' });
        }

        const JobId = ApprovalNoteData?.job_id;
        const ProjectId = ApprovalNoteData?.project_id;
        const Approval_Note_Id = ApprovalNoteData?.approval_note_id;
        /******* Find Reference Data from Candidate Applied Jobs *******/
        const findAppliedJob = CandidateData?.applied_jobs?.find((item) => item?.job_id?.toString() === JobId?.toString() && item?.project_id?.toString() === ProjectId?.toString());
        const checkReferenceDataInAppliedJob = findAppliedJob?.reference_check?.find((item) => item?.referenceStatus === referenceStatus);
        //console.log( checkReferenceDataInAppliedJob );

        /*********Check in approval Note***********/
        const checkCandidateInApprovalNote = ApprovalNoteData?.candidate_list?.find((item) => item?.cand_doc_id?.toString() === candidate_id);
        //console.log( checkCandidateInApprovalNote );
        const checkReferenceDataInApprovalNote = checkCandidateInApprovalNote?.reference_check?.find((item) => item?.referenceStatus === referenceStatus);
        //console.log( checkReferenceDataInApprovalNote );

        /*check reference check data in applied job object*/
        const createPayload = {}
        createPayload.referenceStatus = referenceStatus;
        createPayload.name = name;
        createPayload.mobile = mobile;
        createPayload.email = email;
        createPayload.designation = designation;
        createPayload.add_date = dbDateFormat();

        /*********** Update in Approval Note*********/
        const filterCondition = []
        filterCondition.push({ 'one._id': checkCandidateInApprovalNote._id });
        if (checkReferenceDataInApprovalNote) {
            filterCondition.push({ 'two._id': checkReferenceDataInApprovalNote._id });
        }

        const arrayFilters = { 'arrayFilters': filterCondition }

        const where = {}
        where._id = dbObjectId(approval_note_doc_id);
        where['candidate_list._id'] = checkCandidateInApprovalNote._id;

        const saveData = {}
        if (!checkReferenceDataInApprovalNote) {
            saveData['$push'] = { 'candidate_list.$[one].reference_check': createPayload }
        }
        else {
            const collectUpdateData = {}
            collectUpdateData['candidate_list.$[one].reference_check.$[two].referenceStatus'] = referenceStatus;
            collectUpdateData['candidate_list.$[one].reference_check.$[two].name'] = name;
            collectUpdateData['candidate_list.$[one].reference_check.$[two].mobile'] = mobile;
            collectUpdateData['candidate_list.$[one].reference_check.$[two].email'] = email;
            collectUpdateData['candidate_list.$[one].reference_check.$[two].designation'] = designation;
            collectUpdateData['candidate_list.$[one].reference_check.$[two].add_date'] = dbDateFormat();
            saveData['$set'] = collectUpdateData;
        }


        const updateInApproval = await ApprovalNoteCI.updateOne({ _id: dbObjectId(approval_note_doc_id) }, saveData, arrayFilters);

        /*Add Progress data in Approval note*/
        const progressData = {}
        progressData.title = `Reference Check (${referenceStatus})`;
        progressData.activity = 'Mail sent to reference person for verification';
        progressData.add_by_name = add_by_name;
        progressData.add_by_mobile = add_by_mobile;
        progressData.add_by_email = add_by_email;
        progressData.add_by_designation = add_by_designation;
        progressData.add_date = dbDateFormat();
        progressData.status = 'Verification Pending';

        await updateProgressDataInApprovalNote(approval_note_doc_id, candidate_id, progressData);


        //console.log( updateInApproval );

        /*********** Update In Candidate Profile In Applied Jobs *********/
        const filterConditionInAppliedJob = [];
        filterConditionInAppliedJob.push({ 'one._id': findAppliedJob._id });
        if (checkReferenceDataInAppliedJob) {
            filterConditionInAppliedJob.push({ 'two._id': checkReferenceDataInAppliedJob._id });
        }

        const arrayFiltersAppliedJob = { 'arrayFilters': filterConditionInAppliedJob }

        const whereAppliedJob = {}
        whereAppliedJob._id = dbObjectId(candidate_id);
        whereAppliedJob['applied_jobs._id'] = findAppliedJob._id;

        const saveDataAppliedJob = {}
        if (!checkReferenceDataInAppliedJob) {
            saveDataAppliedJob['$push'] = { 'applied_jobs.$[one].reference_check': createPayload }
            /*update approval note data in applied jobs list*/
            if (findAppliedJob?.approval_note_data && typeof findAppliedJob.approval_note_data === "object" && Object.keys(findAppliedJob.approval_note_data).length <= 2) {
                const collectUpdateData = {}
                collectUpdateData['applied_jobs.$[one].approval_note_data.doc_id'] = dbObjectId(approval_note_doc_id);
                collectUpdateData['applied_jobs.$[one].approval_note_data.note_id'] = Approval_Note_Id;
                saveDataAppliedJob['$set'] = collectUpdateData;
            }
        }
        else {
            var collectUpdateData = {}
            collectUpdateData['applied_jobs.$[one].reference_check.$[two].referenceStatus'] = referenceStatus;
            collectUpdateData['applied_jobs.$[one].reference_check.$[two].name'] = name;
            collectUpdateData['applied_jobs.$[one].reference_check.$[two].mobile'] = mobile;
            collectUpdateData['applied_jobs.$[one].reference_check.$[two].email'] = email;
            collectUpdateData['applied_jobs.$[one].reference_check.$[two].designation'] = designation;
            collectUpdateData['applied_jobs.$[one].reference_check.$[two].add_date'] = dbDateFormat();
            /*update approval note data in applied jobs list*/
            if (findAppliedJob?.approval_note_data && typeof findAppliedJob.approval_note_data === "object" && Object.keys(findAppliedJob.approval_note_data).length <= 2) {
                collectUpdateData['applied_jobs.$[one].approval_note_data.doc_id'] = dbObjectId(approval_note_doc_id);
                collectUpdateData['applied_jobs.$[one].approval_note_data.note_id'] = Approval_Note_Id;
            }
            saveDataAppliedJob['$set'] = collectUpdateData;
        }

        const update = await JobAppliedCandidateCl.updateOne(whereAppliedJob, saveDataAppliedJob, arrayFiltersAppliedJob);

        const mailRegards = {}
        mailRegards.name = add_by_name || '';
        mailRegards.email = add_by_email || '';
        mailRegards.mobile = add_by_mobile || '';
        mailRegards.designation = add_by_designation || '';

        /*send mail to reference Person*/
        referenceCheckMail(email, name, ApprovalNoteData?.job_designation, ApprovalNoteData?._id?.toString(), candidate_id, findAppliedJob?._id?.toString(), referenceStatus, mailRegards);

        return res.status(200).json({ status: true, 'message': 'Reference Data Updated Successfully' });
    }
    catch (error) {
        console.log(error);
        return res.status(403).send({ 'status': false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE });
    }
}

controller.updateReferenceCheckDataByLink = async (req, res) => {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(403).json({ status: false, message: errors.array()[0].msg });
    }

    const { email, verification_mode, performance_remark, give_opportunity_reason, referenceStatus, know_him, capacity, after_know_organization, from, leave_reason, responsibilities, performance, excelled_work, give_opportunity, comments, candidate_doc_id, approval_note_doc_id, applied_job_doc_id } = req.body;

    try {

        /*********Get Candidate Data*****/
        var CandidateData = await JobAppliedCandidateCl.findOne({ _id: dbObjectId(candidate_doc_id) });
        if (!CandidateData) {
            return res.status(403).json({ status: false, message: 'Candidate Not Found' });
        }

        /*********Get Approval Note Data*****/
        var ApprovalNoteData = await ApprovalNoteCI.findOne({ _id: dbObjectId(approval_note_doc_id) });
        if (!ApprovalNoteData) {
            return res.status(403).json({ status: false, message: 'Approval Note Not Found' });
        }

        const JobId = ApprovalNoteData?.job_id;
        const ProjectId = ApprovalNoteData?.project_id;
        /******* Find Reference Data from Candidate Applied Jobs *******/
        const findAppliedJob = CandidateData?.applied_jobs?.find((item) => item?.job_id?.toString() === JobId?.toString() && item?.project_id?.toString() === ProjectId?.toString());
        const checkReferenceDataInAppliedJob = findAppliedJob?.reference_check?.find((item) => item?.referenceStatus === referenceStatus);
        //console.log( checkReferenceDataInAppliedJob );

        /*********Check in approval Note***********/
        const checkCandidateInApprovalNote = ApprovalNoteData?.candidate_list?.find((item) => item?.cand_doc_id?.toString() === candidate_doc_id);
        //console.log( checkCandidateInApprovalNote );
        const checkReferenceDataInApprovalNote = checkCandidateInApprovalNote?.reference_check?.find((item) => item?.referenceStatus === referenceStatus);
        //console.log( checkReferenceDataInApprovalNote );

        if (!checkReferenceDataInApprovalNote) {
            return res.status(403).json({ status: false, message: 'No Data Found' });
        }

        /*********** Update in Approval Note*********/
        const filterCondition = [];
        filterCondition.push({ 'one._id': checkCandidateInApprovalNote._id });
        filterCondition.push({ 'two._id': checkReferenceDataInApprovalNote._id });

        const arrayFilters = { 'arrayFilters': filterCondition }

        const where = {}
        where._id = dbObjectId(approval_note_doc_id);
        where['candidate_list._id'] = checkCandidateInApprovalNote._id;

        const collectVerifyData = {}
        collectVerifyData.know_him = know_him;
        collectVerifyData.capacity = capacity;
        collectVerifyData.after_know_organization = after_know_organization;
        collectVerifyData.from = from;
        collectVerifyData.leave_reason = leave_reason;
        collectVerifyData.responsibilities = responsibilities;
        collectVerifyData.performance = performance;
        collectVerifyData.excelled_work = excelled_work;
        collectVerifyData.give_opportunity = give_opportunity;
        collectVerifyData.comments = comments;
        collectVerifyData.performance_remark = performance_remark;
        collectVerifyData.give_opportunity_reason = give_opportunity_reason;
        collectVerifyData.validate_on = dbDateFormat();

        const collectUpdateData = {}
        collectUpdateData['candidate_list.$[one].reference_check.$[two].verification_mode'] = verification_mode;
        collectUpdateData['candidate_list.$[one].reference_check.$[two].verification_status'] = 'Complete';
        collectUpdateData['candidate_list.$[one].reference_check.$[two].verification_data'] = collectVerifyData;

        const saveData = {}
        saveData['$set'] = collectUpdateData;

        await ApprovalNoteCI.updateOne({ _id: dbObjectId(approval_note_doc_id) }, saveData, arrayFilters);


        /*Add Progress data in Approval Note*/
        const progressData = {}
        progressData.title = `Reference Check (${referenceStatus})`;
        progressData.activity = 'Reference form filled by reference person';
        progressData.add_by_name = checkReferenceDataInApprovalNote?.name || '';
        progressData.add_by_mobile = checkReferenceDataInApprovalNote?.mobile || '';
        progressData.add_by_email = checkReferenceDataInApprovalNote?.email || '';
        progressData.add_by_designation = checkReferenceDataInApprovalNote?.designation || '';
        progressData.add_date = dbDateFormat();
        progressData.status = 'Verification Completed';

        await updateProgressDataInApprovalNote(approval_note_doc_id, candidate_doc_id, progressData);

        return res.status(200).json({ status: true, 'message': 'Reference Data Updated Successfully' });
    }
    catch (error) {
        console.log(error);
        return res.status(403).send({ 'status': false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE });
    }
}


controller.updateReferenceCheckFromAdmin = async (req, res) => {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(403).json({ status: false, message: errors.array()[0].msg });
    }

    const { contact_person_name, contact_person_mobile, email, designation, verification_mode, performance_remark, give_opportunity_reason, referenceStatus, know_him, capacity, after_know_organization, from, leave_reason, responsibilities, performance, excelled_work, give_opportunity, comments, candidate_doc_id, approval_note_doc_id, applied_job_doc_id, add_by_name, add_by_mobile, add_by_designation, add_by_email, added_by_id } = req.body;

    try {

        /*********Get Candidate Data*****/
        var CandidateData = await JobAppliedCandidateCl.findOne({ _id: dbObjectId(candidate_doc_id) });
        if (!CandidateData) {
            return res.status(403).json({ status: false, message: 'Candidate Not Found' });
        }

        /*********Get Approval Note Data*****/
        var ApprovalNoteData = await ApprovalNoteCI.findOne({ _id: dbObjectId(approval_note_doc_id) });
        if (!ApprovalNoteData) {
            return res.status(403).json({ status: false, message: 'Approval Note Not Found' });
        }

        const JobId = ApprovalNoteData?.job_id;
        const ProjectId = ApprovalNoteData?.project_id;
        /******* Find Reference Data from Candidate Applied Jobs *******/
        const findAppliedJob = CandidateData?.applied_jobs?.find((item) => item?.job_id?.toString() === JobId?.toString() && item?.project_id?.toString() === ProjectId?.toString());
        const checkReferenceDataInAppliedJob = findAppliedJob?.reference_check?.find((item) => item?.referenceStatus === referenceStatus);
        //console.log( checkReferenceDataInAppliedJob );

        /*********Check in approval Note***********/
        const checkCandidateInApprovalNote = ApprovalNoteData?.candidate_list?.find((item) => item?.cand_doc_id?.toString() === candidate_doc_id);
        //console.log( checkCandidateInApprovalNote );
        const checkReferenceDataInApprovalNote = checkCandidateInApprovalNote?.reference_check?.find((item) => item?.referenceStatus === referenceStatus);
        //console.log( checkReferenceDataInApprovalNote );  

        /*********** Update in Approval Note*********/

        const collectVerifyData = {}
        collectVerifyData.know_him = know_him;
        collectVerifyData.capacity = capacity;
        collectVerifyData.after_know_organization = after_know_organization;
        collectVerifyData.from = from;
        collectVerifyData.leave_reason = leave_reason;
        collectVerifyData.responsibilities = responsibilities;
        collectVerifyData.performance = performance;
        collectVerifyData.excelled_work = excelled_work;
        collectVerifyData.give_opportunity = give_opportunity;
        collectVerifyData.comments = comments;
        collectVerifyData.performance_remark = performance_remark;
        collectVerifyData.give_opportunity_reason = give_opportunity_reason;
        collectVerifyData.validate_on = dbDateFormat();


        const filterCondition = [];
        filterCondition.push({ 'one._id': checkCandidateInApprovalNote._id });
        if (checkReferenceDataInApprovalNote) {
            filterCondition.push({ 'two._id': checkReferenceDataInApprovalNote._id });
        }


        const arrayFilters = { 'arrayFilters': filterCondition }

        const saveData = {}

        const where = {}
        where._id = dbObjectId(approval_note_doc_id);
        where['candidate_list._id'] = checkCandidateInApprovalNote._id;


        if (!checkReferenceDataInApprovalNote) {

            const createPayload = {}
            createPayload.referenceStatus = referenceStatus;
            createPayload.name = contact_person_name;
            createPayload.mobile = contact_person_mobile;
            createPayload.email = email || '';
            createPayload.designation = designation || '';
            createPayload.add_date = dbDateFormat();
            createPayload.verification_mode = verification_mode || '';
            createPayload.verification_status = 'Complete';
            createPayload.verification_data = collectVerifyData;

            saveData['$set'] = { 'candidate_list.$[one].verification_skipped_status': referenceStatus }
            saveData['$push'] = { 'candidate_list.$[one].reference_check': createPayload }

        }
        else {

            const collectUpdateData = {}
            collectUpdateData['candidate_list.$[one].reference_check.$[two].referenceStatus'] = referenceStatus;
            collectUpdateData['candidate_list.$[one].reference_check.$[two].name'] = contact_person_name;
            collectUpdateData['candidate_list.$[one].reference_check.$[two].mobile'] = contact_person_mobile;
            collectUpdateData['candidate_list.$[one].reference_check.$[two].email'] = email || '';
            collectUpdateData['candidate_list.$[one].reference_check.$[two].designation'] = designation || '';
            collectUpdateData['candidate_list.$[one].reference_check.$[two].verification_mode'] = verification_mode;
            collectUpdateData['candidate_list.$[one].reference_check.$[two].verification_status'] = 'Complete';
            collectUpdateData['candidate_list.$[one].reference_check.$[two].verification_data'] = collectVerifyData;

            saveData['$set'] = collectUpdateData;

        }

        await ApprovalNoteCI.updateOne({ _id: dbObjectId(approval_note_doc_id) }, saveData, arrayFilters);


        /*Add Progress data in Approval note*/
        const progressData = {}
        progressData.title = `Reference Check (${referenceStatus})`;
        progressData.activity = 'Verification Completed';
        progressData.add_by_name = add_by_name;
        progressData.add_by_mobile = add_by_mobile;
        progressData.add_by_email = add_by_email;
        progressData.add_by_designation = add_by_designation;
        progressData.add_date = dbDateFormat();
        progressData.status = 'Verification Completed';

        await updateProgressDataInApprovalNote(approval_note_doc_id, candidate_doc_id, progressData);

        return res.status(200).json({ status: true, 'message': 'Reference Data Updated Successfully' });
    }
    catch (error) {
        console.log(error);
        return res.status(403).send({ 'status': false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE });
    }
}


controller.skipReferenceCheckData = async (req, res) => {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(403).json({ status: false, message: errors.array()[0].msg });
    }

    const { referenceStatus, name, email, mobile, designation, candidate_doc_id, approval_note_doc_id } = req.body;

    try {

        /*********** Get Candidate Data ***********/
        var CandidateData = await JobAppliedCandidateCl.findOne({ _id: dbObjectId(candidate_doc_id) });
        if (!CandidateData) {
            return res.status(403).json({ status: false, message: 'Candidate Not Found' });
        }

        /*********Get Approval Note Data*****/
        var ApprovalNoteData = await ApprovalNoteCI.findOne({ _id: dbObjectId(approval_note_doc_id) });
        if (!ApprovalNoteData) {
            return res.status(403).json({ status: false, message: 'Approval Note Not Found' });
        }

        const JobId = ApprovalNoteData?.job_id;
        const ProjectId = ApprovalNoteData?.project_id;

        /*********Check in approval Note***********/
        const checkCandidateInApprovalNote = ApprovalNoteData?.candidate_list?.find((item) => item?.cand_doc_id?.toString() === candidate_doc_id);
        //console.log( checkCandidateInApprovalNote ); 

        /*********Check approval Note***********/
        const checkVerificationSkipDataInApprovalNote = checkCandidateInApprovalNote?.verification_skip_data?.find((item) => item?.referenceStatus === referenceStatus);


        if (!checkCandidateInApprovalNote) {
            return res.status(403).json({ status: false, message: 'No Data Found' });
        }

        const empWhere = {}
        empWhere["$or"] = [{ 'email': email }, { 'mobile_no': mobile }, { 'name': name }];
        const getEmployeeData = await EmployeeCI.findOne(empWhere, { name: 1, email: 1, mobile_no: 1, designation: 1 });


        //return res.status(403).json({ status: false, message: 'No Data Found' }); 

        /*********** Update in Approval Note *************/
        const filterCondition = [];
        filterCondition.push({ 'one._id': checkCandidateInApprovalNote._id });
        if (checkVerificationSkipDataInApprovalNote) {
            filterCondition.push({ 'two._id': checkVerificationSkipDataInApprovalNote._id });
        }

        const arrayFilters = { 'arrayFilters': filterCondition }

        const where = {}
        where._id = dbObjectId(approval_note_doc_id);
        where['candidate_list._id'] = checkCandidateInApprovalNote._id;

        const collectSkipData = {}
        if (getEmployeeData) {
            collectSkipData.referenceStatus = referenceStatus;
            collectSkipData.emp_doc_id = getEmployeeData._id.toString();
            collectSkipData.name = getEmployeeData?.name || name;
            collectSkipData.email = getEmployeeData?.email || email;
            collectSkipData.mobile_no = getEmployeeData?.mobile_no || mobile;
            collectSkipData.designation = getEmployeeData?.designation || designation;
        } else {
            collectSkipData.referenceStatus = referenceStatus;
            collectSkipData.emp_doc_id = 'NA';
            collectSkipData.name = name;
            collectSkipData.email = email;
            collectSkipData.mobile_no = mobile || '';
            collectSkipData.designation = designation;
        }

        collectSkipData.skipped_on = dbDateFormat();

        const saveData = {}

        const collectUpdateData = {}
        if (checkVerificationSkipDataInApprovalNote) {
            collectUpdateData['candidate_list.$[one].verification_skip_data.$[two].referenceStatus'] = referenceStatus;
            collectUpdateData['candidate_list.$[one].verification_skip_data.$[two].emp_doc_id'] = collectSkipData.emp_doc_id;
            collectUpdateData['candidate_list.$[one].verification_skip_data.$[two].mobile'] = collectSkipData.mobile_no;
            collectUpdateData['candidate_list.$[one].verification_skip_data.$[two].email'] = collectSkipData.email || '';
            collectUpdateData['candidate_list.$[one].verification_skip_data.$[two].designation'] = collectSkipData.designation || '';
            collectUpdateData['candidate_list.$[one].verification_skip_data.$[two].skipped_on'] = collectSkipData.skipped_on;
        } else {
            collectUpdateData['candidate_list.$[one].is_verification_skipped'] = 'Yes';
            saveData['$push'] = { 'candidate_list.$[one].verification_skip_data': collectSkipData };
        }

        saveData['$set'] = collectUpdateData;

        await ApprovalNoteCI.updateOne({ _id: dbObjectId(approval_note_doc_id) }, saveData, arrayFilters);

        /*Add Progress data in Approval note*/
        const progressData = {}
        progressData.title = `Reference Check (${referenceStatus})`;
        progressData.activity = 'Verification Skipped';
        progressData.add_by_name = collectSkipData?.name || name;
        progressData.add_by_mobile = collectSkipData?.mobile_no || mobile_no;
        progressData.add_by_email = collectSkipData?.email || email;
        progressData.add_by_designation = collectSkipData?.designation || designation;
        progressData.add_date = dbDateFormat();
        progressData.status = 'Verification Skipped';

        await updateProgressDataInApprovalNote(approval_note_doc_id, candidate_doc_id, progressData);


        return res.status(200).json({ status: true, 'message': 'Reference Check Skipped Successfully' });
    }
    catch (error) {
        console.log(error);
        return res.status(403).send({ 'status': false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE });
    }
}


controller.approveRejectAppointmentLetter = async (req, res) => {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(403).json({ status: false, message: errors.array()[0].msg });
    }

    const { approval_note_doc_id, candidate_id, status, remark, employee_id } = req.body;

    const hrConfig = JSON.parse(fs.readFileSync('./src/config/hr_config_file.txt', 'utf8'));

    const hiring_approval_hr_email_id = hrConfig?.hiring_approval_hr_email_id || '';


    try {

        /*********Get Approval Note Data*****/
        var ApprovalNoteData = await ApprovalNoteCI.findOne({ _id: dbObjectId(approval_note_doc_id) });
        if (!ApprovalNoteData) {
            return res.status(403).json({ status: false, message: 'Approval Note Not Found' });
        }

        /*********Check in approval Note***********/
        const checkCandidateInApprovalNote = ApprovalNoteData?.candidate_list?.find((item) => item?.cand_doc_id?.toString() === candidate_id);

        if (!checkCandidateInApprovalNote) {
            return res.status(403).json({ status: false, message: 'No Data Found' });
        }

        const empWhere = {}
        empWhere["_id"] = dbObjectId(employee_id);
        empWhere["email"] = hiring_approval_hr_email_id;
        const getEmployeeData = await EmployeeCI.findOne(empWhere, { name: 1, email: 1, mobile_no: 1, designation: 1 });

        if (!getEmployeeData) {
            return res.status(403).json({ status: false, message: `${'This feature is enabled at email ID: '} ${hiring_approval_hr_email_id}` });
        }

        /*********** Update in Approval Note *************/
        const filterCondition = [];
        filterCondition.push({ 'one._id': checkCandidateInApprovalNote._id });
        const arrayFilters = { 'arrayFilters': filterCondition }

        const where = {}
        where._id = dbObjectId(approval_note_doc_id);
        where['candidate_list._id'] = checkCandidateInApprovalNote._id;

        const processBarData = {}
        if (getEmployeeData) {
            processBarData.title = 'Appointment Letter Approval';
            processBarData.activity = 'Appointment Letter Approval Status';
            processBarData.status = status === 'Approve' ? 'Approved' : 'Rejected';
            processBarData.add_by_name = getEmployeeData?.name || '';
            processBarData.add_by_email = getEmployeeData?.email || '';
            processBarData.add_by_mobile = getEmployeeData?.mobile_no || '';
            processBarData.add_by_designation = getEmployeeData?.designation || '';
            processBarData.add_date = dbDateFormat();
        }

        const saveData = {}

        const collectUpdateData = {}
        collectUpdateData['candidate_list.$[one].appointment_letter_verification_status.status'] = status === 'Approve' ? 'Complete' : 'Reject';
        if (['Reject', 'reject'].includes(status) && remark) {
            collectUpdateData['candidate_list.$[one].appointment_letter_verification_status.remark'] = remark;
        }

        if (['Approve', 'approve'].includes(status)) {
            collectUpdateData['candidate_list.$[one].document_status.appointment_letter'] = 'approved';
        }

        saveData['$set'] = collectUpdateData;
        saveData['$push'] = { 'candidate_list.$[one].progress_data': processBarData };

        await ApprovalNoteCI.updateOne(where, saveData, arrayFilters);

        return res.status(200).json({ status: true, 'message': 'Status Updated Successfully' });
    }
    catch (error) {
        console.log(error);
        return res.status(403).send({ 'status': false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE });
    }
}

controller.getAppraisalNoteDataById = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(403).json({ status: false, message: errors.array()[0].msg });
    }

    const { approval_note_doc_id, cand_doc_id } = req.body;

    try {
        const pipeline = [
            {
                $match: {
                    _id: dbObjectId(approval_note_doc_id)
                }
            },
            {
                $unwind: "$candidate_list"
            }
        ];

        // filter candidate by id if provided
        if (dbObjectIdValidate(cand_doc_id)) {
            pipeline.push({
                $match: {
                    "candidate_list.cand_doc_id": dbObjectId(cand_doc_id)
                }
            });
        }

        pipeline.push(
            {
                $lookup: {
                    from: "dt_candidates",
                    localField: "candidate_list.cand_doc_id",
                    foreignField: "_id",
                    as: "candidate_master"
                }
            },
            {
                $addFields: {
                    "candidate_list.father_name": {
                        $arrayElemAt: [
                            "$candidate_master.applicant_form_data.father_hushband_name",
                            0
                        ]
                    },
                    "candidate_list.reporting_manager": {
                        $arrayElemAt: [
                            "$candidate_master.annexure_eleven_form_data.reporting_manager",
                            0
                        ]
                    },
                    "candidate_list.communication_address": {
                        $arrayElemAt: [
                            "$candidate_master.applicant_form_data.communication_address",
                            0
                        ]
                    },
                    "candidate_list.permanent_address": {
                        $arrayElemAt: [
                            "$candidate_master.applicant_form_data.permanent_address",
                            0
                        ]
                    },
                    "candidate_list.family_members": {
                        $arrayElemAt: [
                            "$candidate_master.applicant_form_data.family_members",
                            0
                        ]
                    }
                }
            },
            {
                $group: {
                    _id: "$_id",
                    doc: { $first: "$$ROOT" },
                    candidate_list: { $push: "$candidate_list" }
                }
            },
            {
                $addFields: {
                    "doc.candidate_list": "$candidate_list"
                }
            },
            {
                $replaceRoot: { newRoot: "$doc" }
            },
            {
                $project: {
                    candidate_master: 0
                }
            }
        );

        const data = await ApprovalNoteCI.aggregate(pipeline);

        if (!data.length) {
            return res.status(404).json({
                status: false,
                message: "Candidate not found"
            });
        }

        // optional sorting
        data[0].candidate_list.sort((a, b) => {
            const priority = { Selected: 1, Waiting: 2 };
            return (priority[a.interview_shortlist_status] || 99) -
                (priority[b.interview_shortlist_status] || 99);
        });

        return res.status(200).json({
            status: true,
            data: data[0],
            message: "API Accessed Successfully"
        });

    } catch (error) {
        return res.status(403).json({
            status: false,
            message: error.message || process.env.DEFAULT_ERROR_MESSAGE
        });
    }
};


module.exports = controller;