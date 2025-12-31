const JobAppliedCandidateCl = require('../../../models/JobAppliedCandidateCl.js');
const EmployeeCI = require('../../../models/EmployeeCI.js');
const JobsCL = require('../../../models/JobsCI.js');
const JobCl = require('../../../models/JobsCI.js');
const CandidateDiscussionHistoryCI = require('../../../models/CandidateDiscussionHistoryCI.js');
const RequisitionFormCI = require('../../../models/RequisitionFormCI.js');
const ApprovalNoteCI = require('../../../models/ApprovalNoteCI.js');
const TemplateSettingsCI = require('../../../models/TemplateSettingsCI.js');
const CandidateSentMailLogsCI = require('../../../models/CandidateSentMailLogsCI.js');

const { dbObjectId, dbObjectIdValidate } = require('../../../models/dbObject.js');
const dotenv = require("dotenv");
dotenv.config({ path: '../src/config.env' });

const path = require('path');
const fs = require('fs');
const axios = require('axios');
const { generateJwtToken } = require('../../../middlewares/verifyToken.js');


const uploadsDir = './uploads';


const { dbDateFormat, allDateFormat, numbersOnly, isStrNumbers, isValidEmail, numbersToWords, formatDateToWeekOf, normalizeEmployeeType, deleteMultipleUploadedImage, validateYearWithRange, getWriteDataFromFile, writeDataInFileAnyPath, generateRandomEmail, removeDuplicatesAppliedFrom, updateDatesInArray, updateDatesInObject, replaceNullUndefined, removeBlankValuesFromObject, getImageType, convertBitsIntoKbMb, removeFile, getHumanReadableDate, convertToDbDate, commonOnly } = require('../../../middlewares/myFilters.js');
const { shortListCandidateMail } = require('../../../helpers/shortListCandidateMail.js');
const { ScheduleInterviewMail } = require('../../../helpers/ScheduleInterviewMail.js');
const { scheduleInterviewerMail } = require('../../../helpers/scheduleInterviewerMail.js');
const { rejectApplyJobMail } = require('../../../helpers/rejectApplyJobMail.js');
const { assessmentSecondMail } = require('../../../helpers/assessmentSecondMail.js');
const { offerJobMail, sendJobOfferMailToCandidateFromApprovalNote, sendJobOfferAcceptMailToPanelist, sendAppointmentLetterMailToCandidate, sendIntimationMailToPanelist } = require('../../../helpers/offerJobMail.js');
const { loginCandidateMail } = require('../../../helpers/loginCandidateMail.js');
const { SendJobOfferApprovalMail } = require('../../../helpers/SendJobOfferApprovalMail.js');
const { FinalApprovalNoteMailToAddedByUser } = require('../../../helpers/FinalApprovalNoteMailToAddedByUser.js');
const { cancelInterviewToInterviewer } = require('../../../helpers/cancelInterviewToInterviewer.js');
const { needToDiscussMail } = require('../../../helpers/NeedToDisscuss.js');
const { ApplicantForm } = require('../../../helpers/ApplicantForm.js');

const { validationResult } = require('express-validator');

const { readExcelFile, readCSVFileData } = require('../../../middlewares/ImportExport.js');
const ProjectCl = require('../../../models/ProjectCl.js');
const AppliedFromCI = require('../../../models/AppliedFromCI.js');


const controller = {};

const addCandidateDiscussion = (candidate_id, project_id, candidate_name, discuss_with, subject, discussion) => {

    if (candidate_id && project_id) {
        const payLoad = {}
        payLoad.candidate_id = dbObjectId(candidate_id.toString());
        payLoad.project_id = dbObjectId(project_id.toString());
        payLoad.candidate_name = candidate_name;
        payLoad.discuss_with = discuss_with;
        payLoad.subject = subject;
        payLoad.discussion = discussion;
        payLoad.add_date = dbDateFormat();

        CandidateDiscussionHistoryCI(payLoad).save()
            .then((data) => {
                //console.log( data );
            })
            .catch((error) => {
                //console.log( error );
            });

    }
    return true;

}

// controller.updateCandidateJobRecordsd = ( req, res )=>{
//     const { job_id, project_id } = req.body;
//     updateCandidateJobRecords( job_id, project_id );
//     return res.status(409).send( {'status':false, 'message': 'You have already expressed interest in this job.'} );
// }

const updateCandidateJobRecords = (job_id, project_id) => {

    const where = {}
    where['applied_jobs.job_id'] = dbObjectId(job_id);
    if (project_id !== '') {
        where['applied_jobs.project_id'] = dbObjectId(project_id);
    }

    // Find the related candidates list
    JobAppliedCandidateCl.aggregate([
        {
            $match: where
        },
        {
            $unwind: "$applied_jobs"
        },
        {
            $match: where
        },
        {
            $group: {
                _id: null,
                appliedCount: {
                    $sum: {
                        $cond: [{ $eq: ["$applied_jobs.form_status", "Applied"] }, 1, 0]
                    }
                },
                shortlistCount: {
                    $sum: {
                        $cond: [{ $eq: ["$applied_jobs.form_status", "Shortlisted"] }, 1, 0]
                    }
                },
                interviewedCount: {
                    $sum: {
                        $cond: [{ $eq: ["$applied_jobs.form_status", "Interview"] }, 1, 0]
                    }
                },
                offeredCount: {
                    $sum: {
                        $cond: [{ $eq: ["$applied_jobs.form_status", "Offer"] }, 1, 0]
                    }
                },
                hiredCount: {
                    $sum: {
                        $cond: [{ $eq: ["$applied_jobs.form_status", "Hired"] }, 1, 0]
                    }
                },
                rejectedCount: {
                    $sum: {
                        $cond: [{ $eq: ["$applied_jobs.form_status", "Rejected"] }, 1, 0]
                    }
                }
            }
        },
        {
            $project: {
                _id: 0, // Exclude _id from the final output
                applied: "$appliedCount",
                shortlist: "$shortlistCount",
                interviewed: "$interviewedCount",
                offered: "$offeredCount",
                hired: "$hiredCount",
                rejected: "$rejectedCount",
            }
        }
    ])
        .then((resultData) => {

            JobsCL.findOne({ _id: dbObjectId(job_id) }, { 'total_vacancy': 1 })
                .then((d) => {


                    const total_vacancy = d && typeof d?.total_vacancy !== 'undefined' && d?.total_vacancy ? d?.total_vacancy : 0;

                    const saveData = [];
                    const hireAvailableData = {}
                    hireAvailableData.total_vacancy = total_vacancy;

                    if (resultData.length > 0) {
                        const getCountListData = resultData[0];
                        const total = Object.values(getCountListData).reduce((sum, value) => sum + value, 0);

                        saveData.push({ 'level': 'Total', 'value': parseInt(total) });
                        saveData.push({ 'level': 'Applied', 'value': parseInt(getCountListData.applied) });
                        saveData.push({ 'level': 'Shortlisted', 'value': parseInt(getCountListData.shortlist) });
                        saveData.push({ 'level': 'Interview', 'value': parseInt(getCountListData.interviewed) });
                        saveData.push({ 'level': 'Offer', 'value': parseInt(getCountListData.offered) });
                        saveData.push({ 'level': 'Hired', 'value': parseInt(getCountListData.hired) });
                        saveData.push({ 'level': 'Rejected', 'value': parseInt(getCountListData.rejected) });

                        if (total_vacancy > 0) {
                            hireAvailableData.hired = parseInt(getCountListData.hired);
                            hireAvailableData.available_vacancy = parseInt(total_vacancy) - parseInt(getCountListData.hired);
                        }
                    } else {
                        saveData.push({ 'level': 'Total', 'value': parseInt(0) });
                        saveData.push({ 'level': 'Applied', 'value': parseInt(0) });
                        saveData.push({ 'level': 'Shortlisted', 'value': parseInt(0) });
                        saveData.push({ 'level': 'Interview', 'value': parseInt(0) });
                        saveData.push({ 'level': 'Offer', 'value': parseInt(0) });
                        saveData.push({ 'level': 'Hired', 'value': parseInt(0) });
                        saveData.push({ 'level': 'Rejected', 'value': parseInt(0) });
                    }

                    JobsCL.updateOne(
                        { _id: dbObjectId(job_id) },
                        {
                            $set: {
                                'form_candidates': [],
                                'form_candidates': saveData,
                                ...hireAvailableData
                            }
                        }
                    )
                        .then((d) => {
                            //console.log( d ); 
                        })
                });
        });

}

const updateCandidatePageSteps = (candidateIdsList, pageData) => {
    candidateIdsList.map((item) => {
        JobAppliedCandidateCl.updateOne({ _id: dbObjectId(item.candidate_id) }, { $push: { 'page_steps': pageData } })
            .then((d) => {
                // console.log(d);
            })
    });
}

/********* Post New Jobs Data **********/
controller.addApplyJob = (req, res) => {

    if (req.body && typeof req.body === 'object') {
        req.body = JSON.parse(JSON.stringify(req.body));
    }

    const errors = validationResult(req);

    const resumeFilename = req.files.filename ? req.files?.filename?.map((item) => item.filename)[0] : null;
    const photoImages = req.files.photo ? req.files?.photo?.map((item) => item.filename)[0] : null;


    if (!errors.isEmpty()) {
        if (req.files && req.files.filename && resumeFilename) {
            removeFile(resumeFilename);
        }
        if (req.files && req.files.photo && photoImages) {
            removeFile(photoImages);
        }
        return res.status(402).json({ status: false, message: errors.array()[0].msg });
    }

    const profileDetails = {}

    var saveData = {};
    saveData = removeBlankValuesFromObject(req.body);

    if (req.files && resumeFilename) {
        saveData.resume_file = resumeFilename;
        profileDetails.resume_file = resumeFilename;
    }

    if (req.files && photoImages) {
        saveData.photo = photoImages;
        profileDetails.photo = photoImages;
    }

    if (typeof saveData.job_id !== 'undefined' && saveData.job_id !== '') {
        saveData.job_id = dbObjectId(saveData.job_id);
    }

    if (typeof req.body.last_working_day !== 'undefined' && req.body.last_working_day !== '') {
        saveData.last_working_day = convertToDbDate(req.body.last_working_day);
    }

    if (typeof req.body.designation !== 'undefined' && req.body.designation !== '') {
        profileDetails.designation = req.body.designation;
    }
    if (typeof req.body.total_experience !== 'undefined' && req.body.total_experience !== '') {
        profileDetails.total_experience = req.body.total_experience;
    }
    if (typeof req.body.relevant_experience !== 'undefined' && req.body.relevant_experience !== '') {
        profileDetails.relevant_experience = req.body.relevant_experience;
    }
    if (typeof req.body.location !== 'undefined' && req.body.location !== '') {
        profileDetails.location = req.body.location;
    }
    if (typeof req.body.current_ctc !== 'undefined' && req.body.current_ctc !== '') {
        profileDetails.current_ctc = req.body.current_ctc;
    }
    if (typeof req.body.expected_ctc !== 'undefined' && req.body.expected_ctc !== '') {
        profileDetails.expected_ctc = req.body.expected_ctc;
    }
    if (typeof req.body.notice_period !== 'undefined' && req.body.notice_period !== '') {
        profileDetails.notice_period = req.body.notice_period;
    }
    if (typeof req.body.current_employer !== 'undefined' && req.body.current_employer !== '') {
        profileDetails.current_employer = req.body.current_employer;
    }
    if (typeof req.body.current_employer_mobile !== 'undefined' && req.body.current_employer_mobile !== '') {
        profileDetails.current_employer_mobile = req.body.current_employer_mobile;
    }
    if (typeof req.body.current_employer_email !== 'undefined' && req.body.current_employer_email !== '') {
        profileDetails.current_employer_email = req.body.current_employer_email;
    }
    if (typeof req.body.last_working_day !== 'undefined' && req.body.last_working_day !== '') {
        profileDetails.last_working_day = convertToDbDate(req.body.last_working_day);
    }
    if (typeof req.body.applied_from !== 'undefined' && req.body.applied_from !== '') {
        profileDetails.applied_from = req.body.applied_from;
    }
    if (typeof req.body.reference_employee !== 'undefined' && req.body.reference_employee !== '') {
        profileDetails.reference_employee = req.body.reference_employee;
    }

    if (typeof req.body.reference_employee !== 'undefined' && req.body.reference_employee !== '') {
        profileDetails.reference_employee = req.body.reference_employee;
    }

    if (typeof req.body.social_links !== 'undefined' && req.body.social_links.length > 0) {
        saveData.social_links = JSON.parse(req.body.social_links).map((item) => {
            const push = {}
            if (typeof item.brand !== 'undefined' && item.brand !== '') {
                push.brand = item.brand;
            }
            if (typeof item.link !== 'undefined' && item.link !== '') {
                push.link = item.link;
            }
            return push;
        });
    }


    saveData.add_date = dbDateFormat();
    saveData.updated_on = dbDateFormat();
    saveData.profile_status = 'Active';
    saveData.form_status = 'Applied';
    saveData.profile_avg_rating = 0;
    saveData.interview_shortlist_status = '';

    /*Added After Test for Final Discussion on 07-Nov-2024 for last applied form*/
    saveData.assessment_status = 'Pending';
    saveData.assessment_result = '';
    saveData.score = 0;
    saveData.mcq_final_score = 0;
    saveData.mcq_score_final_result = '';
    saveData.mcq_attempts = 'Available';
    saveData.comprehensive_final_score = 0;
    saveData.comprehensive_score_final_result = '';
    saveData.comprehensive_attempts = 'Available';
    saveData.assessment_apply_status = 'enable';
    saveData.applied_from = 'HLFPPT Career';

    const jobDetails = {}
    jobDetails.job_id = saveData.job_id;
    jobDetails.job_title = saveData.job_title;
    jobDetails.job_type = saveData.job_type;
    jobDetails.project_id = saveData.project_id;
    jobDetails.project_name = saveData.project_name;
    jobDetails.department = saveData.department;
    jobDetails.form_status = 'Applied';
    jobDetails.add_date = dbDateFormat();
    jobDetails.job_location = req.body.location;
    jobDetails.job_designation = req.body.designation;
    jobDetails.profile_details = profileDetails;
    jobDetails.final_job_offer_approval_status = 'No';



    JobsCL.findOne({ _id: saveData.job_id }, { designation_id: 1, designation: 1, assessment_status: 1, requisition_form_id: 1 })
        .then((jobData) => {
            if (jobData) {
                jobDetails.job_designation_id = jobData.designation_id;
                jobDetails.job_designation = jobData.designation;
                saveData.assessment_apply_status = jobData.assessment_status;
            }

            /*define assessment mail enable/disabled status*/
            const is_assessment_enabled = jobData && jobData.assessment_status === 'enable' ? true : false;

            RequisitionFormCI.findOne({ _id: jobData.requisition_form_id }, { type_of_opening: 1, title: 1, fund_type: 1 })
                .then((MprData) => {

                    if (MprData) {
                        jobDetails.mpr_job_offer_type = MprData?.type_of_opening;
                        jobDetails.requisition_form_id = MprData?._id;
                        jobDetails.mpr_id = MprData?.title;
                        jobDetails.mpr_fund_type = MprData?.fund_type;
                    }

                    JobAppliedCandidateCl.findOne({ email: saveData.email })
                        .then((ckData) => {

                            if (ckData) {
                                if (ckData.profile_status === 'Blocked') {
                                    return res.status(409).send({ 'status': false, 'message': 'Unfortunately, your application for the position cannot be accepted because your profile is currently blocked.' });
                                }
                                var matchDuplicate = ckData.applied_jobs.find((item) => item.job_id.toString() === saveData.job_id.toString());
                                if (matchDuplicate) {
                                    return res.status(409).send({ 'status': false, 'message': 'You have already expressed interest in this job.' });
                                }

                                saveData.page_steps = { 'step': '1', 'page': 'MCQ', 'status': 'pending' };
                                saveData.complete_profile_status = 60;
                                /***** Update data ******/
                                JobAppliedCandidateCl.updateOne({ _id: ckData._id }, { $set: saveData, $push: { 'applied_jobs': jobDetails } })
                                    .then((data) => {
                                        updateCandidateJobRecords(saveData.job_id.toString(), saveData.project_id.toString());
                                        loginCandidateMail(saveData.email, saveData.name, 'Login Details!', saveData.project_name, jobDetails.job_designation, is_assessment_enabled);
                                        return res.status(200).send({ 'status': true, 'message': 'You have successfully applied for the job.' });
                                    })
                                    .catch((error) => {
                                        return res.status(403).send({ 'status': false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE });
                                    });
                            } else {
                                saveData.applied_jobs = [jobDetails];
                                saveData.page_steps = { 'step': '1', 'page': 'MCQ', 'status': 'pending' };
                                const instData = new JobAppliedCandidateCl(saveData);
                                instData.save()
                                    .then((data) => {
                                        updateCandidateJobRecords(saveData.job_id.toString(), saveData.project_id.toString());
                                        loginCandidateMail(saveData.email, saveData.name, 'Login Details!', saveData.project_name, jobDetails.job_designation, is_assessment_enabled);
                                        return res.status(200).send({ 'status': true, 'message': 'You have successfully applied for the job.' });
                                    })
                                    .catch((error) => {
                                        return res.status(403).send({ 'status': false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE });
                                    });
                            }
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

controller.editApplyJob = (req, res) => {

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
        saveData.resume_file = req.file.filename;
        //delete old file 
        if (typeof req.body.old_resume_file !== 'undefined' && req.body.old_resume_file !== '') {
            removeFile(req.body.old_resume_file);
        }
    }

    if (typeof saveData.experience !== 'undefined' && saveData.experience.length > 0) {
        saveData.experience = JSON.parse(req.body.experience).map((item) => {
            const pushData = {}
            pushData.designation = item.designation;
            pushData.company = item.company;
            pushData.from_date = convertToDbDate(item.from_date);
            pushData.to_date = convertToDbDate(item.to_date);
            if (typeof item.responsibility !== 'undefined') {
                pushData.responsibility = item.responsibility;
            }
            if (typeof item.is_currently_working !== 'undefined') {
                pushData.is_currently_working = item.is_currently_working;
            }
            return pushData;
        });
    }

    if (typeof saveData.education !== 'undefined' && saveData.education.length > 0) {
        saveData.education = JSON.parse(req.body.education).map((item) => {
            const pushData = {}
            pushData.institute = item.institute;
            pushData.degree = item.degree;
            pushData.from_date = convertToDbDate(item.from_date);
            pushData.to_date = convertToDbDate(item.to_date);
            pushData.add_date = dbDateFormat();
            return pushData;
        });
    }

    saveData.updated_on = dbDateFormat();

    JobAppliedCandidateCl.findOne({ _id: dbObjectId(_id) }, { 'job_id': 1, 'project_id': 1, 'applied_jobs': 1 })
        .then((jobData) => {

            const CurrentJobData = jobData?.applied_jobs.find((item) => item.job_id.toString() === jobData.job_id.toString());

            if (CurrentJobData) {
                let arrayFilters = { 'arrayFilters': [{ 'one._id': CurrentJobData._id }] }

                if (req.body.hasOwnProperty('fund_type') && req.body.fund_type !== '') {
                    saveData['applied_jobs.$[one].mpr_fund_type'] = req.body.fund_type;
                }
                if (req.body.hasOwnProperty('job_offer_type') && req.body.job_offer_type !== '') {
                    saveData['applied_jobs.$[one].mpr_job_offer_type'] = req.body.job_offer_type;
                }

                JobAppliedCandidateCl.updateOne({ _id: dbObjectId(_id) }, { $set: saveData }, arrayFilters)
                    .then((d) => {
                        return res.status(200).send({ 'status': true, 'message': 'Job Edited Successfully' });
                    }).catch((error) => {
                        return res.status(403).send({ 'status': false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE });
                    });

            } else {
                JobAppliedCandidateCl.updateOne({ _id: dbObjectId(_id) }, { $set: saveData })
                    .then((data) => {

                        if (data.modifiedCount === 1) {
                            return res.status(200).send({ 'status': true, 'message': 'Data Updated Successfully' });
                        } else if (data.modifiedCount === 0) {
                            return res.status(304).send({ 'status': false, 'message': 'No Action Performed' });
                        } else {
                            return res.status(403).send({ 'status': false, 'message': process.env.DEFAULT_ERROR_MESSAGE });
                        }
                    }).catch((error) => {
                        return res.status(403).send({ 'status': false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE });
                    });
            }

        }).catch((error) => {
            return res.status(403).send({ 'status': false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE });
        });
}

controller.deleteAppliedJobById = (req, res) => {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(409).json({ status: false, message: errors.array()[0].msg });
    }

    const { _id, job_id } = req.body;

    JobAppliedCandidateCl.updateOne({ _id: dbObjectId(_id) }, { $pull: { applied_jobs: { job_id: dbObjectId(job_id) } } })
        .then((data) => {
            if (data && data.modifiedCount === 1) {
                return res.status(200).send({ 'status': true, 'message': 'Job Deleted Successfully' });
            } else if (data.modifiedCount === 0) {
                return res.status(304).send({ 'status': false, 'message': 'No Action Performed' });
            } else {
                return res.status(403).send({ 'status': false, 'message': process.env.DEFAULT_ERROR_MESSAGE });
            }
        }).catch((error) => {
            return res.status(403).send({ 'status': false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE });
        });
}

controller.deleteCandidateById = (req, res) => {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(409).json({ status: false, message: errors.array()[0].msg });
    }

    const { _id, job_id } = req.body;

    JobAppliedCandidateCl.deleteOne({ _id: dbObjectId(_id) })
        .then((data) => {
            if (data.deletedCount === 1) {
                if (typeof req.body.filename !== 'undefined' && req.body.filename !== '') {
                    removeFile(req.body.filename);
                }

                return res.status(200).send({ 'status': true, 'message': 'Account Deleted Successfully' });
            } else if (data.deletedCount === 0) {
                return res.status(304).send({ 'status': false, 'message': 'No Action Performed' });
            } else {
                return res.status(403).send({ 'status': false, 'message': process.env.DEFAULT_ERROR_MESSAGE });
            }
        }).catch((error) => {
            return res.status(403).send({ 'status': false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE });
        });
}

controller.getApplyJobById = (req, res) => {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(402).json({ status: false, message: errors.array()[0].msg });
    }

    const { _id } = req.body;

    const fetchKeys = {}
    if (req.body.hasOwnProperty('scope_fields') && req.body.scope_fields.length > 0) {
        scope_fields.push('job_id');
        req.body.scope_fields.forEach(field => {
            fetchKeys[field] = 1;
        });
    } else {
        fetchKeys.__v = 0;
    }

    JobAppliedCandidateCl.find({ _id: dbObjectId(_id) }, fetchKeys)
        .then((data) => {
            if (data.length > 0) {

                const resultData = [];
                for (var i = 0; i < data.length; i++) {
                    const push = data[i];
                    push.applied_jobs = data[i].applied_jobs.find((item) => item.job_id.toString() === data[i].job_id.toString());
                    resultData.push(push);
                }

                const outPutData = updateDatesInArray(replaceNullUndefined(resultData), ['add_date', 'updated_on'], 'datetime');
                return res.status(200).send({ 'status': true, 'data': outPutData[0], 'message': 'API Accessed Successfully' });
            } else {
                return res.status(204).send({ 'status': false, 'message': 'No record matched' });
            }
        }).catch((error) => {
            return res.status(403).send({ 'status': false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE });
        });
}

controller.changeApplyJobStatus = (req, res) => {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(409).json({ status: false, message: errors.array()[0].msg });
    }

    const { _id } = req.body;

    let saveData = {}
    saveData = req.body;
    saveData.updated_on = dbDateFormat();

    JobAppliedCandidateCl.updateOne({ _id: dbObjectId(_id) }, { $set: saveData })
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

controller.changeCandidateProfileJobStatus = (req, res) => {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(409).json({ status: false, message: errors.array()[0].msg });
    }

    const { candidate_id } = req.body;

    let saveData = {}
    saveData = req.body;
    saveData.updated_on = dbDateFormat();

    JobAppliedCandidateCl.updateOne({ _id: dbObjectId(candidate_id) }, { $set: saveData })
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

controller.getApplyJobList = async (req, res) => {

    const { page_no, per_page_record, scope_fields, type } = req.body;

    const where = {}
    const fetchKeys = {}


    if (req.body.hasOwnProperty('scope_fields') && scope_fields.length > 0) {
        scope_fields.push('job_id'); // Push 'job_id' as a string
        scope_fields.forEach(field => {
            fetchKeys[field] = 1;
        });
    } else {
        fetchKeys.__v = 0;
    }

    const now = new Date();

    if (req.body.hasOwnProperty('keyword') && req.body.keyword !== '') {
        let searchKeyWord = new RegExp(commonOnly(req.body.keyword));
        if (isValidEmail(req.body.keyword)) {
            where['email'] = req.body.keyword;
        } else if (isStrNumbers(req.body.keyword) && numbersOnly(req.body.keyword).length === 10) {
            where['mobile_no'] = req.body.keyword;
        } else {
            where['$or'] = [
                { name: { $regex: searchKeyWord, $options: 'i' } },
                { 'applied_jobs.project_name': { $regex: searchKeyWord, $options: 'i' } },
                { 'applied_jobs.department': { $regex: searchKeyWord, $options: 'i' } },
                { 'applied_jobs.job_designation': { $regex: searchKeyWord, $options: 'i' } },
                { 'applied_jobs.job_title': { $regex: searchKeyWord, $options: 'i' } },
                { 'applied_jobs.profile_details.location': { $regex: searchKeyWord, $options: 'i' } }
            ]
        }
    }


    /*latest filter added on 29-Sept-2025*/
    if (req.body.hasOwnProperty('filter_city') && req.body.filter_city !== '') {
        where['location'] = new RegExp(commonOnly(req.body.filter_city));
    }
    if (req.body.hasOwnProperty('filter_experience') && req.body.filter_experience !== '') {
        where['total_experience'] = new RegExp(commonOnly(req.body.filter_experience));
    }
    if (req.body.hasOwnProperty('filter_education') && req.body.filter_education !== '') {
        where['education.degree'] = new RegExp(commonOnly(req.body.filter_education));
    }



    if (req.body.hasOwnProperty('form_status') && !['', 'all'].includes(req.body.form_status)) {

        if (req.body.form_status === 'Upcoming') {
            where['applied_jobs.form_status'] = { $in: ['Interview'] };
            where['applied_jobs.interview_date'] = { $gte: now };
        }
        else if (req.body.form_status === 'Applied') {
            where['applied_jobs.form_status'] = { $in: ['Applied'] };
        }
        else if (req.body.form_status === 'Assessment') {
            where['assessment_status'] = 'Complete';
        } else {
            where['applied_jobs.form_status'] = { $in: [req.body.form_status] };
        }
    }

    if (req.body.hasOwnProperty('job_id') && req.body.job_id !== '') {
        where['applied_jobs.job_id'] = { $in: [dbObjectId(req.body.job_id)] };
    }

    /* set interviewer id */
    if (req.body.hasOwnProperty('interviewer_id') && req.body.interviewer_id !== '') {
        where['applied_jobs.interviewer.employee_id'] = { $in: [req.body.interviewer_id] };
    }

    var sortBy = {}
    if (req.body.hasOwnProperty('form_status') && req.body.form_status !== '') {
        sortBy = { _id: -1 }
    } else {
        sortBy = { _id: -1 }
    }

    if (req.body.hasOwnProperty('department') && req.body.department !== '') {
        where['department'] = req.body.department;
    }
    if (req.body.hasOwnProperty('job_title') && req.body.job_title !== '') {
        where['job_title'] = req.body.job_title;
    }
    if (req.body.hasOwnProperty('job_type') && req.body.job_type !== '') {
        where['job_type'] = req.body.job_type;
    }
    if (req.body.hasOwnProperty('salary_range') && req.body.salary_range !== '') {
        where['salary_range'] = req.body.salary_range;
    }
    if (req.body.hasOwnProperty('location') && req.body.location !== '') {
        let searchLocation = new RegExp(commonOnly(req.body.location));
        where['location.name'] = { $regex: searchLocation, $options: 'i' };
    }

    if (req.body.hasOwnProperty('job_id') && req.body.job_id !== '') {
        // where['job_id'] = dbObjectId( req.body.job_id );
    }



    if (req.body.hasOwnProperty('candidate_ids') && req.body.candidate_ids.length > 0) {
        const candidateIds = req.body.candidate_ids.map((item) => {
            return dbObjectId(item);
        });
        where['_id'] = { $in: candidateIds }
    }


    /*************Add count System Start Code Here *********/
    if (req.body.hasOwnProperty('is_count') && req.body.is_count === 'yes') {
        // Find the related candidates list
        try {

            var resultDataCount = 0;

            if (req.body.hasOwnProperty('interviewer_id') && req.body.interviewer_id !== '') {
                resultDataCount = await JobAppliedCandidateCl.countDocuments(where);
            }

            const resultData = await JobAppliedCandidateCl.aggregate([
                {
                    $match: where
                },
                {
                    $facet: {
                        statusCounts: [
                            { $unwind: "$applied_jobs" },
                            { $match: where },
                            {
                                $group: {
                                    _id: null,
                                    appliedCount: {
                                        $sum: { $cond: [{ $eq: ["$applied_jobs.form_status", "Applied"] }, 1, 0] }
                                    },
                                    shortlistCount: {
                                        $sum: { $cond: [{ $eq: ["$applied_jobs.form_status", "Shortlisted"] }, 1, 0] }
                                    },
                                    interviewedCount: {
                                        $sum: { $cond: [{ $eq: ["$applied_jobs.form_status", "Interview"] }, 1, 0] }
                                    },
                                    offeredCount: {
                                        $sum: { $cond: [{ $eq: ["$applied_jobs.form_status", "Offer"] }, 1, 0] }
                                    },
                                    hiredCount: {
                                        $sum: { $cond: [{ $eq: ["$applied_jobs.form_status", "Hired"] }, 1, 0] }
                                    },
                                    rejectedCount: {
                                        $sum: { $cond: [{ $eq: ["$applied_jobs.form_status", "Rejected"] }, 1, 0] }
                                    }
                                }
                            }
                        ],
                        allCount: [
                            { $match: where },
                            {
                                $group: {
                                    _id: null,
                                    allCount: { $sum: 1 }
                                }
                            }
                        ]
                    }
                },
                {
                    $project: {
                        all: { $arrayElemAt: ["$allCount.allCount", 0] },
                        applied: { $arrayElemAt: ["$statusCounts.appliedCount", 0] },
                        shortlist: { $arrayElemAt: ["$statusCounts.shortlistCount", 0] },
                        interviewed: { $arrayElemAt: ["$statusCounts.interviewedCount", 0] },
                        offered: { $arrayElemAt: ["$statusCounts.offeredCount", 0] },
                        hired: { $arrayElemAt: ["$statusCounts.hiredCount", 0] },
                        rejected: { $arrayElemAt: ["$statusCounts.rejectedCount", 0] }
                    }
                }
            ]);


            /***************Count Approval Note Records*****************/
            var whereApproval = {}
            if (req.body.hasOwnProperty('job_id') && req.body.job_id !== '') {
                whereApproval.job_id = dbObjectId(req.body.job_id);
            }
            if (req.body.hasOwnProperty('approval_filter') && req.body.approval_filter !== '') {
                whereApproval.status = req.body.approval_filter;
            }
            const noteCount = await ApprovalNoteCI.countDocuments(whereApproval);
            const resultDataNew = resultData[0];

            var finalResult = {}
            finalResult.all = resultDataNew?.all || 0;
            finalResult.applied = resultDataNew?.applied || 0;
            finalResult.shortlist = resultDataNew?.shortlist || 0;
            finalResult.interviewed = resultDataNew?.interviewed || (parseInt(resultDataCount) || 0);
            finalResult.offered = resultDataNew?.offered || 0;
            finalResult.hired = resultDataNew?.hired || 0;
            finalResult.rejected = resultDataNew?.rejected || 0;
            finalResult.approval_note = noteCount || 0;


            return res.status(200).send({ 'status': true, data: finalResult, 'message': 'Success' });

        } catch (error) { //console.log( error );
            return res.status(403).send({ 'status': false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE });
        }

    } else {

        const pageOptions = {
            page: parseInt(((page_no ? page_no : 1) - 1)) || 0,
            limit: parseInt(per_page_record) || 10
        }

        // console.log( where );

        try {
            const data = await JobAppliedCandidateCl.find(where, fetchKeys)
                .skip(pageOptions.page * pageOptions.limit)
                .limit(pageOptions.limit)
                .sort(sortBy);
            //console.log( JSON.stringify( data ) );

            // console.log( data );

            if (data.length === 0) {
                return res.status(204).send({ 'status': false, 'message': 'No record matched' });
            } else {

                // const resultData = [];
                // if( req.body.hasOwnProperty('job_id') && req.body.job_id !== '' ){
                //     for (var i = 0; i < data.length; i++) {
                //         const push = data[i];
                //         const getJobData = data[i].applied_jobs.find((item) => item.job_id.toString() === req.body.job_id.toString() );
                //         if( getJobData ){
                //             push.applied_jobs = getJobData;
                //             if( req.body.hasOwnProperty('form_status') && req.body.form_status !== '' && getJobData.form_status === req.body.form_status ){
                //                 resultData.push(push);
                //             }else if( req.body.hasOwnProperty('form_status') && req.body.form_status === '') {
                //                 resultData.push(push);
                //             }

                //         } 
                //     }

                // }else{
                //     for (var i = 0; i < data.length; i++) {
                //         const push = data[i];
                //         push.applied_jobs = data[i].applied_jobs.find((item) => item.job_id.toString() === data[i].job_id.toString() );
                //         if( req.body.hasOwnProperty('form_status') && req.body.form_status !== '' && push?.applied_jobs?.form_status === req.body.form_status ){
                //             resultData.push(push);
                //         }else{
                //             resultData.push(push);
                //         }
                //     }
                // }

                const resultData = [];
                for (var i = 0; i < data.length; i++) {
                    const push = data[i];
                    var appliedJobList = [];
                    if (req.body.hasOwnProperty('form_status') && req.body.form_status !== '') {
                        var pushFormData = data[i].applied_jobs.filter((item) => item.form_status === req.body.form_status);
                        if (pushFormData) {
                            pushFormData.forEach((elmStatus) => {
                                appliedJobList.push(elmStatus);
                            });
                        }
                    } else {
                        var pushFormData = data[i].applied_jobs.filter((item) => item.form_status === data[i].form_status);

                        if (pushFormData.length > 0) {
                            pushFormData.forEach((elmStatus) => {
                                appliedJobList.push(elmStatus);
                            });
                        } else if (data[i].applied_jobs.length > 0) {
                            appliedJobList.push(data[i].applied_jobs[0]);
                        }
                    }

                    // Filter by project_id (priority)
                    if (req.body.hasOwnProperty('project_id') && req.body.project_id !== '') {
                        appliedJobList = appliedJobList.filter(
                            item => item.project_id?.toString() === req.body.project_id.toString()
                        );
                    }

                    // Optional job_id filter
                    if (req.body.hasOwnProperty('job_id') && req.body.job_id !== '') {
                        appliedJobList = appliedJobList.filter(
                            item => item.job_id?.toString() === req.body.job_id.toString()
                        );
                    }

                    else {
                        if (req.body.hasOwnProperty('form_status') && req.body.form_status !== '' && appliedJobList.length >= 1) {
                            var pushFormData = appliedJobList.find((item) => item.form_status.toString() === req.body.form_status.toString());
                            var appliedJobList = [];
                            if (pushFormData) {
                                appliedJobList.push(pushFormData);
                            }
                        } else {
                            var pushFormData = appliedJobList.find((item) => item.job_id.toString() === data[i].job_id.toString());
                            var appliedJobList = [];
                            if (pushFormData) {
                                appliedJobList.push(pushFormData);
                            }
                        }

                    }


                    if (appliedJobList.length > 0) {
                        push.applied_jobs = appliedJobList;
                        resultData.push(push);
                    }
                }

                if (resultData.length === 0) {
                    return res.status(204).send({ 'status': false, 'message': 'No record matched' });
                } else {
                    const outPutData = updateDatesInArray(replaceNullUndefined(resultData), ['add_date', 'updated_on'], 'datetime');
                    return res.status(200).send({ 'status': true, 'data': outPutData, 'message': 'API Accessed Successfully' });
                }
            }

        } catch (error) { //console.log( error );
            return res.status(403).send({ 'status': false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE });
        }
    }
}
controller.editProfile = (req, res) => {

    if (req.body && typeof req.body === 'object') {
        req.body = JSON.parse(JSON.stringify(req.body));
    }

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        if (req.file && req.file.filename) {
            removeFile(req.file.filename);
        }
        return res.status(403).json({ status: false, message: errors.array()[0].msg });
    }

    const { _id } = req.body;


    let saveData = {}
    saveData = req.body;
    saveData.updated_on = dbDateFormat();

    if (req.file && req.file.filename) {
        saveData.photo = req.file.filename;
        //delete old file 
        if (typeof req.body.old_photo_file !== 'undefined' && req.body.old_photo_file !== '') {
            removeFile(req.body.old_photo_file);
        }
    }

    if (typeof saveData.experience !== 'undefined' && saveData.experience.length > 0) {
        saveData.experience = JSON.parse(req.body.experience).map((item) => {
            const pushData = {}
            pushData.designation = item.designation;
            pushData.company = item.company;
            pushData.from_date = convertToDbDate(item.from_date);
            pushData.to_date = convertToDbDate(item.to_date);
            if (typeof item.responsibility !== 'undefined') {
                pushData.responsibility = item.responsibility;
            }
            if (typeof item.is_currently_working !== 'undefined') {
                pushData.is_currently_working = item.is_currently_working;
            }
            return pushData;
        });
    }

    if (typeof saveData.education !== 'undefined' && saveData.education.length > 0) {
        saveData.education = JSON.parse(req.body.education).map((item) => {
            const pushData = {}
            pushData.institute = item.institute;
            pushData.degree = item.degree;
            pushData.from_date = convertToDbDate(item.from_date);
            pushData.to_date = convertToDbDate(item.to_date);
            pushData.add_date = dbDateFormat();
            return pushData;
        });
    }

    if (typeof saveData.social_links !== 'undefined' && saveData.social_links.length > 0) {
        saveData.social_links = JSON.parse(req.body.social_links).map((item) => {
            const pushData = {}
            pushData.brand = item.brand;
            pushData.link = item.link;
            return pushData;
        });
    }

    JobAppliedCandidateCl.updateOne({ _id: dbObjectId(_id) }, { $set: { 'experience': [], 'education': [], ...saveData } })
        .then((data) => {

            if (data.modifiedCount === 1) {

                JobAppliedCandidateCl.findOne({ '_id': dbObjectId(_id) }, { 'page_steps': 1, 'email': 1, 'name': 1, 'kyc_steps': 1 })
                    .then((profileData) => {

                        if (profileData.kyc_steps !== 'Complete') {
                            const getPageSteps = profileData.page_steps.find((item) => item.page === 'profile');

                            if (getPageSteps) {

                                let arrayFilters = { 'arrayFilters': [{ 'one._id': getPageSteps._id }] }

                                let where = {}
                                where['_id'] = dbObjectId(_id);
                                where['page_steps._id'] = getPageSteps._id;
                                var saveData = {}
                                saveData.complete_profile_status = 70;
                                saveData['page_steps.$[one].status'] = 'complete';

                                JobAppliedCandidateCl.updateOne({ _id: dbObjectId(_id) }, { $set: saveData }, arrayFilters)
                                    .then((d) => {
                                        const pushMergeData = {}
                                        pushMergeData.step = 3;
                                        pushMergeData.page = 'Comprehensive';
                                        pushMergeData.status = 'pending';
                                        JobAppliedCandidateCl.updateOne({ '_id': dbObjectId(_id) }, { $push: { 'page_steps': pushMergeData } })
                                            .then((d) => {
                                                if (profileData.email && profileData.name) {
                                                    assessmentSecondMail(profileData.email, profileData.name);
                                                }
                                                return res.status(200).send({ 'status': true, 'message': 'Profile Updated Successfully' });
                                            }).catch((error) => {
                                                return res.status(403).send({ 'status': false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE });
                                            });
                                    }).catch((error) => {
                                        return res.status(403).send({ 'status': false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE });
                                    });
                            } else {
                                return res.status(200).send({ 'status': true, 'message': 'Profile Updated Successfully' });
                            }
                        }
                    }).catch((error) => {
                        return res.status(403).send({ 'status': false, 'message': process.env.DEFAULT_ERROR_MESSAGE });
                    });
            } else if (data.modifiedCount === 0) {
                return res.status(200).send({ 'status': false, 'message': 'No Action Performed' });
            } else {
                return res.status(403).send({ 'status': false, 'message': process.env.DEFAULT_ERROR_MESSAGE });
            }
        }).catch((error) => {
            return res.status(403).send({ 'status': false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE });
        });
}

controller.uploadKycDocuments = (req, res) => {

    if (req.body && typeof req.body === 'object') {
        req.body = JSON.parse(JSON.stringify(req.body));
    }

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        if (req.file && req.file.filename) {
            removeFile(req.file.filename);
        }
        return res.status(403).json({ status: false, message: errors.array()[0].msg });
    }

    const { _id, doc_category, doc_name, sub_doc_category } = req.body;

    const saveData = {}
    saveData.updated_on = dbDateFormat();

    JobAppliedCandidateCl.findOne({ '_id': dbObjectId(_id) }, { 'docs': 1, 'email': 1 })
        .then((data) => {

            const findDocInList = typeof data.docs !== 'undefined' && data.docs.length > 0 ? data.docs.find((item) => item.doc_category === doc_category && item.doc_name === doc_name) : false;

            if (typeof findDocInList !== 'undefined' && findDocInList) {
                let arrayFilters = { 'arrayFilters': [{ 'one._id': findDocInList._id }] }
                let where = {}
                where['_id'] = dbObjectId(_id);
                where['docs._id'] = findDocInList._id;

                saveData['docs.$[one].doc_category'] = doc_category;
                if (typeof sub_doc_category !== 'undefined') {
                    saveData['docs.$[one].sub_doc_category'] = sub_doc_category;
                }
                saveData['docs.$[one].doc_name'] = doc_name;
                saveData['docs.$[one].file_name'] = req.file.filename;;
                saveData['docs.$[one].mime_type'] = getImageType(req.file.mimetype);
                saveData['docs.$[one].file_size'] = convertBitsIntoKbMb(req.file.size);
                saveData['docs.$[one].add_date'] = dbDateFormat();
                saveData['docs.$[one].status'] = 'complete';

                JobAppliedCandidateCl.updateOne(where, { $set: saveData }, arrayFilters)
                    .then((resp) => {
                        if (findDocInList.file_name) {
                            removeFile(findDocInList.file_name);
                        }
                        return res.status(200).send({ 'status': true, 'message': `${doc_name} Updated Successfully` });
                    })
                    .catch((error) => {
                        return res.status(403).send({ 'status': false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE });
                    })
            } else {
                var saveDoc = {}
                saveDoc.doc_category = doc_category;
                if (typeof sub_doc_category !== 'undefined') {
                    saveDoc.sub_doc_category = sub_doc_category;
                }
                saveDoc.doc_name = doc_name;
                saveDoc.docs = [];
                saveDoc.file_name = req.file.filename;
                saveDoc.mime_type = getImageType(req.file.mimetype);
                saveDoc.file_size = convertBitsIntoKbMb(req.file.size);
                saveDoc.add_date = dbDateFormat();
                saveDoc.status = 'complete';

                JobAppliedCandidateCl.updateOne({ _id: dbObjectId(_id) }, { $set: saveData, $push: { docs: saveDoc } })
                    .then((data) => {
                        return res.status(200).send({ 'status': true, 'message': `${doc_name} Updated Successfully` });
                    }).catch((error) => {
                        console.log(error);
                        return res.status(403).send({ 'status': false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE });
                    });
            }

        }).catch((error) => {
            console.log(error);
            return res.status(403).send({ 'status': false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE });
        });
}

controller.getCandidateById = (req, res) => {

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


    JobAppliedCandidateCl.find({ _id: dbObjectId(_id) }, fetchKeys)
        .then((data) => {

            if (data.length > 0) {
                const outPutData = updateDatesInArray(replaceNullUndefined(data), ['last_working_day', 'add_date', 'updated_on'], 'date');
                return res.status(200).send({ 'status': true, 'data': outPutData[0], 'message': 'API Accessed Successfully' });
            } else {
                return res.status(204).send({ 'status': false, 'message': 'No record matched' });
            }
        }).catch((error) => {
            console.log(error);
            return res.status(403).send({ 'status': false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE });
        });
}

controller.changeKycStepStatus = (req, res) => {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(409).json({ status: false, message: errors.array()[0].msg });
    }

    const { _id } = req.body;

    let saveData = {}
    saveData = req.body;
    saveData.updated_on = dbDateFormat();

    JobAppliedCandidateCl.updateOne({ _id: dbObjectId(_id) }, { $set: saveData })
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

var pushDataOnNaukariPortal = async (naukriId, stage) => {
    const NAUKRI_JOBS_API_KEY = process.env.NAUKRI_JOBS_API_KEY;
    try {
        const payLoad = {}
        payLoad.sourceType = 'api';
        payLoad.stage = stage;

        var apiResponseDataUp = await axios.post(`https://api.zwayam.com/amplify/v2/applies/${naukriId}/stage`, payLoad, {
            headers: {
                'Content-Type': 'application/json',
                'api_key': NAUKRI_JOBS_API_KEY
            }
        });

        //console.log( apiResponseDataUp.data );

    } catch (error) {
        //console.log(  error.response?.data || error.message );
        return false;
    }
}
var updateCandidateJobRecordOnNaukri = async (dataList, stage) => {
    dataList.forEach((item) => {

        if (item.applied_jobs.length > 0 && typeof item?.applied_jobs[0]?.naukri_ref_id !== 'undefined' && item?.applied_jobs[0]?.naukri_ref_id !== '') {
            pushDataOnNaukariPortal(item?.applied_jobs[0]?.naukri_ref_id, stage);
        }
    });
}

controller.shortListCandidates = (req, res) => {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(403).json({ status: false, message: errors.array()[0].msg });
    }

    const { role_user_id, candidate_ids, status, add_by_mobile, add_by_name, add_by_designation, add_by_email } = req.body;

    var batch_id = '';
    if (req.body.hasOwnProperty('batch_id') && req.body.batch_id !== '') {
        batch_id = parseInt(req.body.batch_id);
    }

    const bulkOps = candidate_ids.map(({ candidate_id, applied_job_id }) => ({
        updateOne: {
            filter: {
                _id: dbObjectId(candidate_id),
                'applied_jobs._id': dbObjectId(applied_job_id)
            },
            update: {
                $set: {
                    'form_status': status,
                    'batch_id': batch_id,
                    'profile_status': 'Active',
                    'applied_jobs.$.form_status': status,
                    'applied_jobs.$.batch_id': batch_id,
                    'updated_on': dbDateFormat()
                }
            }
        }
    }));


    const mailRegards = {}
    mailRegards.name = add_by_name || '';
    mailRegards.email = add_by_email || '';
    mailRegards.mobile = add_by_mobile || '';
    mailRegards.designation = add_by_designation || '';

    JobAppliedCandidateCl.bulkWrite(bulkOps)
        .then((data) => {

            //fetch candidates from database
            const candidateIdsList = candidate_ids.map(candidate => dbObjectId(candidate.candidate_id));

            JobAppliedCandidateCl.find({ _id: { $in: candidateIdsList } }, { _id: 1, name: 1, email: 1, job_id: 1, 'applied_jobs.naukri_ref_id': 1, 'applied_jobs._id': 1, 'applied_jobs.job_id': 1, 'applied_jobs.job_title': 1, 'applied_jobs.job_designation': 1, 'applied_jobs.job_location': 1 })
                .then((dataList) => {
                    if (dataList.length > 0) {
                        //update page steps:
                        updateCandidatePageSteps(candidate_ids, [{ 'step': '1', 'page': 'MCQ', 'status': 'pending' }]);
                        dataList.forEach((item) => {
                            if (typeof item.email !== 'undefined' && item.email !== '') {
                                const matchID = candidate_ids.find((cElm) => cElm.candidate_id.toString() === item._id.toString());
                                const matchJob = item.applied_jobs?.find(elm => elm._id.toString() === matchID?.applied_job_id?.toString());

                                if (matchJob) {
                                    shortListCandidateMail(item.email, item.name, matchJob?.job_title, matchJob?.job_designation, matchJob?.job_location, mailRegards);
                                    updateCandidateJobRecords(matchJob?.job_id.toString(), '');
                                } else {
                                    updateCandidateJobRecords(item.job_id.toString(), '');
                                }
                            }

                        });
                        /*update status on naukri portal*/
                        updateCandidateJobRecordOnNaukri(dataList, status);
                    }
                    return res.status(200).send({ 'status': true, 'message': 'Status Updated Successfully' });
                });

        }).catch((error) => {
            return res.status(403).send({ 'status': false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE });
        });
}

