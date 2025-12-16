const TemplateSettingsCI = require('../../../models/TemplateSettingsCI.js')
const { dbObjectId } = require('../../../models/dbObject.js');
const fs = require('fs');
const dotenv = require("dotenv");
dotenv.config({ path: '../src/config.env' });
const { dbDateFormat, normalizeEmployeeType, formatDateDateFullMonthYear, formatDateToCustomStringNoComma, formatDateToCustomString, updateDatesInArray, replaceNullUndefined, numbersToWords, removeFile, getHumanReadableDate, formatDateToWeekOf } = require('../../../middlewares/myFilters.js');

const { validationResult } = require('express-validator');
const EmployeeCI = require('../../../models/EmployeeCI.js');
const ApprovalNoteCI = require('../../../models/ApprovalNoteCI.js');
const ProjectCl = require('../../../models/ProjectCl.js');
const JobsCI = require('../../../models/JobsCI.js');
const JobAppliedCandidateCl = require('../../../models/JobAppliedCandidateCl.js');
const RequisitionFormCI = require('../../../models/RequisitionFormCI.js');

const IMAGE_PATH = process.env.IMAGE_PATH;
const controller = {};

const deleteUploadedImage = (documents) => {
    documents.forEach((file) => {
        removeFile(file.file_name);
    });
}

/*******  Add  Settings Template **********/
controller.saveTemplateSettings = async (req, res) => {

    if (req.body && typeof req.body === 'object') {
        req.body = JSON.parse(JSON.stringify(req.body));
    }

    const errors = validationResult(req);
    const documents = [];

    req.files.forEach((file) => {
        const match = file.fieldname.match(/attachments\[(\d+)\]\[file_name\]/);
        const idx = match ? Number(match[1]) : -1;

        let docName = 'Untitled';
        let isHtml = 'No';
        let isOptional = 'No';

        // Try structured access first
        if (req.body.attachments && req.body.attachments[idx] && req.body.attachments[idx].doc_name) {
            docName = req.body.attachments[idx].doc_name;
        }

        // Try ESIC Status first
        if (req.body.attachments && req.body.attachments[idx] && req.body.attachments[idx].is_html) {
            isHtml = req.body.attachments[idx].is_html;
        }

        // Try ESIC Status first
        if (req.body.attachments && req.body.attachments[idx] && req.body.attachments[idx].is_optional) {
            isOptional = req.body.attachments[idx].is_optional;
        }

        // Fallback to flat key if structured fails
        const flatKey = `attachments[${idx}][doc_name]`;
        if (!docName || docName === 'Untitled') {
            docName = req.body[flatKey] || 'Untitled';
        }

        if (idx !== -1) {
            documents.push({
                doc_name: docName,
                is_html: isHtml,
                is_optional: isOptional,
                file_name: file.filename,
                add_date: new Date()
            });
        }
    });


    if (!errors.isEmpty()) {
        deleteUploadedImage(documents);
        return res.status(406).json({ status: false, message: errors.array()[0].msg });
    }


    const { doc_id, job_type, status, esic_status, template, template_for } = req.body;

    saveData = {};
    saveData.template = template;
    saveData.job_type = normalizeEmployeeType(job_type);
    saveData.status = status;
    if (req.body.hasOwnProperty('esic_status') && req.body.esic_status !== '') {
        saveData.esic_status = esic_status;
    } else {
        saveData.esic_status = 'No';
    }

    saveData.template_for = template_for;
    saveData.updated_on = dbDateFormat();

    const whereCheck = {}
    whereCheck.job_type = saveData.job_type;
    whereCheck.template_for = saveData.template_for;
    if (req.body.hasOwnProperty('esic_status') && req.body.esic_status !== '') {
        whereCheck.esic_status = saveData.esic_status;
    }

    try {
        const ckData = await TemplateSettingsCI.findOne(whereCheck);

        if (ckData) {

            /*Remove Old Documents*/
            const findMatchDocs = [];
            ckData.attachments.forEach((item) => {
                var findDoc = documents.find((elm) => elm.doc_name === item.doc_name);
                if (findDoc) {
                    removeFile(item.file_name);
                } else {
                    findMatchDocs.push(item);
                }
            });

            const mergeAllAttachment = [...findMatchDocs, ...documents];

            saveData.attachments = mergeAllAttachment;
            await TemplateSettingsCI.updateOne({ _id: ckData._id }, { $set: saveData })

            return res.status(200).send({ 'status': true, 'message': 'Template Updated Successfully' });
        }
        else if (!ckData) {
            saveData.attachments = documents;
            saveData.add_date = dbDateFormat();
            await TemplateSettingsCI.create(saveData);
            return res.status(200).send({ 'status': true, 'message': 'Template Added Successfully' });
        }

    } catch (error) {
        console.log(error);
        return res.status(403).send({ 'status': false, 'message': process.env.DEFAULT_ERROR_MESSAGE });
    }

}


