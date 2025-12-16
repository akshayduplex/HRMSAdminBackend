const mongoose = require('mongoose');

const formStatus = ['Applied','Shortlisted','Interview','Offer','Hired','Rejected','Deleted'];

const convertIntoFloat = ( val )=>{
    if( typeof val !== 'undefined' ){
        return parseFloat( val.toString() );
    }
    return val;
}


const experienceSchema = new mongoose.Schema({
    designation:{
        type: String
    },
    company:{
        type: String
    },
    from_date:{
        type:Date
    },
    to_date:{
        type:Date
    },
    responsibility:{
        type: String
    },
    is_currently_working:{
        type:String,
        enum: ['Yes','No'],
        default: 'No'
    }
});


const educationSchema = new mongoose.Schema({
    institute :{
        type: String
    },
    degree:{
        type: String
    },
    from_date:{
        type:Date
    },
    to_date:{
        type:Date
    },
    add_date:{
        type: Date
    }
});

const interviewerSchema = new mongoose.Schema({
    employee_name:{
        type:String,
        trim: true
    },
    designation:{
        type:String,
        trim: true
    },
    employee_id:{
        type: mongoose.Types.ObjectId
    },
    rating:{
        type: Number,
        default: 0,
        get: convertIntoFloat,
        trim: true
    },
    job_match:{
        type: Number,
        default: 0,
        get: convertIntoFloat,
        trim: true
    },
    job_knowledge:{
        type: Number,
        default: 0,
        get: convertIntoFloat,
        trim: true
    },
    creative_problem_solving:{
        type: Number,
        default: 0,
        get: convertIntoFloat,
        trim: true
    },
    team_player:{
        type: Number,
        default: 0,
        get: convertIntoFloat,
        trim: true
    },
    communication_skill:{
        type: Number,
        default: 0,
        get: convertIntoFloat,
        trim: true
    },
    exposure_to_job_profile:{
        type: Number,
        default: 0,
        get: convertIntoFloat,
        trim: true
    },
    comment:{
        type: String,
        trim: true
    },
    status:{
        type:String,
        enum: ['Accept','Pending','Reject'],
        default: 'Pending'
    },
    feedback_status:{
        type:String,
        enum: ['Approved','Pending'],
        default: 'Pending'
    },
    add_date:{
        type: Date,
        default: Date.now
    },
    updated_on:{
        type: Date,
        default: Date.now
    },
    stage:{
        type:String,
        trim: true
    },
    communication:{
        type: Number,
        default: 0,
        get: convertIntoFloat
    },
    skills:{
        type: Number,
        default: 0,
        get: convertIntoFloat
    },
    total:{
        type: Number,
        default: 0,
        get: convertIntoFloat
    },
    feedback_date:{
        type: Date,
        default: Date.now
    },
    added_by:{
        type: String,
        trim: true
    },
    interview_date:{
        type: Date,
        default: Date.now
    },
    hiring_suggestion_status:{
        type: String ,
        trim: true
    },
    hiring_suggestion_percent:{
        type: Number,
        default: 0,
        get: convertIntoFloat
    },
    candidate_participate_status:{
        type: String,
        enum:['','NotAttempt','Attempt'],
        default: ''
    }
}, { toJSON:{ getters: true, virtuals: true, transform: ( doc, converted )=>{ delete converted.id }}});

const finalJobOfferApproval = new mongoose.Schema({
    employee_id:{
        type: String,
        trim: true
    },
    employee_code:{
        type: String,
        trim: true
    },
    designation:{
        type: String,
        trim: true
    },
    name:{
        type: String,
        trim: true
    },
    email:{
        type: String,
        trim: true
    },
    status:{
        type: String,
        enum : ['','Pending','Approved'],
        default : ''
    },
    priority:{
        type: Number, 
        default: 0
    },
    add_date:{
        type: Date
    },
    send_mail_date:{
        type: Date
    },
    approved_date:{
        type: Date
    }
});