controller.RejectDeleteInterview = (req, res) => {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(403).json({ status: false, message: errors.array()[0].msg });
    }

    const { candidate_id, applied_job_id, status } = req.body;

    if (status === 'Deleted') {

        JobAppliedCandidateCl.findOne({ _id: dbObjectId(candidate_id) }, { applied_jobs: 1, name: 1, email: 1, job_title: 1, job_id: 1, form_status: 1 })
            .then((dataList) => {
                if (typeof dataList !== 'undefined') {
                    JobAppliedCandidateCl.deleteOne({ _id: dbObjectId(candidate_id) })
                        .then((data) => {
                            updateCandidateJobRecords(dataList.job_id.toString(), '');
                            return res.status(200).send({ 'status': true, 'message': `Candidate Deleted Successfully` });
                        }).catch((error) => {
                            return res.status(403).send({ 'status': false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE });
                        });
                } else {
                    return res.status(200).send({ 'status': true, 'message': `Candidate ${status} Successfully` });
                }
            });

    } else {

        const arrayFilters = { 'arrayFilters': [{ 'one._id': dbObjectId(applied_job_id) }] }

        const where = {}
        where._id = dbObjectId(candidate_id);
        where['applied_jobs._id'] = dbObjectId(applied_job_id);

        const saveData = {}
        saveData.form_status = status;
        saveData['applied_jobs.$[one].form_status'] = status;

        JobAppliedCandidateCl.updateOne(where, { $set: saveData }, arrayFilters)
            .then((data) => {
                if (data.modifiedCount === 1) {

                    JobAppliedCandidateCl.find({ _id: dbObjectId(candidate_id) }, { name: 1, email: 1, job_title: 1, job_id: 1, form_status: 1 })
                        .then((dataList) => {
                            if (dataList.length > 0) {
                                dataList.map((item) => {
                                    if (typeof item.email !== 'undefined' && item.email !== '') {
                                        rejectApplyJobMail(item.email, item.name, item.job_title);
                                    }
                                    updateCandidateJobRecords(item.job_id.toString(), '');
                                });
                            }
                            return res.status(200).send({ 'status': true, 'message': `Job ${status} Successfully` });
                        });
                } else {
                    return res.status(403).send({ 'status': false, 'message': 'No action performed' });
                }
            }).catch((error) => {
                return res.status(403).send({ 'status': false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE });
            });
    }
}

controller.scheduleInterView = (req, res) => {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(403).json({ status: false, message: errors.array()[0].msg });
    }

    //console.log( req.body );

    const { candidate_id, applied_job_id, interview_host, stage, google_meet_link, interview_type, interview_duration, interview_date, interviewer, venue_location, added_by_name, added_by_mobile, added_by_designation, added_by_email } = req.body;


    const mailRegards = {}
    mailRegards.name = added_by_name || '';
    mailRegards.email = added_by_email || '';
    mailRegards.mobile = added_by_mobile || '';
    mailRegards.designation = added_by_designation || '';


    const arrayFilters = { 'arrayFilters': [{ 'one._id': dbObjectId(applied_job_id) }] }

    const where = {}
    where._id = dbObjectId(candidate_id);
    where['applied_jobs._id'] = dbObjectId(applied_job_id);

    //fetch records
    JobAppliedCandidateCl.findOne({ _id: dbObjectId(candidate_id), 'applied_jobs._id': dbObjectId(applied_job_id) }, { 'applied_jobs': 1, 'email': 1, 'name': 1, 'job_title': 1 })
        .then((oldData) => {

            const findOldInterViewerData = oldData.applied_jobs.find((item) => item._id.toString() === applied_job_id.toString());

            var getOtherStageInterViewerList = [];
            var getCurrentInterViewerList = [];
            if (typeof findOldInterViewerData.interviewer !== 'undefined' && findOldInterViewerData.interviewer.length > 0) {
                getOtherStageInterViewerList = findOldInterViewerData.interviewer.filter((item) => item.stage !== stage);
                getCurrentInterViewerList = findOldInterViewerData.interviewer.filter((item) => item.stage == stage);
            }


            const saveData = {}
            saveData.form_status = 'Interview';
            saveData.updated_on = dbDateFormat();
            saveData['applied_jobs.$[one].form_status'] = 'Interview';
            saveData['applied_jobs.$[one].interview_date'] = convertToDbDate(interview_date);
            saveData['applied_jobs.$[one].interview_duration'] = interview_duration;
            saveData['applied_jobs.$[one].interview_type'] = interview_type;

            /*forcefully added due to live old records it can be skipped*/
            saveData['applied_jobs.$[one].final_job_offer_approval_status'] = 'No';

            saveData['applied_jobs.$[one].stage'] = stage;
            saveData['applied_jobs.$[one].interview_host'] = interview_host;
            if (typeof google_meet_link !== 'undefined' && google_meet_link !== '' && interview_type === 'Online') {
                saveData['applied_jobs.$[one].google_meet_link'] = google_meet_link;
            } else {
                saveData['applied_jobs.$[one].venue_location'] = venue_location;
            }


            var interviewerList = [];
            //Push Other Stage Data
            for (var i = 0; i < getOtherStageInterViewerList.length; i++) {
                var element = getOtherStageInterViewerList[i];
                interviewerList.push(element);
            }

            //push new Records 
            for (var i = 0; i < interviewer.length; i++) {
                var element = interviewer[i];
                const pushData = {};
                var findMatchItem = getCurrentInterViewerList.find((item) => item.employee_id.toString() === element.employee_id.toString());

                if (typeof findMatchItem !== 'undefined' && findMatchItem && getCurrentInterViewerList) {
                    pushData.employee_name = element.employee_name;
                    pushData.designation = element.designation;
                    pushData.employee_id = findMatchItem.employee_id;
                    pushData.rating = findMatchItem.rating;
                    pushData.status = findMatchItem.status;
                    pushData.stage = stage;
                    pushData.add_date = findMatchItem.add_date;
                    pushData.interview_date = convertToDbDate(interview_date);
                } else {
                    pushData.employee_name = element.employee_name;
                    pushData.designation = element.designation;
                    pushData.employee_id = dbObjectId(element.employee_id);
                    pushData.rating = 0;
                    pushData.status = 'Pending';
                    pushData.stage = stage;
                    pushData.add_date = dbDateFormat();
                    pushData.interview_date = convertToDbDate(interview_date);
                }
                interviewerList.push(pushData);
            }


            JobAppliedCandidateCl.updateOne(where, { $set: { 'applied_jobs.$[one].interviewer': [], ...saveData } }, arrayFilters)
                .then((data) => {
                    if (data.modifiedCount === 1) {
                        updateCandidateJobRecords(findOldInterViewerData.job_id.toString(), findOldInterViewerData.project_id.toString());
                        if (interviewerList) {
                            JobAppliedCandidateCl.updateOne(where, { $push: { 'applied_jobs.$[one].interviewer': interviewerList } }, arrayFilters)
                                .then((data) => {

                                    /**Send schedule Email To candidate */
                                    //if( Object.keys( findOldInterViewerData ).length > 0  && findOldInterViewerData.interview_host === 'Panel'){
                                    if (req.body.hasOwnProperty('send_candidate_email') && ['Yes', 'yes', 'YES'].includes(req.body.send_candidate_email)) {
                                        ScheduleInterviewMail(oldData.email, oldData.name, oldData.job_title, interview_date, interview_type, google_meet_link, venue_location, mailRegards);
                                    }
                                    //}
                                    /**Send schedule Email To Interviewers */

                                    /*update status on naukri portal*/
                                    if (findOldInterViewerData && typeof findOldInterViewerData?.naukri_ref_id !== 'undefined' && findOldInterViewerData?.naukri_ref_id !== '') {
                                        pushDataOnNaukariPortal(findOldInterViewerData?.naukri_ref_id, 'Interview Scheduled');
                                    }

                                    if (interviewer.length > 0) {

                                        //fetch employee list 
                                        const employeeList = interviewer.map((item) => dbObjectId(item.employee_id));

                                        EmployeeCI.find({ _id: { $in: employeeList } }, { name: 1, email: 1 })
                                            .then((dataList) => {
                                                if (dataList.length > 0) {

                                                    dataList.map((item) => {
                                                        if (typeof item.email !== 'undefined' && item.email !== '' && req.body.hasOwnProperty('send_interviewers_email') && ['Yes', 'yes', 'YES'].includes(req.body.send_interviewers_email)) {
                                                            //scheduleInterviewerMail( item.email, oldData.name, oldData.job_title, interview_date, interview_type, google_meet_link, item.name , venue_location, mailRegards );
                                                            scheduleInterviewerMail(item.email, oldData.name, oldData.job_title, interview_date, interview_type, google_meet_link, item.name, venue_location, null);
                                                        }
                                                    });
                                                }
                                                return res.status(200).send({ 'status': true, 'message': `Interview Scheduled Successfully` });
                                            });

                                    } else {
                                        return res.status(200).send({ 'status': true, 'message': `Interview Scheduled Successfully` });
                                    }
                                }).catch((error) => {
                                    console.log(error);
                                    return res.status(403).send({ 'status': false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE });
                                });
                        } else {
                            return res.status(403).send({ 'status': false, 'message': 'No action performed' });
                        }
                    } else {
                        return res.status(403).send({ 'status': false, 'message': 'No action performed' });
                    }
                }).catch((error) => {
                    console.log(error);
                    return res.status(403).send({ 'status': false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE });
                });

        }).catch((error) => {
            console.log(error);
            return res.status(403).send({ 'status': false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE });
        });
}


function scheduleInterToBulkCandidatesInLoop(req, candidate_id, applied_job_id, mailRegards) {

    const { interview_host, stage, google_meet_link, interview_type, interview_duration, interview_date, interviewer, venue_location } = req.body;

    //console.log( 'applied_job_id:'+applied_job_id );
    //console.log( 'interview_host:'+interview_host );


    const arrayFilters = { 'arrayFilters': [{ 'one._id': dbObjectId(applied_job_id) }] }

    const where = {}
    where._id = dbObjectId(candidate_id);
    where['applied_jobs._id'] = dbObjectId(applied_job_id);

    //fetch records
    JobAppliedCandidateCl.findOne({ _id: dbObjectId(candidate_id), 'applied_jobs._id': dbObjectId(applied_job_id) }, { 'applied_jobs': 1, 'email': 1, 'name': 1, 'job_title': 1 })
        .then((oldData) => {

            const findOldInterViewerData = oldData.applied_jobs.find((item) => item._id.toString() === applied_job_id.toString());

            var getOtherStageInterViewerList = [];
            var getCurrentInterViewerList = [];
            if (typeof findOldInterViewerData.interviewer !== 'undefined' && findOldInterViewerData.interviewer.length > 0) {
                getOtherStageInterViewerList = findOldInterViewerData.interviewer.filter((item) => item.stage !== stage);
                getCurrentInterViewerList = findOldInterViewerData.interviewer.filter((item) => item.stage == stage);
            }


            const saveData = {}
            saveData.form_status = 'Interview';
            saveData.updated_on = dbDateFormat();
            saveData['applied_jobs.$[one].form_status'] = 'Interview';
            saveData['applied_jobs.$[one].interview_date'] = convertToDbDate(interview_date);
            saveData['applied_jobs.$[one].interview_duration'] = interview_duration;
            saveData['applied_jobs.$[one].interview_type'] = interview_type;

            /*forcefully added due to live old records it can be skipped*/
            saveData['applied_jobs.$[one].final_job_offer_approval_status'] = 'No';

            saveData['applied_jobs.$[one].stage'] = stage;
            saveData['applied_jobs.$[one].interview_host'] = interview_host;
            if (typeof google_meet_link !== 'undefined' && google_meet_link !== '' && interview_type === 'Online') {
                saveData['applied_jobs.$[one].google_meet_link'] = google_meet_link;
            } else {
                saveData['applied_jobs.$[one].venue_location'] = venue_location;
            }


            var interviewerList = [];
            //Push Other Stage Data
            for (var i = 0; i < getOtherStageInterViewerList.length; i++) {
                var element = getOtherStageInterViewerList[i];
                interviewerList.push(element);
            }

            //push new Records 
            for (var i = 0; i < interviewer.length; i++) {
                var element = interviewer[i];
                const pushData = {};
                var findMatchItem = getCurrentInterViewerList.find((item) => item.employee_id.toString() === element.employee_id.toString());

                if (typeof findMatchItem !== 'undefined' && findMatchItem && getCurrentInterViewerList) {
                    pushData.employee_name = element.employee_name;
                    pushData.designation = element.designation;
                    pushData.employee_id = findMatchItem.employee_id;
                    pushData.rating = findMatchItem.rating;
                    pushData.status = findMatchItem.status;
                    pushData.stage = stage;
                    pushData.add_date = findMatchItem.add_date;
                    pushData.interview_date = convertToDbDate(interview_date);
                } else {
                    pushData.employee_name = element.employee_name;
                    pushData.designation = element.designation;
                    pushData.employee_id = dbObjectId(element.employee_id);
                    pushData.rating = 0;
                    pushData.status = 'Pending';
                    pushData.stage = stage;
                    pushData.add_date = dbDateFormat();
                    pushData.interview_date = convertToDbDate(interview_date);
                }
                interviewerList.push(pushData);
            }


            JobAppliedCandidateCl.updateOne(where, { $set: { 'applied_jobs.$[one].interviewer': [], ...saveData } }, arrayFilters)
                .then((data) => {
                    if (data.modifiedCount === 1) {
                        updateCandidateJobRecords(findOldInterViewerData.job_id.toString(), findOldInterViewerData.project_id.toString());
                        if (interviewerList) {
                            JobAppliedCandidateCl.updateOne(where, { $push: { 'applied_jobs.$[one].interviewer': interviewerList } }, arrayFilters)
                                .then((data) => {

                                    /**Send schedule Email To candidate */
                                    //if( Object.keys( findOldInterViewerData ).length > 0  && findOldInterViewerData.interview_host === 'Panel'){
                                    if (req.body.hasOwnProperty('send_candidate_email') && ['Yes', 'yes', 'YES'].includes(req.body.send_candidate_email)) {
                                        ScheduleInterviewMail(oldData.email, oldData.name, oldData.job_title, interview_date, interview_type, google_meet_link, venue_location, mailRegards);
                                    }
                                    //}
                                    /**Send schedule Email To Interviewers */
                                    if (interviewer.length > 0) {

                                        //fetch employee list 
                                        const employeeList = interviewer.map((item) => dbObjectId(item.employee_id));

                                        EmployeeCI.find({ _id: { $in: employeeList } }, { name: 1, email: 1 })
                                            .then((dataList) => {
                                                if (dataList.length > 0) {

                                                    dataList.map((item) => {
                                                        if (typeof item.email !== 'undefined' && item.email !== '' && req.body.hasOwnProperty('send_interviewers_email') && ['Yes', 'yes', 'YES'].includes(req.body.send_interviewers_email)) {
                                                            scheduleInterviewerMail(item.email, oldData.name, oldData.job_title, interview_date, interview_type, google_meet_link, item.name, venue_location);
                                                        }
                                                    });
                                                }
                                                //console.log('Scheduled for id:');
                                                //return res.status(200).send( {'status':true, 'message': `Interview Scheduled Successfully`} ); 
                                            });

                                    } else { //console.log('Scheduled');
                                        // return res.status(200).send( {'status':true, 'message': `Interview Scheduled Successfully`} ); 
                                    }
                                }).catch((error) => {   //console.log( error );
                                    //return res.status(403).send( {'status':false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE } ); 
                                });
                        } else {   //console.log( 'No action performed' );
                            //return res.status(403).send( {'status':false, 'message': 'No action performed'} );
                        }
                    } else {  //console.log( 'No action performed' );
                        //return res.status(403).send( {'status':false, 'message': 'No action performed'} );
                    }
                }).catch((error) => {   // console.log( error );
                    //return res.status(403).send( {'status':false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE } ); 
                });

        }).catch((error) => {   //console.log( error ); 
            //return res.status(403).send( {'status':false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE } ); 
        });
}


controller.scheduleBulkInterView = (req, res) => {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(403).json({ status: false, message: errors.array()[0].msg });
    }

    //console.log( req.body );

    const { candidate_ids, added_by_name, added_by_mobile, added_by_designation, added_by_email } = req.body;

    const mailRegards = {}
    mailRegards.name = added_by_name || '';
    mailRegards.email = added_by_email || '';
    mailRegards.mobile = added_by_mobile || '';
    mailRegards.designation = added_by_designation || '';

    candidate_ids.forEach((item) => {
        scheduleInterToBulkCandidatesInLoop(req, item.cand_id, item.applied_job_id, mailRegards);
    });

    return res.status(200).send({ 'status': true, 'message': `Interview Scheduled Successfully` });
}



controller.scheduleInterViewDate = (req, res) => {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(403).json({ status: false, message: errors.array()[0].msg });
    }

    const { candidate_id, applied_job_id, interview_duration, interview_date, interviewer_id } = req.body;

    const arrayFilters = { 'arrayFilters': [{ 'one._id': dbObjectId(applied_job_id) }, { 'two._id': dbObjectId(interviewer_id) }] }

    const where = {}
    where._id = dbObjectId(candidate_id);
    where['applied_jobs._id'] = dbObjectId(applied_job_id);
    where['applied_jobs.interviewer._id'] = dbObjectId(interviewer_id);

    const saveData = {}
    saveData.updated_on = dbDateFormat();
    saveData['applied_jobs.$[one].interview_date'] = convertToDbDate(interview_date);
    saveData['applied_jobs.$[one].interview_duration'] = interview_duration;
    saveData['applied_jobs.$[one].interviewer.$[two].interview_date'] = convertToDbDate(interview_date);
    saveData['applied_jobs.$[one].interviewer.$[two].status'] = 'Accept';


    JobAppliedCandidateCl.updateOne(where, { $set: saveData }, arrayFilters)
        .then((data) => {
            if (data.modifiedCount === 1) {
                JobAppliedCandidateCl.findOne({ _id: dbObjectId(candidate_id), 'applied_jobs._id': dbObjectId(applied_job_id) }, { 'applied_jobs': 1, 'email': 1, 'name': 1, 'job_title': 1 })
                    .then((oldData) => {

                        const findOldInterViewerData = oldData.applied_jobs.find((item) => item._id.toString() === applied_job_id);
                        /**Send schedule Email To candidate */
                        if (Object.keys(findOldInterViewerData).length > 0 && findOldInterViewerData.interview_host === 'Panel' && req.body.hasOwnProperty('send_candidate_email') && ['Yes', 'yes', 'YES'].includes(req.body.send_candidate_email)) {
                            //ScheduleInterviewMail( oldData.email, oldData.name, oldData.job_title, interview_date, findOldInterViewerData.interview_type, findOldInterViewerData.google_meet_link );
                        }
                        return res.status(200).send({ 'status': true, 'message': `Interview Scheduled Successfully` });
                    });
            } else {
                return res.status(403).send({ 'status': false, 'message': 'No action performed' });
            }
        }).catch((error) => {
            return res.status(403).send({ 'status': false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE });
        });
}

controller.employeeAcceptRejectInterview = (req, res) => {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(403).json({ status: false, message: errors.array()[0].msg });
    }

    const { interviewer_id, candidate_id, applied_job_id, status, comment } = req.body;

    if (typeof comment !== 'undefined' && comment === '' && status === 'Reject') {
        return res.status(403).send({ 'status': false, 'message': 'Please provide the reason' });
    }

    const arrayFilters = { 'arrayFilters': [{ 'one._id': dbObjectId(applied_job_id) }, { 'two._id': dbObjectId(interviewer_id) }] }

    const where = {}
    where._id = dbObjectId(candidate_id);
    where['applied_jobs._id'] = dbObjectId(applied_job_id);
    where['applied_jobs.interviewer._id'] = dbObjectId(interviewer_id);

    const saveData = {}
    saveData.updated_on = dbDateFormat();
    saveData['applied_jobs.$[one].interviewer.$[two].status'] = status;
    saveData['applied_jobs.$[one].interviewer.$[two].updated_on'] = dbDateFormat();
    if (typeof comment !== 'undefined' && comment !== '') {
        saveData['applied_jobs.$[one].interviewer.$[two].comment'] = comment;
    }


    JobAppliedCandidateCl.updateOne(where, { $set: saveData }, arrayFilters)
        .then((data) => {

            if (data.modifiedCount === 1) {
                return res.status(200).send({ 'status': true, 'message': `Interview ${status} Successfully` });
            } else {
                return res.status(403).send({ 'status': false, 'message': 'No action performed' });
            }
        }).catch((error) => {
            return res.status(403).send({ 'status': false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE });
        });
}



controller.getUpcomingInterViewList = (req, res) => {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(403).json({ status: false, message: errors.array()[0].msg });
    }

    const { page_no, per_page_record, scope_fields } = req.body;

    const fetchKeys = {}

    if (req.body.hasOwnProperty('scope_fields') && scope_fields.length > 0) {
        scope_fields.forEach(field => {
            fetchKeys[field] = 1;
        });
    } else {
        fetchKeys.__v = 0;
    }

    const now = new Date();

    let where = {}
    //where['form_status'] = 'Interview';
    where['applied_jobs.form_status'] = 'Interview';
    where['applied_jobs.interview_date'] = { $gte: now };
    if (req.body.hasOwnProperty('job_id') && req.body.job_id !== '') {
        where['job_id'] = dbObjectId(req.body.job_id);
    }

    const pageOptions = {
        page: parseInt(((page_no ? page_no : 1) - 1)) || 0,
        limit: parseInt(per_page_record) || 10
    }

    JobAppliedCandidateCl.find(where, fetchKeys)
        .skip(pageOptions.page * pageOptions.limit)
        .limit(pageOptions.limit)
        .sort({ 'applied_jobs.add_date': -1 })
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

controller.countInterviewRecords = (req, res) => {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(403).json({ status: false, message: errors.array()[0].msg });
    }

    const { type } = req.body;

    const fetchKeys = { _id: 1 }

    const now = new Date();

    let where = {}
    if (type === 'Upcoming') {
        where['applied_jobs.form_status'] = { $in: ['Interview'] };
        where['applied_jobs.interview_date'] = { $gte: now };
    }
    else if (type === 'Applied') {
        where['form_status'] = 'Applied';
        where['applied_jobs.form_status'] = 'Applied';
    }
    else if (type === 'Assessment') {
        where['assessment_status'] = 'Complete';
    }

    if (req.body.hasOwnProperty('job_id') && req.body.job_id !== '') {
        where['job_id'] = dbObjectId(req.body.job_id);
    }

    JobAppliedCandidateCl.countDocuments(where, fetchKeys)
        .then((data) => {
            var countItems = parseInt(data) || 0
            return res.status(200).send({ 'status': true, 'data': countItems, 'message': 'API Accessed Successfully' });

        }).catch((error) => {
            return res.status(403).send({ 'status': false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE });
        });
}

controller.saveFeedback = (req, res) => {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(403).json({ status: false, message: errors.array()[0].msg });
    }

    const { candidate_id, applied_job_id, interviewer_id, exposure_to_job_profile, job_match, comment, job_knowledge, creative_problem_solving, team_player, communication_skill, feedback_date } = req.body;

    const arrayFilters = { 'arrayFilters': [{ 'one._id': dbObjectId(applied_job_id) }, { 'two._id': dbObjectId(interviewer_id) }] }

    const where = {}
    where._id = dbObjectId(candidate_id);
    where['applied_jobs._id'] = dbObjectId(applied_job_id);
    where['applied_jobs.interviewer._id'] = dbObjectId(interviewer_id);

    const saveData = {}
    saveData.updated_on = dbDateFormat();
    saveData['applied_jobs.$[one].interviewer.$[two].updated_on'] = dbDateFormat();
    saveData['applied_jobs.$[one].interviewer.$[two].exposure_to_job_profile'] = exposure_to_job_profile;
    saveData['applied_jobs.$[one].interviewer.$[two].comment'] = comment;
    saveData['applied_jobs.$[one].interviewer.$[two].job_match'] = job_match;
    saveData['applied_jobs.$[one].interviewer.$[two].job_knowledge'] = job_knowledge;
    saveData['applied_jobs.$[one].interviewer.$[two].creative_problem_solving'] = creative_problem_solving;
    saveData['applied_jobs.$[one].interviewer.$[two].team_player'] = team_player;
    saveData['applied_jobs.$[one].interviewer.$[two].communication_skill'] = communication_skill;
    saveData['applied_jobs.$[one].interviewer.$[two].total'] = exposure_to_job_profile + job_match + job_knowledge + creative_problem_solving + team_player + communication_skill;
    saveData['applied_jobs.$[one].interviewer.$[two].feedback_status'] = 'Approved';
    saveData['applied_jobs.$[one].interviewer.$[two].status'] = 'Accept';
    saveData['applied_jobs.$[one].interviewer.$[two].feedback_date'] = convertToDbDate(feedback_date);
    saveData['applied_jobs.$[one].interviewer.$[two].candidate_participate_status'] = 'Attempt';

    if (req.body.hasOwnProperty('hiring_suggestion_status') && req.body.hiring_suggestion_status !== '') {
        saveData['applied_jobs.$[one].interviewer.$[two].hiring_suggestion_status'] = req.body.hiring_suggestion_status || '';
    }
    if (req.body.hasOwnProperty('hiring_suggestion_percent')) {
        saveData['applied_jobs.$[one].interviewer.$[two].hiring_suggestion_percent'] = parseInt(req.body.hiring_suggestion_percent) || 0;
    }

    if (req.body.hasOwnProperty('add_by') && req.body.add_by !== '') {
        saveData['applied_jobs.$[one].interviewer.$[two].added_by'] = req.body.add_by;
    }

    JobAppliedCandidateCl.updateOne(where, { $set: saveData }, arrayFilters)
        .then((data) => {

            console.log(data);

            JobAppliedCandidateCl.findOne({ _id: dbObjectId(candidate_id) }, { 'applied_jobs._id': 1, 'applied_jobs.interviewer.employee_id': 1, 'applied_jobs.interviewer.total': 1 })
                .then((candidateData) => {

                    const getInterviewerList = candidateData?.applied_jobs.find((item) => item._id.toString() === applied_job_id.toString())?.interviewer;

                    const totalSum = getInterviewerList ? getInterviewerList.reduce((sum, item) => sum + item.total, 0) : 0;
                    const averageRating = totalSum > 0 ? totalSum / getInterviewerList.length : 0;
                    const totalProfileAvgRating = averageRating.toFixed(2);
                    JobAppliedCandidateCl.updateOne({ _id: dbObjectId(candidate_id) }, { $set: { 'profile_avg_rating': totalProfileAvgRating } })
                        .then((data) => {
                            return res.status(200).send({ 'status': true, 'message': `Feedback Submitted Successfully` });
                        })
                        .catch((error) => {
                            return res.status(403).send({ 'status': false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE });
                        })
                })
                .catch((error) => {
                    console.log(error);
                    return res.status(403).send({ 'status': false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE });
                })

        }).catch((error) => {
            console.log(error);
            return res.status(403).send({ 'status': false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE });
        });
}