controller.getTemplateSettingsList = (req, res) => {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(403).json({ status: false, message: errors.array()[0].msg });
    }

    const { page_no, per_page_record, scope_fields } = req.body;

    const where = {}
    const fetchKeys = {}
    fetchKeys['_id'] = 1;

    if (req.body.hasOwnProperty('template_for') && req.body.template_for !== '') {
        where.template_for = req.body.template_for;
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
            { template_for: { $regex: searchKeyWord, $options: 'i' } },
            { job_type: { $regex: searchKeyWord, $options: 'i' } }
        ]
    }

    const pageOptions = {
        page: parseInt(((page_no ? page_no : 1) - 1)) || 0,
        limit: parseInt(per_page_record) || 10
    }

    //console.log( where );

    TemplateSettingsCI.find(where, fetchKeys)
        .skip(pageOptions.page * pageOptions.limit)
        .limit(pageOptions.limit)
        .sort({ '_id': 1 })
        .then((data) => {

            if (data.length > 0) {
                const outPutData = updateDatesInArray(replaceNullUndefined(data), ['add_date', 'updated_on'], 'datetime');
                return res.status(200).send({ 'status': true, 'data': outPutData, 'message': 'API Accessed Successfully' });
            } else {
                return res.status(403).send({ 'status': false, 'message': 'No record matched' });
            }
        }).catch((error) => {
            return res.status(403).send({ 'status': false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE });
        });
}


controller.getTemplateSettingsById = (req, res) => {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(403).json({ status: false, message: errors.array()[0].msg });
    }

    const { doc_id } = req.body;

    const where = {}
    where._id = dbObjectId(doc_id);
    const fetchKeys = {}
    fetchKeys['__v'] = 0;


    //console.log( where );

    TemplateSettingsCI.find(where, fetchKeys)
        .then((data) => {

            if (data.length > 0) {
                const outPutData = updateDatesInArray(replaceNullUndefined(data), ['add_date', 'updated_on'], 'datetime');
                return res.status(200).send({ 'status': true, 'data': outPutData[0], 'message': 'API Accessed Successfully' });
            } else {
                return res.status(403).send({ 'status': false, 'message': 'No record matched' });
            }
        }).catch((error) => {
            return res.status(403).send({ 'status': false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE });
        });
}


controller.removeTemplateSettingsById = async (req, res) => {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(403).json({ status: false, message: errors.array()[0].msg });
    }

    const { doc_id } = req.body;

    const where = {}
    where._id = dbObjectId(doc_id);
    const fetchKeys = {}
    fetchKeys['__v'] = 0;

    //console.log( where );
    try {
        const data = await TemplateSettingsCI.findOne(where, fetchKeys);
        if (data) {

            /*it is commented due to multiple uses in all candidate profiles*/
            // data.attachments.forEach((item)=>{
            //     //removeFile( item.file_name );
            // });

            await TemplateSettingsCI.deleteOne(where);
            return res.status(200).send({ 'status': true, 'message': 'Record removed successfully' });
        } else {
            return res.status(403).send({ 'status': false, 'message': 'No record matched' });
        }
    }
    catch (error) {
        return res.status(403).send({ 'status': false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE });
    }
}

