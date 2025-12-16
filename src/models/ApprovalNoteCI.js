const mongoose = require('mongoose');


const approvalMembersList = new mongoose.Schema({
    emp_doc_id: {
        type: String
    },
    name: {
        type: String,
        trim: true
    },
    emp_code: {
        type: String,
        trim: true
    },
    designation: {
        type: String,
        trim: true
    },
    email: {
        type: String,
        trim: true
    },
    signature: {
        type: String,
        trim: true
    },
    approval_status: {
        type: String,
        enum: ['', 'Pending', 'Approved', 'Rejected'],
        default: ''
    },
    send_mail_date: {
        type: Date
    },
    approved_date: {
        type: Date
    },
    add_date: {
        type: Date,
        default: Date.now
    },
    priority: {
        type: Number
    }
});


const ApprovalHistory = new mongoose.Schema({
    emp_doc_id: {
        type: String
    },
    remark: {
        type: String
    },
    approved_date: {
        type: Date
    },
    approval_status: {
        type: String,
        enum: ['Pending', 'Approved', 'Rejected'],
        default: 'Pending'
    }
});


const candidatesList = new mongoose.Schema({
    cand_doc_id: {
        type: mongoose.Types.ObjectId
    },
    applied_job_doc_id: {
        type: mongoose.Types.ObjectId
    },
    name: {
        type: String,
        trim: true
    },
    email: {
        type: String,
        trim: true
    },
    job_type: {
        type: String,
        trim: true
    },
    applied_from: {
        type: String,
        trim: true
    },
    approval_status: {
        type: String,
        enum: ['Pending', 'Approved', 'Rejected'],
        default: 'Pending'
    },
    approval_date: {
        type: Date
    },
    interview_type: {
        type: String
    },
    add_date: {
        type: Date,
        default: Date.now
    },
    offer_ctc: {
        type: Number
    },
    onboarding_date: {
        type: Date
    },
    job_valid_date: {
        type: Date
    },
    interview_shortlist_status: {
        type: String,
        trim: true
    },
    approval_history: [ApprovalHistory],
    proposed_location: {
        type: String
    },
    proposed_location_id: {
        type: mongoose.Types.ObjectId
    },
    payment_type: {
        type: String,
        default: 'Annum'
    },
    document_status: {
        joining_kit: { type: String, enum: ['pending', 'mailsent', 'uploaded', 'Skipped'], default: 'pending' },
        offer_letter: { type: String, enum: ['pending', 'mailsent', 'uploaded', 'Skipped'], default: 'pending' },
        appointment_letter: { type: String, enum: ['pending', 'generated', 'approved', 'mailsent', 'uploaded'], default: 'pending' }
    },
    reference_check: [{
        referenceStatus: { type: String, enum: ['previous', 'current', 'hrhead'] },
        name: { type: String, trim: true },
        mobile: { type: String, trim: true },
        email: { type: String, trim: true },
        designation: { type: String, trim: true },
        add_date: { type: Date, trim: true },
        verification_mode: { type: String, enum: ['', 'email', 'telephone'], default: '' },
        verification_status: { type: String, enum: ['Pending', 'Complete'], default: 'Pending' },
        verification_data: {
            know_him: { type: String },
            capacity: { type: String },
            after_know_organization: { type: String },
            from: { type: String },
            leave_reason: { type: String },
            responsibilities: { type: String },
            performance: { type: String },
            performance_remark: { type: String },
            excelled_work: { type: String },
            give_opportunity: { type: String },
            give_opportunity_reason: { type: String },
            comments: { type: String },
            validate_on: { type: Date },
        }
    }],
    is_verification_skipped: { type: String, enum: ['Yes', 'No'], default: 'No' },
    verification_skip_data: [{
        referenceStatus: { type: String, enum: ['previous', 'current', 'hrhead'] },
        emp_doc_id: { type: String },
        name: { type: String },
        email: { type: String },
        mobile_no: { type: String },
        designation: { type: String },
        skipped_on: { type: Date },
    }],
    working_days: {
        type: Number,
        default: 0
    },
    progress_data: [{
        title: { type: String },
        activity: { type: String },
        status: { type: String },
        add_by_name: { type: String },
        add_by_mobile: { type: String },
        add_by_email: { type: String },
        add_by_designation: { type: String },
        add_date: { type: Date }
    }],
    trail_mail_list: [],
    appointment_letter_verification_status: {
        status: { type: String, enum: ['', 'Pending', 'Complete', 'Reject'], default: '' },
        remark: { type: String }
    },
    salary_structure_data: {
        type: String
    }
});


const interviewerList = new mongoose.Schema({
    emp_doc_id: {
        type: mongoose.Types.ObjectId
    },
    name: {
        type: String,
        trim: true
    },
    designation: {
        type: String,
        trim: true
    },
    mode_of_interview: {
        type: String,
        trim: true
    },
    stage: {
        type: String,
        trim: true
    }
});

const ApprovalNoteSchema = new mongoose.Schema({
    project_name: {
        type: String
    },
    project_id: {
        type: mongoose.Types.ObjectId
    },
    no_of_candidates: {
        type: Number,
        default: 0
    },
    job_title: {
        type: String,
        trim: true
    },
    job_id: {
        type: mongoose.Types.ObjectId
    },
    job_designation: {
        type: String,
        trim: true
    },
    mpr_offer_type: {
        type: String,
        trim: true
    },
    mpr_fund_type: {
        type: String,
        trim: true
    },
    approval_note_id: {
        type: String,
        unique: true
    },
    add_date: {
        type: Date,
        default: Date.now
    },
    updated_on: {
        type: Date,
        default: Date.now
    },
    status: { type: String, enum: ['Inprogress', 'Completed'], default: 'inprogress' },
    approval_date: {
        type: Date,
        default: Date.now
    },
    panel_members_list: [approvalMembersList],
    candidate_list: [candidatesList],
    interviewer_list: [interviewerList],
    intimation_mail_list: [candidatesList],
    add_by_details: {
        name: { type: String, required: true },
        email: { type: String, required: true, match: /.+\@.+\..+/ },
        mobile: { type: String, required: true, match: /^[0-9]{10,15}$/ },
        designation: { type: String, required: true }
    },
    mpr_number: {
        type: String
    },
    applied_from: {
        type: String,
        trim: true
    },
    interview_type: {
        type: String,
        trim: true
    }

});

const ApprovalNoteCI = mongoose.model('dt_approval_notes', ApprovalNoteSchema);

module.exports = ApprovalNoteCI;