/**********Save candidate not attempted interview feedback **********/
controller.saveSkippedInterviewCandidateFeedback = async (req, res) => {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(403).json({ status: false, message: errors.array()[0].msg });
    }

    const { candidate_id, applied_job_id, interviewer_id, comment, feedback_date } = req.body;

    const arrayFilters = { 'arrayFilters': [{ 'one._id': dbObjectId(applied_job_id) }, { 'two._id': dbObjectId(interviewer_id) }] }

    const where = {}
    where._id = dbObjectId(candidate_id);
    where['applied_jobs._id'] = dbObjectId(applied_job_id);
    where['applied_jobs.interviewer._id'] = dbObjectId(interviewer_id);

    const saveData = {}
    saveData.updated_on = dbDateFormat();
    saveData['applied_jobs.$[one].interviewer.$[two].updated_on'] = dbDateFormat();
    saveData['applied_jobs.$[one].interviewer.$[two].exposure_to_job_profile'] = 0;
    saveData['applied_jobs.$[one].interviewer.$[two].comment'] = comment;
    saveData['applied_jobs.$[one].interviewer.$[two].job_match'] = 0;
    saveData['applied_jobs.$[one].interviewer.$[two].job_knowledge'] = 0;
    saveData['applied_jobs.$[one].interviewer.$[two].creative_problem_solving'] = 0;
    saveData['applied_jobs.$[one].interviewer.$[two].team_player'] = 0;
    saveData['applied_jobs.$[one].interviewer.$[two].communication_skill'] = 0;
    saveData['applied_jobs.$[one].interviewer.$[two].total'] = 0;
    saveData['applied_jobs.$[one].interviewer.$[two].feedback_status'] = 'Approved';
    saveData['applied_jobs.$[one].interviewer.$[two].status'] = 'Accept';
    saveData['applied_jobs.$[one].interviewer.$[two].feedback_date'] = convertToDbDate(feedback_date);
    saveData['applied_jobs.$[one].interviewer.$[two].candidate_participate_status'] = 'NotAttempt';

    if (req.body.hasOwnProperty('add_by_name') && req.body.add_by_name !== '') {
        saveData['applied_jobs.$[one].interviewer.$[two].add_by_name'] = req.body.add_by_name;
    }


    try {
        const result = await JobAppliedCandidateCl.updateOne(where, { $set: saveData }, arrayFilters);
        return res.status(200).send({ 'status': true, 'message': `Feedback Submitted Successfully` });
    } catch (error) {
        console.log(error);
        return res.status(403).send({ 'status': false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE });
    }
}


controller.saveRecommendationStatus = (req, res) => {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(403).json({ status: false, message: errors.array()[0].msg });
    }

    const { candidate_id, applied_job_id, recommendation, interview_status } = req.body;

    const arrayFilters = { 'arrayFilters': [{ 'one._id': dbObjectId(applied_job_id) }] }

    const where = {}
    where._id = dbObjectId(candidate_id);
    where['applied_jobs._id'] = dbObjectId(applied_job_id);

    const saveData = {}
    saveData.updated_on = dbDateFormat();
    saveData['applied_jobs.$[one].recommendation'] = recommendation;
    saveData['applied_jobs.$[one].interview_status'] = interview_status;

    JobAppliedCandidateCl.updateOne(where, { $set: saveData }, arrayFilters)
        .then((data) => {

            if (data.modifiedCount === 1) {
                return res.status(200).send({ 'status': true, 'message': `Recommendation Status Submitted Successfully` });
            } else {
                return res.status(403).send({ 'status': false, 'message': 'No action performed' });
            }
        }).catch((error) => {
            return res.status(403).send({ 'status': false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE });
        });
}

controller.uploadResume = (req, res) => {

    if (req.body && typeof req.body === 'object') {
        req.body = JSON.parse(JSON.stringify(req.body));
    }

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        if (req.file && req.file.filename) {
            removeFile(req.file.filename);
        }
        return res.status(403).json({ status: false, message: errors.array()[0].msg });
    }

    const { candidate_id } = req.body;

    let saveData = {}
    saveData = req.body;
    saveData.updated_on = dbDateFormat();

    if (req.file && req.file.filename) {
        saveData.resume_file = req.file.filename;
        //delete old file
        if (typeof req.body.old_resume_file !== 'undefined' && req.body.old_resume_file !== '') {
            removeFile(req.body.old_resume_file);
        }
    }

    JobAppliedCandidateCl.updateOne({ _id: dbObjectId(candidate_id) }, { $set: saveData })
        .then((data) => {
            if (data.modifiedCount === 1) {
                return res.status(200).send({ 'status': true, 'message': 'Resume File Uploaded Successfully' });
            } else if (data.modifiedCount === 0) {
                return res.status(200).send({ 'status': false, 'message': 'No Action Performed' });
            } else {
                return res.status(403).send({ 'status': false, 'message': process.env.DEFAULT_ERROR_MESSAGE });
            }
        }).catch((error) => {
            return res.status(403).send({ 'status': false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE });
        });
}


controller.offerJob = (req, res) => {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(403).json({ status: false, message: errors.array()[0].msg });
    }

    const { candidate_id, applied_job_id, onboard_date, offer_ctc } = req.body;

    const arrayFilters = { 'arrayFilters': [{ 'one._id': dbObjectId(applied_job_id) }] }

    const where = {}
    where._id = dbObjectId(candidate_id);
    where['applied_jobs._id'] = dbObjectId(applied_job_id);

    const tokenPayload = {}
    tokenPayload.candidate_id = candidate_id;
    tokenPayload.job_id = applied_job_id;
    const token = generateJwtToken(tokenPayload);

    const combineVerifyToken = candidate_id + '|' + applied_job_id + '|' + token;

    const saveData = {}
    saveData.form_status = 'Offer';
    saveData.verify_token = Buffer.from(combineVerifyToken).toString('base64');
    saveData['applied_jobs.$[one].form_status'] = 'Offer';
    saveData['applied_jobs.$[one].offer_status'] = 'Pending';
    saveData['applied_jobs.$[one].offer_ctc'] = parseFloat(offer_ctc);
    saveData['applied_jobs.$[one].onboard_date'] = convertToDbDate(onboard_date);

    JobAppliedCandidateCl.updateOne(where, { $set: saveData }, arrayFilters)
        .then((data) => {

            //if( data.modifiedCount === 1 ){ 
            JobAppliedCandidateCl.find({ _id: dbObjectId(candidate_id) }, { name: 1, email: 1, job_title: 1, 'applied_jobs': 1 })
                .then((dataList) => {

                    if (dataList.length > 0) {
                        dataList.map((item) => {
                            if (typeof item.email !== 'undefined' && item.email !== '') {
                                var findMatchItem = item.applied_jobs.find((item) => item._id.toString() === applied_job_id.toString());
                                if (findMatchItem) {
                                    updateCandidateJobRecords(findMatchItem.job_id.toString(), findMatchItem.project_id.toString());
                                    offerJobMail(item.email, item.name, findMatchItem, saveData.verify_token);
                                }
                            }
                        });
                    }
                    return res.status(200).send({ 'status': true, 'message': `Job Offered Successfully` });
                });
            // }else{
            //     return res.status(403).send( {'status':false, 'message': 'No action performed'} );
            // }
        }).catch((error) => {
            console.log(error);
            return res.status(403).send({ 'status': false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE });
        });
}

controller.extendJobOfferDate = (req, res) => {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(403).json({ status: false, message: errors.array()[0].msg });
    }

    const { candidate_id, applied_job_id, onboard_date } = req.body;

    const arrayFilters = { 'arrayFilters': [{ 'one._id': dbObjectId(applied_job_id) }] }

    const where = {}
    where._id = dbObjectId(candidate_id);
    where['applied_jobs._id'] = dbObjectId(applied_job_id);

    const tokenPayload = {}
    tokenPayload.candidate_id = candidate_id;
    tokenPayload.job_id = applied_job_id;
    const token = generateJwtToken(tokenPayload);

    const combineVerifyToken = candidate_id + '|' + applied_job_id + '|' + token;

    const saveData = {}
    saveData.form_status = 'Offer';
    saveData.verify_token = Buffer.from(combineVerifyToken).toString('base64');
    saveData['applied_jobs.$[one].onboard_date'] = convertToDbDate(onboard_date);

    JobAppliedCandidateCl.updateOne(where, { $set: saveData }, arrayFilters)
        .then((data) => {

            if (data.modifiedCount === 1) {
                JobAppliedCandidateCl.find({ _id: dbObjectId(candidate_id) }, { name: 1, email: 1, job_title: 1, 'applied_jobs': 1 })
                    .then((dataList) => {
                        if (dataList.length > 0) {
                            dataList.map((item) => {
                                if (typeof item.email !== 'undefined' && item.email !== '') {
                                    var findMatchItem = item.applied_jobs.find((item) => item._id.toString() === applied_job_id.toString());
                                    if (findMatchItem) {
                                        offerJobMail(item.email, item.name, findMatchItem, saveData.verify_token);
                                    }
                                }
                            });
                        }
                        return res.status(200).send({ 'status': true, 'message': `Job Offered Successfully` });
                    });
            } else {
                return res.status(403).send({ 'status': false, 'message': 'No action performed' });
            }
        }).catch((error) => {
            console.log(error);
            return res.status(403).send({ 'status': false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE });
        });
}

const updateCandidateDetailsInApprovalNoteById = (project_id, candidate_id, applied_job_id, job_type, onboard_date, offer_ctc, interview_shortlist_status, job_valid_till, proposed_location, proposed_location_id, working_days) => {

    JobAppliedCandidateCl.findOne({ _id: dbObjectId(candidate_id) }, { name: 1, email: 1, job_title: 1, 'applied_jobs': 1 })
        .then((dataList) => {
            //console.log( dataList );
            var findMatchItem = dataList.applied_jobs.find((item) => item._id.toString() === applied_job_id.toString());
            if (findMatchItem) {
                const job_id = findMatchItem.job_id;
                const aprWhere = {}
                aprWhere.project_id = dbObjectId(project_id);
                aprWhere.job_id = dbObjectId(job_id);
                aprWhere.status = 'Inprogress';
                aprWhere['candidate_list.cand_doc_id'] = dbObjectId(candidate_id);
                aprWhere['candidate_list.applied_job_doc_id'] = dbObjectId(applied_job_id);

                ApprovalNoteCI.findOne(aprWhere, { candidate_list: 1 })
                    .then((aprData) => {

                        if (aprData) {
                            var findAndMatchCandidateItem = aprData.candidate_list.find((item) => item.cand_doc_id.toString() === candidate_id.toString() && item.applied_job_doc_id.toString() === applied_job_id.toString());
                            if (findAndMatchCandidateItem) {
                                const arrayFilters = { 'arrayFilters': [{ 'one._id': findAndMatchCandidateItem._id }] }

                                const where = {}
                                where._id = aprData._id;
                                where['candidate_list.cand_doc_id'] = dbObjectId(candidate_id);
                                where['candidate_list.applied_job_doc_id'] = dbObjectId(applied_job_id);

                                const saveData = {}
                                saveData['candidate_list.$[one].offer_ctc'] = parseFloat(offer_ctc);
                                saveData['candidate_list.$[one].working_days'] = parseFloat(working_days);
                                saveData['candidate_list.$[one].job_type'] = job_type.replace(/\s+/g, "");
                                saveData['candidate_list.$[one].onboarding_date'] = convertToDbDate(onboard_date);
                                saveData['candidate_list.$[one].interview_shortlist_status'] = interview_shortlist_status;
                                if (typeof job_valid_till !== 'undefined' && job_valid_till !== '') {
                                    saveData['candidate_list.$[one].job_valid_date'] = convertToDbDate(job_valid_till);
                                }

                                if (proposed_location !== '') {
                                    saveData['candidate_list.$[one].proposed_location'] = proposed_location;
                                }
                                if (proposed_location_id !== '') {
                                    saveData['candidate_list.$[one].proposed_location_id'] = dbObjectId(proposed_location_id);
                                }

                                console.log(saveData);

                                ApprovalNoteCI.updateOne(where, { $set: saveData }, arrayFilters)
                                    .then((data) => {
                                        console.log(data);
                                        return true;
                                    }).catch((error) => {
                                        console.log(error);
                                        return false;
                                    });
                            }
                        }

                    }).catch((error) => {
                        console.log(error);
                        return false;
                    });
            }

            return true;
        }).catch((error) => {
            //console.log( error );
            return false;
        });
}


controller.updateJobOfferAmount = (req, res) => {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(403).json({ status: false, message: errors.array()[0].msg });
    }

    const { candidate_id, project_id, esic_status, candidate_name, applied_job_id, job_type, onboard_date, offer_ctc, interview_shortlist_status, add_by_name, add_by_designation, add_by_email, add_by_mobile, working_days } = req.body;
    var job_valid_till = '';
    var proposed_location = '';
    var proposed_location_id = '';

    const arrayFilters = { 'arrayFilters': [{ 'one._id': dbObjectId(applied_job_id) }] }

    const where = {}
    where._id = dbObjectId(candidate_id);
    where['applied_jobs._id'] = dbObjectId(applied_job_id);

    const saveData = {}
    saveData['offer_ctc'] = parseFloat(offer_ctc);
    saveData['job_type'] = job_type.replace(/\s+/g, "");
    saveData['interview_shortlist_status'] = interview_shortlist_status;
    saveData['applied_jobs.$[one].offer_ctc'] = parseFloat(offer_ctc || 0);
    saveData['applied_jobs.$[one].working_days'] = parseFloat(working_days || 0);
    saveData['applied_jobs.$[one].job_type'] = job_type.replace(/\s+/g, "");
    saveData['applied_jobs.$[one].onboard_date'] = convertToDbDate(onboard_date);
    saveData['applied_jobs.$[one].interview_shortlist_status'] = interview_shortlist_status;
    if (req.body.hasOwnProperty('job_valid_till')) {
        saveData['applied_jobs.$[one].job_valid_till'] = convertToDbDate(req.body.job_valid_till);
        job_valid_till = req.body.job_valid_till;
    }

    if (req.body.hasOwnProperty('proposed_location') && req.body.proposed_location !== '') {
        saveData['applied_jobs.$[one].proposed_location'] = req.body.proposed_location;
        proposed_location = req.body.proposed_location;
    }

    if (req.body.hasOwnProperty('proposed_location_id') && req.body.proposed_location_id !== '') {
        saveData['applied_jobs.$[one].proposed_location_id'] = dbObjectId(req.body.proposed_location_id);
        proposed_location_id = req.body.proposed_location_id;
    }

    if (req.body.hasOwnProperty('payment_type') && req.body.payment_type !== '') {
        saveData['applied_jobs.$[one].payment_type'] = req.body.payment_type;
    }

    if (req.body.hasOwnProperty('esic_status') && req.body.esic_status !== '') {
        saveData['esic_status'] = esic_status;
    } else {
        saveData['esic_status'] = 'No';
    }



    JobAppliedCandidateCl.updateOne(where, { $set: saveData }, arrayFilters)
        .then((data) => {

            updateCandidateDetailsInApprovalNoteById(project_id, candidate_id, applied_job_id, job_type, onboard_date, offer_ctc, interview_shortlist_status, job_valid_till, proposed_location, proposed_location_id, working_days);
            addCandidateDiscussion(candidate_id, project_id, candidate_name, add_by_name, 'Job Offer Amount', 'Offer Amount Updated')
            return res.status(200).send({ 'status': true, 'message': `Job Offer Data Updated Successfully` });
        }).catch((error) => {
            return res.status(403).send({ 'status': false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE });
        });
}

controller.updateHireStatus = (req, res) => {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(403).json({ status: false, message: errors.array()[0].msg });
    }

    const { candidate_id, applied_job_id, hiring_status, add_by_name, add_by_designation, add_by_email, add_by_mobile } = req.body;


    const where = {}
    where._id = dbObjectId(candidate_id);

    JobAppliedCandidateCl.findOne(where, { name: 1, email: 1, project_id: 1 })
        .then((candiDate) => {

            const saveData = {}
            saveData['hiring_status'] = hiring_status;

            JobAppliedCandidateCl.updateOne(where, { $set: saveData })
                .then((data) => {
                    addCandidateDiscussion(candidate_id, candiDate?.project_id?.toString(), candiDate?.name?.toString(), add_by_name, 'Hiring Status', hiring_status)
                    return res.status(200).send({ 'status': true, 'message': `Hiring Status Updated Successfully` });
                }).catch((error) => {
                    return res.status(403).send({ 'status': false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE });
                });

        }).catch((error) => {
            return res.status(403).send({ 'status': false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE });
        });
}


controller.getCandidateJobRating = (req, res) => {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(403).json({ status: false, message: errors.array()[0].msg });
    }

    const { approval_note_doc_id, candidate_id, job_id } = req.body;

    const where = {}
    where._id = dbObjectId(candidate_id);

    JobAppliedCandidateCl.findOne(where, { name: 1, email: 1, 'applied_jobs': 1 })
        .then((candiDate) => {

            if (!job_id) {
                return res.status(403).send({ 'status': false, 'message': ' No Record Matched' });
            }

            const findRatingList = candiDate?.applied_jobs.find((item) => item.job_id.toString() === job_id.toString())?.interviewer;

            if (findRatingList) {
                return res.status(200).send({ 'status': true, data: findRatingList, 'message': `API Accessed Successfully` });
            } else {
                return res.status(403).send({ 'status': false, 'message': '' });
            }

        }).catch((error) => {
            return res.status(403).send({ 'status': false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE });
        });
}

controller.getJobOfferApprovalMemberList = async (req, res) => {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(403).json({ status: false, message: errors.array()[0].msg });
    }

    const { approval_note_doc_id, candidate_ids, job_id, project_id, add_by_name, add_by_designation, add_by_email, add_by_mobile } = req.body;

    var projectId = project_id;
    /*get Job Form Data */
    const jobColWhere = {}
    jobColWhere['_id'] = dbObjectId(job_id);
    const jobData = await JobCl.findOne(jobColWhere, { 'requisition_form_id': 1, 'project_id': 1 });

    if (!jobData) {
        return res.status(403).send({ 'status': false, 'message': `No Job Record Found` });
    }

    /*forcefully check on 17-April-2025*/
    if (Object.entries(jobData).length > 0) {
        if (jobData.project_id.toString() !== project_id.toString()) {
            projectId = jobData.project_id.toString();
        }
    }

    /*get candidate record */
    const candidateWhere = {}
    candidateWhere['_id'] = { '$in': candidate_ids.map(item => dbObjectId(item)) }
    candidateWhere['applied_jobs.job_id'] = dbObjectId(job_id);
    candidateWhere['applied_jobs.form_status'] = 'Interview';
    candidateWhere['applied_jobs.project_id'] = dbObjectId(projectId);


    const jobCandidateData = await JobAppliedCandidateCl.aggregate([
        { $match: candidateWhere },
        {
            $addFields: {
                applied_jobs: {
                    $filter: {
                        input: "$applied_jobs",
                        as: "job",
                        cond: {
                            $and: [
                                { $eq: ["$$job.job_id", dbObjectId(job_id)] }, // Match by job_id
                                { $eq: [{ $toUpper: "$$job.form_status" }, "INTERVIEW"] } // Case-insensitive match for form_status
                            ]
                        }
                    }
                }
            }
        },
        {
            $match: {
                "applied_jobs": { $ne: [] } // Ensure applied_jobs is not an empty array
            }
        },
        {
            $project: {
                name: 1, email: 1, applied_from: 1,
                "applied_jobs._id": 1, "applied_jobs.job_id": 1,
                "applied_jobs.job_title": 1, "applied_jobs.job_type": 1,
                "applied_jobs.job_location": 1, "applied_jobs.mpr_job_offer_type": 1,
                "applied_jobs.mpr_fund_type": 1, "applied_jobs.job_designation": 1,
                "applied_jobs.offer_ctc": 1, "applied_jobs.interview_type": 1,
                "applied_jobs.onboard_date": 1, "applied_jobs.job_valid_till": 1,
                "applied_jobs.interviewer": 1, "applied_jobs.interview_shortlist_status": 1,
                "applied_jobs.proposed_location": 1, "applied_jobs.proposed_location_id": 1,
                "applied_jobs.form_status": 1, "applied_jobs.payment_type": 1,
                "applied_jobs.working_days": 1, "applied_jobs.working_days": 1
            }
        }
    ]);

    //console.log( jobCandidateData ); 

    if (!jobCandidateData) {
        return res.status(403).send({ 'status': false, 'message': `No Candidate Record Found` });
    }

    const invalidEntry = jobCandidateData.find(candidate =>
        candidate.applied_jobs.find(job => typeof job.job_valid_till === 'undefined')
    );


    if (invalidEntry) {
        return res.status(403).json({
            success: false,
            message: "Invalid contract end date found in record, please check all records, and try again",
        });
    }


    /*get Project managers/head records */
    const projectWhere = {}
    projectWhere['_id'] = dbObjectId(projectId);
    const projectData = await ProjectCl.findOne(projectWhere, { 'manager_list': 1, 'in_charge_list': 1, 'title': 1 });

    if (!projectData) {
        return res.status(403).send({ 'status': false, 'message': `No Project Record Found` });
    }

    const collectManagersId = projectData?.manager_list.map(item => item.emp_id);
    const collectInChargeId = projectData?.in_charge_list.map(item => item.emp_id);
    const mergeEmployeeIds = [...collectManagersId, ...collectInChargeId];


    /*get Job Form Data */
    // const jobColWhere = {}
    // jobColWhere['_id'] = dbObjectId( job_id ); 
    // const jobData = await JobCl.findOne( jobColWhere, {'requisition_form_id':1} ); 


    var type_of_opening = '';
    var fund_type = '';
    /*get Requisition Form Data */
    if (jobData && typeof jobData.requisition_form_id !== 'undefined') {
        const reqFormWhere = {}
        reqFormWhere['_id'] = jobData.requisition_form_id;
        const reqFormData = await RequisitionFormCI.findOne(reqFormWhere, { 'type_of_opening': 1, 'fund_type': 1 });
        if (reqFormData) {
            type_of_opening = typeof reqFormData?.type_of_opening !== 'undefined' && reqFormData?.type_of_opening !== '' ? reqFormData?.type_of_opening : 'new';
            fund_type = typeof reqFormData?.fund_type !== 'undefined' && reqFormData?.fund_type !== '' ? reqFormData?.fund_type : 'Funded';
        }
    }

    /*get employee Record */
    const empWhere = {}
    empWhere['_id'] = { '$in': mergeEmployeeIds }
    const EmpData = await EmployeeCI.find(empWhere, { 'name': 1, 'email': 1, 'employee_code': 1, 'mobile_no': 1, 'designation': 1, 'docs.doc_category': 1, 'docs.file_name': 1 });

    if (!EmpData) {
        return res.status(403).send({ 'status': false, 'message': `No Employee Record Found` });
    }

    /*Count approval Notes Record for suggested Job ID  */
    const countWhere = {}
    countWhere['project_id'] = dbObjectId(projectId);
    countWhere['job_id'] = dbObjectId(job_id);
    const countApprovalNotes = await ApprovalNoteCI.countDocuments(countWhere);


    //console.log( JSON.stringify( EmpData ) );

    /*Prepare panel_members_list*/
    const panel_members_list = EmpData?.map((item, index) => {
        const getSignature = item.docs.find((elm) => elm.doc_category === 'Signature');
        const push = {}
        push.emp_doc_id = item._id;
        push.name = item.name;
        push.emp_code = item.employee_code;
        push.designation = item.designation;
        push.email = item.email;
        push.signature = typeof getSignature?.file_name !== 'undefined' ? getSignature.file_name : '';
        push.approval_status = '';
        push.priority = index + 1;
        push.add_date = dbDateFormat();
        return push;
    });

    const hrConfig = JSON.parse(fs.readFileSync('./src/config/hr_config_file.txt', 'utf8'));

    //create ceo sir entry
    var pushCEOData = {}
    pushCEOData.emp_doc_id = 'NA';
    pushCEOData.employee_code = 'CEO';
    pushCEOData.name = hrConfig?.ceo_name;
    pushCEOData.emp_code = 'CEO Sir';
    pushCEOData.email = hrConfig?.ceo_email_id;
    pushCEOData.designation = 'CEO';
    pushCEOData.signature = hrConfig?.ceo_digital_signature;
    pushCEOData.approval_status = '';
    pushCEOData.priority = panel_members_list.length + 1;
    pushCEOData.add_date = dbDateFormat();
    var panelMembersList = [...panel_members_list, pushCEOData];



    /* Prepare candidate records*/
    const candidate_list = jobCandidateData.map((item) => {
        const findMatchJobData = item.applied_jobs.find((elm) => elm.job_id.toString() === job_id.toString());


        const push = {}
        push.cand_doc_id = item._id;
        push.name = item.name;
        push.email = item.email;
        push.approval_status = 'Pending';
        push.add_date = dbDateFormat();
        push.approval_date = dbDateFormat();
        push.offer_ctc = findMatchJobData?.offer_ctc;
        push.working_days = findMatchJobData?.working_days || 0;
        push.onboarding_date = findMatchJobData?.onboard_date;
        push.job_valid_date = typeof findMatchJobData?.job_valid_till !== 'undefined' ? findMatchJobData?.job_valid_till : dbDateFormat();
        push.job_type = findMatchJobData.job_type;
        push.applied_from = item?.applied_from;
        push.interview_type = findMatchJobData?.interview_type;
        push.applied_job_doc_id = findMatchJobData?._id;
        if (findMatchJobData?.proposed_location !== '') {
            push.proposed_location = findMatchJobData?.proposed_location;
        } else {
            push.proposed_location = findMatchJobData?.job_location;
        }
        if (findMatchJobData?.proposed_location_id !== '') {
            push.proposed_location_id = findMatchJobData?.proposed_location_id;
        }
        push.payment_type = typeof findMatchJobData?.payment_type !== 'undefined' ? findMatchJobData?.payment_type : 'Annum';

        push.interview_shortlist_status = findMatchJobData?.interview_shortlist_status === '' ? 'Selected' : findMatchJobData?.interview_shortlist_status;
        return push;
    });

    // console.log( candidate_list );
    //return 

    /*get single record from candidate applied job list */
    const selectedCandidateData = jobCandidateData[0]?.applied_jobs.find((elm) => elm.job_id.toString() === job_id.toString());

    /* interviewer List */
    const interviewerListData = selectedCandidateData?.interviewer;

    const InterviewerList = interviewerListData?.map((item) => {
        const push = {}
        push.emp_doc_id = item.employee_id;
        push.name = item.employee_name?.replace(/\s*\(.*?\)/, "");
        push.designation = item.designation;
        push.stage = item.stage;
        return push;
    });




    /*Prepare Approval Note Payload*/
    if (approval_note_doc_id !== '') {
        const latestData = await ApprovalNoteCI.findOne({ '_id': dbObjectId(approval_note_doc_id) });
        return res.status(200).send({ 'status': true, 'data': latestData.panel_members_list, 'message': 'Approval Note Added Successfully' });

    } else {

        const firstLettersFromJobTitle = selectedCandidateData?.job_designation.split(" ").filter(word => /^[a-zA-Z]+$/.test(word)).map(word => word[0].toUpperCase());
        const DesignationCode = firstLettersFromJobTitle.join("");

        const firstLettersFromProject = projectData.title.split(" ").filter(word => /^[a-zA-Z]+$/.test(word)).map(word => word[0].toUpperCase());
        const ProjectCode = firstLettersFromProject.join("");


        const appliedFromList = [];
        var interviewType = '';
        for (var i = 0; i < candidate_list.length; i++) {
            if (typeof candidate_list[i].applied_from !== 'undefined' && candidate_list[i].applied_from !== '') {
                appliedFromList.push(candidate_list[i].applied_from);
            }

            if (interviewType === '' && typeof candidate_list[i].interview_type !== 'undefined' && candidate_list[i].interview_type !== '') {
                interviewType = candidate_list[i].interview_type;
            }
        }

        const removeDuplicatesAppliedFromList = removeDuplicatesAppliedFrom(appliedFromList);

        const applied_from = removeDuplicatesAppliedFromList.join(',');


        const saveData = {}
        saveData.project_name = projectData.title;
        saveData.project_id = projectId;
        saveData.job_title = selectedCandidateData?.job_title;
        saveData.job_designation = selectedCandidateData?.job_designation;
        saveData.mpr_offer_type = type_of_opening !== '' ? type_of_opening : typeof selectedCandidateData.mpr_job_offer_type !== 'undefined' && selectedCandidateData.mpr_job_offer_type !== '' ? selectedCandidateData.mpr_job_offer_type : 'new';
        saveData.mpr_fund_type = fund_type !== '' ? fund_type : typeof selectedCandidateData.mpr_fund_type !== 'undefined' && selectedCandidateData.mpr_fund_type !== '' ? selectedCandidateData.mpr_fund_type : 'Funded';
        saveData.job_id = job_id;
        saveData.approval_note_id = `APN-${DesignationCode}${ProjectCode}-${ProjectCode}-${allDateFormat(dbDateFormat(), 'DDMMYYYYhmm')}-${parseInt(countApprovalNotes) + 1}`;;
        saveData.add_date = dbDateFormat();
        saveData.status = 'Inprogress';
        saveData.panel_members_list = panelMembersList;
        saveData.candidate_list = candidate_list;
        saveData.interviewer_list = InterviewerList;
        saveData.no_of_candidates = candidate_list.length;
        saveData.applied_from = applied_from;
        saveData.interview_type = interviewType;
        saveData.add_by_details = {
            name: add_by_name,
            email: add_by_email,
            mobile: add_by_mobile,
            designation: add_by_designation
        };

        try {
            // Insert the data
            const insert = await new ApprovalNoteCI(saveData).save();

            // Fetch the newly inserted document
            const latestData = await ApprovalNoteCI.findOne({ approval_note_id: saveData.approval_note_id });

            /*Update Approval Data in Candidate Profile Start Script */
            const upCandidateData = candidate_list.map((item) => ({
                updateOne: {
                    filter: {
                        _id: item.cand_doc_id,
                        'applied_jobs.form_status': 'Interview',
                        'applied_jobs._id': item.applied_job_doc_id,
                    },
                    update: {
                        $set: {
                            'applied_jobs.$.approval_note_data.doc_id': latestData._id,
                            'applied_jobs.$.approval_note_data.note_id': latestData.approval_note_id,
                            'updated_on': dbDateFormat()
                        }
                    }
                }
            }));

            const upData = await JobAppliedCandidateCl.bulkWrite(upCandidateData);
            /*Update Approval Data in Candidate Profile Start Script */


            if (latestData && latestData.panel_members_list) {
                return res.status(200).send({
                    status: true,
                    data: { 'panel_members_list': latestData.panel_members_list, 'approval_note_doc_id': latestData._id },
                    message: 'Approval Note Added Successfully'
                });
            } else {
                return res.status(403).send({
                    status: false,
                    message: 'Approval Note Added, but no panel members found.'
                });
            }
        } catch (error) {
            // console.log( error );
            return res.status(403).send({
                status: false,
                message: 'Duplicate approval note for this job.'
            });
        }
    }

}