controller.removeAttachmentDocFromTSById = async (req, res) => {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(403).json({ status: false, message: errors.array()[0].msg });
    }

    const { doc_id, attachment_id } = req.body;

    const where = {}
    where._id = dbObjectId(doc_id);
    const fetchKeys = {}
    fetchKeys['__v'] = 0;

    //console.log( where );
    try {
        const data = await TemplateSettingsCI.findOne(where, fetchKeys);
        if (data) {
            const collectDocs = [];
            const saveData = {}
            data.attachments.forEach((item) => {
                if (item._id.toString() === attachment_id) {
                    removeFile(item.file_name);
                } else {
                    collectDocs.push(item);
                }

            });
            saveData.attachments = collectDocs;

            await TemplateSettingsCI.updateOne(where, { $set: saveData });
            return res.status(200).send({ 'status': true, 'message': 'Record updated successfully' });
        } else {
            return res.status(403).send({ 'status': false, 'message': 'No record matched' });
        }
    }
    catch (error) {
        return res.status(403).send({ 'status': false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE });
    }
}

controller.getTemplateSettingsByDocName = (req, res) => {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(403).json({ status: false, message: errors.array()[0].msg });
    }

    const { job_type, template_for } = req.body;

    const where = {}
    where.job_type = normalizeEmployeeType(job_type);
    where.template_for = template_for;
    const fetchKeys = {}
    fetchKeys['__v'] = 0;


    TemplateSettingsCI.find(where, fetchKeys)
        .then((data) => {

            if (data.length > 0) {
                const outPutData = updateDatesInArray(replaceNullUndefined(data), ['add_date', 'updated_on'], 'datetime');
                return res.status(200).send({ 'status': true, 'data': outPutData[0], 'message': 'API Accessed Successfully' });
            } else {
                return res.status(403).send({ 'status': false, 'message': 'No record matched' });
            }
        }).catch((error) => {
            return res.status(403).send({ 'status': false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE });
        });
}