const AppliedJobsListSchema = new mongoose.Schema({
    job_id:{
        type: mongoose.Types.ObjectId,
        index: true
    },
    job_title:{
        type:String,
        trim: true,
    },
    job_type:{
        type:String,
        trim: true,
    },
    job_location:{
        type:String,
        trim: true,
    },
    job_designation:{
        type:String,
        trim: true,
    },
    job_designation_id:{
        type: mongoose.Types.ObjectId,
        index: true
    },
    offer_ctc:{
        type: Number,
        default: 0,
        get: convertIntoFloat,
        trim: true
    },
    original_ctc:{
        type: Number,
        default: 0,
        get: convertIntoFloat,
        trim: true
    },
    project_id:{
        type: mongoose.Types.ObjectId,
        index: true
    },
    project_name:{
        type: String,
        trim: true
    },
    department:{
        type: String,
        trim: true
    },
    recommendation:{
        type: String,
        trim: true,
        default: ''
    },
    interview_status:{
        type: String,
        enum: ['Pending','Rejected','Confirmed','Completed'], 
        default: 'Pending'
    },
    form_status: { type: String, enum: formStatus, default: 'Applied', index: true },
    add_date:{
        type: Date, 
        default: Date.now
    },
    interviewer:[interviewerSchema],
    interview_date:{
        type: Date,
        default: Date.now
    },
    interview_duration:{
        type: String,
        trim: true
    },
    interview_type:{ type: String, enum: ['Online','Offline'], default: 'Online' },
    google_meet_link:{
        type: String,
        trim: true,
        default: ''
    },
    venue_location:{
        type: String,
        trim: true,
        default: ''
    },
    stage:{
        type: String,
        trim: true
    },
    interview_host: { type: String, enum: ['One-To-One','Panel'], default: 'One-To-One' },
    onboard_date:{
        type: Date,
        default: Date.now,
        remark :'Candidate Joining Offer Date'
    },
    batch_id:{
        type: String
    },
    profile_details:{},
    mark_as_hired: { type: String, enum: ['No','Yes'], default: 'No' },
    tentative_date:{
        type: Date,
        remark :'Candidate Joining Accept Date'
    },
    offer_status:{ type: String, enum: ['','Pending','Accepted','Rejected','Skipped'], default: '' },
    both_address_same:{ type: String, enum: ['Yes','No'], default: 'No' },
    final_job_offer_approval:[finalJobOfferApproval],
    final_job_offer_approval_status: { type: String, enum: ['No','Yes'], default: 'No' },
    mpr_job_offer_type:{
        type: String,
        trim: true,
        default: ''
    },
    mpr_id:{
        type: String,
        trim: true,
    },
    requisition_form_id:{
        type: mongoose.Types.ObjectId
    },
    job_valid_till:{
        type: Date
    },
    mpr_fund_type:{
        type: String,
        trim: true,
        default: ''
    },
    interview_shortlist_status:{
        type: String,
        enum: ['','Waiting','Selected'],
        default: '',
        remark:'candidate shortlist for approval note after interview'
    },
    proposed_location: {
        type: String
    },
    proposed_location_id: {
        type: mongoose.Types.ObjectId
    },
    payment_type:{
        type: String,
        default: 'Annum'
    },
    naukri_ref_id:{
        type: String
    },
    approval_note_data:{
       doc_id:{ type: mongoose.Types.ObjectId },
       note_id:{ type: String },
    },
    reference_check:[{
        referenceStatus: { type: String, enum: ['previous','current','hrhead']},
        name: { type: String, trim : true },
        mobile: { type: String, trim : true },
        email: { type: String, trim : true },
        designation: { type: String, trim : true },
        add_date: { type: Date }
    }],
    declaration_form_status: { type: String, enum: ['','agree','disagree'], default : ''},
    working_days:{
        type: Number,
        default: 0
    },
    id_card_status: { type: String, enum: ['','uploaded'], default : ''},
    id_card_details: {
        employee_code: { type: String, trim : true },
        candidate_name: { type: String, trim : true },
        emergency_contact_no: { type: String, trim : true },
        blood_group: { type: String, trim : true },
        office_address: { type: String, trim : true },
        card_image: { type: String, trim : true },
        add_date: { type: Date },
        add_by_mobile: { type: String, trim : true },
        add_by_designation: { type: String, trim : true },
        add_by_email: { type: String, trim : true },
        add_by_name: { type: String, trim : true }
    },
     
}, { toJSON:{ getters: true, virtuals: true, transform: ( doc, converted )=>{ delete converted.id }}});

const socialLinkSchema = new mongoose.Schema({
    brand:{
        type: String,
        trim: true
    },
    link:{
        type: String,
        trim: true
    }
});