controller.addJobOfferApprovalMember = async (req, res) => {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(403).json({ status: false, message: errors.array()[0].msg });
    }

    const { approval_note_doc_id, employee_ids } = req.body;

    if (req.body.hasOwnProperty('merge_approval_note_doc_id') && req.body.merge_approval_note_doc_id !== '') {
        try {
            /********************* Merge Into Other old assigned approval note  *********************/
            const getOldApprovalNote = await ApprovalNoteCI.findOne({ '_id': dbObjectId(req.body.merge_approval_note_doc_id) }, { 'candidate_list': 1, 'project_id': 1, 'job_id': 1, 'panel_members_list': 1 });
            const getCurrentApprovalNote = await ApprovalNoteCI.findOne({ '_id': dbObjectId(approval_note_doc_id) }, { 'candidate_list': 1, 'project_id': 1, 'job_id': 1, interviewer_list: 1 });

            /*check the project ids and job id */
            if (getOldApprovalNote.project_id.toString() !== getCurrentApprovalNote.project_id.toString() && getOldApprovalNote.job_id.toString() !== getCurrentApprovalNote.job_id.toString()) {
                return res.status(403).send({ 'status': false, 'message': `Project ID And Job ID not Matched` });
            }

            const collectBothCandidateFromList = [...getOldApprovalNote.candidate_list, ...getCurrentApprovalNote.candidate_list];

            // Remove duplicates based on candidate_id
            const mergeTwoArrayINsingle = Object.values(
                collectBothCandidateFromList.reduce((acc, candidate) => {
                    acc[candidate.cand_doc_id] = candidate;
                    return acc;
                }, {})
            );


            //console.log( mergeTwoArrayINsingle );
            //return res.status(403).send( {'status':false, 'message': `Project ID And Job ID not Matched`} );

            /*merge into old approval note*/
            const where = {}
            where._id = getOldApprovalNote._id;
            where['job_id'] = getOldApprovalNote.job_id;

            const saveData = {}
            saveData['candidate_list'] = mergeTwoArrayINsingle;
            saveData['no_of_candidates'] = mergeTwoArrayINsingle.length;

            if (req.body.hasOwnProperty('approval_date') && req.body.approval_date !== '') {
                saveData['approval_date'] = new Date(convertToDbDate(req.body.approval_date));
                saveData['add_date'] = new Date(convertToDbDate(req.body.approval_date));
            }

            //console.log( saveData );
            /** get panel member kist and modify thier designation modify****/
            /*********** find job offer member data ***********/
            const OldRecords = getOldApprovalNote.panel_members_list;
            const allEmployeeIds = employee_ids.filter((item) => item.id !== 'NA').map((item) => dbObjectId(item.id));

            const empData = await EmployeeCI.find({ '_id': { $in: allEmployeeIds } }, { 'name': 1, 'email': 1, 'employee_code': 1, 'designation': 1, 'designation': 1, 'docs.doc_category': 1, 'docs.file_name': 1 });

            if (empData.length === 0) {
                return res.status(200).send({ 'status': true, 'message': `No Employee Data Found` });
            }

            //set new priority 
            const newPriorityEmpList = employee_ids.filter((item) => item.id !== 'NA');

            const createPayloadAll = newPriorityEmpList.map((empItem, index) => {


                const findEmployeeInList = OldRecords.find((item) => item.emp_doc_id.toString() === empItem.id.toString());
                const findEmployeeData = empData.find((item) => item._id.toString() === empItem.id.toString());
                const getSignature = findEmployeeData.docs.find((elm) => elm.doc_category === 'Signature');
                const findEmployeeDataInRequest = newPriorityEmpList.find((item) => item.id.toString() === empItem.id.toString());

                if (findEmployeeInList && findEmployeeData) {
                    var push = {}
                    push.emp_doc_id = findEmployeeData._id.toString();
                    push.emp_code = findEmployeeData.employee_code;
                    push.name = findEmployeeData.name;
                    push.email = findEmployeeData.email;
                    push.designation = findEmployeeDataInRequest?.designation ? findEmployeeDataInRequest?.designation : findEmployeeData.designation;
                    push.priority = empItem.priority;
                    push.approval_status = findEmployeeInList.approval_status;
                    push.signature = typeof getSignature?.file_name !== 'undefined' ? getSignature.file_name : '';
                    push.add_date = findEmployeeInList.add_date;
                    if (typeof findEmployeeInList.send_mail_date !== 'undefined') {
                        push.send_mail_date = findEmployeeInList.send_mail_date;
                    }
                    if (typeof findEmployeeInList.approved_date !== 'undefined') {
                        push.approved_date = findEmployeeInList.approved_date;
                    }
                    return push;
                } else if (findEmployeeData) {
                    var push = {}
                    push.emp_doc_id = findEmployeeData._id.toString();
                    push.emp_code = findEmployeeData.employee_code;
                    push.name = findEmployeeData.name;
                    push.email = findEmployeeData.email;
                    push.designation = findEmployeeDataInRequest?.designation ? findEmployeeDataInRequest?.designation : findEmployeeData.designation;
                    push.signature = typeof getSignature?.file_name !== 'undefined' ? getSignature.file_name : '';
                    push.priority = empItem.priority;
                    push.approval_status = '';
                    push.add_date = dbDateFormat();
                    return push;
                }
            });

            // Using a Map for unique keys
            const createPayload = Array.from(new Map(createPayloadAll.map(item => [item.email, item])).values());

            const highestPriorityItem = employee_ids.reduce((prev, current) => {
                return current.priority > prev.priority ? current : prev;
            });

            var aprData = getCurrentApprovalNote;


            const hrConfig = JSON.parse(fs.readFileSync('./src/config/hr_config_file.txt', 'utf8'));
            //create ceo sir entry
            var pushCEOData = {}
            if (aprData.status === 'Completed') {
                const newCEOListData = OldRecords.find((item) => item.emp_doc_id.toString() === 'NA');
                pushCEOData.emp_doc_id = newCEOListData._id.toString();
                pushCEOData.emp_code = newCEOListData.employee_code;
                pushCEOData.name = newCEOListData.name;
                pushCEOData.email = newCEOListData.email;
                pushCEOData.designation = newCEOListData.designation;
                pushCEOData.priority = newCEOListData.priority;
                pushCEOData.approval_status = newCEOListData.approval_status;
                pushCEOData.signature = hrConfig?.ceo_digital_signature;
                pushCEOData.add_date = newCEOListData.add_date;
                if (typeof newCEOListData.send_mail_date !== 'undefined') {
                    pushCEOData.send_mail_date = newCEOListData.send_mail_date;
                }
                if (typeof newCEOListData.approved_date !== 'undefined') {
                    pushCEOData.approved_date = newCEOListData.approved_date;
                }

            } else {
                pushCEOData.emp_doc_id = 'NA';
                pushCEOData.emp_code = 'CEO';
                pushCEOData.name = hrConfig?.ceo_name;
                pushCEOData.email = hrConfig?.ceo_email_id;
                pushCEOData.designation = 'CEO';
                pushCEOData.signature = hrConfig?.ceo_digital_signature;
                pushCEOData.approval_status = '';
                pushCEOData.priority = parseInt(highestPriorityItem.priority) + 1;
                pushCEOData.add_date = dbDateFormat();
            }
            var collectPayload = [...createPayload, pushCEOData];

            saveData['panel_members_list'] = collectPayload;

            /**   find and change the designation from Employee panel member list */
            if (collectPayload && aprData.interviewer_list.length > 0) {
                const createInterviewerListPayload = aprData.interviewer_list.map((empItem, index) => {
                    var findEmployeeInList = collectPayload.find((item) => item.emp_doc_id.toString() === empItem.emp_doc_id.toString());
                    if (findEmployeeInList) {
                        var push = {}
                        push.emp_doc_id = empItem._id.toString();
                        push.name = empItem.name;
                        push.designation = findEmployeeInList?.designation ? findEmployeeInList?.designation : empItem.designation;
                        push.stage = empItem.stage;
                        return push;
                    } else {
                        return empItem;
                    }
                });
                saveData['interviewer_list'] = createInterviewerListPayload;
            }


            const isUpdated = await ApprovalNoteCI.updateOne(where, { $set: saveData });

            var approvalData = await ApprovalNoteCI.findOne(where);

            if (!approvalData) {
                return res.status(403).send({ 'status': false, 'message': `No Record Found` });
            }

            /*********** find job offer member data ***********/
            if (approvalData.panel_members_list.length > 0) {
                return res.status(200).send({ 'status': true, 'data': approvalData.panel_members_list, 'message': `API Accessed Successfully` });
            } else {
                return res.status(403).send({ 'status': false, 'message': process.env.DEFAULT_ERROR_MESSAGE });
            }
        }
        catch (error) {
            console.log(error);
            return res.status(403).send({ 'status': false, 'message': process.env.DEFAULT_ERROR_MESSAGE });
        }

    } else {
        /********************* simple update *********************/
        ApprovalNoteCI.findOne({ '_id': dbObjectId(approval_note_doc_id) })
            .then((aprData) => {
                if (!aprData) {
                    return res.status(403).send({ 'status': false, 'message': `No Record Found` });
                }

                /*********** find job offer member data ***********/
                const OldRecords = aprData.panel_members_list;
                const allEmployeeIds = employee_ids.filter((item) => item.id !== 'NA').map((item) => dbObjectId(item.id));

                EmployeeCI.find({ '_id': { $in: allEmployeeIds } }, { 'name': 1, 'email': 1, 'employee_code': 1, 'designation': 1, 'designation': 1, 'docs.doc_category': 1, 'docs.file_name': 1 })
                    .then((empData) => {
                        if (!empData) {
                            return res.status(200).send({ 'status': true, 'message': `No Employee Data Found` });
                        }


                        //set new priority 
                        const newPriorityEmpList = employee_ids.filter((item) => item.id !== 'NA');


                        const createPayload = newPriorityEmpList.map((empItem, index) => {

                            const findEmployeeInList = OldRecords.find((item) => item.emp_doc_id.toString() === empItem.id.toString());
                            const findEmployeeData = empData.find((item) => item._id.toString() === empItem.id.toString());
                            const getSignature = findEmployeeData?.docs?.find((elm) => elm.doc_category === 'Signature');
                            const findEmployeeDataInRequest = newPriorityEmpList.find((item) => item.id.toString() === empItem.id.toString());

                            if (findEmployeeInList && findEmployeeData) {
                                var push = {}
                                push.emp_doc_id = findEmployeeData._id.toString();
                                push.emp_code = findEmployeeData.employee_code;
                                push.name = findEmployeeData.name;
                                push.email = findEmployeeData.email;
                                push.designation = findEmployeeDataInRequest?.designation ? findEmployeeDataInRequest?.designation : findEmployeeData.designation;
                                push.priority = empItem.priority;
                                push.approval_status = findEmployeeInList.approval_status;
                                push.signature = typeof getSignature?.file_name !== 'undefined' ? getSignature.file_name : '';
                                push.add_date = findEmployeeInList.add_date;
                                if (typeof findEmployeeInList.send_mail_date !== 'undefined') {
                                    push.send_mail_date = findEmployeeInList.send_mail_date;
                                }
                                if (typeof findEmployeeInList.approved_date !== 'undefined') {
                                    push.approved_date = findEmployeeInList.approved_date;
                                }
                                return push;
                            } else if (findEmployeeData) {
                                var push = {}
                                push.emp_doc_id = findEmployeeData._id.toString();
                                push.emp_code = findEmployeeData.employee_code;
                                push.name = findEmployeeData.name;
                                push.email = findEmployeeData.email;
                                push.designation = findEmployeeDataInRequest?.designation ? findEmployeeDataInRequest?.designation : findEmployeeData.designation;
                                push.signature = typeof getSignature?.file_name !== 'undefined' ? getSignature.file_name : '';
                                push.priority = empItem.priority;
                                push.approval_status = '';
                                push.add_date = dbDateFormat();
                                return push;
                            }
                        });

                        const highestPriorityItem = employee_ids.reduce((prev, current) => {
                            return current.priority > prev.priority ? current : prev;
                        });

                        //console.log( collectPayload );

                        const hrConfig = JSON.parse(fs.readFileSync('./src/config/hr_config_file.txt', 'utf8'));
                        //create ceo sir entry 
                        var pushCEOData = {}
                        if (aprData.status === 'Completed') {
                            const newCEOListData = OldRecords.find((item) => item.emp_doc_id.toString() == 'NA' && item.designation == 'CEO');

                            if (newCEOListData) {
                                pushCEOData.emp_doc_id = 'NA';
                                pushCEOData.emp_code = 'CEO';
                                pushCEOData.name = newCEOListData.name;
                                pushCEOData.email = newCEOListData.email;
                                pushCEOData.designation = newCEOListData.designation;
                                pushCEOData.priority = newCEOListData.priority;
                                pushCEOData.approval_status = newCEOListData.approval_status;
                                pushCEOData.signature = hrConfig?.ceo_digital_signature;
                                pushCEOData.add_date = newCEOListData.add_date;
                                if (typeof newCEOListData.send_mail_date !== 'undefined') {
                                    pushCEOData.send_mail_date = newCEOListData.send_mail_date;
                                } else {
                                    pushCEOData.send_mail_date = newCEOListData.add_date;
                                }
                                if (typeof newCEOListData.approved_date !== 'undefined') {
                                    pushCEOData.approved_date = newCEOListData.approved_date;
                                } else {
                                    pushCEOData.approved_date = newCEOListData.add_date;
                                }

                            } else {
                                pushCEOData.emp_doc_id = 'NA';
                                pushCEOData.emp_code = 'CEO';
                                pushCEOData.name = hrConfig?.ceo_name;
                                pushCEOData.email = hrConfig?.ceo_email_id;
                                pushCEOData.designation = 'CEO';
                                pushCEOData.signature = hrConfig?.ceo_digital_signature;
                                pushCEOData.approval_status = '';
                                pushCEOData.priority = parseInt(highestPriorityItem.priority) + 1;
                                pushCEOData.add_date = dbDateFormat();
                            }


                        } else {
                            pushCEOData.emp_doc_id = 'NA';
                            pushCEOData.emp_code = 'CEO';
                            pushCEOData.name = hrConfig?.ceo_name;
                            pushCEOData.email = hrConfig?.ceo_email_id;
                            pushCEOData.designation = 'CEO';
                            pushCEOData.signature = hrConfig?.ceo_digital_signature;
                            pushCEOData.approval_status = '';
                            pushCEOData.priority = parseInt(highestPriorityItem.priority) + 1;
                            pushCEOData.add_date = dbDateFormat();

                        }

                        var collectPayload = [...createPayload, pushCEOData];

                        const where = {}
                        where._id = aprData._id;
                        where['job_id'] = aprData.job_id;

                        const saveData = {}
                        saveData['panel_members_list'] = collectPayload;

                        if (req.body.hasOwnProperty('approval_date') && req.body.approval_date !== '') {
                            saveData['approval_date'] = new Date(convertToDbDate(req.body.approval_date));
                            saveData['add_date'] = new Date(convertToDbDate(req.body.approval_date));
                        }

                        /**   find and change the designation from Employee panel member list */
                        if (collectPayload.length > 0 && aprData.interviewer_list.length > 0) {

                            const createInterviewerListPayload = aprData.interviewer_list.map((empItem, index) => {
                                var findEmployeeInList = collectPayload.length > 0 ? collectPayload?.find((item) => typeof item !== 'undefined' && item.emp_doc_id.toString() === empItem.emp_doc_id.toString()) : '';

                                if (findEmployeeInList) {
                                    var push = {}
                                    push.emp_doc_id = empItem.emp_doc_id.toString();
                                    push.name = empItem.name;
                                    push.designation = findEmployeeInList?.designation ? findEmployeeInList?.designation : empItem.designation;
                                    push.stage = empItem.stage;
                                    return push;
                                } else {
                                    var push = {}
                                    push.emp_doc_id = empItem.emp_doc_id.toString();
                                    push.name = empItem.name;
                                    push.designation = empItem.designation;
                                    push.stage = empItem.stage;
                                    return push;
                                }
                            });
                            saveData['interviewer_list'] = createInterviewerListPayload;
                        }


                        ApprovalNoteCI.updateOne(where, { $set: saveData })
                            .then((data) => {

                                ApprovalNoteCI.findOne({ '_id': aprData._id })
                                    .then((approvalData) => {
                                        if (!approvalData) {
                                            return res.status(403).send({ 'status': false, 'message': `No Record Found` });
                                        }
                                        /*********** find job offer member data ***********/
                                        if (approvalData.panel_members_list.length > 0) {
                                            return res.status(200).send({ 'status': true, 'data': approvalData.panel_members_list, 'message': `API Accessed Successfully` });
                                        } else {
                                            return res.status(403).send({ 'status': false, 'message': process.env.DEFAULT_ERROR_MESSAGE });
                                        }
                                    }).catch((error) => {
                                        console.log(error);
                                        return res.status(403).send({ 'status': false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE });
                                    });
                            }).catch((error) => {
                                console.log(error);
                                return res.status(403).send({ 'status': false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE });
                            });
                    }).catch((error) => {
                        console.log(error);
                        return res.status(403).send({ 'status': false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE });
                    });
            }).catch((error) => {
                console.log(error);
                return res.status(403).send({ 'status': false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE });
            });
    }
}


controller.getBulkCandidateListByJobId = async (req, res) => {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(403).json({ status: false, message: errors.array()[0].msg });
    }

    const { candidate_ids, job_id, project_id } = req.body;

    /*get candidate record */
    const candidateWhere = {}
    candidateWhere['_id'] = { '$in': candidate_ids.map(item => dbObjectId(item)) }
    candidateWhere['applied_jobs.job_id'] = dbObjectId(job_id);
    candidateWhere['applied_jobs.form_status'] = 'Shortlisted';
    candidateWhere['applied_jobs.project_id'] = dbObjectId(project_id);


    const jobCandidateData = await JobAppliedCandidateCl.aggregate([
        { $match: candidateWhere },
        {
            $addFields: {
                applied_jobs: {
                    $filter: {
                        input: "$applied_jobs",
                        as: "job",
                        cond: {
                            $and: [
                                { $eq: ["$$job.job_id", dbObjectId(job_id)] }, // Match by job_id
                                { $eq: [{ $toUpper: "$$job.form_status" }, "SHORTLISTED"] } // Case-insensitive match for form_status
                            ]
                        }
                    }
                }
            }
        },
        {
            $match: {
                "applied_jobs": { $ne: [] } // Ensure applied_jobs is not an empty array
            }
        },
        {
            $project: {
                name: 1, email: 1, applied_from: 1,
                "applied_jobs._id": 1, "applied_jobs.job_id": 1,
                "applied_jobs.job_title": 1, "applied_jobs.job_type": 1,
                "applied_jobs.job_location": 1, "applied_jobs.mpr_job_offer_type": 1,
                "applied_jobs.mpr_fund_type": 1, "applied_jobs.job_designation": 1,
                "applied_jobs.offer_ctc": 1,
                "applied_jobs.stage": 1,
                "applied_jobs.form_status": 1
            }
        }
    ]);

    if (jobCandidateData.length === 0) {
        return res.status(403).send({ 'status': false, 'message': `No Candidate Record Found` });
    } else {
        return res.status(200).send({
            status: true,
            data: jobCandidateData,
            message: 'API Accessed Successfully'
        });
    }
}


const sendJobOfferApprovalMailToNextEmployee = (noteData, employee_id) => {

    const findEmployee = noteData.panel_members_list.find((item) => item.emp_doc_id.toString() === employee_id.toString());

    if (!findEmployee) {
        return false;
    }


    const payload = {}
    payload.emp_doc_id = employee_id;
    payload.employee_name = findEmployee?.name;
    payload.approval_note_doc_id = noteData._id;
    payload.job_designation = noteData.job_designation;
    payload.project_id = noteData?.project_id;
    payload.project_name = noteData.project_name;
    payload.candidate_list = noteData.candidate_list;
    payload.mpr_offer_type = noteData.mpr_offer_type;
    payload.approval_note_id = noteData.approval_note_id;

    const regardsData = '';

    //if( findEmployee?.email ){ 
    SendJobOfferApprovalMail(payload, findEmployee?.email, regardsData);
    //}

    const arrayFilters = { 'arrayFilters': [{ 'one._id': findEmployee._id }] }

    const where = {}
    where._id = noteData._id;
    where['panel_members_list._id'] = findEmployee._id;

    const saveData = {}
    saveData['panel_members_list.$[one].send_mail_date'] = dbDateFormat();
    saveData['panel_members_list.$[one].approval_status'] = 'Pending';

    ApprovalNoteCI.updateOne(where, { $set: saveData }, arrayFilters)
        .then((data) => {
            return true;
        }).catch((error) => {
            return false;
        });

}

controller.approveApprovalNoteByEmployee = async (req, res) => {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(403).json({ status: false, message: errors.array()[0].msg });
    }

    const { approval_note_doc_id, employee_id, candidate_id, status, remark } = req.body;

    var employeeSignatureImage = '';
    /*get employee signature*/
    if (employee_id !== 'NA') {
        const fetchEmployeeProfileData = await EmployeeCI.findOne({ _id: dbObjectId(employee_id), 'docs.doc_category': 'Signature' }, { 'docs.doc_category': 1, 'docs.file_name': 1 });

        if (fetchEmployeeProfileData && fetchEmployeeProfileData?.docs.length > 0 && fetchEmployeeProfileData?.docs[0]?.doc_category === 'Signature' && fetchEmployeeProfileData?.docs[0]?.file_name !== '') {
            employeeSignatureImage = fetchEmployeeProfileData?.docs[0]?.file_name;
        }
    }


    ApprovalNoteCI.findOne({ '_id': dbObjectId(approval_note_doc_id) })
        .then((noteData) => {
            if (!noteData) {
                return res.status(403).send({ 'status': false, 'message': `No Record Found` });
            }

            const findCandidate = noteData.candidate_list.find((item) => item.cand_doc_id.toString() === candidate_id.toString());
            if (!findCandidate) {
                return res.status(403).send({ 'status': false, 'message': `Candidate not found` });
            }

            const findEmployeeInRecord = noteData.panel_members_list.find((item) => item.emp_doc_id.toString() === employee_id.toString());

            if (!findEmployeeInRecord) {
                return res.status(403).send({ 'status': false, 'message': `Employee not found` });
            }

            if (typeof findCandidate.approval_history !== 'undefined' && findCandidate.approval_history.length > 0) {
                const alreadyUpdatedStatus = findCandidate.approval_history.find((item) => item.emp_doc_id.toString() === employee_id.toString());
                if (typeof alreadyUpdatedStatus !== 'undefined' && ['Approved', 'Rejected'].includes(alreadyUpdatedStatus.approval_status)) {
                    return res.status(403).send({ 'status': false, 'message': `Thank You For Your Support` });
                }
            }

            /*Find Rest One candidate Entry that is not approved*/
            const checkPendingApproval = noteData.candidate_list.filter(candidate => {
                return !candidate.approval_history.some(history => history.emp_doc_id.toString() === employee_id.toString());
            });


            /*Find Next Employee For Approval Note Mail*/
            var nextEmployeeData = {}
            if (employee_id !== 'NA') {
                const nextCandidates = noteData.panel_members_list.filter(emp => emp.priority > findEmployeeInRecord.priority);
                nextCandidates.sort((a, b) => a.priority - b.priority);
                nextEmployeeData = nextCandidates.length > 0 ? nextCandidates[0] : null;
            }


            const arrayFilters = { 'arrayFilters': [{ 'one._id': findCandidate._id }, { 'two._id': findEmployeeInRecord._id }] }

            const where = {}
            where._id = dbObjectId(approval_note_doc_id);
            where['candidate_list._id'] = findCandidate._id;
            where['panel_members_list._id'] = findEmployeeInRecord._id;

            const saveData = {}
            saveData['candidate_list.$[one].approval_date'] = dbDateFormat();
            saveData['candidate_list.$[one].approval_status'] = status;

            saveData['panel_members_list.$[two].approved_date'] = dbDateFormat();
            if (['', 'Pending'].includes(findEmployeeInRecord.approval_status)) {
                saveData['panel_members_list.$[two].approval_status'] = status;
            }

            /****** Add employee signature forcefully ********/
            if (employee_id !== 'NA' && employeeSignatureImage !== '') {
                saveData['panel_members_list.$[two].signature'] = employeeSignatureImage;
            }

            if (employee_id === 'NA' && checkPendingApproval.length === 1) {
                saveData['status'] = 'Completed';
                var hrConfig = JSON.parse(fs.readFileSync('./src/config/hr_config_file.txt', 'utf8'));
                if (hrConfig?.ceo_name) {
                    saveData['panel_members_list.$[two].name'] = hrConfig?.ceo_name;
                }
                if (hrConfig?.ceo_digital_signature) {
                    saveData['panel_members_list.$[two].signature'] = hrConfig?.ceo_digital_signature;
                }
            }

            const approvalHistory = {}
            approvalHistory.emp_doc_id = employee_id;
            approvalHistory.remark = remark;
            approvalHistory.approved_date = dbDateFormat();
            approvalHistory.approval_status = status || 'Approved';

            ApprovalNoteCI.updateOne(where, { $set: saveData, $push: { 'candidate_list.$[one].approval_history': approvalHistory } }, arrayFilters)
                .then((data) => {
                    if (employee_id !== 'NA' && nextEmployeeData && checkPendingApproval.length === 1) {
                        sendJobOfferApprovalMailToNextEmployee(noteData, nextEmployeeData.emp_doc_id);
                    }
                    /*send final mail , who had created the note*/
                    if (employee_id === 'NA' && checkPendingApproval.length === 1) {
                        FinalApprovalNoteMailToAddedByUser(noteData, status);
                    }
                    return res.status(200).send({ 'status': true, 'message': `Status ${status} Successfully` });
                }).catch((error) => {
                    console.log(error);
                    return res.status(403).send({ 'status': false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE });
                });

        }).catch((error) => {
            console.log(error);
            return res.status(403).send({ 'status': false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE });
        });
}


controller.moveInterviewCandidateToWaitingOrSelected = (req, res) => {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(403).json({ status: false, message: errors.array()[0].msg });
    }

    const { candidate_data, status, add_by_name, add_by_email, add_by_designation } = req.body;


    const bulkOps = candidate_data.map((item) => ({
        updateOne: {
            filter: {
                _id: dbObjectId(item.candidate_id),
                'applied_jobs.form_status': 'Interview',
                'applied_jobs._id': dbObjectId(item.applied_job_id)
            },
            update: {
                $set: {
                    'applied_jobs.$.interview_shortlist_status': status,
                    'updated_on': dbDateFormat(),
                    'interview_shortlist_status': status
                }
            }
        }
    }));

    JobAppliedCandidateCl.bulkWrite(bulkOps)
        .then((d) => {
            return res.status(200).send({ 'status': true, 'message': 'Status Updated Successfully' });
        }).catch((error) => {
            return res.status(403).send({ 'status': false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE });
        });
}

controller.changeCandidateAnyInterviewStatus = (req, res) => {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(403).json({ status: false, message: errors.array()[0].msg });
    }

    const { candidate_id, applied_job_id } = req.body;

    JobAppliedCandidateCl.findOne({ '_id': dbObjectId(candidate_id) }, { 'applied_jobs': 1 })
        .then((jobData) => {
            if (!jobData) {
                return res.status(403).send({ 'status': false, 'message': `No Record Found` });
            }

            const findJob = jobData.applied_jobs.find((item) => item._id.toString() === applied_job_id.toString());
            if (!findJob) {
                return res.status(403).send({ 'status': false, 'message': `No job match` });
            }

            /*********** find job offer member data ***********/

            const arrayFilters = { 'arrayFilters': [{ 'one._id': dbObjectId(applied_job_id) }] }

            const where = {}
            where._id = dbObjectId(candidate_id);
            where['applied_jobs._id'] = dbObjectId(applied_job_id);

            const saveData = {}
            saveData['form_status'] = 'Applied';
            saveData['applied_jobs.$[one].form_status'] = 'Applied';
            saveData['applied_jobs.$[one].mark_as_hired'] = 'No';
            saveData['applied_jobs.$[one].offer_status'] = '';
            saveData['applied_jobs.$[one].interview_status'] = 'Pending';
            saveData['applied_jobs.$[one].interview_type'] = '';
            saveData['applied_jobs.$[one].interviewer'] = [];
            saveData['applied_jobs.$[one].batch_id'] = '';
            saveData['applied_jobs.$[one].stage'] = '';
            saveData['applied_jobs.$[one].interview_host'] = '';
            saveData['applied_jobs.$[one].final_job_offer_approval'] = [];
            saveData['applied_jobs.$[one].final_job_offer_approval_status'] = 'No';

            JobAppliedCandidateCl.updateOne(where, { $set: saveData }, arrayFilters)
                .then((data) => {
                    updateCandidateJobRecords(findJob.job_id.toString(), findJob.project_id.toString());
                    return res.status(200).send({ 'status': true, 'message': 'Success' });
                }).catch((error) => {
                    console.log(error);
                    return res.status(403).send({ 'status': false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE });
                });

        }).catch((error) => {
            console.log(error);
            return res.status(403).send({ 'status': false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE });
        });
}

controller.sendJobOfferApprovalMailToMember = (req, res) => {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(403).json({ status: false, message: errors.array()[0].msg });
    }

    const { approval_note_doc_id, employee_id, add_by_name, add_by_email, add_by_mobile, add_by_designation } = req.body;

    const mailRegards = {}
    mailRegards.name = add_by_name || '';
    mailRegards.email = add_by_email || '';
    mailRegards.mobile = add_by_mobile || '';
    mailRegards.designation = add_by_designation || '';


    ApprovalNoteCI.findOne({ '_id': dbObjectId(approval_note_doc_id) })
        .then((noteData) => {

            if (!noteData) {
                return res.status(403).send({ 'status': false, 'message': `No Record Found` });
            }

            const findEmployee = noteData.panel_members_list.find((item) => item.emp_doc_id.toString() === employee_id.toString());

            if (!findEmployee) {
                return res.status(403).send({ 'status': false, 'message': `Member not found` });
            }


            const payload = {}
            payload.emp_doc_id = employee_id;
            payload.employee_name = findEmployee?.name;
            payload.approval_note_doc_id = noteData._id;
            payload.job_designation = noteData.job_designation;
            payload.project_id = noteData?.project_id;
            payload.project_name = noteData.project_name;
            payload.candidate_list = noteData.candidate_list;
            payload.mpr_offer_type = noteData.mpr_offer_type;
            payload.approval_note_id = noteData.approval_note_id;


            if (findEmployee?.email) {
                SendJobOfferApprovalMail(payload, findEmployee?.email, mailRegards);
            }

            const arrayFilters = { 'arrayFilters': [{ 'one._id': findEmployee._id }] }

            const where = {}
            where._id = dbObjectId(approval_note_doc_id);
            where['panel_members_list._id'] = findEmployee._id;

            const saveData = {}
            saveData['panel_members_list.$[one].send_mail_date'] = dbDateFormat();
            saveData['panel_members_list.$[one].approval_status'] = 'Pending';
            ApprovalNoteCI.updateOne(where, { $set: saveData }, arrayFilters)
                .then((data) => {
                    return res.status(200).send({ 'status': true, 'message': `Mail Send Successfully` });
                }).catch((error) => {
                    return res.status(403).send({ 'status': false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE });
                });

        }).catch((error) => {
            return res.status(403).send({ 'status': false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE });
        });
}


controller.updateFinalDocumentStatus = (req, res) => {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(403).json({ status: false, message: errors.array()[0].msg });
    }

    const { candidate_id } = req.body;

    JobAppliedCandidateCl.findOne({ '_id': dbObjectId(candidate_id) }, { 'page_steps': 1, 'email': 1, 'name': 1, 'kyc_steps': 1, 'assessment_apply_status': 1 })
        .then((profileData) => {

            if (profileData.kyc_steps !== 'Complete') {
                if (typeof profileData.assessment_apply_status !== 'undefined' && profileData.assessment_apply_status === 'disable') {

                    let where = {}
                    where['_id'] = dbObjectId(candidate_id);
                    var saveData = {}
                    saveData.kyc_steps = 'Complete';
                    saveData.complete_profile_status = 100;

                    JobAppliedCandidateCl.updateOne({ _id: dbObjectId(candidate_id) }, { $set: saveData })
                        .then((d) => {
                            return res.status(200).send({ 'status': true, 'message': 'Profile Updated Successfully' });
                        }).catch((error) => {
                            return res.status(403).send({ 'status': false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE });
                        });
                } else {
                    const getPageSteps = profileData.page_steps.find((item) => item.page === 'docs');
                    if (getPageSteps) {

                        let arrayFilters = { 'arrayFilters': [{ 'one._id': getPageSteps._id }] }

                        let where = {}
                        where['_id'] = dbObjectId(candidate_id);
                        where['page_steps._id'] = getPageSteps._id;
                        var saveData = {}
                        saveData.kyc_steps = 'Complete';
                        saveData.complete_profile_status = 100;
                        saveData['page_steps.$[one].status'] = 'complete';

                        JobAppliedCandidateCl.updateOne({ _id: dbObjectId(candidate_id) }, { $set: saveData }, arrayFilters)
                            .then((d) => {
                                return res.status(200).send({ 'status': true, 'message': 'Profile Updated Successfully' });
                            }).catch((error) => {
                                return res.status(403).send({ 'status': false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE });
                            });
                    } else {
                        return res.status(200).send({ 'status': true, 'message': 'Profile Updated Successfully' });
                    }
                }
            } else {
                return res.status(200).send({ 'status': true, 'message': 'Profile Updated Successfully' });
            }
        }).catch((error) => {
            return res.status(403).send({ 'status': false, 'message': process.env.DEFAULT_ERROR_MESSAGE });
        });

}


controller.rejectDocuments = (req, res) => {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(403).json({ status: false, message: errors.array()[0].msg });
    }

    const { candidate_id, reject_doc_reason, doc_list_ids } = req.body;

    JobAppliedCandidateCl.findOne({ '_id': dbObjectId(candidate_id) }, { 'page_steps': 1, 'email': 1, 'name': 1, 'kyc_steps': 1, 'docs': 1 })
        .then((profileData) => {

            const getPageSteps = profileData.page_steps.find((item) => item.page === 'docs');

            if (getPageSteps) {

                let arrayFilters = { 'arrayFilters': [{ 'one._id': getPageSteps._id }] }

                let where = {}
                where['_id'] = dbObjectId(candidate_id);
                where['page_steps._id'] = getPageSteps._id;
                var saveData = {}
                saveData.kyc_steps = 'Complete';
                saveData.complete_profile_status = 100;
                saveData['page_steps.$[one].status'] = 'pending';
                if (req.body.hasOwnProperty('reject_doc_reason') && reject_doc_reason !== '') {
                    saveData.reject_doc_reason = reject_doc_reason;
                }

                JobAppliedCandidateCl.updateOne({ _id: dbObjectId(candidate_id) }, { $set: saveData }, arrayFilters)
                    .then((d) => {

                        const bulkOps = doc_list_ids.map((item) => ({
                            updateOne: {
                                filter: {
                                    _id: dbObjectId(candidate_id),
                                    'docs._id': dbObjectId(item)
                                },
                                update: {
                                    $set: {
                                        'docs.$.status': 'reject',
                                        'updated_on': dbDateFormat()
                                    }
                                }
                            }
                        }));

                        JobAppliedCandidateCl.bulkWrite(bulkOps)
                            .then((d) => {
                                return res.status(200).send({ 'status': true, 'message': 'Status Updated Successfully' });
                            }).catch((error) => {

                                return res.status(403).send({ 'status': false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE });
                            });
                    }).catch((error) => {
                        return res.status(403).send({ 'status': false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE });
                    });
            } else {
                return res.status(200).send({ 'status': true, 'message': 'Profile Updated Successfully' });
            }

        }).catch((error) => {
            return res.status(403).send({ 'status': false, 'message': process.env.DEFAULT_ERROR_MESSAGE });
        });

}

//pending work
controller.verifyDocuments = (req, res) => {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(403).json({ status: false, message: errors.array()[0].msg });
    }

    const { candidate_id, reject_doc_reason, doc_list_ids } = req.body;

    JobAppliedCandidateCl.findOne({ '_id': dbObjectId(candidate_id) }, { 'page_steps': 1, 'email': 1, 'name': 1, 'kyc_steps': 1, 'docs': 1 })
        .then((profileData) => {

            const getPageSteps = profileData.page_steps.find((item) => item.page === 'docs');

            if (getPageSteps) {

                let arrayFilters = { 'arrayFilters': [{ 'one._id': getPageSteps._id }] }

                let where = {}
                where['_id'] = dbObjectId(candidate_id);
                where['page_steps._id'] = getPageSteps._id;
                var saveData = {}
                saveData.kyc_steps = 'Complete';
                saveData.complete_profile_status = 100;
                saveData['page_steps.$[one].status'] = 'pending';
                if (req.body.hasOwnProperty('reject_doc_reason') && reject_doc_reason !== '') {
                    saveData.reject_doc_reason = reject_doc_reason;
                }

                JobAppliedCandidateCl.updateOne({ _id: dbObjectId(candidate_id) }, { $set: saveData }, arrayFilters)
                    .then((d) => {

                        const bulkOps = doc_list_ids.map((item) => ({
                            updateOne: {
                                filter: {
                                    _id: dbObjectId(candidate_id),
                                    'docs._id': dbObjectId(item)
                                },
                                update: {
                                    $set: {
                                        'docs.$.status': 'reject',
                                        'updated_on': dbDateFormat()
                                    }
                                }
                            }
                        }));

                        JobAppliedCandidateCl.bulkWrite(bulkOps)
                            .then((d) => {
                                return res.status(200).send({ 'status': true, 'message': 'Status Updated Successfully' });
                            }).catch((error) => {

                                return res.status(403).send({ 'status': false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE });
                            });
                    }).catch((error) => {
                        return res.status(403).send({ 'status': false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE });
                    });
            } else {
                return res.status(200).send({ 'status': true, 'message': 'Profile Updated Successfully' });
            }

        }).catch((error) => {
            return res.status(403).send({ 'status': false, 'message': process.env.DEFAULT_ERROR_MESSAGE });
        });

}


/*********** Method to send Automatic Joining kit ***********/
var sendApprovalNoteJoiningKitToCandidates = async (candidate_id, approval_note_id, jobType) => {

    try {

        /************* Fetch Template Data ***************/
        const whereTemplate = {}
        whereTemplate.job_type = normalizeEmployeeType(jobType);
        whereTemplate.template_for = 'Joining Kit';
        const templateData = await TemplateSettingsCI.findOne(whereTemplate);

        if (!templateData) {
            return false;
        }

        const documents = [];

        /************* Fetch Approval Note Data ***************/
        const ApprovalNoteData = await ApprovalNoteCI.findOne({ _id: dbObjectId(approval_note_id.toString()) });
        if (!ApprovalNoteData) {
            return false;
        }

        const findCandidate = ApprovalNoteData?.candidate_list.find((item) => item.cand_doc_id.toString() === candidate_id.toString());
        const checkAnyPendingApprovalInCandidate = findCandidate?.approval_history.find((elm) => elm.approval_status !== 'Approved');
        if (checkAnyPendingApprovalInCandidate) {
            return false;
        }

        /*********prepare token ************/
        const tokenPayload = {}
        tokenPayload.candidate_id = findCandidate.cand_doc_id;
        tokenPayload.job_id = findCandidate.applied_job_doc_id;
        const token = generateJwtToken(tokenPayload);
        const combineVerifyToken = findCandidate.cand_doc_id + '|' + findCandidate.applied_job_doc_id + '|' + token;
        const base64Token = Buffer.from(combineVerifyToken).toString('base64');

        /************* Send Offer Job Mail ***************/
        const added_by_data = {
            name: '',
            email: '',
            mobile: '',
            designation: ''
        }

        /******** fetch candidate details *********/
        const candidateApplicationData = await ApprovalNoteCI.findOne({ _id: dbObjectId(approval_note_id.toString()) });
        if (!candidateApplicationData) {
            return false;
        }


        /******** prepare candidate data ********/
        const organizationConfig = JSON.parse(fs.readFileSync('./src/config/organization_config_file.txt', 'utf8'));

        const TEMPLATE_VARIABLES = [
            { key: 'name', value: findCandidate?.name || '' },
            { key: 'position_name', value: ApprovalNoteData?.job_designation || '' },
            { key: 'project_name', value: ApprovalNoteData?.project_name || '' },
            { key: 'department_name', value: findCandidate?.department || '' },
            { key: 'designation_name', value: ApprovalNoteData?.job_designation || '' },
            { key: 'location', value: findCandidate?.proposed_location || '' },
            { key: 'contract_end_date', value: getHumanReadableDate(findCandidate.job_valid_date, 'date') },
            { key: 'reporting_person_name', value: '' },
            { key: 'posting_location', value: findCandidate?.proposed_location || '' },
            { key: 'offer_amount', value: findCandidate?.offer_ctc || '' },
            { key: 'offer_amount_in_words', value: numbersToWords(findCandidate?.offer_ctc) },
            { key: 'onboarding_date', value: formatDateToWeekOf(findCandidate.onboarding_date) },
            { key: 'salary_type', value: findCandidate.payment_type || '' },
            { key: 'company_name', value: organizationConfig?.organization_name || '' },
            { key: 'father_name', value: organizationConfig?.organization_name || '' },
            { key: 'candidate_address', value: organizationConfig?.organization_name || '' }
        ];

        var templateContentData = templateData.template;

        const replacedContentsData = templateContentData.replace(/\{#(.*?)\}/g, (match, key) => {
            const found = TEMPLATE_VARIABLES.find(item => item.key === key);
            return found ? found.value : match;
        });



        const mailData = sendJobOfferMailToCandidateFromApprovalNote(ApprovalNoteData, findCandidate, replacedContentsData, templateData, documents, base64Token);

        /*Save Send Mail Records*/
        const saveMailRecords = {}
        saveMailRecords.candidate_id = findCandidate.cand_doc_id;
        saveMailRecords.doc_category = templateData.template_for;
        saveMailRecords.reference_doc_id = dbObjectId(approval_note_id);
        saveMailRecords.content_data = mailData.body;
        saveMailRecords.attachments = mailData.attachments;
        saveMailRecords.add_date = dbDateFormat();
        saveMailRecords.updated_on = dbDateFormat();
        saveMailRecords.added_by_data = added_by_data;

        await CandidateSentMailLogsCI.create(saveMailRecords);

        /*Save Data in candidate profile*/
        const onboardDocuments = []
        mailData.attachments.forEach((elm) => {
            const candidateData = {}
            candidateData.approval_note_doc_id = dbObjectId(approval_note_id);
            candidateData.doc_category = templateData.template_for;
            candidateData.doc_name = templateData.template_for;
            candidateData.send_file_data = {
                file_name: elm.file_name,
                added_by_data: added_by_data
            }
            candidateData.status = 'pending';
            candidateData.add_date = dbDateFormat();
            onboardDocuments.push(candidateData);
        });

        if (onboardDocuments.length > 0) {
            await JobAppliedCandidateCl.updateOne({ _id: findCandidate.cand_doc_id }, { $push: { onboarding_docs: onboardDocuments } });
        }

        /*update mail send status in approval note*/
        updateDocumentStatusInApproval(approval_note_id, candidate_id, templateData.template_for, 'mailsent');

        return true;

    } catch (error) {  //console.log( error );
        return false;
    }
}