/************** fetch template for approval note & offer job************* */
controller.getTemplateSettingsByApprovalNote = async (req, res) => {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(403).json({ status: false, message: errors.array()[0].msg });
    }

    const { approval_note_doc_id, candidate_id, template_for } = req.body;

    /* fetch approval note data*/
    const whereApproval = {}
    whereApproval._id = dbObjectId(approval_note_doc_id);
    const approvalNoteData = await ApprovalNoteCI.findOne(whereApproval);
    if (!approvalNoteData) {
        return res.status(403).send({ 'status': false, 'message': 'Approval note data not found' });
    }
    const findCandidate = approvalNoteData?.candidate_list?.find((item) => item.cand_doc_id.toString() === candidate_id);

    if (!findCandidate) {
        return res.status(403).send({ 'status': false, 'message': 'Candidate data not found' });
    }

    /*get Job Details details*/
    const jobData = await JobsCI.findOne({ _id: approvalNoteData.job_id }, { project_name: 1, department: 1, designation: 1, requisition_form_id: 1 });

    const job_type = findCandidate?.job_type;
    const mpr_id = jobData?.requisition_form_id;
    /* get mpr data  */
    const mprData = await RequisitionFormCI.findOne({ _id: mpr_id }, { activity_data: 1 });

    const reporting_manager_data = mprData?.activity_data?.find((item) => item.designation == 'HOD');

    //var reporting_manager_name = reporting_manager_data?.name; 
    var reporting_manager_name = reporting_manager_data?.employee_designation || reporting_manager_data?.designation;

    const organizationConfig = JSON.parse(fs.readFileSync('./src/config/organization_config_file.txt', 'utf8'));

    //console.log( jobData );
    //console.log( approvalNoteData?.job_designation );

    /*******Candidate Details******/
    const candidateDetails = await JobAppliedCandidateCl.findOne({ _id: dbObjectId(candidate_id) }, { applicant_form_data: 1, esic_status: 1 });


    var communicationAddress = '';
    var fatherName = '';
    if (candidateDetails?.applicant_form_data?.communication_address) {
        communicationAddress = candidateDetails?.applicant_form_data?.communication_address?.address || '';
        communicationAddress += +' ' + candidateDetails?.applicant_form_data?.communication_address?.pincode || '';
    }

    if (candidateDetails?.applicant_form_data?.father_hushband_name) {
        fatherName = candidateDetails?.applicant_form_data?.father_hushband_name || '';
    }

    var esicStatus = candidateDetails?.esic_status === 'Yes' ? 'Yes' : 'No';


    const TEMPLATE_VARIABLES = [
        { key: 'name', value: findCandidate?.name || '' },
        { key: 'position_name', value: approvalNoteData?.job_designation || '' },
        { key: 'project_name', value: approvalNoteData?.project_name || '' },
        { key: 'department_name', value: jobData?.department || '' },
        { key: 'designation_name', value: approvalNoteData?.job_designation || '' },
        { key: 'location', value: findCandidate?.proposed_location || '' },
        { key: 'contract_end_date', value: formatDateToCustomString(findCandidate.job_valid_date) },
        { key: 'reporting_person_name', value: reporting_manager_name || '' },
        { key: 'posting_location', value: findCandidate?.proposed_location || '' },
        { key: 'offer_amount', value: findCandidate?.offer_ctc || '' },
        { key: 'offer_amount_in_words', value: numbersToWords(findCandidate?.offer_ctc) },
        { key: 'onboarding_date', value: formatDateToWeekOf(findCandidate.onboarding_date) },
        { key: 'salary_type', value: findCandidate.payment_type || '' },
        { key: 'company_name', value: organizationConfig?.organization_name || '' },
        { key: 'father_name', value: fatherName || '' },
        { key: 'ro_address', value: communicationAddress || '' },
        { key: 'current_date', value: formatDateToCustomString(new Date()) }
    ];


    const newJobType = job_type.toUpperCase().trim();
    const where = {}
    where.template_for = template_for;
    if (['EMPANELED', 'EMPANELLED'].includes(newJobType)) {
        where.job_type = 'EMPANELED';
    } else if (['ONCONTRACT', 'ONCONSULTANT'].includes(newJobType)) {
        where.job_type = 'ONCONTRACT';
    } else {
        where.job_type = newJobType;
    }

    where.esic_status = esicStatus;

    try {
        const data = await TemplateSettingsCI.find(where);

        if (data.length > 0) {
            const outPutData = data.map((item) => {
                const push = {}
                push.template_id = item._id;
                push.template = item.template;
                push.template_for = item.template_for;
                push.mail_status = item.template_for;
                push.attachments = item.attachments.map((elm) => {
                    const pushElm = {}
                    pushElm._id = elm._id;
                    pushElm.doc_name = elm.doc_name;
                    pushElm.is_optional = elm.is_optional || 'No';
                    pushElm.file_name = `${IMAGE_PATH}${elm.file_name}`;
                    return pushElm;
                });
                return push;
            });

            const resultData = outPutData[0];
            var templateData = outPutData[0].template;

            const replacedData = templateData.replace(/\{#(.*?)\}/g, (match, key) => {
                const found = TEMPLATE_VARIABLES.find(item => item.key === key);
                return found ? found.value : match;
            });

            resultData.template = replacedData;

            return res.status(200).json({ 'status': true, 'data': resultData, 'message': 'API Accessed Successfully' });
        } else {
            return res.status(403).json({ 'status': false, 'message': 'No record matched' });
        }
    } catch (error) {
        console.log(error);
        return res.status(403).json({ 'status': false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE });
    }
}

module.exports = controller;