const DocumentListSchema = new mongoose.Schema({
    doc_category:{
        type:String,
        trim: true
    },
    sub_doc_category:{
        type:String, 
        default: 'NA'
    },
    doc_name:{
        type: String,
        trim: true
    },
    file_name:{
        type: String,
        trim: true
    },
    mime_type:{
        type: String
    },
    file_size:{
        type: String
    },
    add_date:{
        type: Date,
        default: Date.now
    },
    updated_on:{
        type: Date,
        default: Date.now
    },
    status:{
        type: String,
        enum: ['pending','complete','reject'],
        default: 'pending'
    }
});

const OnBoardingDocumentSchema = new mongoose.Schema({
    approval_note_doc_id:{
        type: mongoose.Types.ObjectId
    },
    doc_category:{
        type: String,
        trim: true
    },
    doc_name:{
        type: String,
        trim: true
    },
    is_html: {
        type: String,
        enum: ['Yes','No'],
        default: 'No'
    },
    send_file_data:{
       file_name:{ type: String, trim: true}, 
       add_date:{ type: Date, default: Date.now },
       added_by_data:{
                    name: {type: String},
                    email: { type: String},
                    mobile:{ type: String},
                    designation: {type: String}
        }
    },
    uploaded_file_data:{
        file_name:{ type: String, trim: true, default: ''}, 
        add_date:{ type: Date, default: Date.now },
        added_by_data:{
            name: {type: String},
            email: { type: String},
            mobile:{ type: String},
            designation: {type: String}
        }
    },
    status:{
        type: String,
        enum: ['pending','complete','reject','verified'],
        default: 'pending'
    },
    activity_log:[{
            action: {type: String},
            name: {type: String},
            email: { type: String},
            mobile:{ type: String},
            designation: {type: String},
            add_date:{ type: Date, default: Date.now }
    }],
    add_date:{
        type: Date,
        default: Date.now
    },
    updated_on:{
        type: Date,
        default: Date.now
    }
});

const pageStepsSchema = new mongoose.Schema({
    step:{
        type: Number,
        default: 0
    },
    page:{
        type: String,
        default: ''
    },
    status:{
        type:String,
        enum: ['pending','complete'],
        default: 'pending'
    }
});

const assessmentResultDataSchema = new mongoose.Schema({
    type: { 
        type: String, 
        enum: ['MCQ','Comprehensive'], 
        default: 'MCQ' 
    },
    result:{
        type: String,
        enum: ['Pass','Fail'],
        default: 'Fail'
    },
    score:{
        type: Number, 
        default: 0
    }
});