controller.verifyOffer = async (req, res) => {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(403).json({ status: false, message: errors.array()[0].msg });
    }

    const { utm, type } = req.body;

    const decodeString = Buffer.from(utm, 'base64').toString('utf-8');
    //console.log( decodeString );

    const [candidate_id, applied_job_id, token] = decodeString.split('|');

    if (typeof candidate_id === 'undefined') {
        return res.status(403).send({ 'status': false, 'message': 'Something went wrong' });
    } else if (typeof applied_job_id === 'undefined') {
        return res.status(403).send({ 'status': false, 'message': 'Something went wrong' });
    }

    var where = {}
    var newStatus = '';
    //where.verify_token = utm;
    where._id = dbObjectId(candidate_id);
    where['applied_jobs._id'] = { $in: [dbObjectId(applied_job_id)] };


    var messageStatus = '';
    if (type === 'accept') {
        newStatus = 'Accepted';
        messageStatus = 'accepted';
    } else {
        newStatus = 'Rejected';
        messageStatus = 'rejected';
    }


    try {
        const profileData = await JobAppliedCandidateCl.findOne(where, { 'form_status': 1, 'email': 1, 'name': 1, 'job_id': 1, 'applied_jobs': 1 });
        if (!profileData) {
            return res.status(403).send({ 'status': false, data: messageStatus, 'message': 'Something went wrong' });
        }

        const getOfferJobData = profileData.applied_jobs.find((item) => item._id.toString() === applied_job_id.toString());

        const approval_doc_id = getOfferJobData?.approval_note_data?.doc_id;
        /*********Get Approval Note Data*****/
        if (approval_doc_id) {
            var ApprovalNoteData = await ApprovalNoteCI.findOne({ _id: approval_doc_id });
            if (ApprovalNoteData) {

                /*********Check in approval Note***********/
                const checkCandidateInApprovalNote = ApprovalNoteData?.candidate_list?.find((item) => item?.cand_doc_id?.toString() === candidate_id);

                /*********** Update in Approval Note *********/
                if (checkCandidateInApprovalNote) {
                    const filterCondition = []
                    filterCondition.push({ 'one._id': checkCandidateInApprovalNote._id });

                    const arrayFilters = { 'arrayFilters': filterCondition }

                    const where = {}
                    where._id = ApprovalNoteData._id;
                    where['candidate_list._id'] = checkCandidateInApprovalNote._id;

                    /*Add Progress data in Approval note*/
                    const progressData = {}
                    progressData.title = `Offer Letter`;
                    progressData.activity = `Offer Letter ${newStatus} By Candidate`;
                    progressData.add_by_name = checkCandidateInApprovalNote?.name || '';
                    progressData.add_by_mobile = '';
                    progressData.add_by_email = checkCandidateInApprovalNote?.email || '';
                    progressData.add_by_designation = 'na';
                    progressData.add_date = dbDateFormat();
                    progressData.status = newStatus;

                    const saveData = {}
                    saveData['$push'] = { 'candidate_list.$[one].progress_data': progressData }

                    await ApprovalNoteCI.updateOne({ _id: approval_doc_id }, saveData, arrayFilters);
                }
            }
        }


        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const onboardDate = new Date(getOfferJobData.onboard_date);
        onboardDate.setHours(0, 0, 0, 0);

        //if( getOfferJobData && profileData.form_status === 'Offer' && onboardDate >= today ){

        if (applied_job_id.toString() !== getOfferJobData._id.toString()) {
            return res.status(403).send({ 'status': false, data: messageStatus, 'message': 'Something went wrongs' });
        }

        let arrayFilters = { 'arrayFilters': [{ 'one._id': getOfferJobData._id }] }

        var whereCon = {}
        whereCon['_id'] = dbObjectId(candidate_id);
        whereCon['applied_jobs._id'] = getOfferJobData._id;
        var saveData = {}
        saveData['applied_jobs.$[one].offer_status'] = newStatus;
        if (type === 'accept' && typeof req.body.tentative_date !== 'undefined' && req.body.tentative_date !== '') {
            saveData['applied_jobs.$[one].tentative_date'] = convertToDbDate(req.body.tentative_date);
        }

        try {
            await JobAppliedCandidateCl.updateOne({ _id: dbObjectId(candidate_id) }, { $set: saveData }, arrayFilters);
            return res.status(200).send({ 'status': true, data: messageStatus, 'message': 'Success' });
        } catch (error) {
            return res.status(200).send({ 'status': false, data: messageStatus, 'message': 'Something went wrong' });
        }
        //}else{
        // return res.status(200).send( {'status':false, data: messageStatus, 'message': 'Onboarding date has been passed' } ); 
        // }

    } catch (error) {
        console.log(error);
        return res.status(200).send({ 'status': false, data: messageStatus, 'message': 'Something went wrong' });
    }
}

controller.updateCandidateOnboardMailSteps = async (req, res) => {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(403).json({ status: false, message: errors.array()[0].msg });
    }

    const { candidate_doc_id, action, applied_job_id } = req.body;

    try {

        var where = {}
        where._id = dbObjectId(candidate_doc_id);

        const profileData = await JobAppliedCandidateCl.findOne(where, { 'onboarding_docs_stage': 1, 'form_status': 1, 'email': 1, 'name': 1, 'job_id': 1, 'applied_jobs': 1, 'applicant_form_data': 1 });
        if (!profileData) {
            return res.status(403).send({ 'status': false, 'message': 'Profile not matched' });
        }



        if (profileData?.onboarding_docs_stage !== action) {
            return res.status(403).send({ 'status': false, 'message': 'No Action Accepted' });
        }

        const getOfferJobData = profileData.applied_jobs.find((item) => item._id.toString() === applied_job_id.toString());

        if (!getOfferJobData) {
            return res.status(403).send({ 'status': false, 'message': 'No Job Found' });
        }

        var nextStatus = '';
        if (action === 'offerletter') {

            /********* Send joining kit to candidate ***********/
            if (getOfferJobData?.approval_note_data && getOfferJobData?.approval_note_data?.doc_id !== '' && getOfferJobData?.job_type) {
                sendApprovalNoteJoiningKitToCandidates(candidate_doc_id, getOfferJobData?.approval_note_data?.doc_id, getOfferJobData?.job_type, profileData?.applicant_form_data);
            }
            nextStatus = 'joiningkit';
        }
        else if (action === 'joiningkit') {
            nextStatus = 'appointmentletter';
        }
        else if (action === 'appointmentletter') {
            nextStatus = 'complete';
        }

        /**Update Approval Note Status**/
        if (['offerletter', 'joiningkit'].includes() && getOfferJobData?.approval_note_data && getOfferJobData?.approval_note_data?.doc_id !== '') {

            var getApprovalData = await ApprovalNoteCI.findOne({ _id: getOfferJobData?.approval_note_data?.doc_id }, { candidate_list: 1 });

            if (getApprovalData) {
                const matchCandidate = getApprovalData?.candidate_list?.find((item) => item.cand_doc_id.toString() === candidate_doc_id.toString());
                //console.log( matchCandidate );
                if (matchCandidate) {
                    const arrayFilters = { 'arrayFilters': [{ 'one._id': matchCandidate?._id }] }

                    const whereApproval = {}
                    whereApproval._id = getApprovalData?._id;
                    whereApproval['candidate_list.cand_doc_id'] = dbObjectId(candidate_doc_id);
                    whereApproval['candidate_list._id'] = matchCandidate?._id;

                    const saveDataApr = {}
                    if (action === 'offerletter') {
                        saveDataApr['candidate_list.$[one].document_status.offer_letter'] = 'uploaded';
                        saveDataApr['candidate_list.$[one].document_status.joining_kit'] = 'mailsent';
                    } else if (action === 'joiningkit') {
                        saveDataApr['candidate_list.$[one].document_status.joining_kit'] = 'uploaded';
                        //saveDataApr['candidate_list.$[one].document_status.appointment_letter'] = 'mailsent';
                    } else if (action === 'appointmentletter') {
                        saveDataApr['candidate_list.$[one].document_status.appointment_letter'] = 'uploaded';
                    }

                    await ApprovalNoteCI.updateOne(whereApproval, { $set: saveDataApr }, arrayFilters);
                }
            }
        }

        /**Update Candidate Profile Status**/
        var saveData = {}
        saveData['onboarding_docs_stage'] = nextStatus;

        await JobAppliedCandidateCl.updateOne({ _id: dbObjectId(candidate_doc_id) }, { $set: saveData });

        return res.status(200).send({ 'status': true, 'message': 'Success' });

    } catch (error) {
        console.log(error);
        return res.status(200).send({ 'status': false, 'message': 'Something went wrong' });
    }

}

controller.getCandidateByEmailName = (req, res) => {

    const { keyword, scope_fields } = req.body;

    const where = {}
    const fetchKeys = {}

    if (req.body.hasOwnProperty('scope_fields') && scope_fields.length > 0) {
        scope_fields.forEach(field => {
            fetchKeys[field] = 1;
        });
    } else {
        fetchKeys.__v = 0;
    }

    if (req.body.hasOwnProperty('keyword') && keyword !== '') {
        let searchKeyWord = new RegExp(keyword);
        where['$or'] = [
            { mobile_no: { $regex: searchKeyWord, $options: 'i' } },
            { email: { $regex: searchKeyWord, $options: 'i' } },
            { name: { $regex: searchKeyWord, $options: 'i' } }
        ]
    }

    JobAppliedCandidateCl.find(where, fetchKeys)
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

controller.getCandidateListForAdmin = (req, res) => {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(403).json({ status: false, message: errors.array()[0].msg });
    }

    const { page_no, per_page_record, scope_fields, type } = req.body;

    const fetchKeys = {}

    if (req.body.hasOwnProperty('scope_fields') && scope_fields.length > 0) {
        scope_fields.forEach(field => {
            fetchKeys[field] = 1;
        });
    } else {
        fetchKeys.__v = 0;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const where = {}
    where['form_status'] = 'Interview';

    if (type === 'Upcoming') {
        where['applied_jobs.interviewer'] = { $elemMatch: { status: { $in: ['Pending', 'Accept'] } } };
        where["applied_jobs.interview_date"] = { $gte: today };
    } else if (type === 'Today') {
        where["applied_jobs.interview_date"] = {
            $gte: today,
            $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
        };
    }

    /* check project id */
    if (req.body.hasOwnProperty('project_id')) {
        where['applied_jobs.project_id'] = dbObjectId(req.body.project_id);
    }

    const pageOptions = {
        page: parseInt(((page_no ? page_no : 1) - 1)) || 0,
        limit: parseInt(per_page_record) || 10
    }


    JobAppliedCandidateCl.find(where, fetchKeys)
        .skip(pageOptions.page * pageOptions.limit)
        .limit(pageOptions.limit)
        .sort({ 'applied_jobs.add_date': -1 })
        .then((data) => {

            if (data.length > 0) {
                data.forEach(dataItem => {
                    dataItem.applied_jobs = dataItem.applied_jobs.filter(job => job.interviewer.length > 0);
                    dataItem.applied_jobs.forEach(job => {
                        job.interviewer = job.interviewer.reduce((unique, interviewer) => {
                            const updatedObj = updateDatesInObject(replaceNullUndefined(interviewer), ['add_date', 'updated_on', 'feedback_date'], 'datetime');
                            unique.push(updatedObj);
                            return unique;
                        }, []);
                    });
                });

                const outPutData = updateDatesInArray(replaceNullUndefined(data), ['add_date', 'updated_on'], 'datetime');
                return res.status(200).send({ 'status': true, 'data': outPutData, 'message': 'API Accessed Successfully' });
            } else {
                return res.status(204).send({ 'status': false, 'message': 'No record matched' });
            }
        }).catch((error) => {
            return res.status(403).send({ 'status': false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE });
        });
}

controller.getCandidateListForEmployee = (req, res) => {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(403).json({ status: false, message: errors.array()[0].msg });
    }

    const { employee_id, page_no, per_page_record, scope_fields, type } = req.body;

    const fetchKeys = {}

    if (req.body.hasOwnProperty('scope_fields') && scope_fields.length > 0) {
        scope_fields.forEach(field => {
            fetchKeys[field] = 1;
        });
    } else {
        fetchKeys.__v = 0;
    }

    /*check keys in filter keys */
    if (!('applied_jobs' in fetchKeys)) {
        fetchKeys.applied_jobs = 1;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const where = {}
    //where['form_status'] = 'Interview';
    where['applied_jobs.interviewer.employee_id'] = dbObjectId(employee_id);

    if (type === 'Upcoming') {
        where['applied_jobs.interviewer'] = { $elemMatch: { status: { $in: ['Pending', 'Accept'] } } };
        where["applied_jobs.interview_date"] = { $gt: today };
    } else if (type === 'Today') {
        where['applied_jobs.interviewer.status'] = 'Accept';
        where["applied_jobs.interview_date"] = {
            $gte: today,
            $lte: new Date(today.getTime() + 24 * 60 * 60 * 1000)
        }
    }

    /* check project id */
    if (req.body.hasOwnProperty('project_id') && req.body.project_id !== '') {
        where['applied_jobs.project_id'] = dbObjectId(req.body.project_id);
    }

    if (req.body.hasOwnProperty('keywords') && req.body.keywords !== '') {
        let searchKeyWord = new RegExp(commonOnly(req.body.keywords));
        where['$or'] = [
            { 'name': { $regex: searchKeyWord, $options: 'i' } },
            { 'email': { $regex: searchKeyWord, $options: 'i' } },
            { 'mobile_no': { $regex: searchKeyWord, $options: 'i' } },
            { 'applied_jobs.job_title': { $regex: searchKeyWord, $options: 'i' } },
            { 'applied_jobs.job_designation': { $regex: searchKeyWord, $options: 'i' } },
            { 'applied_jobs.job_location': { $regex: searchKeyWord, $options: 'i' } },
            { 'applied_jobs.project_name': { $regex: searchKeyWord, $options: 'i' } }
        ]
    }

    const pageOptions = {
        page: parseInt(((page_no ? page_no : 1) - 1)) || 0,
        limit: parseInt(per_page_record) || 10
    }

    JobAppliedCandidateCl.find(where, fetchKeys)
        .skip(pageOptions.page * pageOptions.limit)
        .limit(pageOptions.limit)
        .sort({ 'applied_jobs._id': -1 })
        .then((data) => {

            // console.log( data.length );

            if (data.length > 0) {
                data.forEach(dataItem => {
                    dataItem.applied_jobs = dataItem.applied_jobs.filter(job => job.interviewer.length > 0);

                    dataItem.applied_jobs.forEach(job => {
                        job.interviewer = job.interviewer.filter(interviewer => interviewer.employee_id.toString() === employee_id);
                        job.interviewer = job.interviewer.reduce((unique, interviewer) => {
                            if (!unique.some(item => item.employee_id.toString() === interviewer.employee_id.toString())) {
                                const updatedObj = updateDatesInObject(replaceNullUndefined(interviewer), ['add_date', 'updated_on', 'feedback_date'], 'datetime');
                                unique.push(updatedObj);
                            }
                            return unique;
                        }, []);
                    });
                });

                const outPutData = updateDatesInArray(replaceNullUndefined(data), ['add_date', 'updated_on'], 'datetime');
                return res.status(200).send({ 'status': true, 'data': outPutData, 'message': 'API Accessed Successfully' });
            } else {
                return res.status(204).send({ 'status': false, 'message': 'No record matched' });
            }
        }).catch((error) => {
            console.log(error);
            return res.status(403).send({ 'status': false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE });
        });
}

const insertBulkCandidatesRecordsFromCsv = async (saveData, jobDetails) => {
    try {
        const ckData = await JobAppliedCandidateCl.findOne({ email: saveData.email });

        if (ckData) {
            const matchDuplicate = ckData.applied_jobs.find((item) => item.job_id.toString() === saveData.job_id.toString());

            if (!matchDuplicate) {
                saveData.page_steps = { 'step': '1', 'page': 'MCQ', 'status': 'pending' };

                try {
                    const data = await JobAppliedCandidateCl.updateOne({ _id: ckData._id }, { $set: saveData, $push: { 'applied_jobs': jobDetails } });
                    return 'done';
                    // handle data if needed
                } catch (error) {
                    console.log(error);
                    //console.log('Error updating candidate data:', error);
                    return 'no';
                }
            } else {
                return 'no';
            }
        } else {
            saveData.applied_jobs = [jobDetails];
            saveData.page_steps = [{ 'step': '1', 'page': 'MCQ', 'status': 'pending' }];

            const instData = new JobAppliedCandidateCl(saveData);

            try {
                const data = await instData.save();
                // handle data if needed 
                return 'done';
            } catch (error) {
                console.log(error);
                //console.log('Error inserting new candidate data:', error);
                return 'no';
            }
        }
    } catch (error) {
        console.log(error);
        //console.log('Error finding candidate by email:', error);
        return 'no';
    }
};


const convertToLPA = (salary) => {
    if (salary > 100000) {
        return (salary / 100000).toFixed(1);
    }
    return salary;
}

/********* Post New Jobs Data **********/
controller.importCandidatesData = async (req, res) => {

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

    var csvData = [];
    if (req.file && req.file.filename) {
        const excelData = await readExcelFile(uploadsDir + '/' + req.file.filename);
        const headersData = excelData[0];
        csvData = excelData.slice(1).map(row => {
            const obj = {};
            headersData.forEach((header, index) => {
                obj[header] = row[index];
            });
            return obj;
        });
        removeFile(req.file.filename);
    } else {
        return res.status(403).json({ 'status': false, 'message': 'Please choose valid CSV(Comma Delimited) file' });
    }

    if (csvData.length === 0) {
        return res.status(403).json({ 'status': false, 'message': 'No record in the file' });
    }


    //console.log( csvData );
    const { project_id, job_id, applied_from } = req.body;
    const jobWhere = {}
    jobWhere._id = dbObjectId(job_id);
    jobWhere.project_id = dbObjectId(project_id);

    var jobData = await JobCl.findOne(jobWhere, { description: 0, form_personal_data: 0 });

    if (Object.keys(jobData).length === 0) {
        return res.status(403).send({ 'status': false, 'message': 'Job ID is Invalid' });
    } else {

        //prepare Applied Job Record;
        const appliedJobDetails = {}
        appliedJobDetails.job_id = jobData._id;
        appliedJobDetails.job_title = jobData.job_title;
        appliedJobDetails.job_type = jobData.job_type;
        appliedJobDetails.project_id = jobData.project_id;
        appliedJobDetails.project_name = jobData.project_name;
        appliedJobDetails.department = jobData.department;
        appliedJobDetails.form_status = 'Applied';
        appliedJobDetails.add_date = dbDateFormat();
        appliedJobDetails.job_location = jobData.location[0].name;
        appliedJobDetails.job_designation_id = jobData.designation_id;
        appliedJobDetails.job_designation = jobData.designation;
        appliedJobDetails.original_ctc = jobData?.ctc_amount !== 'NaN' ? parseInt(jobData.ctc_amount) : 0;
        appliedJobDetails.final_job_offer_approval_status = 'No';

        csvData.forEach(candidate => {
            const emailId = typeof candidate.email === 'object' ? candidate.email.text : candidate.email;
            if (emailId) {
                const payload = {
                    job_id: jobData._id,
                    job_title: jobData.job_title,
                    job_type: jobData.job_type,
                    project_id: jobData.project_id,
                    project_name: jobData.project_name,
                    name: typeof candidate.name !== 'undefined' ? candidate.name : '',
                    mobile_no: typeof candidate.mobile_no !== 'undefined' ? candidate.mobile_no : '',
                    email: emailId.match(/[\w.-]+@[\w.-]+\.[a-zA-Z]{2,}/)?.[0] || '',
                    designation: typeof candidate.designation !== 'undefined' ? candidate.designation : '',
                    current_employer: typeof candidate.current_employer !== 'undefined' ? candidate.current_employer : '',
                    current_employer_mobile: typeof candidate.current_employer_mobile !== 'undefined' ? candidate.current_employer_mobile : '',
                    location: typeof candidate.location !== 'undefined' ? candidate.location : '',
                    total_experience: typeof candidate.total_experience !== 'undefined' ? `${parseFloat(candidate.total_experience)} Year(s)` : '',
                    relevant_experience: typeof candidate.relevant_experience !== 'undefined' ? `${parseFloat(candidate.relevant_experience)} Year(s)` : '',
                    current_ctc: typeof candidate.current_ctc !== 'undefined' ? convertToLPA(candidate.current_ctc) : 0,
                    expected_ctc: typeof candidate.expected_ctc !== 'undefined' ? convertToLPA(candidate.expected_ctc) : 0,
                    notice_period: typeof candidate.notice_period !== 'undefined' ? parseInt(candidate.notice_period) : 0,
                    last_working_day: typeof candidate.last_working_day !== 'undefined' ? candidate.last_working_day : dbDateFormat(),
                    applied_from: applied_from,
                    reference_employee: typeof candidate.reference_employee !== 'undefined' ? candidate.reference_employee : '',
                    department: typeof candidate.department !== 'undefined' ? candidate.department : '',
                    add_date: dbDateFormat(),
                    updated_on: dbDateFormat(),
                    profile_status: 'Active',
                    form_status: 'Applied'
                }

                insertBulkCandidatesRecordsFromCsv(payload, appliedJobDetails);
            }

        });

        updateCandidateJobRecords(job_id.toString(), project_id);

        return res.status(200).send({ 'status': true, 'message': 'Candidates Data Imported Successfully' });

    } /*end of check job data check*/

}


/********* Post New Jobs Data in Json Format **********/
controller.importCandidatesDataJson = async (req, res) => {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(402).json({ status: false, message: errors.array()[0].msg });
    }


    //console.log( csvData );
    const { project_id, job_id, applied_from, candidate_data } = req.body;

    if (candidate_data.length === 0) {
        return res.status(403).json({ 'status': false, 'message': 'Please send Candidate Data' });
    }



    const jobWhere = {}
    jobWhere._id = dbObjectId(job_id);
    jobWhere.project_id = dbObjectId(project_id);

    var jobData = await JobCl.findOne(jobWhere, { description: 0, form_personal_data: 0 });

    if (Object.keys(jobData).length === 0) {
        return res.status(403).send({ 'status': false, 'message': 'Job ID is Invalid' });
    } else {

        //prepare Applied Job Record;
        const appliedJobDetails = {}
        appliedJobDetails.job_id = jobData._id;
        appliedJobDetails.job_title = jobData.job_title;
        appliedJobDetails.job_type = jobData.job_type;
        appliedJobDetails.project_id = jobData.project_id;
        appliedJobDetails.project_name = jobData.project_name;
        appliedJobDetails.department = jobData.department;
        appliedJobDetails.form_status = 'Applied';
        appliedJobDetails.add_date = dbDateFormat();
        appliedJobDetails.job_location = jobData.location[0].name;
        appliedJobDetails.job_designation_id = jobData.designation_id;
        appliedJobDetails.job_designation = jobData.designation;
        appliedJobDetails.original_ctc = typeof jobData?.ctc_amount !== 'NaN' ? parseInt(jobData.ctc_amount) : 0;
        appliedJobDetails.final_job_offer_approval_status = 'No';

        if (isNaN(appliedJobDetails.original_ctc)) {
            appliedJobDetails.original_ctc = 0;
        }


        var countAffectedRecords = 0;

        candidate_data.forEach(candidate => {
            var emailId = typeof candidate.email === 'object' ? candidate.email.text : candidate.email;

            if (!emailId && isValidEmail(emailId)) {
                emailId = generateRandomEmail(candidate.name, candidate.mobile_no);
            }

            if (emailId) {
                var payload = {
                    job_id: jobData._id,
                    job_title: jobData.job_title,
                    job_type: jobData.job_type,
                    project_id: jobData.project_id,
                    project_name: jobData.project_name,
                    name: typeof candidate.name !== 'undefined' ? candidate.name : '',
                    mobile_no: typeof candidate.mobile_no !== 'undefined' ? candidate.mobile_no : '',
                    email: emailId.match(/[\w.-]+@[\w.-]+\.[a-zA-Z]{2,}/)?.[0] || '',
                    designation: typeof candidate.designation !== 'undefined' ? candidate.designation : '',
                    current_employer: typeof candidate.current_employer !== 'undefined' ? candidate.current_employer : '',
                    current_employer_mobile: typeof candidate.current_employer_mobile !== 'undefined' ? candidate.current_employer_mobile : '',
                    location: typeof candidate.location !== 'undefined' ? candidate.location : '',
                    total_experience: typeof candidate.total_experience !== 'undefined' && candidate.total_experience !== '' ? `${parseFloat(candidate.total_experience)} Year(s)` : '',
                    relevant_experience: typeof candidate.relevant_experience !== 'undefined' && candidate.relevant_experience !== '' ? `${parseFloat(candidate.relevant_experience)} Year(s)` : '',
                    current_ctc: typeof candidate.current_ctc !== 'undefined' && candidate.current_ctc !== '' ? convertToLPA(candidate.current_ctc) : 0,
                    expected_ctc: typeof candidate.expected_ctc !== 'undefined' && candidate.expected_ctc !== '' ? convertToLPA(candidate.expected_ctc) : 0,
                    notice_period: typeof candidate.notice_period !== 'undefined' && candidate.notice_period !== '' ? parseInt(candidate.notice_period) : 0,
                    last_working_day: typeof candidate.last_working_day !== 'undefined' && candidate.last_working_day !== '' && validateYearWithRange(candidate.last_working_day) ? candidate.last_working_day : dbDateFormat(),
                    applied_from: applied_from,
                    reference_employee: typeof candidate.reference_employee !== 'undefined' && candidate.reference_employee !== '' ? candidate.reference_employee : '',
                    department: typeof candidate.department !== 'undefined' && candidate.department !== '' ? candidate.department : '',
                    add_date: dbDateFormat(),
                    updated_on: dbDateFormat(),
                    profile_status: 'Active',
                    form_status: 'Applied'
                }

                //console.log( appliedJobDetails );

                insertBulkCandidatesRecordsFromCsv(payload, appliedJobDetails);
                countAffectedRecords += 1;
            }

        });

        updateCandidateJobRecords(job_id.toString(), project_id.toString());

        if (countAffectedRecords === candidate_data.length) {
            return res.status(200).send({ 'status': true, 'message': 'Candidates Data Imported Successfully' });
        } else if (countAffectedRecords !== 0 && countAffectedRecords < candidate_data.length) {
            return res.status(200).send({ 'status': true, 'message': 'Few Candidates Data Not Imported' });
        } else if (countAffectedRecords === 0) {
            return res.status(403).send({ 'status': false, 'message': 'Candidates Data Not Imported' });
        }


    } /*end of check job data check*/

}

/********* Add Manual Job And Candidate Data **********/
controller.addManualJobCandidate = (req, res) => {

    if (req.body && typeof req.body === 'object') {
        req.body = JSON.parse(JSON.stringify(req.body));
    }

    const errors = validationResult(req);

    const resumeFilename = req.files.filename ? req.files?.filename?.map((item) => item.filename)[0] : null;
    const photoImages = req.files.photo ? req.files?.photo?.map((item) => item.filename)[0] : null;


    if (!errors.isEmpty()) {
        if (req.files && req.files.filename && resumeFilename) {
            removeFile(resumeFilename);
        }
        if (req.files && req.files.photo && photoImages) {
            removeFile(photoImages);
        }
        return res.status(402).json({ status: false, message: errors.array()[0].msg });
    }

    const profileDetails = {}

    var saveData = {};
    saveData = removeBlankValuesFromObject(req.body);

    if (req.files && resumeFilename) {
        saveData.resume_file = resumeFilename;
        profileDetails.resume_file = resumeFilename;
    }

    if (req.files && photoImages) {
        saveData.photo = photoImages;
        profileDetails.photo = photoImages;
    }

    if ((!req.body.hasOwnProperty('email') || req?.body?.email === '')) {
        saveData.email = generateRandomEmail(saveData.name, saveData.mobile_no);
    }

    if (typeof saveData.job_id !== 'undefined' && saveData.job_id !== '') {
        saveData.job_id = dbObjectId(saveData.job_id);
    }

    if (typeof req.body.last_working_day !== 'undefined' && req.body.last_working_day !== '') {
        saveData.last_working_day = convertToDbDate(req.body.last_working_day);
    }

    if (typeof req.body.designation !== 'undefined' && req.body.designation !== '') {
        profileDetails.designation = req.body.designation;
    }
    if (typeof req.body.total_experience !== 'undefined' && req.body.total_experience !== '') {
        profileDetails.total_experience = req.body.total_experience;
    }
    if (typeof req.body.relevant_experience !== 'undefined' && req.body.relevant_experience !== '') {
        profileDetails.relevant_experience = req.body.relevant_experience;
    }
    if (typeof req.body.location !== 'undefined' && req.body.location !== '') {
        profileDetails.location = req.body.location;
    }
    if (typeof req.body.current_ctc !== 'undefined' && req.body.current_ctc !== '') {
        profileDetails.current_ctc = req.body.current_ctc;
    }
    if (typeof req.body.expected_ctc !== 'undefined' && req.body.expected_ctc !== '') {
        profileDetails.expected_ctc = req.body.expected_ctc;
    }
    if (typeof req.body.notice_period !== 'undefined' && req.body.notice_period !== '') {
        profileDetails.notice_period = req.body.notice_period;
    }
    if (typeof req.body.current_employer !== 'undefined' && req.body.current_employer !== '') {
        profileDetails.current_employer = req.body.current_employer;
    }
    if (typeof req.body.current_employer_mobile !== 'undefined' && req.body.current_employer_mobile !== '') {
        profileDetails.current_employer_mobile = req.body.current_employer_mobile;
    }
    if (typeof req.body.current_employer_email !== 'undefined' && req.body.current_employer_email !== '') {
        profileDetails.current_employer_email = req.body.current_employer_email;
    }
    if (typeof req.body.last_working_day !== 'undefined' && req.body.last_working_day !== '') {
        profileDetails.last_working_day = convertToDbDate(req.body.last_working_day);
    }
    if (typeof req.body.applied_from !== 'undefined' && req.body.applied_from !== '') {
        profileDetails.applied_from = req.body.applied_from;
    }
    if (typeof req.body.reference_employee !== 'undefined' && req.body.reference_employee !== '') {
        profileDetails.reference_employee = req.body.reference_employee;
    }

    if (typeof req.body.reference_employee !== 'undefined' && req.body.reference_employee !== '') {
        profileDetails.reference_employee = req.body.reference_employee;
    }

    if (typeof req.body.social_links !== 'undefined' && req.body.social_links.length > 0) {
        saveData.social_links = JSON.parse(req.body.social_links).map((item) => {
            const push = {}
            if (typeof item.brand !== 'undefined' && item.brand !== '') {
                push.brand = item.brand;
            }
            if (typeof item.link !== 'undefined' && item.link !== '') {
                push.link = item.link;
            }
            return push;
        });
    }


    saveData.add_date = dbDateFormat();
    saveData.updated_on = dbDateFormat();
    saveData.profile_status = 'Active';
    saveData.form_status = 'Applied';
    saveData.profile_avg_rating = 0;
    saveData.interview_shortlist_status = '';

    /*Added After Test for Final Discussion on 07-Nov-2024 for last applied form*/
    saveData.assessment_status = 'Pending';
    saveData.assessment_result = '';
    saveData.score = 0;
    saveData.mcq_final_score = 0;
    saveData.mcq_score_final_result = '';
    saveData.mcq_attempts = 'Available';
    saveData.comprehensive_final_score = 0;
    saveData.comprehensive_score_final_result = '';
    saveData.comprehensive_attempts = 'Available';
    saveData.assessment_apply_status = 'enable';

    const jobDetails = {}
    jobDetails.job_id = saveData.job_id;
    jobDetails.job_title = saveData.job_title;
    jobDetails.job_type = saveData.job_type;
    jobDetails.project_id = saveData.project_id;
    jobDetails.project_name = saveData.project_name;
    jobDetails.department = saveData.department;
    jobDetails.form_status = 'Applied';
    jobDetails.add_date = dbDateFormat();
    jobDetails.job_location = req.body.location;
    jobDetails.job_designation = req.body.designation;
    jobDetails.profile_details = profileDetails;
    jobDetails.final_job_offer_approval_status = 'No';



    JobsCL.findOne({ _id: saveData.job_id }, { designation_id: 1, designation: 1, assessment_status: 1, requisition_form_id: 1 })
        .then((jobData) => {
            if (jobData) {
                jobDetails.job_designation_id = jobData.designation_id;
                jobDetails.job_designation = jobData.designation;
                saveData.assessment_apply_status = jobData.assessment_status;
            }

            /*define assessment mail enable/disabled status*/
            const is_assessment_enabled = jobData && jobData.assessment_status === 'enable' ? true : false;

            RequisitionFormCI.findOne({ _id: jobData.requisition_form_id }, { type_of_opening: 1, title: 1, fund_type: 1 })
                .then((MprData) => {

                    if (MprData) {
                        jobDetails.mpr_job_offer_type = MprData?.type_of_opening;
                        jobDetails.requisition_form_id = MprData?._id;
                        jobDetails.mpr_id = MprData?.title;
                        jobDetails.mpr_fund_type = MprData?.fund_type;
                    }

                    JobAppliedCandidateCl.findOne({ email: saveData.email })
                        .then((ckData) => {

                            if (ckData) {
                                if (ckData.profile_status === 'Blocked') {
                                    return res.status(409).send({ 'status': false, 'message': 'Unfortunately, this application for the position cannot be accepted because this profile is currently blocked.' });
                                }
                                var matchDuplicate = ckData.applied_jobs.find((item) => item.job_id.toString() === saveData.job_id.toString());
                                if (matchDuplicate) {
                                    return res.status(409).send({ 'status': false, 'message': 'You have already added this job.' });
                                }

                                saveData.page_steps = { 'step': '1', 'page': 'MCQ', 'status': 'pending' };
                                saveData.complete_profile_status = 60;
                                /***** Update data ******/
                                JobAppliedCandidateCl.updateOne({ _id: ckData._id }, { $set: saveData, $push: { 'applied_jobs': jobDetails } })
                                    .then((data) => {
                                        updateCandidateJobRecords(saveData.job_id.toString(), saveData.project_id.toString());
                                        //loginCandidateMail( saveData.email,saveData.name, 'Login Details!', saveData.project_name, jobDetails.job_designation, is_assessment_enabled );
                                        return res.status(200).send({ 'status': true, 'message': 'Candidate added successfully' });
                                    })
                                    .catch((error) => {
                                        return res.status(403).send({ 'status': false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE });
                                    });
                            } else {
                                saveData.applied_jobs = [jobDetails];
                                saveData.page_steps = { 'step': '1', 'page': 'MCQ', 'status': 'pending' };
                                const instData = new JobAppliedCandidateCl(saveData);
                                instData.save()
                                    .then((data) => {
                                        updateCandidateJobRecords(saveData.job_id.toString(), saveData.project_id.toString());
                                        //loginCandidateMail( saveData.email,saveData.name, 'Login Details!', saveData.project_name, jobDetails.job_designation , is_assessment_enabled );
                                        return res.status(200).send({ 'status': true, 'message': 'Candidate added successfully.' });
                                    })
                                    .catch((error) => {
                                        return res.status(403).send({ 'status': false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE });
                                    });
                            }
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


controller.getApplyJobListCeo = (req, res) => {

    const { page_no, per_page_record, scope_fields, filter_type } = req.body;

    const where = {}
    const fetchKeys = {}


    if (req.body.hasOwnProperty('scope_fields') && scope_fields.length > 0) {
        scope_fields.push('job_id'); // Push 'job_id' as a string
        scope_fields.forEach(field => {
            fetchKeys[field] = 1;
        });
    } else {
        fetchKeys.__v = 0;
    }

    const now = new Date();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (req.body.hasOwnProperty('keyword') && req.body.keyword !== '') {
        let searchKeyWord = new RegExp(commonOnly(req.body.keyword));
        where['$or'] = [
            { department: { $regex: searchKeyWord, $options: 'i' } },
            { job_title: { $regex: searchKeyWord, $options: 'i' } },
            { 'location.name': { $regex: searchKeyWord, $options: 'i' } },
            { 'tags.name': { $regex: searchKeyWord, $options: 'i' } },
            { 'benefits.name': { $regex: searchKeyWord, $options: 'i' } },
            { 'educations.name': { $regex: searchKeyWord, $options: 'i' } },
        ]
    }

    if (req.body.hasOwnProperty('filter_type') && req.body.filter_type !== '') {

        if (req.body.filter_type === 'Upcoming') {
            where['form_status'] = "Interview";
            where['applied_jobs'] = {
                $elemMatch: {
                    form_status: "Interview",
                    interview_date: { $gte: today },
                    interviewer: { $elemMatch: { status: { $in: ['Pending', 'Accept'] }, designation: { $in: ['CEO', 'CEO Sir', 'ceo', 'ceo sir', 'C E O'] } } }
                }
            }
        }
        else if (req.body.filter_type === 'Completed') {
            where['form_status'] = "Interview";
            where['applied_jobs'] = {
                $elemMatch: {
                    form_status: "Interview",
                    interview_date: { $lt: today },
                    interviewer: { $elemMatch: { status: 'Accept', designation: { $in: ['CEO', 'CEO Sir', 'ceo', 'ceo sir', 'C E O'] } } }
                }
            }
        }
        else if (req.body.filter_type === 'PendingFeedback') {
            where['form_status'] = "Interview";
            where['applied_jobs'] = {
                $elemMatch: {
                    form_status: "Interview",
                    interview_date: { $lt: today },
                    profile_avg_rating: { $eq: 0 },
                    interviewer: { $elemMatch: { status: 'Accept', feedback_status: 'Pending', designation: { $in: ['CEO', 'CEO Sir', 'ceo', 'ceo sir', 'C E O'] } } }
                }
            }
        }
    } else if (req.body.hasOwnProperty('job_id') && req.body.job_id !== '') {
        where['applied_jobs.job_id'] = dbObjectId(req.body.job_id);
        where['$or'] = [
            { 'applied_jobs.job_id': dbObjectId(req.body.job_id) },
            { 'job_id': dbObjectId(req.body.job_id) }
        ]
    }

    var sortBy = {}
    sortBy = { _id: -1 }


    //console.log( JSON.stringify( where ) );


    // if( req.body.hasOwnProperty('department') && req.body.department !== '' ){
    //      where['department'] = req.body.department;
    // }
    // if( req.body.hasOwnProperty('job_title') && req.body.job_title !== '' ){
    //     where['job_title'] = req.body.job_title;
    // }
    // if( req.body.hasOwnProperty('job_type') && req.body.job_type !== '' ){
    //     where['job_type'] = req.body.job_type;
    // }
    // if( req.body.hasOwnProperty('salary_range') && req.body.salary_range !== '' ){
    //     where['salary_range'] = req.body.salary_range;
    // }
    // if( req.body.hasOwnProperty('location') && req.body.location !== '' ){ 
    //     let searchLocation =  new RegExp( commonOnly( req.body.location ) );  
    //     where['location.name'] = { $regex: searchLocation, $options: 'i' } ;
    // }


    const pageOptions = {
        page: parseInt(((page_no ? page_no : 1) - 1)) || 0,
        limit: parseInt(per_page_record) || 10
    }

    //console.log( where );

    JobAppliedCandidateCl.find(where, fetchKeys)
        .skip(pageOptions.page * pageOptions.limit)
        .limit(pageOptions.limit)
        .sort(sortBy)
        .then((data) => {

            if (data.length > 0) {

                const resultData = [];
                if (req.body.hasOwnProperty('job_id') && req.body.job_id !== '') {
                    for (var i = 0; i < data.length; i++) {
                        const push = data[i];
                        const getJobData = data[i].applied_jobs.find((item) => item.job_id.toString() === req.body.job_id.toString());
                        if (getJobData) {
                            push.applied_jobs = getJobData;
                            resultData.push(push);
                        }
                    }

                } else {
                    for (var i = 0; i < data.length; i++) {
                        const push = data[i];
                        push.applied_jobs = data[i].applied_jobs.find((item) => item.job_id.toString() === data[i].job_id.toString());
                        resultData.push(push);
                    }
                }

                const outPutData = updateDatesInArray(replaceNullUndefined(resultData), ['add_date', 'updated_on'], 'datetime');
                return res.status(200).send({ 'status': true, 'data': outPutData, 'message': 'API Accessed Successfully' });
            } else {
                return res.status(204).send({ 'status': false, 'message': 'No record matched' });
            }
        }).catch((error) => {
            //console.log( error );
            return res.status(403).send({ 'status': false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE });
        });
}

controller.getApplyJobListHod = (req, res) => {

    const { page_no, per_page_record, scope_fields, filter_type, employee_doc_id } = req.body;

    if (employee_doc_id === '') {
        return res.json({ status: false, message: 'Employee ID is blank' });
    }


    const where = {}
    const fetchKeys = {}

    if (req.body.hasOwnProperty('scope_fields') && scope_fields.length > 0) {
        scope_fields.push('job_id'); // Push 'job_id' as a string
        scope_fields.forEach(field => {
            fetchKeys[field] = 1;
        });
    } else {
        fetchKeys.__v = 0;
    }

    const now = new Date();
    const today = new Date();
    today.setHours(0, 0, 0, 0);


    if (req.body.hasOwnProperty('filter_type') && req.body.filter_type !== '') {

        if (req.body.filter_type === 'Upcoming') {
            where['form_status'] = "Interview";
            where['applied_jobs'] = {
                $elemMatch: {
                    form_status: "Interview",
                    interview_date: { $gte: today },
                    interviewer: { $elemMatch: { status: { $in: ['Pending', 'Accept'] }, employee_id: dbObjectId(employee_doc_id) } }
                }
            }
        }
        else if (req.body.filter_type === 'Completed') {
            where['form_status'] = "Interview";
            where['applied_jobs'] = {
                $elemMatch: {
                    form_status: "Interview",
                    interview_date: { $lt: today },
                    interviewer: { $elemMatch: { status: 'Accept', employee_id: dbObjectId(employee_doc_id) } }
                }
            }
        }
        else if (req.body.filter_type === 'PendingFeedback') {
            where['form_status'] = "Interview";
            where['applied_jobs'] = {
                $elemMatch: {
                    form_status: "Interview",
                    interview_date: { $lt: today },
                    profile_avg_rating: { $eq: 0 },
                    interviewer: { $elemMatch: { status: 'Accept', feedback_status: 'Pending', employee_id: dbObjectId(employee_doc_id) } }
                }
            }
        }
    } else if (req.body.hasOwnProperty('job_id') && req.body.job_id !== '') {
        where['applied_jobs.job_id'] = dbObjectId(req.body.job_id);
        where['$or'] = [
            { 'applied_jobs.job_id': dbObjectId(req.body.job_id) },
            { 'job_id': dbObjectId(req.body.job_id) }
        ]
    }

    var sortBy = {}
    sortBy = { _id: -1 }

    //console.log( JSON.stringify( where ) );

    // if( req.body.hasOwnProperty('department') && req.body.department !== '' ){
    //      where['department'] = req.body.department;
    // }
    // if( req.body.hasOwnProperty('job_title') && req.body.job_title !== '' ){
    //     where['job_title'] = req.body.job_title;
    // }
    // if( req.body.hasOwnProperty('job_type') && req.body.job_type !== '' ){
    //     where['job_type'] = req.body.job_type;
    // }
    // if( req.body.hasOwnProperty('salary_range') && req.body.salary_range !== '' ){
    //     where['salary_range'] = req.body.salary_range;
    // }
    // if( req.body.hasOwnProperty('location') && req.body.location !== '' ){ 
    //     let searchLocation =  new RegExp( commonOnly( req.body.location ) );  
    //     where['location.name'] = { $regex: searchLocation, $options: 'i' } ;
    // }


    if (req.body.hasOwnProperty('keyword') && req.body.keyword !== '') {
        let searchKeyWord = new RegExp(commonOnly(req.body.keyword));
        if (isValidEmail(req.body.keyword)) {
            where['email'] = req.body.keyword;
        } else {
            where['$or'] = [
                { name: { $regex: searchKeyWord, $options: 'i' } },
                { mobile_no: { $regex: searchKeyWord, $options: 'i' } },
                { department: { $regex: searchKeyWord, $options: 'i' } },
                { job_title: { $regex: searchKeyWord, $options: 'i' } },
                { 'location.name': { $regex: searchKeyWord, $options: 'i' } },
                { 'educations.name': { $regex: searchKeyWord, $options: 'i' } }
            ]
        }
    }

    //console.log( where ); 


    const pageOptions = {
        page: parseInt(((page_no ? page_no : 1) - 1)) || 0,
        limit: parseInt(per_page_record) || 10
    }

    //console.log( where );

    JobAppliedCandidateCl.find(where, fetchKeys)
        .skip(pageOptions.page * pageOptions.limit)
        .limit(pageOptions.limit)
        .sort(sortBy)
        .then((data) => {

            if (data.length > 0) {

                const resultData = [];
                if (req.body.hasOwnProperty('job_id') && req.body.job_id !== '') {
                    for (var i = 0; i < data.length; i++) {
                        const push = data[i];
                        const getJobData = data[i].applied_jobs.find((item) => item.job_id.toString() === req.body.job_id.toString());
                        if (getJobData) {
                            push.applied_jobs = getJobData;
                            resultData.push(push);
                        }
                    }

                } else {
                    for (var i = 0; i < data.length; i++) {
                        const push = data[i];
                        push.applied_jobs = data[i].applied_jobs.find((item) => item.job_id.toString() === data[i].job_id.toString());
                        resultData.push(push);
                    }
                }

                const outPutData = updateDatesInArray(replaceNullUndefined(resultData), ['add_date', 'updated_on'], 'datetime');
                return res.status(200).send({ 'status': true, 'data': outPutData, 'message': 'API Accessed Successfully' });
            } else {
                return res.status(204).send({ 'status': false, 'message': 'No record matched' });
            }
        }).catch((error) => {
            //console.log( error );
            return res.status(403).send({ 'status': false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE });
        });
}

controller.changeCandidateDataInApprovalNote = (req, res) => {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(403).json({ status: false, message: errors.array()[0].msg });
    }

    const { approval_note_doc_id, candidate_id, field_name, field_value } = req.body;


    if (!req.body.hasOwnProperty('approval_note_doc_id')) {
        return res.status(403).send({ 'status': false, 'message': `approval_note_doc_id mis` });
    }
    else if (req.body.approval_note_doc_id === '') {
        return res.status(403).send({ 'status': false, 'message': `approval_note_doc_id blank` });
    }
    else if (!req.body.hasOwnProperty('candidate_id')) {
        return res.status(403).send({ 'status': false, 'message': `candidate_id mis` });
    }
    else if (req.body.candidate_id === '') {
        return res.status(403).send({ 'status': false, 'message': `candidate_id blank` });
    }
    else if (!req.body.hasOwnProperty('field_name')) {
        return res.status(403).send({ 'status': false, 'message': `field_name mis` });
    }
    else if (!['name', 'email', 'offer_ctc', 'onboarding_date', 'job_valid_date', 'job_type'].includes(field_name)) {
        return res.status(403).send({ 'status': false, 'message': `Invalid Data` });
    }
    else if (!req.body.hasOwnProperty('field_value')) {
        return res.status(403).send({ 'status': false, 'message': `field_value mis` });
    }
    else if (req.body.field_value === '') {
        return res.status(403).send({ 'status': false, 'message': `field_value blank` });
    }


    ApprovalNoteCI.findOne({ '_id': dbObjectId(approval_note_doc_id) }, { _id: 1, candidate_list: 1 })
        .then((noteData) => {

            if (!noteData) {
                return res.status(403).send({ 'status': false, 'message': `No Record Found` });
            }

            const findCandidate = noteData.candidate_list.find((item) => item.cand_doc_id.toString() === candidate_id.toString());

            if (!findCandidate) {
                return res.status(403).send({ 'status': false, 'message': `Candidate not found` });
            }

            const arrayFilters = { 'arrayFilters': [{ 'one._id': findCandidate._id }] }

            const where = {}
            where._id = dbObjectId(approval_note_doc_id);
            where['candidate_list._id'] = findCandidate._id;

            const saveData = {}

            if (field_name === 'name') {
                saveData['candidate_list.$[one].name'] = field_value;
            }
            else if (field_name === 'email') {
                saveData['candidate_list.$[one].email'] = field_value;
            }
            else if (field_name === 'offer_ctc') {
                saveData['candidate_list.$[one].offer_ctc'] = field_value;
            }
            else if (field_name === 'onboarding_date') {
                saveData['candidate_list.$[one].onboarding_date'] = new Date(field_value);
            }
            else if (field_name === 'job_valid_date') {
                saveData['candidate_list.$[one].job_valid_date'] = new Date(field_value);
            }
            else if (field_name === 'job_type') {
                saveData['candidate_list.$[one].job_type'] = field_value;
            }

            ApprovalNoteCI.updateOne(where, { $set: saveData }, arrayFilters)
                .then((data) => {
                    return res.status(200).send({ 'status': true, 'message': `Record Updated Successfully` });
                }).catch((error) => {
                    console.log(error);
                    return res.status(403).send({ 'status': false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE });
                });

        }).catch((error) => {
            console.log(error);
            return res.status(403).send({ 'status': false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE });
        });
}


/*update approval note Progress data in document*/
var updateProgressDataInApprovalNote = async (approval_note_doc_id, candidate_id, progressData, trail_mail_list = null, document_status_for_db = null, salary_structure = null) => {
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
        const checkOldStatusData = checkCandidateInApprovalNote?.progress_data.find((item) => item?.title === progressData?.title && item?.activity === progressData?.activity && item?.status === progressData?.status);

        if (!checkOldStatusData) {

            const filterCondition = []
            filterCondition.push({ 'one._id': checkCandidateInApprovalNote._id });

            const arrayFilters = { 'arrayFilters': filterCondition }

            const where = {}
            where._id = dbObjectId(approval_note_doc_id);
            where['candidate_list._id'] = checkCandidateInApprovalNote._id;

            const saveData = {}

            const saveSetData = {}
            if (trail_mail_list && Array.isArray(trail_mail_list)) {
                saveSetData['candidate_list.$[one].trail_mail_list'] = trail_mail_list;
            }
            if (document_status_for_db) {
                saveSetData['candidate_list.$[one].appointment_letter_verification_status.status'] = 'Pending';
            }

            if (Object.keys(saveSetData).length > 1) {
                saveData['$set'] = saveSetData;
            }

            saveData['$push'] = { 'candidate_list.$[one].progress_data': progressData }

            await ApprovalNoteCI.updateOne({ _id: dbObjectId(approval_note_doc_id) }, saveData, arrayFilters);
        }

        /************Update Salary Data in Approval Note***********/

        if (salary_structure) {
            var filterCondition = []
            filterCondition.push({ 'one._id': checkCandidateInApprovalNote._id });

            var arrayFilters = { 'arrayFilters': filterCondition }

            var where = {}
            where._id = dbObjectId(approval_note_doc_id);
            where['candidate_list._id'] = checkCandidateInApprovalNote._id;

            var saveData = {}
            var saveSetData = {}
            saveSetData['candidate_list.$[one].salary_structure_data'] = JSON.stringify(JSON.parse(salary_structure));

            saveData['$set'] = saveSetData;
            await ApprovalNoteCI.updateOne({ _id: dbObjectId(approval_note_doc_id) }, saveData, arrayFilters);
        }
    }
    return true;
}


/********** Create a dummy script for testing remove after demo  start dummy here **********/
// const { DocumentApi, DocumentSigner, FormField, Rectangle, SendForSign } = require("boldsign");
// const puppeteer = require('puppeteer');
// async function generatePDFFromHtml( htmlContent, documentNameFull, emailId, candidateName ) { 

//  try {
//             // Write temporary HTML file (optional)
//             fs.writeFileSync('./uploads/temp.html', htmlContent);

//             // Launch Puppeteer
//             //const browser = await puppeteer.launch();
//             const browser = await puppeteer.launch({
//                 headless: true,
//                 executablePath: "/snap/bin/chromium", // or "/usr/bin/google-chrome"
//                 args: ["--no-sandbox", "--disable-setuid-sandbox"],
//             });

//             const page = await browser.newPage();

//             // Load HTML content
//             await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

//             // Generate PDF
//             await page.pdf({
//                 path: 'output.pdf',
//                 format: 'A4',
//                 printBackground: true,
//             });

//             await browser.close(); 
//             console.log('✅ PDF saved as output.pdf');

//         //send attachment to email:

//               const documentApi = new DocumentApi();
//               // Replace "your_api_key" with the actual API key from your BoldSign account.
//               documentApi.setApiKey("MGVjOGE0MWItZmE4YS00YzgyLTk2YzctZmExZjZhYTFjZjNk");

//                console.log( documentApi );

//               // These coordinates specify where the signature field will appear on the document.
//               const bounds = new Rectangle();
//               bounds.x = 100;
//               bounds.y = 50;
//               bounds.width = 100;
//               bounds.height = 100;

//               // Define the form fields where the signer needs to provide input.
//               // In this case, we are adding a signature field on page 1 at specific coordinates.
//               const formField = new FormField();
//               // Unique identifier for the field.
//               formField.id = "Signature";
//               formField.fieldType = FormField.FieldTypeEnum.Signature;
//               formField.pageNumber = 1;
//               formField.bounds = bounds;

//               // Define the signer information.
//               const documentSigner = new DocumentSigner();
//               documentSigner.name = candidateName || "Anil";
//               // Email address where the signing request will be sent.
//               //documentSigner.emailAddress = "anil@duplextech.com";
//               //documentSigner.emailAddress = emailId || "anil.duplextechnology@gmail.com";
//               documentSigner.emailAddress = "duplextechnology@gmail.com";
//               documentSigner.signerType = DocumentSigner.SignerTypeEnum.Signer;
//               documentSigner.formFields = [formField];

//               // Path to the document that needs to be signed.
//               // Ensure that the file exists at the specified path and is accessible.        
//               const files = fs.createReadStream("output.pdf");

//               // Create the document details for sending.
//               const sendForSign = new SendForSign();
//               sendForSign.title = documentNameFull || "Offer Letter";
//               sendForSign.signers = [documentSigner];
//               sendForSign.files = [files];

//               // Send the document for signature.
//               const documentCreated = await documentApi.sendDocument(sendForSign);

//              // console.log( documentCreated );

//               // The documentCreated object contains document id.
//               // The signer will receive an email to review and sign the document.

//           return true
//       }catch ( error ){
//           return false
//       }
// }
/********** Create a dummy script for testing remove after demo  end dummy here **********/


controller.sendApprovalNoteOfferMailToCandidates = async (req, res) => {

    if (req.body && typeof req.body === 'object') {
        req.body = JSON.parse(JSON.stringify(req.body));
    }

    const errors = validationResult(req);
    const documents = [];

    req.files.forEach((file) => {
        const match = file.fieldname.match(/attachments\[(\d+)\]\[file_name\]/);
        const idx = match ? Number(match[1]) : -1;

        let docName = 'Untitled';

        // Try structured access first
        if (req.body.attachments && req.body.attachments[idx] && req.body.attachments[idx].doc_name) {
            docName = req.body.attachments[idx].doc_name;
        }

        // Fallback to flat key if structured fails
        const flatKey = `attachments[${idx}][doc_name]`;
        if (!docName || docName === 'Untitled') {
            docName = req.body[flatKey] || 'Untitled';
        }

        if (idx !== -1) {
            documents.push({
                doc_name: docName,
                file_name: file.filename,
                add_date: new Date()
            });
        }
    });

    //console.log( documents );


    if (!errors.isEmpty()) {
        deleteMultipleUploadedImage(documents);
        return res.status(406).json({ status: false, message: errors.array()[0].msg });
    }

    const { selected_doc, email_subject, approval_note_id, contents, template_id, candidate_id, add_by_name, add_by_mobile, add_by_designation, add_by_email, trail_mail_list, salary_structure } = req.body;

    try {

        /************* Fetch Approval Note Data ***************/
        const ApprovalNoteData = await ApprovalNoteCI.findOne({ _id: dbObjectId(approval_note_id) });
        if (!ApprovalNoteData) {
            deleteMultipleUploadedImage(documents);
            return res.status(403).json({ 'status': false, 'message': 'Template Not Found' });
        }

        const findCandidate = ApprovalNoteData?.candidate_list.find((item) => item.cand_doc_id.toString() === candidate_id.toString());
        const checkAnyPendingApprovalInCandidate = findCandidate?.approval_history.find((elm) => elm.approval_status !== 'Approved');
        if (checkAnyPendingApprovalInCandidate) {
            deleteMultipleUploadedImage(documents);
            return res.status(403).json({ 'status': false, 'message': 'This Candidate is not Approved By Panel Members' });
        }

        /************* Fetch Template Data ***************/
        const templateData = await TemplateSettingsCI.findOne({ _id: dbObjectId(template_id) });
        if (!templateData) {
            deleteMultipleUploadedImage(documents);
            return res.status(403).json({ 'status': false, 'message': 'Template Not Found' });
        }

        /*********prepare token ************/
        const tokenPayload = {}
        tokenPayload.candidate_id = findCandidate.cand_doc_id;
        tokenPayload.job_id = findCandidate.applied_job_doc_id;
        const token = generateJwtToken(tokenPayload);
        const combineVerifyToken = findCandidate.cand_doc_id + '|' + findCandidate.applied_job_doc_id + '|' + token;
        const base64Token = Buffer.from(combineVerifyToken).toString('base64');

        var ccEmailList = findCandidate?.trail_mail_list || [];


        /*Add Progress data in Approval note*/
        const progressData = {}
        progressData.add_by_name = add_by_name;
        progressData.add_by_mobile = add_by_mobile;
        progressData.add_by_email = add_by_email;
        progressData.add_by_designation = add_by_designation;
        progressData.add_date = dbDateFormat();


        /******** Define document status***********/
        var document_status_for_db;


        /************* Send Offer Job Mail ***************/
        if (templateData.template_for === 'Offer Letter') {
            const arrayFilters = { 'arrayFilters': [{ 'one._id': findCandidate.applied_job_doc_id }] }
            const where = {}
            where._id = findCandidate.cand_doc_id;
            where['applied_jobs._id'] = findCandidate.applied_job_doc_id;

            const saveData = {}
            saveData.form_status = 'Offer';
            saveData.verify_token = base64Token;
            saveData.onboarding_docs_stage = 'offerletter';
            saveData['applied_jobs.$[one].form_status'] = 'Offer';
            saveData['applied_jobs.$[one].offer_status'] = 'Pending';
            saveData['applied_jobs.$[one].offer_ctc'] = parseFloat(findCandidate.offer_ctc);
            saveData['applied_jobs.$[one].onboard_date'] = convertToDbDate(findCandidate.onboarding_date);

            await JobAppliedCandidateCl.updateOne(where, { $set: saveData }, arrayFilters);
            updateCandidateJobRecords(ApprovalNoteData.job_id.toString(), ApprovalNoteData.project_id.toString());

            /*Add Progress data in Approval note*/
            progressData.title = `Offer Letter`;
            progressData.activity = 'Offer Letter Sent to Candidate';
            progressData.status = 'Accept Pending';

            document_status_for_db = 'mailsent';

        }
        else if (templateData.template_for === 'Joining Kit') {
            const where = {}
            where._id = findCandidate.cand_doc_id;
            const saveData = {}
            saveData.onboarding_docs_stage = 'joiningkit';
            await JobAppliedCandidateCl.updateOne(where, { $set: saveData });

            /*Add Progress data in Approval note*/
            progressData.title = `Joining Kit`;
            progressData.activity = 'Joining Kit Sent to Candidate';
            progressData.status = 'Upload Pending';

            document_status_for_db = 'mailsent';

        }
        else if (templateData.template_for === 'Appointment Letter') {
            const where = {}
            where._id = findCandidate.cand_doc_id;
            const saveData = {}
            saveData.onboarding_docs_stage = 'appointmentletter';
            await JobAppliedCandidateCl.updateOne(where, { $set: saveData });

            /*Add Progress data in Approval note*/
            progressData.title = `Appointment Letter`;
            progressData.activity = 'Appointment Letter Generated For Approval';
            progressData.status = 'Approval Pending';

            document_status_for_db = 'generated';

        }


        /*Finally Add Progress data in Approval note  start script*/
        var collectTrailEmails = [];
        collectTrailEmails.push(add_by_email);
        if (trail_mail_list) {
            try {
                const trailMail = JSON.parse(trail_mail_list);
                trailMail.forEach((item) => {
                    if (item?.email) {
                        collectTrailEmails.push(item.email);
                    }
                });
            } catch (err) {
                console.error("Invalid JSON in trail_mail_list:", err);
            }
        }

        collectTrailEmails = [...new Set(collectTrailEmails)];
        ccEmailList = collectTrailEmails;

        await updateProgressDataInApprovalNote(approval_note_id, candidate_id, progressData, collectTrailEmails, document_status_for_db, salary_structure);
        /*Finally Add Progress data in Approval note end script*/

        const added_by_data = {
            name: add_by_name || '',
            email: add_by_email || '',
            mobile: add_by_mobile || '',
            designation: add_by_designation || ''
        }

        //added on 29-08-2025
        const mailRegards = {}
        mailRegards.name = add_by_name || '';
        mailRegards.email = add_by_email || '';
        mailRegards.mobile = add_by_mobile || '';
        mailRegards.designation = add_by_designation || '';

        const mailData = sendJobOfferMailToCandidateFromApprovalNote(ApprovalNoteData, findCandidate, contents, templateData, documents, base64Token, templateData.template_for, mailRegards, ccEmailList, document_status_for_db, selected_doc, email_subject);

        // if( process.env.DIGITAL_SIGNATURE_STATUS == 'ON' && mailData ){ /* THIS FEATURE IS ADDED ONLY FOR TESTING PURPOSES*/
        //     generatePDFFromHtml( mailData.body, templateData.template_for, findCandidate?.email, findCandidate?.name );
        //     return res.status(200).send( {'status':true, 'message': `${templateData.template_for} Send Successfully`} );
        // }


        /******** Save Send Mail Records ********/
        //delete old record for this candidate
        const saveMailRecords = {}
        saveMailRecords.candidate_id = findCandidate.cand_doc_id;
        saveMailRecords.doc_category = templateData.template_for;
        saveMailRecords.reference_doc_id = dbObjectId(approval_note_id);

        //delete old record for this candidate
        await CandidateSentMailLogsCI.deleteOne(saveMailRecords);


        saveMailRecords.content_data = mailData.body;
        saveMailRecords.attachments = mailData.attachments;
        saveMailRecords.add_date = dbDateFormat();
        saveMailRecords.updated_on = dbDateFormat();
        saveMailRecords.added_by_data = added_by_data;

        await CandidateSentMailLogsCI.create(saveMailRecords);

        /*Save Data in candidate profile*/
        const onboardDocuments = []
        mailData.attachments.forEach((elm) => {
            const candidateData = {}
            candidateData.approval_note_doc_id = dbObjectId(approval_note_id);
            candidateData.doc_category = templateData.template_for;
            candidateData.doc_name = elm.doc_name;
            candidateData.is_html = elm.is_html;
            candidateData.send_file_data = {
                file_name: elm.file_name,
                added_by_data: added_by_data
            }
            candidateData.status = 'pending';
            candidateData.add_date = dbDateFormat();
            onboardDocuments.push(candidateData);
        });

        if (onboardDocuments.length > 0) {
            await JobAppliedCandidateCl.updateOne({ _id: findCandidate.cand_doc_id }, { $push: { onboarding_docs: onboardDocuments } });
        }

        /*update mail send status in approval note*/
        updateDocumentStatusInApproval(approval_note_id, candidate_id, templateData.template_for, document_status_for_db);

        if (templateData.template_for === 'Offer Letter') {
            var candidateData = await JobAppliedCandidateCl.findOne({ _id: dbObjectId(candidate_id) }, { name: 1, email: 1, job_title: 1, 'applied_jobs': 1 })
            if (candidateData) {
                if (typeof candidateData.email !== 'undefined' && candidateData.email !== '') {
                    var findMatchItem = candidateData.applied_jobs.find((item) => item._id.toString() === findCandidate.applied_job_doc_id.toString());
                    //offerJobMail( candidateData.email, candidateData.name, findMatchItem, null, '', mailRegards, ccEmailList ); 
                }
            }
        }

        return res.status(200).send({ 'status': true, 'message': `${templateData.template_for} Send Successfully` });

    } catch (error) {
        console.log(error);
        return res.status(403).json({ 'status': false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE });
    }
}
controller.sendJoiningIntimationMailToCandidates = async (req, res) => {
    try {
        const {
            candidate_doc_id,
            approval_note_doc_id,
            email_subject,
            content,
            add_by_name,
            add_by_designation,
            add_by_mobile,
            add_by_email
        } = req.body;

        const approvalNote = await ApprovalNoteCI.findById(approval_note_doc_id);
        if (!approvalNote) {
            return res.status(404).json({
                status: false,
                message: 'Approval Note not found'
            });
        }

        const candidate = approvalNote.candidate_list.find(
            c => c.cand_doc_id.toString() === candidate_doc_id.toString()
        );

        if (!candidate) {
            return res.status(404).json({
                status: false,
                message: 'Candidate not found'
            });
        }

        // CC list
        const ccEmailList = [add_by_email].filter(Boolean);


        const mailRegards = {
            name: add_by_name,
            email: add_by_email,
            designation: add_by_designation
        };

        await sendIntimationMailToPanelist(
            candidate.name,
            candidate.job_type,
            candidate.email,
            ccEmailList,
            content
        );

        await ApprovalNoteCI.updateOne(
            {
                _id: approval_note_doc_id,
                "candidate_list.cand_doc_id": candidate_doc_id
            },
            {
                $addToSet: {
                    "candidate_list.$.intimation_mail_list": candidate.email
                }
            }
        );


        const progressData = {
            title: 'Joining Intimation',
            activity: 'Joining Intimation Sent',
            status: 'Mail Sent',
            add_by_name,
            add_by_mobile,
            add_by_email,
            add_by_designation,
            add_date: new Date()
        };

        await ApprovalNoteCI.updateOne(
            {
                _id: approval_note_doc_id,
                "candidate_list.cand_doc_id": candidate_doc_id
            },
            {
                $push: {
                    "candidate_list.$.progress_data": progressData
                }
            }
        );

        return res.status(200).json({
            status: true,
            message: 'Joining Intimation mail sent '
        });

    } catch (error) {
        console.error('sendJoiningIntimationMailToCandidates error:', error);
        return res.status(500).json({
            status: false,
            message: error.message || 'Internal server error'
        });
    }
};

controller.getOnboardDocuments = async (req, res) => {

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(403).json({ status: false, message: errors.array()[0].msg });
    }

    const { candidate_id } = req.body;
    const getCandidateData = await JobAppliedCandidateCl.findOne({ _id: dbObjectId(candidate_id) }, { onboarding_docs: 1, onboarding_docs_stage: 1 });

    if (!getCandidateData) {
        return res.status(403).send({ 'status': false, 'message': `No Candidate Data Found` });
    }

    return res.status(200).send({ 'status': true, 'data': getCandidateData, 'message': `API Accessed Successfully` });
}


controller.uploadOnboardingDocuments = async (req, res) => {

    if (req.body && typeof req.body === 'object') {
        req.body = JSON.parse(JSON.stringify(req.body));
    }

    const errors = validationResult(req);

    const documents = [];

    req.files.forEach((file) => {
        const match = file.fieldname.match(/attachments\[(\d+)\]\[file_name\]/);
        const idx = match ? Number(match[1]) : -1;

        let docName = 'Untitled';

        // Try structured access first
        if (req.body.attachments && req.body.attachments[idx] && req.body.attachments[idx].doc_name) {
            docName = req.body.attachments[idx].doc_name;
        }

        // Fallback to flat key if structured fails
        const flatKey = `attachments[${idx}][doc_name]`;
        if (!docName || docName === 'Untitled') {
            docName = req.body[flatKey] || 'Untitled';
        }

        if (idx !== -1) {
            documents.push({
                doc_name: docName,
                file_name: file.filename,
                add_date: new Date()
            });
        }
    });

    if (!errors.isEmpty()) {
        deleteMultipleUploadedImage(documents);
        return res.status(406).json({ status: false, message: errors.array()[0].msg });
    }

    const { approval_note_id, onboard_doc_id, candidate_id, add_by_name, add_by_mobile, add_by_designation, add_by_email } = req.body;

    try {


        /************* Fetch Template Data ***************/
        var candidateKeys = { onboarding_docs: 1 }
        const candidateData = await JobAppliedCandidateCl.findOne({ _id: dbObjectId(candidate_id) }, candidateKeys);
        if (!candidateData) {
            deleteMultipleUploadedImage(documents);
            return res.status(403).json({ 'status': false, 'message': 'Candidate Not Found' });
        }

        /*check if any old document id id available*/
        const checkOldDocument = candidateData?.onboarding_docs?.find((item) => item._id.toString() === onboard_doc_id);
        if (!checkOldDocument) {
            deleteMultipleUploadedImage(documents);
            return res.status(403).send({ 'status': false, 'message': `Document ID Not Matched` });
        }
        // console.log( checkOldDocument );

        if (documents.length === 0) {
            deleteMultipleUploadedImage(documents);
            return res.status(403).send({ 'status': false, 'message': `Please choose Document` });
        }

        /*remove old documents if any*/
        if (checkOldDocument.uploaded_file_data?.file_name && checkOldDocument.uploaded_file_data?.file_name !== '') {
            removeFile(checkOldDocument.uploaded_file_data?.file_name);
        }


        /************* Update documents ***************/
        if (onboard_doc_id && documents.length > 0) {
            const arrayFilters = { 'arrayFilters': [{ 'one._id': dbObjectId(onboard_doc_id) }] }
            const where = {}
            where._id = dbObjectId(candidate_id);
            where['onboarding_docs._id'] = dbObjectId(onboard_doc_id);

            const saveData = {}
            saveData['onboarding_docs.$[one].uploaded_file_data.file_name'] = documents[0].file_name;
            saveData['onboarding_docs.$[one].uploaded_file_data.add_date'] = dbDateFormat();
            saveData['onboarding_docs.$[one].status'] = 'complete';
            saveData['onboarding_docs.$[one].uploaded_file_data.added_by_data.name'] = add_by_name || 'By Candidate';
            saveData['onboarding_docs.$[one].uploaded_file_data.added_by_data.email'] = add_by_email || 'na';
            saveData['onboarding_docs.$[one].uploaded_file_data.added_by_data.mobile'] = add_by_mobile || 'na';
            saveData['onboarding_docs.$[one].uploaded_file_data.added_by_data.designation'] = add_by_designation || 'na';

            await JobAppliedCandidateCl.updateOne(where, { $set: saveData }, arrayFilters);
            /*update approval note data*/
            updateDocumentStatusInApproval(approval_note_id, candidate_id, checkOldDocument.doc_category, 'uploaded');


            return res.status(200).send({ 'status': true, 'message': `Document Uploaded Successfully` });
        } else {
            return res.status(403).send({ 'status': false, 'message': `Some Error Occurred` });
        }



    } catch (error) {
        console.log(error);
        return res.status(403).json({ 'status': false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE });
    }

}

var updateDocumentStatusInApproval = async (approval_doc_id, candidate_id, documentType, status) => {
    const where = {}
    where._id = dbObjectId(approval_doc_id);
    const approvalData = await ApprovalNoteCI.findOne(where);
    if (approvalData) {
        const findCandidate = approvalData?.candidate_list?.find((item) => item.cand_doc_id.toString() === candidate_id.toString());
        if (findCandidate) {
            const arrayFilters = { 'arrayFilters': [{ 'one._id': findCandidate._id }] }
            const where = {}
            where._id = dbObjectId(approval_doc_id);
            where['candidate_list._id'] = findCandidate._id;

            const saveData = {}
            if (documentType === 'Joining Kit') {
                saveData['candidate_list.$[one].document_status.joining_kit'] = status;
                await ApprovalNoteCI.updateOne(where, { $set: saveData }, arrayFilters);
            } else if (documentType === 'Offer Letter') {
                saveData['candidate_list.$[one].document_status.offer_letter'] = status;
                await ApprovalNoteCI.updateOne(where, { $set: saveData }, arrayFilters);
            } else if (documentType === 'Appointment Letter') {
                saveData['candidate_list.$[one].document_status.appointment_letter'] = status;
                await ApprovalNoteCI.updateOne(where, { $set: saveData }, arrayFilters);
            }

        }
    }
}

controller.removeOnboardingDocuments = async (req, res) => {

    const errors = validationResult(req);
    const documents = [];

    if (!errors.isEmpty()) {
        return res.status(406).json({ status: false, message: errors.array()[0].msg });
    }

    const { approval_note_id, onboard_doc_id, candidate_id } = req.body;

    try {


        /************* Fetch Template Data ***************/
        var candidateKeys = { onboarding_docs: 1 }
        const candidateData = await JobAppliedCandidateCl.findOne({ _id: dbObjectId(candidate_id) }, candidateKeys);
        if (!candidateData) {
            return res.status(403).json({ 'status': false, 'message': 'Candidate Not Found' });
        }

        /*check if any old document id id available*/
        const checkOldDocument = candidateData?.onboarding_docs?.find((item) => item._id.toString() === onboard_doc_id);
        if (!checkOldDocument) {
            return res.status(403).send({ 'status': false, 'message': `Document ID Not Matched` });
        }

        /*remove old documents if any*/
        if (checkOldDocument.send_file_data?.file_name && checkOldDocument.send_file_data?.file_name !== '') {
            //removeFile( checkOldDocument.send_file_data?.file_name ); //removed because is uses the master template files
        }
        if (checkOldDocument.uploaded_file_data?.file_name && checkOldDocument.uploaded_file_data?.file_name !== '') {
            removeFile(checkOldDocument.uploaded_file_data?.file_name);
        }


        /************* Update Documents ***************/
        if (onboard_doc_id && checkOldDocument) {
            const where = {}
            where._id = dbObjectId(candidate_id);
            where['onboarding_docs.approval_note_doc_id'] = dbObjectId(approval_note_id);
            where['onboarding_docs._id'] = { $in: [dbObjectId(onboard_doc_id)] }

            const pullData = { onboarding_docs: { _id: dbObjectId(onboard_doc_id) } }
            try {
                await JobAppliedCandidateCl.updateOne(where, { $pull: pullData });
                return res.status(200).send({ 'status': true, 'message': `Document Removed Successfully` });
            } catch (error) {
                console.log(error);
                return res.status(403).json({ 'status': false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE });
            }
        } else {
            return res.status(403).send({ 'status': false, 'message': `Some Error Occurred` });
        }

    } catch (error) {
        console.log(error);
        return res.status(403).json({ 'status': false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE });
    }

}


controller.verifyOnBoardDocuments = async (req, res) => {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(403).json({ status: false, message: errors.array()[0].msg });
    }

    const { candidate_doc_id, action, onboard_doc_id, add_by_name, add_by_email, add_by_mobile, add_by_designation } = req.body;
    const getCandidateData = await JobAppliedCandidateCl.findOne({ _id: dbObjectId(candidate_doc_id) }, { onboarding_docs: 1 });

    if (!getCandidateData) {
        return res.status(403).send({ 'status': false, 'message': `No Candidate Data Found` });
    }

    const arrayFilters = { 'arrayFilters': [{ 'one._id': dbObjectId(onboard_doc_id) }] }

    const where = {}
    where._id = dbObjectId(candidate_doc_id);
    where['onboarding_docs._id'] = dbObjectId(onboard_doc_id);

    const saveData = {}
    saveData.updated_on = dbDateFormat();
    saveData['onboarding_docs.$[one].status'] = action === 'Accept' ? 'verified' : 'reject';

    const activity_log = {}
    activity_log.action = action === 'Accept' ? 'verified' : 'reject';
    activity_log.name = add_by_name;
    activity_log.email = add_by_email;
    activity_log.mobile = add_by_mobile;
    activity_log.add_date = add_by_designation;
    activity_log.add_date = dbDateFormat();
    await JobAppliedCandidateCl.updateOne(where, { $set: saveData, $push: { 'onboarding_docs.$[one].activity_log': activity_log } }, arrayFilters);

    return res.status(200).send({ 'status': true, 'message': `Document ${action}ed Successfully` });
}



controller.saveApplicantForm = async (req, res) => {

    if (req.body && typeof req.body === 'object') {
        req.body = JSON.parse(JSON.stringify(req.body));
    }

    const errors = validationResult(req);
    const documents = [];

    // console.log( req.files );

    var belongs_to_category_proof_image = {}
    var physically_handicapped_proof_image = {}
    var major_alignments_image = {}
    var signature = {}
    var profile_image = {}

    req.files.forEach((file) => {
        if (file?.fieldname === 'belongs_to_category_proof_image') {
            belongs_to_category_proof_image = file;
        }
        if (file?.fieldname === 'physically_handicapped_proof_image') {
            physically_handicapped_proof_image = file;
        }
        if (file?.fieldname === 'major_alignments_image') {
            major_alignments_image = file;
        }
        if (file?.fieldname === 'signature') {
            signature = file;
        }
        if (file?.fieldname === 'profile_image') {
            profile_image = file;
        }
    });

    // console.log( profile_image );

    if (!errors.isEmpty()) {
        deleteMultipleUploadedImage(documents);
        return res.status(406).json({ status: false, message: errors.array()[0].msg });
    }

    const { candidate_id, first_name, major_alignments_details, physically_handicapped_details, belongs_to_category_details, is_before_work_in_orgainization, middle_name, surname, father_hushband_name, communication_address, permanent_address, dob, gender, marital_status, language, strength, weakness, family_members, belongs_to_category, physically_handicapped, major_alignments, arrested_convicted_by_court, arrested_convicted_by_court_details, before_work_in_orgainization, relationship_associate_status, relationship_associate_list, qualification, training, scholarship, extracurricular_activities, employment_history, pay_slip, references_other_than_family } = req.body;

    try {

        /************* Fetch Template Data ***************/
        var candidateKeys = { applicant_form_data: 1 }
        const candidateData = await JobAppliedCandidateCl.findOne({ _id: dbObjectId(candidate_id) }, candidateKeys);
        //console.log( candidateData );
        const oldApplicantData = candidateData?.applicant_form_data || {}

        if (!candidateData) {
            deleteMultipleUploadedImage(documents);
            return res.status(403).json({ 'status': false, 'message': 'Candidate Not Found' });
        }


        const saveData = {}
        saveData['full_name'] = { first_name: first_name || '', middle_name: middle_name || '', surname: surname || '' };
        saveData['father_hushband_name'] = father_hushband_name;
        if (communication_address) {
            const caParsed = JSON.parse(communication_address);
            saveData['communication_address'] = {
                address: caParsed?.address || '',
                pincode: caParsed?.pincode || '',
                telephone: caParsed?.telephone || '',
                mobile_no: caParsed?.mobile_no || '',
                email_id: caParsed?.email_id || ''
            }
        }

        if (permanent_address) {
            const paParsed = JSON.parse(permanent_address);
            saveData['permanent_address'] = {
                address: paParsed?.address || '',
                pincode: paParsed?.pincode || '',
                telephone: paParsed?.telephone || '',
                mobile_no: paParsed?.mobile_no || '',
                email_id: paParsed?.email_id || ''
            }
        }
        const newDob = JSON.parse(dob);
        saveData['dob'] = {
            date: newDob?.date || '',
            month: newDob?.month || '',
            year: newDob?.year || '',
            in_words: newDob?.in_words || ''
        }
        saveData['gender'] = gender || 'male';
        saveData['marital_status'] = marital_status || 'unmarried';
        if (language.length > 0) {
            saveData['language'] = JSON.parse(language) || [];
        }
        saveData['strength'] = strength || '';
        saveData['weakness'] = weakness || '';
        if (typeof family_members !== 'undefined' && family_members.length > 0) {
            saveData['family_members'] = JSON.parse(family_members) || [];
        }
        saveData['belongs_to_category'] = belongs_to_category || 'no';
        saveData['belongs_to_category_details'] = belongs_to_category_details || '';
        saveData['belongs_to_category_proof_image'] = belongs_to_category_proof_image?.filename || (oldApplicantData?.belongs_to_category_proof_image || '');
        saveData['physically_handicapped'] = physically_handicapped || 'no';
        saveData['physically_handicapped_details'] = physically_handicapped_details || '';
        saveData['physically_handicapped_proof_image'] = physically_handicapped_proof_image?.filename || (oldApplicantData?.physically_handicapped_proof_image || '');
        saveData['major_alignments'] = major_alignments || 'no';
        saveData['major_alignments_details'] = major_alignments_details || '';
        saveData['major_alignments_image'] = major_alignments_image?.filename || (oldApplicantData?.major_alignments_image || '');

        saveData['arrested_convicted_by_court'] = arrested_convicted_by_court || '';
        saveData['arrested_convicted_by_court_details'] = arrested_convicted_by_court_details || '';
        saveData['is_before_work_in_orgainization'] = is_before_work_in_orgainization;

        if (is_before_work_in_orgainization === 'yes' && before_work_in_orgainization.length > 0) {
            saveData['before_work_in_orgainization'] = JSON.parse(before_work_in_orgainization) || [];
        }

        saveData['relationship_associate_status'] = relationship_associate_status || 'no';
        if (typeof relationship_associate_list !== 'undefined' && relationship_associate_list.length > 0) {
            saveData['relationship_associate_list'] = JSON.parse(relationship_associate_list) || [];
        }
        if (typeof qualification !== 'undefined' && qualification.length > 0) {
            saveData['qualification'] = JSON.parse(qualification) || [];
        }
        if (typeof training !== 'undefined' && training.length > 0) {
            saveData['training'] = JSON.parse(training) || [];
        }
        saveData['scholarship'] = scholarship || '';
        saveData['extracurricular_activities'] = extracurricular_activities || '';

        if (typeof employment_history !== 'undefined' && employment_history.length > 0) {
            saveData['employment_history'] = JSON.parse(employment_history) || [];
        }
        if (typeof pay_slip !== 'undefined' && pay_slip.length > 0) {
            saveData['pay_slip'] = JSON.parse(pay_slip) || {};
        }
        if (typeof references_other_than_family !== 'undefined' && references_other_than_family.length > 0) {
            saveData['references_other_than_family'] = JSON.parse(references_other_than_family) || [];
        }
        saveData['signature'] = signature?.filename || (oldApplicantData?.signature || '');
        saveData['profile_image'] = profile_image?.filename || (oldApplicantData?.profile_image || '');

        if (req.body.hasOwnProperty('added_by') && req.body.added_by) {
            saveData['added_by'] = JSON.parse(req.body.added_by);
        }

        if (req.body.hasOwnProperty('joining_details') && req.body.joining_details) {
            saveData['joining_details'] = JSON.parse(req.body.joining_details);
        }

        //console.log( saveData );

        const update = await JobAppliedCandidateCl.updateOne({ _id: dbObjectId(candidate_id) }, { $set: { 'applicant_form_data': saveData, 'applicant_form_status': 'Complete' } });
        //console.log( update );

        return res.status(200).send({ 'status': true, 'message': `Form Data Updated Successfully` });

    } catch (error) {
        console.log(error);
        return res.status(403).json({ 'status': false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE });
    }

}


controller.saveAnnexureElevenForm = async (req, res) => {

    if (req.body && typeof req.body === 'object') {
        req.body = JSON.parse(JSON.stringify(req.body));
    }

    const errors = validationResult(req);
    const documents = [];

    var bank_cancel_cheque = '';
    if (typeof req.file !== 'undefined' && req.file) {
        bank_cancel_cheque = req?.file?.filename;
    }

    //console.log( bank_cancel_cheque );

    if (!errors.isEmpty()) {
        deleteMultipleUploadedImage(documents);
        return res.status(406).json({ status: false, message: errors.array()[0].msg });
    }

    const { candidate_id, candidate_pan_number, candidate_name, candidate_designation, candidate_father_husband_name, candidate_doj, candidate_dob, candidate_date_of_wedding, candidate_place_of_posting, candidate_reporting_time, candidate_reporting_manager, candidate_communication_address, candidate_permanent_address, candidate_gender, candidate_marital_status, candidate_blood_group, candidate_family_details, candidate_emergency_contact_local, candidate_emergency_contact_permanent, candidate_bank_details, candidate_previous_org_details } = req.body;

    try {

        /************* Fetch Template Data ***************/
        var candidateKeys = { annexure_eleven_form_data: 1, annexure_eleven_form_status: 1, applicant_form_data: 1 }
        const candidateData = await JobAppliedCandidateCl.findOne({ _id: dbObjectId(candidate_id) }, candidateKeys);
        //console.log( candidateData );
        const oldApplicantData = candidateData?.applicant_form_data || {}

        if (!candidateData) {
            deleteMultipleUploadedImage(documents);
            return res.status(403).json({ 'status': false, 'message': 'Candidate Not Found' });
        }

        const saveAnnexureData = {}
        saveAnnexureData['designation'] = candidate_designation;
        saveAnnexureData['pan_number'] = candidate_pan_number;
        saveAnnexureData['blood_group'] = candidate_blood_group;
        saveAnnexureData['emergency_contact_local'] = JSON.parse(candidate_emergency_contact_local);
        saveAnnexureData['emergency_contact_permanent'] = JSON.parse(candidate_emergency_contact_permanent);
        saveAnnexureData['bank_details'] = JSON.parse(candidate_bank_details);
        saveAnnexureData['bank_cancel_cheque'] = bank_cancel_cheque || '';
        saveAnnexureData['candidate_doj'] = candidate_doj || '';
        saveAnnexureData['candidate_dob'] = candidate_dob || '';
        saveAnnexureData['candidate_date_of_wedding'] = candidate_date_of_wedding || '';
        saveAnnexureData['previous_organization_details'] = JSON.parse(candidate_previous_org_details);
        saveAnnexureData['reporting_time'] = candidate_reporting_time || '';
        saveAnnexureData['reporting_manager'] = candidate_reporting_manager || '';
        saveAnnexureData['place_of_posting'] = candidate_place_of_posting || '';


        const saveData = {}
        saveData['annexure_eleven_form_data'] = saveAnnexureData;

        const permAddressParsed = JSON.parse(candidate_permanent_address);
        const comAddressParsed = JSON.parse(candidate_communication_address);

        saveData['applicant_form_data.father_hushband_name'] = candidate_father_husband_name;
        saveData['applicant_form_data.permanent_address.address'] = comAddressParsed?.address || '';
        saveData['applicant_form_data.permanent_address.mobile_no'] = comAddressParsed?.contact_no || '';
        saveData['applicant_form_data.permanent_address.email_id'] = comAddressParsed?.email || '';

        saveData['applicant_form_data.communication_address.address'] = permAddressParsed?.address || '';
        saveData['applicant_form_data.communication_address.mobile_no'] = permAddressParsed?.contact_no || '';
        saveData['applicant_form_data.communication_address.email_id'] = permAddressParsed?.email || '';
        saveData['applicant_form_data.gender'] = candidate_gender || 'male';
        saveData['applicant_form_data.marital_status'] = candidate_marital_status || 'unmarried';

        saveData['annexure_eleven_form_status'] = 'Complete';

        const candidate_family_details_new = JSON.parse(candidate_family_details);

        if (candidate_family_details_new.length > 0) {
            saveData['applicant_form_data.family_members'] = [];
            saveData['applicant_form_data.family_members'] = candidate_family_details_new.map((item) => {
                return {
                    particulars: item?.relationship,
                    name: item?.name || '',
                    age: item?.age || 0,
                    occupation: item?.occupation || '',
                    date_of_birth: item?.date_of_birth || '',
                    is_dependent: item?.is_dependent || ''
                }
            });
        }

        const update = await JobAppliedCandidateCl.updateOne({ _id: dbObjectId(candidate_id) }, { $set: saveData });



        return res.status(200).send({ 'status': true, 'message': `Form Data Updated Successfully` });

    } catch (error) {
        console.log(error);
        return res.status(403).json({ 'status': false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE });
    }

}


controller.acceptRejectOffer = async (req, res) => {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(403).json({ status: false, message: errors.array()[0].msg });
    }

    const { candidate_id, applied_job_id, action, tentative_date } = req.body;

    if (typeof candidate_id === 'undefined') {
        return res.status(403).send({ 'status': false, 'message': 'Something went wrong' });
    } else if (typeof applied_job_id === 'undefined') {
        return res.status(403).send({ 'status': false, 'message': 'Something went wrong' });
    }

    var where = {}
    var newStatus = '';
    //where.verify_token = utm;
    where._id = dbObjectId(candidate_id);
    where['applied_jobs._id'] = { $in: [dbObjectId(applied_job_id)] };


    var messageStatus = '';
    if (action === 'accept') {
        newStatus = 'Accepted';
        messageStatus = 'accepted';
    } else {
        newStatus = 'Rejected';
        messageStatus = 'rejected';
    }


    try {
        const profileData = await JobAppliedCandidateCl.findOne(where, { 'form_status': 1, 'email': 1, 'name': 1, 'job_id': 1, 'applied_jobs': 1 });
        if (!profileData) {
            return res.status(403).send({ 'status': false, data: messageStatus, 'message': 'Something went wrong' });
        }

        const getOfferJobData = profileData.applied_jobs.find((item) => item._id.toString() === applied_job_id.toString());

        const approval_doc_id = getOfferJobData?.approval_note_data?.doc_id;
        /*********Get Approval Note Data*****/
        if (approval_doc_id) {
            var ApprovalNoteData = await ApprovalNoteCI.findOne({ _id: approval_doc_id });
            if (ApprovalNoteData) {

                /********* Check in approval Note ***********/
                const checkCandidateInApprovalNote = ApprovalNoteData?.candidate_list?.find((item) => item?.cand_doc_id?.toString() === candidate_id);

                /*********** Update in Approval Note *********/
                if (checkCandidateInApprovalNote) {

                    const filterCondition = [];
                    filterCondition.push({ 'one._id': checkCandidateInApprovalNote._id });

                    const arrayFilters = { 'arrayFilters': filterCondition }

                    const where = {}
                    where._id = ApprovalNoteData._id;
                    where['candidate_list._id'] = checkCandidateInApprovalNote._id;

                    /*Add Progress data in Approval note*/
                    const progressData = {}
                    progressData.title = `Offer Letter`;
                    progressData.activity = `Offer Letter ${newStatus} By Candidate`;
                    progressData.add_by_name = checkCandidateInApprovalNote?.name || '';
                    progressData.add_by_mobile = '';
                    progressData.add_by_email = checkCandidateInApprovalNote?.email || '';
                    progressData.add_by_designation = 'na';
                    progressData.add_date = dbDateFormat();
                    progressData.status = newStatus;

                    const saveData = {}
                    saveData['$push'] = { 'candidate_list.$[one].progress_data': progressData }

                    /* Send Accept Mail To Panelist */
                    if (action === 'accept') {
                        const panelistEmails = checkCandidateInApprovalNote?.trail_mail_list;
                        if (panelistEmails && panelistEmails.length > 0) {

                            const jobPosition = ApprovalNoteData?.job_designation;
                            const jobLocation = checkCandidateInApprovalNote?.proposed_location || '';
                            const candidateName = checkCandidateInApprovalNote?.name;
                            var onboardingDate;
                            if (typeof req.body.tentative_date !== 'undefined' && req.body.tentative_date !== '') {
                                onboardingDate = convertToDbDate(req.body.tentative_date);
                            } else {
                                var onboardingDate = checkCandidateInApprovalNote?.onboarding_date;
                            }

                            const toEmailId = panelistEmails[0];
                            const ccEmailList = panelistEmails.slice(1);
                            sendJobOfferAcceptMailToPanelist(candidateName, jobPosition, onboardingDate, toEmailId, ccEmailList, jobLocation);
                        }
                    }

                    await ApprovalNoteCI.updateOne({ _id: approval_doc_id }, saveData, arrayFilters);
                }
            }
        }


        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const onboardDate = new Date(getOfferJobData.onboard_date);
        onboardDate.setHours(0, 0, 0, 0);

        //if( getOfferJobData && profileData.form_status === 'Offer' && onboardDate >= today ){

        if (applied_job_id.toString() !== getOfferJobData._id.toString()) {
            return res.status(403).send({ 'status': false, data: messageStatus, 'message': 'Something went wrong' });
        }

        let arrayFilters = { 'arrayFilters': [{ 'one._id': getOfferJobData._id }] }

        var whereCon = {}
        whereCon['_id'] = dbObjectId(candidate_id);
        whereCon['applied_jobs._id'] = getOfferJobData._id;
        var saveData = {}
        saveData['applied_jobs.$[one].offer_status'] = newStatus;
        if (action === 'accept' && typeof req.body.tentative_date !== 'undefined' && req.body.tentative_date !== '') {
            saveData['applied_jobs.$[one].tentative_date'] = convertToDbDate(req.body.tentative_date);
        }

        try {
            await JobAppliedCandidateCl.updateOne({ _id: dbObjectId(candidate_id) }, { $set: saveData }, arrayFilters);
            return res.status(200).send({ 'status': true, data: messageStatus, 'message': 'Success' });
        } catch (error) {
            return res.status(403).send({ 'status': false, data: messageStatus, 'message': 'Something went wrong' });
        }
        //}else{
        //   return res.status(403).send( {'status':false, data: messageStatus, 'message': 'Onboarding date has been passed' } ); 
        //}

    } catch (error) {
        console.log(error);
        return res.status(403).send({ 'status': false, data: messageStatus, 'message': 'Something went wrong' });
    }
}

controller.saveDeclarationForm = async (req, res) => {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(403).json({ status: false, message: errors.array()[0].msg });
    }


    const { candidate_id, applied_job_id, is_agree } = req.body;

    if (typeof candidate_id === 'undefined') {
        return res.status(403).send({ 'status': false, 'message': 'Something went wrong' });
    }

    var where = {}
    var newStatus = '';
    //where.verify_token = utm;
    where._id = dbObjectId(candidate_id);
    where['applied_jobs._id'] = { $in: [dbObjectId(applied_job_id)] };

    if (['yes', 'Yes', 'agree'].includes(is_agree)) {
        newStatus = 'agree';
    } else if (['no', 'No', 'disagree'].includes(is_agree)) {
        newStatus = 'disagree';
    }


    try {
        const profileData = await JobAppliedCandidateCl.findOne(where, { 'applied_jobs': 1 });
        if (!profileData) {
            return res.status(403).send({ 'status': false, data: messageStatus, 'message': 'Something went wrong' });
        }

        const getOfferJobData = profileData.applied_jobs.find((item) => item._id.toString() === applied_job_id.toString());


        if (getOfferJobData) {

            if (applied_job_id.toString() !== getOfferJobData._id.toString()) {
                return res.status(403).send({ 'status': false, data: messageStatus, 'message': 'Something went wrongs' });
            }

            let arrayFilters = { 'arrayFilters': [{ 'one._id': getOfferJobData._id }] }

            var whereCon = {}
            whereCon['_id'] = dbObjectId(candidate_id);
            whereCon['applied_jobs._id'] = getOfferJobData._id;
            var saveData = {}
            saveData['applied_jobs.$[one].declaration_form_status'] = newStatus;

            try {
                await JobAppliedCandidateCl.updateOne({ _id: dbObjectId(candidate_id) }, { $set: saveData }, arrayFilters);
                return res.status(200).send({ 'status': true, 'message': 'Data updated successfully' });
            } catch (error) {
                return res.status(403).send({ 'status': false, data: messageStatus, 'message': 'Something went wrong' });
            }
        } else {
            return res.status(403).send({ 'status': false, data: messageStatus, 'message': 'Onboarding date has been passed' });
        }

    } catch (error) {
        console.log(error);
        return res.status(403).send({ 'status': false, data: messageStatus, 'message': 'Something went wrong' });
    }
}


controller.scoringSheet = async (req, res) => {

    const { job_id } = req.body;

    const where = {}

    where['applied_jobs.form_status'] = { $in: ['Interview', 'Offer'] };
    where['applied_jobs.job_id'] = dbObjectId(job_id);

    try {

        const profileData = await JobAppliedCandidateCl.aggregate([
            // Unwind the `applied_jobs` array
            { $unwind: "$applied_jobs" },
            { $unwind: "$applied_jobs.interviewer" },

            // Match only those sub-documents that meet your conditions
            {
                $match: {
                    "applied_jobs.form_status": { $in: ['Interview', 'Offer'] },
                    "applied_jobs.job_id": dbObjectId(job_id)
                }
            },

            // Project only necessary fields
            {
                $project: {
                    _id: 1,
                    name: 1,
                    email: 1,
                    mobile_no: 1,
                    job_name: "$applied_jobs.job_title",
                    'interviewer': "$applied_jobs.interviewer"
                }
            }
        ]);


        if (!profileData) {
            return res.status(403).send({ 'status': false, 'message': 'No Records Found' });
        }

        const collectEmployeeIds = profileData.flatMap(item => item.interviewer?.employee_id);

        const newEmployeeIds = [
            ...new Map(
                collectEmployeeIds
                    .map(id => dbObjectId(id))
                    .map(objId => [objId.toString(), objId]) // use string form as key
            ).values()
        ];


        if (req.body.hasOwnProperty('employee_id') && req.body.employee_id !== '') {
            var allNewEmployeeIDs = [dbObjectId(req.body.employee_id)];
        } else {
            var allNewEmployeeIDs = newEmployeeIds;
        }

        /* Fetch employee List */
        var employeeList = await EmployeeCI.find({ '_id': { $in: allNewEmployeeIDs } }, { _id: 1, name: 1, email: 1, employee_code: 1, designation: 1, mobile_no: 1, 'docs.file_name': 1, 'docs.doc_category': 1 });

        const newListData = []
        employeeList.forEach((item) => {
            const signatureImage = item?.docs?.find((elm) => elm.doc_category === 'Signature');

            let push = {}
            push.employee_doc_id = item?._id || '';
            push.employee_name = item?.name || '';
            push.employee_code = item?.employee_code || '';
            push.employee_email = item?.email || '';
            push.employee_mobile_no = item?.mobile_no || '';
            push.employee_email = item?.email || '';
            push.employee_designation = item?.designation || '';
            push.employee_signature = signatureImage?.file_name ? process.env.IMAGE_PATH + '' + signatureImage?.file_name : '';
            push.candidate_list = [];

            var collectCandidates = [];
            profileData.forEach((cnd) => {
                if (cnd?.interviewer?.employee_id.toString() === item?._id.toString()) {
                    const push = {}
                    push._id = cnd?._id;
                    push.name = cnd?.name;
                    push.email = cnd?.email;
                    push.mobile_no = cnd?.mobile_no;
                    push.job_name = cnd?.job_name;

                    const ratingData = {}
                    ratingData.rating = cnd?.interviewer?.rating || 0;
                    ratingData.job_match = cnd?.interviewer?.job_match || 0;
                    ratingData.job_knowledge = cnd?.interviewer?.job_knowledge || 0;
                    ratingData.creative_problem_solving = cnd?.interviewer?.creative_problem_solving || 0;
                    ratingData.team_player = cnd?.interviewer?.team_player || 0;
                    ratingData.communication_skill = cnd?.interviewer?.communication_skill || 0;
                    ratingData.exposure_to_job_profile = cnd?.interviewer?.exposure_to_job_profile || 0;
                    ratingData.total_rating = ratingData.job_knowledge + ratingData.creative_problem_solving + ratingData.team_player + ratingData.communication_skill + ratingData.exposure_to_job_profile + ratingData.rating + ratingData.job_match;
                    ratingData.hiring_suggestion_status = cnd?.interviewer?.hiring_suggestion_status || '';
                    ratingData.hiring_suggestion_percent = cnd?.interviewer?.hiring_suggestion_percent || '';
                    ratingData.comment = cnd?.interviewer?.comment || '';

                    push.rating_data = ratingData;
                    if (ratingData.total_rating > 0) {
                        collectCandidates.push(push);
                    }
                }
            });

            push.candidate_list = collectCandidates || [];
            if (collectCandidates.length > 0) {
                newListData.push(push);
            }
        })

        if (newListData && newListData.length > 0) {
            return res.status(200).send({ 'status': true, data: newListData, 'message': 'API Accessed Successfully' });
        } else {
            return res.status(403).send({ 'status': false, 'message': 'No Records Found' });
        }

    } catch (error) {
        console.log(error);
        return res.status(403).send({ 'status': false, 'message': 'Something went wrong' });
    }

}

controller.getInterviewerListByJobId = async (req, res) => {

    const { job_id } = req.body;

    const where = {}

    where['applied_jobs.form_status'] = { $in: ['Interview'] };
    where['applied_jobs.job_id'] = dbObjectId(job_id);

    try {

        const profileData = await JobAppliedCandidateCl.aggregate([
            // Unwind the `applied_jobs` array
            { $unwind: "$applied_jobs" },
            { $unwind: "$applied_jobs.interviewer" },

            // Match only those subdocuments that meet your conditions
            {
                $match: {
                    "applied_jobs.form_status": "Interview",
                    "applied_jobs.job_id": dbObjectId(job_id)
                }
            },

            // Project only necessary fields
            {
                $project: {
                    _id: 1,
                    name: 1,
                    email: 1,
                    mobile_no: 1,
                    job_name: "$applied_jobs.job_title",
                    'interviewer': "$applied_jobs.interviewer"
                }
            }
        ]);


        if (!profileData) {
            return res.status(403).send({ 'status': false, 'message': 'No Records Found' });
        }

        const collectEmployeeIds = profileData.flatMap(item => item.interviewer?.employee_id);

        const newEmployeeIds = [
            ...new Map(
                collectEmployeeIds
                    .map(id => dbObjectId(id))
                    .map(objId => [objId.toString(), objId]) // use string form as key
            ).values()
        ];


        var allNewEmployeeIDs = newEmployeeIds;


        /* Fetch employee List */
        var employeeList = await EmployeeCI.find({ '_id': { $in: allNewEmployeeIDs } }, { _id: 1, name: 1, email: 1, designation: 1, employee_code: 1, mobile_no: 1, 'docs.file_name': 1, 'docs.doc_category': 1 });

        const newListData = []
        employeeList.forEach((item) => {
            const signatureImage = item?.docs?.find((elm) => elm.doc_category === 'Signature');

            let push = {}
            push.employee_doc_id = item?._id || '';
            push.employee_name = item?.name || '';
            push.employee_code = item?.employee_code || '';
            push.employee_email = item?.email || '';
            push.employee_mobile_no = item?.mobile_no || '';
            push.employee_email = item?.email || '';
            push.employee_designation = item?.designation || '';
            newListData.push(push);
        })

        if (newListData && newListData.length > 0) {
            return res.status(200).send({ 'status': true, data: newListData, 'message': 'API Accessed Successfully' });
        } else {
            return res.status(403).send({ 'status': false, 'message': 'No Records Found' });
        }

    } catch (error) {
        console.log(error);
        return res.status(403).send({ 'status': false, 'message': 'Something went wrong' });
    }

}



controller.addInterviewerInScheduleInterView = async (req, res) => {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(403).json({ status: false, message: errors.array()[0].msg });
    }

    //console.log( req.body );

    const { candidate_id, applied_job_id, interviewer_id, stage } = req.body;

    const arrayFilters = { 'arrayFilters': [{ 'one._id': dbObjectId(applied_job_id) }] }

    const where = {}
    where._id = dbObjectId(candidate_id);
    where['applied_jobs._id'] = dbObjectId(applied_job_id);

    try {
        //fetch records
        const oldCandidateData = await JobAppliedCandidateCl.findOne({ _id: dbObjectId(candidate_id), 'applied_jobs._id': dbObjectId(applied_job_id) }, { 'applied_jobs': 1, 'email': 1, 'name': 1, 'job_title': 1 })
        const findOldInterViewerData = oldCandidateData.applied_jobs.find((item) => item._id.toString() === applied_job_id.toString());

        const empData = await EmployeeCI.findOne({ _id: dbObjectId(interviewer_id) }, { 'email': 1, 'name': 1, 'mobile_no': 1, 'designation': 1, 'department': 1, 'employee_code': 1 })

        var checkInterviewerInList, checkInterviewerStageInList;
        if (typeof findOldInterViewerData.interviewer !== 'undefined' && findOldInterViewerData.interviewer.length > 0) {
            checkInterviewerInList = findOldInterViewerData?.interviewer?.find((item) => item.stage === stage && item.employee_id.toString() === interviewer_id);
            checkInterviewerStageInList = findOldInterViewerData?.interviewer?.find((item) => item.stage === stage);

        }

        if (checkInterviewerInList) {
            return res.status(403).send({ 'status': false, 'message': 'Employee ID Already Exists' });
        }

        if (!checkInterviewerStageInList) {
            return res.status(403).send({ 'status': false, 'message': 'No Stage Found' });
        }

        const pushData = {}
        pushData.employee_name = empData?.name || '';
        pushData.designation = empData.designation || '';
        pushData.employee_id = empData._id;
        pushData.rating = 0;
        pushData.status = 'Pending';
        pushData.stage = stage;
        pushData.add_date = dbDateFormat();
        pushData.interview_date = checkInterviewerStageInList?.interview_date;

        const updatedData = await JobAppliedCandidateCl.updateOne(where, { $push: { 'applied_jobs.$[one].interviewer': pushData } }, arrayFilters);

        if (updatedData.modifiedCount === 1 && empData?.email !== '') {
            /**Send schedule Email To candidate */
            scheduleInterviewerMail(empData?.email, oldCandidateData.name, findOldInterViewerData.job_title, pushData.interview_date, findOldInterViewerData?.interview_type, findOldInterViewerData?.google_meet_link, pushData.employee_name, findOldInterViewerData?.venue_location);

        }
        return res.status(200).send({ 'status': true, 'message': 'Employee Updated Successfully' });

    }
    catch (error) {
        console.log(error);
        return res.status(403).send({ 'status': false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE });
    }
}