const ApplyJobSchema = new mongoose.Schema({
    job_id:{
        type: mongoose.Types.ObjectId,
        index: true
    },
    job_title:{
        type:String,
        trim: true,
    },
    job_type:{
        type:String,
        trim: true,
    },
    project_id:{
        type: mongoose.Types.ObjectId,
        index: true
    },
    project_name:{
        type: String,
        trim: true
    },
    department:{
        type: String,
        trim: true
    },
    name:{
        type: String,
        trim: true,
        required: [true, 'Name Required']
    },
    email:{
        type: String,
        trim: true, 
        required: [true, 'Email ID Required'],
        unique: true
    },
    mobile_no:{
        type: String,
        trim: true,
        required: [true, 'Mobile No Required']
    },
    password:{
        type: String,
        trim: true
    },
    otp:{
        type: Number
    },
    otp_sent_on:{
        type: Date,
        default: Date.now
    },
    last_login:{
        type: Date
    },
    login_device:{
        type: String
    }, 
    photo:{
        type: String,
        trim: true
    },
    designation: {
        type: String,
        trim: true
    },
    total_experience: {
        type: String,
        trim: true
    },
    relevant_experience: {
        type: String,
        trim: true,
    },
    location: {
        type: String,
        trim: true
    },
    current_ctc: {
        type: String,
        default: 0
    },
    expected_ctc: {
        type: String,
        default: 0
    },
    notice_period: {
        type: String,
        trim: true
    },
    resume_file: {
        type: String,
        trim: true
    },
    current_employer: {
        type: String,
        trim: true
    },
    current_employer_mobile: {
        type: String,
        trim: true
    },
    current_employer_email: {
        type: String,
        trim: true
    },
    last_working_day:{
        type: Date,
        default: Date.now
    },
    applied_from:{
        type: String,
        trim: true
    },
    reference_employee:{
        type: String,
        trim: true
    },
    experience:[experienceSchema],
    education:[educationSchema],
    social_links:[socialLinkSchema],
    form_status: { type: String, enum: formStatus, default: 'Applied' },
    profile_status:{
        type: String,
        enum: ['Active','Inactive','Blocked'],
        default: 'Active'
    },
    kyc_steps:{
        type: String,
        enum: ['Profile','Document','Complete'],
        default: 'Profile'
    },
    add_date:{
        type: Date,
        default: Date.now
    },
    updated_on:{
        type: Date,
        default: Date.now
    },
    batch_id:{
        type: String
    },
    applied_jobs: [AppliedJobsListSchema],
    other:{
        type:String
    },
    docs: [DocumentListSchema],
    onboarding_docs: [OnBoardingDocumentSchema],
    onboarding_docs_stage: {
        type: String,
        enum: ['','offerletter','joiningkit','appointmentletter','complete'],
        default: ''
    },
    assessment_apply_status:{
        type: String,
        enum: ['enable','disable'],
        default: 'enable'
    },
    assessment_status:{
        type: String,
        enum: ['Pending','Complete'],
        default: 'Pending'
    },
    assessment_result:{
        type: String,
        enum: ['Pass','Fail',''],
        default: ''
    },
    score:{
        type: Number, 
        default: 0
    },
    complete_profile_status:{
        type: Number, 
        default: 40
    },
    profile_avg_rating:{
        type: Number, 
        default: 0
    },
    page_steps:[pageStepsSchema],
    assessment_result_data:[assessmentResultDataSchema],
    reject_doc_reason:{
        type: String,
        default: ''
    },
    mcq_final_score:{
        type: Number, 
        default: 0
    },
    mcq_score_final_result:{
        type: String,
        enum: ['Pass','Fail',''],
        default: ''
    },
    mcq_attempts:{
        type: String,
        enum: ['Available','Complete'],
        default: 'Available'
    },
    comprehensive_final_score:{
        type: Number, 
        default: 0
    },
    comprehensive_score_final_result:{
        type: String,
        enum: ['Pass','Fail',''],
        default: ''
    },
    comprehensive_attempts:{
        type: String,
        enum: ['Available','Complete'],
        default: 'Available'
    },
    verify_token:{
        type: String
    },
    interview_shortlist_status:{
        type: String,
        enum: ['','Waiting','Selected'],
        default: '',
        remark:'candidate shortlist for approval note after interview'
    },
    offer_ctc:{
        type: Number,
        default: 0,
        trim: true
    },
    hiring_status:{
        type: String,
        enum: ['','Approved','Hold'],
        default: '',
        remark:'if candidate is put in hold or approved for hiring'
    },
    esic_status:{
        type: String,
        enum: ['Yes','No'],
        default: 'No'
    },
    applicant_form_status:{ type: String, enum: ['Pending','Complete'], default : 'Pending'},
    applicant_form_data: {
        full_name: {
            first_name: { type:String, trim: true },
            middle_name: { type:String, trim: true },
            surname: { type:String, trim: true }
        },
        father_hushband_name: { type:String, trim: true },
        communication_address: {
            address: { type:String, trim: true },  
            pincode: { type:String, trim: true }, 
            telephone: { type:String, trim: true }, 
            mobile_no: { type:String, trim: true }, 
            email_id: { type:String, trim: true }
        },
        permanent_address: {
            address: { type:String, trim: true },  
            pincode: { type:String, trim: true }, 
            telephone: { type:String, trim: true }, 
            mobile_no: { type:String, trim: true }, 
            email_id: { type:String, trim: true }
        },
        dob: {
            date: { type:String, trim: true },  
            month: { type:String, trim: true }, 
            year: { type:String, trim: true }, 
            in_words: { type:String, trim: true }
        },
        gender: { type:String, trim: true },
        marital_status: { type:String, trim: true },
        language: [{  
            name: { type:String, trim: true },  
            read: { type:String, trim: true }, 
            write: { type:String, trim: true }, 
            speak: { type:String, trim: true }
        }],
        strength: { type:String, trim: true },
        weakness: { type:String, trim: true },
        family_members: [{
            particulars: { type:String, trim: true },  
            name: { type:String, trim: true }, 
            age: { type:String, trim: true }, 
            occupation: { type:String, trim: true },
            date_of_birth: { type:String, trim: true },
            is_dependent: { type:String, trim: true }
        }],
        belongs_to_category: { type:String, trim: true },
        belongs_to_category_details: { type:String, trim: true },
        belongs_to_category_proof_image: { type:String, trim: true },
        physically_handicapped: { type:String, trim: true },
        physically_handicapped_proof_image: { type:String, trim: true },
        physically_handicapped_details: { type:String, trim: true },
        major_alignments: { type:String, trim: true },
        major_alignments_image: { type:String, trim: true },
        major_alignments_details: { type:String, trim: true },
        arrested_convicted_by_court: { type:String, trim: true },
        arrested_convicted_by_court_details: { type:String, trim: true },
        is_before_work_in_orgainization: {type:String, enum: ['yes','no'], default: 'no'},
        before_work_in_orgainization: [{
            projct_name: { type:String, trim: true },  
            designation: { type:String, trim: true }, 
            reporting_person: { type:String, trim: true }, 
            from: { type:String, trim: true },
            to: { type:String, trim: true },
            reason: { type:String, trim: true }
        }],
        relationship_associate_status: { type:String, trim: true },
        relationship_associate_list: [{
            name: { type:String, trim: true },  
            department: { type:String, trim: true }, 
            relation: { type:String, trim: true }
        }],
        qualification: [{
            school_college: { type:String, trim: true },  
            degree: { type:String, trim: true }, 
            subject: { type:String, trim: true },
            marks: { type:String, trim: true }, 
            duration_from: { type:String, trim: true },
            duration_to: { type:String, trim: true }, 
            passing_year: { type:String, trim: true },
            course_type: { type:String, trim: true }
        }],
        training: [{
            course: { type:String, trim: true },  
            organization: { type:String, trim: true }, 
            subject_project: { type:String, trim: true },
            duration_from: { type:String, trim: true }, 
            duration_to: { type:String, trim: true },
            stipend_recieved: { type:String, trim: true }
        }],
        scholarship: { type:String, trim: true },
        extracurricular_activities: { type:String, trim: true },
        employment_history: [{
            org_name: { type:String, trim: true },  
            designation: { type:String, trim: true }, 
            nature_of_work: { type:String, trim: true },
            ctc: { type:String, trim: true }, 
            duration_from: { type:String, trim: true },
            duration_to: { type:String, trim: true }, 
            organization_email: { type:String, trim: true },
            reporting_person_email: { type:String, trim: true },
            reporting_person_mobile: { type:String, trim: true }
        }],
        pay_slip: {
            basic: { type: Number },  
            hra_cla: { type: Number }, 
            conveyance: { type: Number },
            petrol_reimbursement: { type: Number }, 
            attire_reimbursement: { type: Number },
            subscription_allowance: { type: Number }, 
            telephone_reimbursement: { type: Number },
            driver_salary: { type: Number },
            childrens_education_allow: { type: Number},
            professional_development: { type: Number},
            monthly_any_other: { type: Number },
            provident_fund: { type: Number },
            superannuation: { type: Number },
            gratuity: { type: Number },
            medical_reimbursements: { type: Number },
            lta: { type: Number},
            performance_bonus: { type: Number },
            annual_any_other: { type: Number }
        },
        signature: { type:String, trim: true },
        profile_image: { type:String, trim: true },
        references_other_than_family : Array,
        added_by: Object,
        joining_details: Object
    },
    annexure_eleven_form_status: { type: String, enum: ['Pending','Complete'], default : 'Pending'},
    annexure_eleven_form_data: {
        designation: { type:String, trim: true },
        pan_number: { type:String, trim: true },
        blood_group: { type:String, trim: true },
        candidate_doj: { type:String, trim: true },
        candidate_dob: { type:String, trim: true },
        candidate_date_of_wedding: { type:String, trim: true },
        emergency_contact_local: Object,
        emergency_contact_permanent: Object,
        bank_details: { 
            bank_name: {type:String, trim: true },
            branch_ifsc: { type:String, trim: true },
            account_no: { type:String, trim: true }
        },
        bank_cancel_cheque: { type:String, trim: true },
        previous_organization_details: Object,
        reporting_time: { type:String, trim: true },
        reporting_manager: { type:String, trim: true },
        place_of_posting: { type:String, trim: true }
    }

});
 

const JobAppliedCandidateCl = mongoose.model('dt_candidates', ApplyJobSchema );
//JobAppliedCandidateCl.syncIndexes();

module.exports = JobAppliedCandidateCl;