controller.removeInterviewerFromScheduleInterView = async (req, res) => {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(403).json({ status: false, message: errors.array()[0].msg });
    }

    //console.log( req.body );

    const { candidate_id, applied_job_id, interviewer_id, stage } = req.body;

    const arrayFilters = { 'arrayFilters': [{ 'one._id': dbObjectId(applied_job_id) }] }

    const where = {}
    where._id = dbObjectId(candidate_id);
    where['applied_jobs._id'] = dbObjectId(applied_job_id);

    try {
        //fetch records
        const oldCandidateData = await JobAppliedCandidateCl.findOne({ _id: dbObjectId(candidate_id), 'applied_jobs._id': dbObjectId(applied_job_id) }, { 'applied_jobs': 1, 'email': 1, 'name': 1, 'job_title': 1 })
        const findOldInterViewerData = oldCandidateData.applied_jobs.find((item) => item._id.toString() === applied_job_id.toString());

        const empData = await EmployeeCI.findOne({ _id: dbObjectId(interviewer_id) }, { 'email': 1, 'name': 1, 'mobile_no': 1, 'designation': 1, 'department': 1, 'employee_code': 1 })

        var checkInterviewerInList, checkInterviewerStageInList;
        if (typeof findOldInterViewerData.interviewer !== 'undefined' && findOldInterViewerData.interviewer.length > 0) {
            checkInterviewerInList = findOldInterViewerData?.interviewer?.find((item) => item.stage === stage && item.employee_id.toString() === interviewer_id);
            checkInterviewerStageInList = findOldInterViewerData?.interviewer?.find((item) => item.stage === stage);

        }

        if (!checkInterviewerInList) {
            return res.status(403).send({ 'status': false, 'message': 'Employee ID not Exists' });
        }

        if (!checkInterviewerStageInList) {
            return res.status(403).send({ 'status': false, 'message': 'No Stage Found' });
        }


        const updatedData = await JobAppliedCandidateCl.updateOne(where, { $pull: { 'applied_jobs.$[one].interviewer': { 'employee_id': dbObjectId(interviewer_id), 'stage': stage } } }, arrayFilters);
        if (updatedData.modifiedCount === 1 && empData?.email !== '') {
            /**Send schedule Email To candidate */
            cancelInterviewToInterviewer(empData?.email, oldCandidateData.name, findOldInterViewerData.job_title, checkInterviewerStageInList?.interview_date, empData.name);

        }
        return res.status(200).send({ 'status': true, 'message': 'Employee Removed Successfully' });
    }
    catch (error) {
        return res.status(403).send({ 'status': false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE });
    }
}


controller.updateInterviewDoneStatus = async (req, res) => {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(403).json({ status: false, message: errors.array()[0].msg });
    }

    const { candidate_doc_id, applied_job_doc_id } = req.body;

    try {

        const arrayFilters = { 'arrayFilters': [{ 'one._id': dbObjectId(applied_job_doc_id) }] }

        const where = {}
        where._id = dbObjectId(candidate_doc_id);
        where['applied_jobs._id'] = dbObjectId(applied_job_doc_id);

        const saveData = {}
        saveData['applied_jobs.$[one].interview_status'] = 'Completed';

        JobAppliedCandidateCl.updateOne(where, { $set: saveData }, arrayFilters)
            .then((data) => {
                return res.status(200).send({ 'status': true, 'message': `Status Updated Successfully` });
            }).catch((error) => {
                return res.status(403).send({ 'status': false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE });
            });
    }
    catch (error) {
        return res.status(403).send({ 'status': false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE });
    }
}


/************* update joining kit update status **************/
controller.updateOnboardStatusOfApprovalTimeLine = async (req, res) => {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(403).json({ status: false, message: errors.array()[0].msg });
    }

    const { approval_note_id, candidate_id, form_step, add_by_name, add_by_mobile, add_by_designation, add_by_email } = req.body;

    try {

        /************* Fetch Approval Note Data ***************/
        const ApprovalNoteData = await ApprovalNoteCI.findOne({ _id: dbObjectId(approval_note_id) });
        if (!ApprovalNoteData) {
            return res.status(403).json({ 'status': false, 'message': 'Approval Note Not Found' });
        }

        const findCandidate = ApprovalNoteData?.candidate_list.find((item) => item.cand_doc_id.toString() === candidate_id.toString());
        const checkAnyPendingApprovalInCandidate = findCandidate?.approval_history.find((elm) => elm.approval_status !== 'Approved');
        if (checkAnyPendingApprovalInCandidate) {
            return res.status(403).json({ 'status': false, 'message': 'This Candidate is not Approved By Panel Members' });
        }


        /*Add Progress data in Approval note*/
        const progressData = {}
        progressData.add_by_name = add_by_name;
        progressData.add_by_mobile = add_by_mobile;
        progressData.add_by_email = add_by_email;
        progressData.add_by_designation = add_by_designation;
        progressData.add_date = dbDateFormat();


        /*Add Progress data in Approval note*/
        if (form_step === 'Joining Kit') {

            progressData.title = `Joining Kit`;
            progressData.activity = 'Joining Kit Uploaded by Candidate';
            progressData.status = 'Uploaded';
        }
        else if (form_step === 'Appointment Letter') {

            progressData.title = `Appointment Letter`;
            progressData.activity = 'Appointment Letter Uploaded by Candidate';
            progressData.status = 'Uploaded';
        }

        await updateProgressDataInApprovalNote(approval_note_id, candidate_id, progressData, null);

        return res.status(200).send({ 'status': true, 'message': `${form_step} Status Updated Successfully` });

    } catch (error) {
        return res.status(403).json({ 'status': false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE });
    }
}


/************* get email content data  **************/
controller.getCandidateEmailContent = async (req, res) => {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(403).json({ status: false, message: errors.array()[0].msg });
    }

    const { approval_note_id, candidate_id, doc_category } = req.body;

    const where = {}
    if (candidate_id && candidate_id !== '') {
        where.candidate_id = dbObjectId(candidate_id);
    }

    if (doc_category && doc_category !== '') {
        where.doc_category = doc_category;
    }

    if (approval_note_id && approval_note_id !== '') {
        where.reference_doc_id = dbObjectId(approval_note_id);
    }



    try {

        /************* Fetch Email Content Data ***************/
        const getData = await CandidateSentMailLogsCI.findOne(where);

        if (!getData) {
            return res.status(403).json({ 'status': false, 'message': 'Email Data Not Found' });
        }

        return res.status(200).send({ 'status': true, data: getData, 'message': `Status Updated Successfully` });

    } catch (error) {
        return res.status(403).json({ 'status': false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE });
    }
}



/***************** Get candidate email content **********************/
controller.getCandidateAppointmentEmailList = async (req, res) => {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(403).json({ status: false, message: errors.array()[0].msg });
    }

    const { page_no, per_page_record, employee_id } = req.body;

    const hrConfig = JSON.parse(fs.readFileSync('./src/config/hr_config_file.txt', 'utf8'));
    var hiring_approval_hr_email_id = hrConfig?.hiring_approval_hr_email_id || '';

    /**************** get default **************/
    const employeeIdData = await EmployeeCI.findOne({ email: hiring_approval_hr_email_id }, { _id: 1 });
    //console.log( employeeIdData );
    const pageOptions = {
        page: parseInt(((page_no ? page_no : 1) - 1)) || 0,
        limit: parseInt(per_page_record) || 10
    }

    const where = {}
    var allowedEmployeeId;

    where["candidate_list.appointment_letter_verification_status"] = {
        $exists: true,
        $ne: null,
        $type: "object"
    }

    if (req.body.hasOwnProperty('filter_type') && req.body.filter_type == 'Complete') {
        where['candidate_list.appointment_letter_verification_status.status'] = 'Complete';
        where['candidate_list.document_status.appointment_letter'] = { $in: ["approved", "uploaded"] };
    } else if (req.body.hasOwnProperty('filter_type') && req.body.filter_type == 'Pending') {
        where['candidate_list.appointment_letter_verification_status.status'] = 'Pending';
        where['candidate_list.document_status.appointment_letter'] = { $in: ["generated"] };
    } else {
        where['candidate_list.appointment_letter_verification_status.status'] = { $in: ['Complete', 'Pending'] };
        where['candidate_list.document_status.appointment_letter'] = { $in: ["generated", "approved", "uploaded"] };
    }



    //console.log( where );



    if (employee_id && employeeIdData && employeeIdData?._id.toString() === employee_id) {
        allowedEmployeeId = employee_id;
    }

    if (req.body.hasOwnProperty('keyword') && req.body.keyword !== '') {
        let searchKeyWord = new RegExp(commonOnly(req.body.keyword));
        if (isValidEmail(req.body.keyword)) {
            where['candidate_list.email'] = req.body.keyword;
        } else {
            where['$or'] = [
                { 'project_name': { $regex: searchKeyWord, $options: 'i' } },
                { 'job_title': { $regex: searchKeyWord, $options: 'i' } },
                { 'job_designation': { $regex: searchKeyWord, $options: 'i' } },
                { 'candidate_list.name': { $regex: searchKeyWord, $options: 'i' } },
                { 'candidate_list.job_type': { $regex: searchKeyWord, $options: 'i' } },
                { 'candidate_list.proposed_location': { $regex: searchKeyWord, $options: 'i' } }
            ]
        }
    }

    const sortBy = { _id: 1 }

    // console.log( where ); 

    try {

        const getData = await ApprovalNoteCI.aggregate([
            { $unwind: "$candidate_list" },

            { $match: where },

            // Project only necessary fields
            {
                $project: {
                    _id: 1,
                    project_name: 1,
                    project_id: 1,
                    job_title: 1,
                    job_id: 1,
                    job_designation: 1,
                    mpr_offer_type: 1,
                    mpr_fund_type: 1,
                    approval_note_id: 1,
                    status: 1,
                    applied_from: 1,
                    cand_doc_id: "$candidate_list.cand_doc_id",
                    applied_job_doc_id: "$candidate_list.applied_job_doc_id",
                    name: "$candidate_list.name",
                    email: "$candidate_list.email",
                    job_type: "$candidate_list.job_type",
                    applied_from: "$candidate_list.applied_from",
                    approval_status: "$candidate_list.approval_status",
                    approval_date: "$candidate_list.approval_date",
                    interview_type: "$candidate_list.interview_type",
                    offer_ctc: "$candidate_list.offer_ctc",
                    onboarding_date: "$candidate_list.onboarding_date",
                    job_valid_date: "$candidate_list.job_valid_date",
                    interview_shortlist_status: "$candidate_list.interview_shortlist_status",
                    proposed_location: "$candidate_list.proposed_location",
                    payment_type: "$candidate_list.payment_type",
                    document_status: "$candidate_list.document_status",
                    is_verification_skipped: "$candidate_list.is_verification_skipped",
                    appointment_letter_verification_status: "$candidate_list.appointment_letter_verification_status.status",
                }
            },

            // Sort must be inside aggregation
            { $sort: sortBy },

            // Skip and Limit also inside aggregation
            { $skip: pageOptions.page * pageOptions.limit },
            { $limit: pageOptions.limit }
        ]);

        if (getData.length === 0) {
            return res.status(403).json({ 'status': false, 'message': 'No Data Found' });
        }

        return res.status(200).send({ 'status': true, 'allowed_employee_id': allowedEmployeeId, data: getData, 'message': `API Accessed Successfully` });

    } catch (error) {
        console.log(error);
        return res.status(403).json({ 'status': false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE });
    }
}


/*send appointment letter to candidate after approve */
controller.sendAppointmentLetterToCandidateAfterApproval = async (req, res) => {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(403).json({ status: false, message: errors.array()[0].msg });
    }

    const { approval_note_doc_id, candidate_doc_id, add_by_name, add_by_mobile, add_by_designation, add_by_email } = req.body;

    try {

        /*********Get Approval Note Data*****/
        var ApprovalNoteData = await ApprovalNoteCI.findOne({ _id: dbObjectId(approval_note_doc_id) });
        if (!ApprovalNoteData) {
            return res.status(403).json({ status: false, message: 'Approval Note Not Found' });
        }

        /*********Check in approval Note***********/
        const checkCandidateInApprovalNote = ApprovalNoteData?.candidate_list?.find((item) => item?.cand_doc_id?.toString() === candidate_doc_id);

        if (!checkCandidateInApprovalNote) {
            return res.status(403).json({ status: false, message: 'No Data Found' });
        }

        /*fetch mail from email list */
        const mailWhere = {}
        mailWhere.candidate_id = dbObjectId(candidate_doc_id);
        mailWhere.doc_category = 'Appointment Letter';
        mailWhere.reference_doc_id = dbObjectId(approval_note_doc_id);
        const emailContent = await CandidateSentMailLogsCI.findOne(mailWhere, { content_data: 1, attachments: 1 });

        if (!emailContent) {
            return res.status(403).json({ status: false, message: 'Appointment letter not found' });
        }


        /*********** Update in Approval Note *************/
        const filterCondition = [];
        filterCondition.push({ 'one._id': checkCandidateInApprovalNote._id });
        const arrayFilters = { 'arrayFilters': filterCondition }

        const where = {}
        where._id = dbObjectId(approval_note_doc_id);
        where['candidate_list._id'] = checkCandidateInApprovalNote._id;

        const processBarData = {}
        if (add_by_name || add_by_email) {
            processBarData.title = 'Appointment Letter Send To Candidate';
            processBarData.activity = 'Appointment Letter Sent';
            processBarData.status = 'Sent';
            processBarData.add_by_name = add_by_name || '';
            processBarData.add_by_email = add_by_email || '';
            processBarData.add_by_mobile = add_by_mobile || '';
            processBarData.add_by_designation = add_by_designation || '';
            processBarData.add_date = dbDateFormat();
        }

        const saveData = {}

        const collectUpdateData = {}
        collectUpdateData['candidate_list.$[one].document_status.appointment_letter'] = 'mailsent';

        saveData['$set'] = collectUpdateData;
        saveData['$push'] = { 'candidate_list.$[one].progress_data': processBarData };

        await ApprovalNoteCI.updateOne(where, saveData, arrayFilters);

        /*Prepare appointment letter email content */
        var toEmailId = checkCandidateInApprovalNote?.email || '';
        var candidateName = checkCandidateInApprovalNote?.name || '';
        var jobPosition = ApprovalNoteData?.job_designation || '';
        var templateHtml = emailContent?.content_data;
        var ccEmailList = checkCandidateInApprovalNote?.trail_mail_list || '';

        sendAppointmentLetterMailToCandidate(toEmailId, candidateName, jobPosition, templateHtml, ccEmailList);

        return res.status(200).json({ status: true, 'message': 'Appointment Letter sent Successfully' });
    }
    catch (error) {
        return res.status(403).send({ 'status': false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE });
    }
}


/*send appointment letter to candidate after approve */
controller.saveIDCardDetailsInCandidateProfile = async (req, res) => {

    if (req.body && typeof req.body === 'object') {
        req.body = JSON.parse(JSON.stringify(req.body));
    }

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        if (req.file && req.file.filename) {
            removeFile(req.file.filename);
        }
        return res.status(403).json({ status: false, message: errors.array()[0].msg });
    }

    const { approval_note_doc_id, candidate_doc_id, add_by_name, add_by_mobile, add_by_designation, add_by_email, blood_group, office_address, employee_code, emergency_contact_no, candidate_name } = req.body;

    try {

        /*********Get Approval Note Data*****/
        var ApprovalNoteData = await ApprovalNoteCI.findOne({ _id: dbObjectId(approval_note_doc_id) });
        if (!ApprovalNoteData) {
            return res.status(403).json({ status: false, message: 'Approval Note Not Found' });
        }

        /*********Check in approval Note***********/
        const checkCandidateInApprovalNote = ApprovalNoteData?.candidate_list?.find((item) => item?.cand_doc_id?.toString() === candidate_doc_id);

        if (!checkCandidateInApprovalNote) {
            return res.status(403).json({ status: false, message: 'No Data Found' });
        }


        /*********** Update in Approval Note *************/
        const filterCondition = [];
        filterCondition.push({ 'one._id': checkCandidateInApprovalNote._id });
        const arrayFilters = { 'arrayFilters': filterCondition }

        const where = {}
        where._id = dbObjectId(approval_note_doc_id);
        where['candidate_list._id'] = checkCandidateInApprovalNote._id;

        const processBarData = {}
        if (add_by_name || add_by_email) {
            processBarData.title = 'ID Card Generated';
            processBarData.activity = 'ID Card';
            processBarData.status = 'Sent';
            processBarData.add_by_name = add_by_name || '';
            processBarData.add_by_email = add_by_email || '';
            processBarData.add_by_mobile = add_by_mobile || '';
            processBarData.add_by_designation = add_by_designation || '';
            processBarData.add_date = dbDateFormat();
        }

        const saveData = {}
        saveData['$push'] = { 'candidate_list.$[one].progress_data': processBarData };

        await ApprovalNoteCI.updateOne(where, saveData, arrayFilters);

        /*Save Content into Candidate profile content */
        const arrayFiltersAtCandidate = { 'arrayFilters': [{ 'one._id': checkCandidateInApprovalNote.applied_job_doc_id }] }

        const whereCandidate = {}
        whereCandidate._id = dbObjectId(candidate_doc_id);
        whereCandidate['applied_jobs._id'] = checkCandidateInApprovalNote.applied_job_doc_id;

        const saveDataCandidate = {}
        saveDataCandidate['annexure_eleven_form_data.blood_group'] = blood_group;
        saveDataCandidate['applied_jobs.$[one].id_card_status'] = 'uploaded';
        saveDataCandidate['applied_jobs.$[one].id_card_details.employee_code'] = employee_code;
        saveDataCandidate['applied_jobs.$[one].id_card_details.candidate_name'] = candidate_name;
        saveDataCandidate['applied_jobs.$[one].id_card_details.emergency_contact_no'] = emergency_contact_no;
        saveDataCandidate['applied_jobs.$[one].id_card_details.blood_group'] = blood_group;
        saveDataCandidate['applied_jobs.$[one].id_card_details.office_address'] = office_address;
        if (req?.file?.filename) {
            saveDataCandidate['applied_jobs.$[one].id_card_details.card_image'] = req.file.filename;
        }
        saveDataCandidate['applied_jobs.$[one].id_card_details.add_date'] = dbDateFormat();
        saveDataCandidate['applied_jobs.$[one].id_card_details.add_by_mobile'] = add_by_mobile;
        saveDataCandidate['applied_jobs.$[one].id_card_details.add_by_designation'] = add_by_designation;
        saveDataCandidate['applied_jobs.$[one].id_card_details.add_by_email'] = add_by_email;
        saveDataCandidate['applied_jobs.$[one].id_card_details.add_by_name'] = add_by_name;

        await JobAppliedCandidateCl.updateOne(whereCandidate, { $set: saveDataCandidate }, arrayFiltersAtCandidate);

        return res.status(200).json({ status: true, 'message': 'ID Card Updated Successfully' });
    }
    catch (error) {
        return res.status(403).send({ 'status': false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE });
    }
}


var updateApprovalNoteByCeoSir = async (approval_note_doc_id, candidate_id, employee_id, status, remark) => {

    const noteData = await ApprovalNoteCI.findOne({ '_id': dbObjectId(approval_note_doc_id) })

    if (!noteData) {
        return { 'status': false, 'message': `No Record Found` }
    }

    const findCandidate = noteData.candidate_list.find((item) => item.cand_doc_id.toString() === candidate_id.toString());
    if (!findCandidate) {
        return { 'status': false, 'message': `Candidate not found` }
    }

    const findEmployeeInRecord = noteData.panel_members_list.find((item) => item.emp_doc_id.toString() === employee_id.toString());

    if (!findEmployeeInRecord) {
        return { 'status': false, 'message': `Employee not found` }
    }

    if (typeof findCandidate.approval_history !== 'undefined' && findCandidate.approval_history.length > 0) {
        const alreadyUpdatedStatus = findCandidate.approval_history.find((item) => item.emp_doc_id.toString() === employee_id.toString());
        if (typeof alreadyUpdatedStatus !== 'undefined' && ['Approved', 'Rejected'].includes(alreadyUpdatedStatus.approval_status)) {
            return { 'status': false, 'message': `Thank You For Your Support` }
        }
    }

    /*Find Rest One candidate Entry that is not approved*/
    const checkPendingApproval = noteData.candidate_list.filter(candidate => {
        return !candidate.approval_history.some(history => history.emp_doc_id.toString() === employee_id.toString());
    });


    /*Find Next Employee For Approval Note Mail*/
    var nextEmployeeData = {}
    if (employee_id !== 'NA') {
        const nextCandidates = noteData.panel_members_list.filter(emp => emp.priority > findEmployeeInRecord.priority);
        nextCandidates.sort((a, b) => a.priority - b.priority);
        nextEmployeeData = nextCandidates.length > 0 ? nextCandidates[0] : null;
    }


    const arrayFilters = { 'arrayFilters': [{ 'one._id': findCandidate._id }, { 'two._id': findEmployeeInRecord._id }] }

    const where = {}
    where._id = dbObjectId(approval_note_doc_id);
    where['candidate_list._id'] = findCandidate._id;
    where['panel_members_list._id'] = findEmployeeInRecord._id;

    const saveData = {}
    saveData['candidate_list.$[one].approval_date'] = dbDateFormat();
    saveData['candidate_list.$[one].approval_status'] = status;

    saveData['panel_members_list.$[two].approved_date'] = dbDateFormat();
    if (['', 'Pending'].includes(findEmployeeInRecord.approval_status)) {
        saveData['panel_members_list.$[two].approval_status'] = status;
    }

    if (employee_id === 'NA') {
        saveData['status'] = 'Completed';
        var hrConfig = JSON.parse(fs.readFileSync('./src/config/hr_config_file.txt', 'utf8'));
        if (hrConfig?.ceo_name) {
            saveData['panel_members_list.$[two].name'] = hrConfig?.ceo_name;
        }
        if (hrConfig?.ceo_digital_signature) {
            saveData['panel_members_list.$[two].signature'] = hrConfig?.ceo_digital_signature;
        }
    }

    const approvalHistory = {}
    approvalHistory.emp_doc_id = employee_id;
    approvalHistory.remark = remark;
    approvalHistory.approved_date = dbDateFormat();
    approvalHistory.approval_status = status;

    await ApprovalNoteCI.updateOne(where, { $set: saveData, $push: { 'candidate_list.$[one].approval_history': approvalHistory } }, arrayFilters);

    /*send final mail , who had created the note*/
    //if( employee_id === 'NA' /*&& checkPendingApproval.length === 1*/ ){
    if (employee_id === 'NA') {
        FinalApprovalNoteMailToAddedByUser(noteData, status);
    }

    return { 'status': true, 'message': `Status ${status} Successfully` }

}

controller.approveApprovalNoteByCeoSir = async (req, res) => {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(403).json({ status: false, message: errors.array()[0].msg });
    }

    const { employee_id, status, remark } = req.body;

    const candidateIds = req.body.candidate_ids;

    if (!Array.isArray(candidateIds) || candidateIds.length === 0) {
        return res.status(400).json({ status: false, message: "candidate_ids must be a non-empty array" });
    }


    /* add new condition need to discuss*/
    if (status === 'need_to_discusss') {
        const approvalNoteidsList = candidateIds.map((item) => { return dbObjectId(item?.approval_note_doc_id) });
        const candidateIdsList = candidateIds.map((item) => { return dbObjectId(item?.id) });

        const where = {}
        where['_id'] = { $in: approvalNoteidsList }
        where['candidate_list.cand_doc_id'] = { $in: candidateIdsList }


        const findCandidateData = await ApprovalNoteCI.aggregate([
            { $unwind: "$candidate_list" },

            { $match: where },
            {
                $project: {
                    _id: 1,
                    project_name: 1,
                    project_id: 1,
                    job_title: 1,
                    job_designation: 1,
                    approval_note_id: 1,
                    status: 1,
                    applied_from: 1,
                    name: "$candidate_list.name",
                    email: "$candidate_list.email",
                    job_type: "$candidate_list.job_type",
                    interview_shortlist_status: "$candidate_list.interview_shortlist_status",
                    job_designation: 1,
                    proposed_location: "$candidate_list.proposed_location",
                    onboarding_date: "$candidate_list.onboarding_date",
                    job_valid_date: "$candidate_list.job_valid_date"
                }
            }
        ]);

        if (findCandidateData.length > 0) {
            needToDiscussMail(findCandidateData, remark);
        }

        return res.status(200).json({ status: true, message: "Mail Sent to Corporate HR" });

    }


    var employeeSignatureImage = '';
    /*get employee signature*/
    if (employee_id !== 'NA') {
        const fetchEmployeeProfileData = await EmployeeCI.findOne({ _id: dbObjectId(employee_id), 'docs.doc_category': 'Signature' }, { 'docs.doc_category': 1, 'docs.file_name': 1 });

        if (fetchEmployeeProfileData && fetchEmployeeProfileData?.docs.length > 0 && fetchEmployeeProfileData?.docs[0]?.doc_category === 'Signature' && fetchEmployeeProfileData?.docs[0]?.file_name !== '') {
            employeeSignatureImage = fetchEmployeeProfileData?.docs[0]?.file_name;
        }
    }


    for (const item of candidateIds) {
        const result = await updateApprovalNoteByCeoSir(
            item?.approval_note_doc_id,
            item?.id,
            employee_id,
            status,
            remark
        );
    }


    return res.status(200).send({ 'status': true, 'message': `Status ${status} Successfully` });

}


controller.approveApprovalNoteByHodSir = async (req, res) => {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(403).json({ status: false, message: errors.array()[0].msg });
    }

    const { employee_id, status, remark } = req.body;

    const candidateIds = req.body.candidate_ids;

    if (!Array.isArray(candidateIds) || candidateIds.length === 0) {
        return res.status(400).json({ status: false, message: "candidate_ids must be a non-empty array" });
    }


    /* add new condition need to discuss*/
    if (status === 'need_to_discusss') {
        const approvalNoteidsList = candidateIds.map((item) => { return dbObjectId(item?.approval_note_doc_id) });
        const candidateIdsList = candidateIds.map((item) => { return dbObjectId(item?.id) });

        const where = {}
        where['_id'] = { $in: approvalNoteidsList }
        where['candidate_list.cand_doc_id'] = { $in: candidateIdsList }


        const findCandidateData = await ApprovalNoteCI.aggregate([
            { $unwind: "$candidate_list" },

            { $match: where },
            {
                $project: {
                    _id: 1,
                    project_name: 1,
                    project_id: 1,
                    job_title: 1,
                    job_designation: 1,
                    approval_note_id: 1,
                    status: 1,
                    applied_from: 1,
                    name: "$candidate_list.name",
                    email: "$candidate_list.email",
                    job_type: "$candidate_list.job_type",
                    interview_shortlist_status: "$candidate_list.interview_shortlist_status",
                    job_designation: 1,
                    proposed_location: "$candidate_list.proposed_location",
                    onboarding_date: "$candidate_list.onboarding_date",
                    job_valid_date: "$candidate_list.job_valid_date"
                }
            }
        ]);

        if (findCandidateData.length > 0) {
            needToDiscussMail(findCandidateData, remark);
        }

        return res.status(200).json({ status: true, message: "Mail Sent to Corporate HR" });

    }


    var employeeSignatureImage = '';
    /*get employee signature*/
    if (employee_id !== 'NA') {
        const fetchEmployeeProfileData = await EmployeeCI.findOne({ _id: dbObjectId(employee_id), 'docs.doc_category': 'Signature' }, { 'docs.doc_category': 1, 'docs.file_name': 1 });

        if (fetchEmployeeProfileData && fetchEmployeeProfileData?.docs.length > 0 && fetchEmployeeProfileData?.docs[0]?.doc_category === 'Signature' && fetchEmployeeProfileData?.docs[0]?.file_name !== '') {
            employeeSignatureImage = fetchEmployeeProfileData?.docs[0]?.file_name;
        }
    }

    for (const item of candidateIds) {
        var result = await updateApprovalNoteStatusInBulk(item?.approval_note_doc_id, employee_id, item?.id, status, remark);
    }

    return res.status(200).send({ 'status': true, 'message': `Status ${status} Successfully` });

}


var updateApprovalNoteStatusInBulk = async (approval_note_doc_id, employee_id, candidate_id, status, remark) => {


    var employeeSignatureImage = '';
    /*get employee signature*/
    if (employee_id !== 'NA') {
        const fetchEmployeeProfileData = await EmployeeCI.findOne({ _id: dbObjectId(employee_id), 'docs.doc_category': 'Signature' }, { 'docs.doc_category': 1, 'docs.file_name': 1 });

        if (fetchEmployeeProfileData && fetchEmployeeProfileData?.docs.length > 0 && fetchEmployeeProfileData?.docs[0]?.doc_category === 'Signature' && fetchEmployeeProfileData?.docs[0]?.file_name !== '') {
            employeeSignatureImage = fetchEmployeeProfileData?.docs[0]?.file_name;
        }
    }


    ApprovalNoteCI.findOne({ '_id': dbObjectId(approval_note_doc_id) })
        .then((noteData) => {
            if (!noteData) {
                return { 'status': false, 'message': `No Record Found` };
            }

            const findCandidate = noteData.candidate_list.find((item) => item.cand_doc_id.toString() === candidate_id.toString());
            if (!findCandidate) {
                return { 'status': false, 'message': `Candidate not found` };
            }

            const findEmployeeInRecord = noteData.panel_members_list.find((item) => item.emp_doc_id.toString() === employee_id.toString());

            if (!findEmployeeInRecord) {
                return { 'status': false, 'message': `Employee not found` };
            }

            if (typeof findCandidate.approval_history !== 'undefined' && findCandidate.approval_history.length > 0) {
                const alreadyUpdatedStatus = findCandidate.approval_history.find((item) => item.emp_doc_id.toString() === employee_id.toString());
                if (typeof alreadyUpdatedStatus !== 'undefined' && ['Approved', 'Rejected'].includes(alreadyUpdatedStatus.approval_status)) {
                    return { 'status': false, 'message': `Thank You For Your Support` };
                }
            }

            /*Find Rest One candidate Entry that is not approved*/
            const checkPendingApproval = noteData.candidate_list.filter(candidate => {
                return !candidate.approval_history.some(history => history.emp_doc_id.toString() === employee_id.toString());
            });


            /*Find Next Employee For Approval Note Mail*/
            var nextEmployeeData = {}
            if (employee_id !== 'NA') {
                const nextCandidates = noteData.panel_members_list.filter(emp => emp.priority > findEmployeeInRecord.priority);
                nextCandidates.sort((a, b) => a.priority - b.priority);
                nextEmployeeData = nextCandidates.length > 0 ? nextCandidates[0] : null;
            }


            const arrayFilters = { 'arrayFilters': [{ 'one._id': findCandidate._id }, { 'two._id': findEmployeeInRecord._id }] }

            const where = {}
            where._id = dbObjectId(approval_note_doc_id);
            where['candidate_list._id'] = findCandidate._id;
            where['panel_members_list._id'] = findEmployeeInRecord._id;

            const saveData = {}
            saveData['candidate_list.$[one].approval_date'] = dbDateFormat();
            saveData['candidate_list.$[one].approval_status'] = status;

            saveData['panel_members_list.$[two].approved_date'] = dbDateFormat();
            if (['', 'Pending'].includes(findEmployeeInRecord.approval_status)) {
                saveData['panel_members_list.$[two].approval_status'] = status;
            }

            /****** Add employee signature forcefully ********/
            if (employee_id !== 'NA' && employeeSignatureImage !== '') {
                saveData['panel_members_list.$[two].signature'] = employeeSignatureImage;
            }

            if (employee_id === 'NA' && checkPendingApproval.length === 1) {
                saveData['status'] = 'Completed';
                var hrConfig = JSON.parse(fs.readFileSync('./src/config/hr_config_file.txt', 'utf8'));
                if (hrConfig?.ceo_name) {
                    saveData['panel_members_list.$[two].name'] = hrConfig?.ceo_name;
                }
                if (hrConfig?.ceo_digital_signature) {
                    saveData['panel_members_list.$[two].signature'] = hrConfig?.ceo_digital_signature;
                }
            }

            const approvalHistory = {}
            approvalHistory.emp_doc_id = employee_id;
            approvalHistory.remark = remark;
            approvalHistory.approved_date = dbDateFormat();
            approvalHistory.approval_status = status || 'Approved';

            ApprovalNoteCI.updateOne(where, { $set: saveData, $push: { 'candidate_list.$[one].approval_history': approvalHistory } }, arrayFilters)
                .then((data) => {
                    if (employee_id !== 'NA' && nextEmployeeData && checkPendingApproval.length === 1) {
                        sendJobOfferApprovalMailToNextEmployee(noteData, nextEmployeeData.emp_doc_id);
                    }
                    /*send final mail , who had created the note*/
                    if (employee_id === 'NA' && checkPendingApproval.length === 1) {
                        FinalApprovalNoteMailToAddedByUser(noteData, status);
                    }
                    return { 'status': true, 'message': `Status ${status} Successfully` };
                }).catch((error) => {
                    console.log(error);
                    return { 'status': false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE };
                });

        }).catch((error) => {
            console.log(error);
            return { 'status': false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE };
        });
}



controller.skipOfferJoiningLetter = async (req, res) => {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(406).json({ status: false, message: errors.array()[0].msg });
    }

    const { approval_note_doc_id, candidate_doc_id, skip_status_for, add_by_name, add_by_mobile, add_by_designation, add_by_email, content } = req.body;

    try {

        const added_by_data = {
            name: add_by_name || '',
            email: add_by_email || '',
            mobile: add_by_mobile || '',
            designation: add_by_designation || ''
        }


        /************* Fetch Approval Note Data ***************/
        const ApprovalNoteData = await ApprovalNoteCI.findOne({ _id: dbObjectId(approval_note_doc_id) });
        if (!ApprovalNoteData) {
            return res.status(403).json({ 'status': false, 'message': 'Template Not Found' });
        }

        const findCandidate = ApprovalNoteData?.candidate_list.find((item) => item.cand_doc_id.toString() === candidate_doc_id.toString());

        var applied_job_doc_id = findCandidate?.applied_job_doc_id;

        /*Add Progress data in Approval note*/
        const progressData = {}
        progressData.add_by_name = add_by_name;
        progressData.add_by_mobile = add_by_mobile;
        progressData.add_by_email = add_by_email;
        progressData.add_by_designation = add_by_designation;
        progressData.add_date = dbDateFormat();


        /******** Define document status***********/
        var document_status_for_db = 'Skipped';

        /************* Skip Offer Job letter ***************/
        if (skip_status_for === 'Offer Letter') {
            const arrayFilters = { 'arrayFilters': [{ 'one._id': findCandidate.applied_job_doc_id }] }
            const where = {}
            where._id = findCandidate.cand_doc_id;
            where['applied_jobs._id'] = findCandidate.applied_job_doc_id;

            const saveData = {}
            saveData.form_status = 'Offer';
            saveData.onboarding_docs_stage = 'offerletter';
            saveData['applied_jobs.$[one].form_status'] = 'Offer';
            saveData['applied_jobs.$[one].offer_status'] = 'Skipped';

            await JobAppliedCandidateCl.updateOne(where, { $set: saveData }, arrayFilters);

            /*Add Progress data in Approval note*/
            progressData.title = `Offer Letter`;
            progressData.activity = `Offer Letter Skipped By ${add_by_name}`;
            progressData.status = 'Offer Skipped';

        }
        else if (skip_status_for === 'Joining Kit') {
            const where = {}
            where._id = findCandidate.cand_doc_id;
            const saveData = {}
            saveData.onboarding_docs_stage = 'joiningkit';
            await JobAppliedCandidateCl.updateOne(where, { $set: saveData });

            /*Add Progress data in Approval note*/
            progressData.title = `Joining Kit`;
            progressData.activity = `Joining Kit Skipped By ${add_by_name}`;
            progressData.status = 'Joining Kit Skipped';

        }

        /*Finally Add Progress data in Approval note end script*/
        await updateProgressDataInApprovalNote(approval_note_doc_id, candidate_doc_id, progressData, null, document_status_for_db, null);


        /*update mail send status in approval note*/
        updateDocumentStatusInApproval(approval_note_doc_id, candidate_doc_id, skip_status_for, document_status_for_db);


        /******** Save Send Mail Records ********/
        if (skip_status_for === 'Offer Letter') {
            const generalConfig = JSON.parse(fs.readFileSync('./src/config/general_config_file.txt', 'utf8'));
            const organizationConfig = JSON.parse(fs.readFileSync('./src/config/organization_config_file.txt', 'utf8'));
            const companyName = organizationConfig?.organization_name;
            const companyLogo = process.env.IMAGE_PATH + '' + generalConfig.logo_image;

            const msgBody = `<!DOCTYPE html>
	<html>
	<head>
		<meta charset="utf-8">
		<meta name="viewport" content="width=device-width, initial-scale=1">
		<title>Candidate Offer Letter</title>
		<link href="https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap" rel="stylesheet">

	</head>
	<body style="font-family: 'Poppins', sans-serif; color: #585858;">
		<table style="max-width: 700px;" center>
			<tr class="headerContent">
				<td style="text-align: center;border-bottom:1px solid #34209B; padding: 10px;">
					<img src="${companyLogo}" width="175px" >
				</td>
			</tr>
			<tr class="textContent">
				<td>
					<table style="padding: 20px;"> 
						<tr>
							<td class="templateContent" >${content}</td>
						</tr>
					</table>
				</td>
			</tr>
			<tr class="headerContent" >
				<td>
					<table style="border-spacing:0">
						<td style="border-top:1px solid #34209B; padding: 10px;"><img src="${companyLogo}" width="175px" ></td>
						<td style="border-top:1px solid #34209B; padding: 10px;">
							<p style="font-size:12px;">The content of this email is confidential and intended for the recipient specified in message only. It is strictly forbidden to share any part of this message with any third party, without a written consent of the sender. If you received this message by mistake, please reply to this message and follow with its deletion, so that we can ensure such a mistake does not occur in the future.</p>
						</td>
					</table>
				</td>
			</tr>
		</table>
	</body>
	</html>`;

            //delete old record for this candidate
            const saveMailRecords = {}
            saveMailRecords.candidate_id = dbObjectId(candidate_doc_id);
            saveMailRecords.doc_category = skip_status_for;
            saveMailRecords.reference_doc_id = dbObjectId(approval_note_doc_id);

            //delete old record for this candidate
            await CandidateSentMailLogsCI.deleteOne(saveMailRecords);

            saveMailRecords.content_data = msgBody;
            saveMailRecords.attachments = [];
            saveMailRecords.add_date = dbDateFormat();
            saveMailRecords.updated_on = dbDateFormat();
            saveMailRecords.added_by_data = added_by_data;

            await CandidateSentMailLogsCI.create(saveMailRecords);
        }

        return res.status(200).send({ 'status': true, 'message': `${skip_status_for} Skipped Successfully` });

    } catch (error) {
        console.log(error);
        return res.status(403).json({ 'status': false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE });
    }
}


/************* post job on devnet  **************/
controller.postJobOnDevnet = async (req, res) => {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(403).json({ status: false, message: errors.array()[0].msg });
    }

    const { job_id } = req.body;

    const where = {}
    where._id = dbObjectId(job_id);


    try {

        const getData = await JobCl.findOne(where);
        if (!getData) {
            return res.status(403).json({ 'status': false, 'message': 'JOb Data Not Found' });
        }

        /*Add Logic for mail format*/

        return res.status(200).send({ 'status': true, 'message': `Mail Sent To Devnet Successfully` });

    } catch (error) {
        return res.status(403).json({ 'status': false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE });
    }
}



controller.resendApplicantForm = async (req, res) => {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(403).json({ status: false, message: errors.array()[0].msg });
    }

    //console.log( req.body );

    const { candidate_doc_id, applied_job_doc_id, added_by_name, added_by_mobile, added_by_designation, added_by_email } = req.body;


    const mailRegards = {}
    mailRegards.name = added_by_name || '';
    mailRegards.email = added_by_email || '';
    mailRegards.mobile = added_by_mobile || '';
    mailRegards.designation = added_by_designation || '';



    try {

        const where = {}
        where._id = dbObjectId(candidate_doc_id);
        //fetch records
        const oldData = await JobAppliedCandidateCl.findOne(where, { 'applied_jobs': 1, 'email': 1, 'name': 1, 'job_title': 1 })

        if (!oldData) {
            return res.status(403).send({ 'status': false, 'message': 'No Record Found' });
        }

        ApplicantForm(oldData.email, oldData.name, oldData.job_title, mailRegards);

        return res.status(200).send({ 'status': true, 'message': `Applicant Form Sent Successfully` });

    }
    catch (error) {
        console.log(error);
        return res.status(403).send({ 'status': false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE });
    }

}


controller.getApprovalMemberListForCandidate = async (req, res) => {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(403).json({ status: false, message: errors.array()[0].msg });
    }

    const { applied_job_id, candidate_doc_id } = req.body;

    /*Count approval Notes Record for suggested Job ID  */
    const getWhere = {}
    getWhere['candidate_list.cand_doc_id'] = dbObjectId(candidate_doc_id);
    if (applied_job_id) {
        getWhere['candidate_list.applied_job_doc_id'] = dbObjectId(applied_job_id);
    }


    try {

        const getApprovalNotes = await ApprovalNoteCI.find(getWhere, { 'panel_members_list': 1, candidate_list: 1, approval_note_id: 1, mpr_offer_typ: 1, mpr_fund_type: 1, project_name: 1, job_title: 1 });



        if (getApprovalNotes.length === 0) {
            return res.status(403).send({ status: false, message: 'No Record Found.' });
        }
        // console.log( JSON.stringify( getApprovalNotes ) );

        /*Prepare panel_members_list*/
        const resultData = getApprovalNotes?.map((item, index) => {
            const push = {}
            push._id = item._id;
            push.project_name = item.project_name;
            push.job_title = item.job_title;
            push.mpr_fund_type = item.mpr_fund_type;
            push.approval_note_id = item.approval_note_id;
            push.panel_members_list = item?.panel_members_list;
            push.candidate_list = item?.candidate_list.filter((elm) => elm.cand_doc_id.toString() === candidate_doc_id);
            return push;
        });


        return res.status(200).send({
            status: true,
            data: resultData,
            message: 'API Accessed Successfully'
        });

    } catch (error) {
        // console.log( error );
        return res.status(403).send({ status: false, message: 'No Record Found.' });
    }

}

controller.sendAppointmentMailToCandidates = async (req, res) => {
    try {
        const {
            approval_note_id,
            candidate_id,
            selected_doc,
            contents,
            salary_structure
        } = req.body;
        if (!approval_note_id || !candidate_id) {
            return res.status(400).json({ status: false, message: "Missing required fields" });
        }

        let parsedSalaryStructure = null;

        if (salary_structure) {
            if (typeof salary_structure === 'string') {
                try {
                    parsedSalaryStructure = JSON.parse(salary_structure);
                } catch (err) {
                    return res.status(400).json({
                        status: false,
                        message: "Invalid salary_structure JSON"
                    });
                }
            } else {
                // already an object
                parsedSalaryStructure = salary_structure;
            }
        }

        // Find Approval Note
        const approvalNote = await ApprovalNoteCI.findOne({ _id: dbObjectId(approval_note_id) });
        if (!approvalNote) {
            return res.status(404).json({ status: false, message: "Approval Note Not Found" });
        }
        // Find Candidate
        const candidateObjectId = dbObjectId(candidate_id);

        const findCandidate = approvalNote.candidate_list.find(
            item => item.cand_doc_id.equals(candidateObjectId)
        );

        if (!findCandidate) {
            return res.status(404).json({ status: false, message: "Candidate Not Found" });
        }

        // Calculate offer CTC correctly
        let offerCTC = 0;

        if (parsedSalaryStructure) {
            const {
                monthlySalary = 0,
                totalCTOAnnual = 0
            } = parsedSalaryStructure;

            const paymentType = (findCandidate.payment_type || '').toLowerCase();

            switch (paymentType) {
                case 'annum':
                case 'year':
                    // ANNUAL OFFER CTC
                    offerCTC = totalCTOAnnual;
                    break;

                case 'month':
                    // MONTHLY OFFER CTC
                    offerCTC = monthlySalary;
                    break;

                default:
                    offerCTC = totalCTOAnnual || monthlySalary;
            }
        }


        const result = await ApprovalNoteCI.updateOne(
            {
                _id: dbObjectId(approval_note_id),
                'candidate_list.cand_doc_id': dbObjectId(candidate_id)
            },
            {
                $set: {
                    'candidate_list.$.salary_structure_data': parsedSalaryStructure
                        ? JSON.stringify(parsedSalaryStructure)
                        : null,
                    'candidate_list.$.offer_ctc': offerCTC
                }
            }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({ status: false, message: "Candidate not updated" });
        }

        const sentMailLog = new CandidateSentMailLogsCI({
            candidate_id: dbObjectId(candidate_id),
            doc_category: "Appointment Letter",
            reference_doc_id: dbObjectId(approval_note_id),
            content_data: contents,
            attachments: [],
            add_date: new Date(),
            updated_on: new Date(),
            added_by_data: {
                name: req.user?.name,
                email: req.user?.email,
                mobile: req.user?.mobile,
                designation: req.user?.designation
            }
        });

        await sentMailLog.save();

        return res.status(200).json({
            status: true,
            message: `${selected_doc} saved successfully`
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            status: false,
            message: error.message || "Internal Server Error"
        });
    }
};

controller.cloneJobAppliedByCandidate = async (req, res) => {
    try {
        const { candidate_id, applied_job_id, job_id } = req.body;

        /** Validate input */
        if (!candidate_id || !applied_job_id || !job_id) {
            return res.status(400).json({
                success: false,
                message: 'candidate_id, applied_job_id and job_id are required'
            });
        }

        const validCandidateId = dbObjectIdValidate(candidate_id);
        const validAppliedJobId = dbObjectIdValidate(applied_job_id);
        const validJobId = dbObjectIdValidate(job_id);

        if (!validCandidateId || !validAppliedJobId || !validJobId) {
            return res.status(400).json({
                success: false,
                message: 'Invalid ObjectId provided'
            });
        }

        /** Fetch candidate */
        const candidate = await JobAppliedCandidateCl.findById(
            dbObjectId(validCandidateId)
        );

        if (!candidate) {
            return res.status(404).json({
                success: false,
                message: 'Candidate not found'
            });
        }

        /** Find applied job inside array */
        const oldAppliedJob = candidate.applied_jobs.id(
            dbObjectId(validAppliedJobId)
        );

        if (!oldAppliedJob) {
            return res.status(404).json({
                success: false,
                message: 'Applied job not found'
            });
        }

        /** Fetch job master details */
        const job = await JobCl.findById(
            dbObjectId(validJobId)
        ).lean();

        if (!job) {
            return res.status(404).json({
                success: false,
                message: 'Job not found'
            });
        }

        /** Clone applied job */
        const clonedAppliedJob = JSON.parse(JSON.stringify(oldAppliedJob));

        delete clonedAppliedJob._id; // new subdocument id

        /** Override ONLY job-specific fields */
        clonedAppliedJob.job_id = job._id;
        clonedAppliedJob.job_title = job.job_title;
        clonedAppliedJob.job_type = job.job_type;
        clonedAppliedJob.job_location = job.location?.[0]?.name || '';
        clonedAppliedJob.job_designation = job.designation || '';
        clonedAppliedJob.job_designation_id = job.designation_id || null;

        clonedAppliedJob.offer_ctc = job.offer_ctc || 0;
        clonedAppliedJob.original_ctc = job.original_ctc || 0;
        clonedAppliedJob.project_id = job.project_id;
        clonedAppliedJob.project_name = job.project_name;
        clonedAppliedJob.department = job.department;

        /** Preserve workflow + meta fields (already cloned) */
        clonedAppliedJob.add_date = oldAppliedJob.add_date;
        clonedAppliedJob.form_status = oldAppliedJob.form_status;
        clonedAppliedJob.interview_status = oldAppliedJob.interview_status;
        clonedAppliedJob.offer_status = oldAppliedJob.offer_status;
        clonedAppliedJob.mark_as_hired = oldAppliedJob.mark_as_hired;

        /** Deep clone interviewer array */
        clonedAppliedJob.interviewer = Array.isArray(oldAppliedJob.interviewer)
            ? JSON.parse(JSON.stringify(oldAppliedJob.interviewer))
            : [];

        candidate.applied_jobs.push(clonedAppliedJob);

        await candidate.save();

        return res.status(200).json({
            success: true,
            message: 'Applied job cloned successfully'
        });

    } catch (error) {
        console.error('cloneJobAppliedCandidateData ERROR:', error);

        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

module.exports = controller;