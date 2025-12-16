const mongoose = require('mongoose');

const convertIntoFloat = ( val )=>{
    if( typeof val !== 'undefined' ){
        return parseFloat( val );
    }
    return val;
}

const educationListSchema = new mongoose.Schema({
    degree_certificates:{
        type: String,
        trim: true
    },
    passing_year:{
        type: Number,
        default: 0,
        get: convertIntoFloat,
        trim: true
    },
    marks:{
        type: String,
        default: '0',
        trim: true
    },
    add_date:{
        type: Date,
        default: Date.now
    }
}, { toJSON:{ getters: true, virtuals: true, transform: ( doc, converted )=>{ delete converted.id }}});



const experienceListSchema = new mongoose.Schema({
    employer_name:{
        type: String,
        trim: true
    },
    designation:{
        type: String,
        trim: true 
    },
    from_date:{
        type: Date, 
        default: Date.now
    },
    to_date:{
        type: Date, 
        default: Date.now
    },
    add_date:{
        type: Date,
        default: Date.now
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
    verify_by:{
       name:{ type: String, trim: true},
       email:{ type: String, trim: true},
       mobile:{ type: String, trim: true},
       designation:{ type: String, trim: true},
    },
    added_by:{
       name:{ type: String, trim: true},
       email:{ type: String, trim: true},
       mobile:{ type: String, trim: true},
       designation:{ type: String, trim: true},
    },
    status:{
        type: String,
        enum: ['pending','complete','reject'],
        default: 'pending'
    }
    
});

const contractExtensionDatesSchema = new mongoose.Schema({
    from:{
        type: Date
    },
    to:{
        type: Date
    }
});

const joiningKtiDocsSchema = new mongoose.Schema({
    document_name:{
        type: String,
        trim: true
    },
    mime_type:{
        type: String,
        trim: true
    },
    file_size:{
        type: String,
        trim: true
    }, 
    file_name:{
        type: String,
        trim: true
    },
    add_date:{
        type: Date,
        default: Date.now
    },
    updated_on:{
        type: Date,
        default: Date.now
    },
    verify_by:{
       name:{ type: String, trim: true},
       email:{ type: String, trim: true},
       mobile:{ type: String, trim: true},
       designation:{ type: String, trim: true},
    },
    added_by:{
       name:{ type: String, trim: true},
       email:{ type: String, trim: true},
       mobile:{ type: String, trim: true},
       designation:{ type: String, trim: true},
    }
});

const physicalInductionDocsSchema = new mongoose.Schema({
    document_name:{
        type: String,
        trim: true
    },
    mime_type:{
        type: String,
        trim: true
    },
    file_size:{
        type: String,
        trim: true
    }, 
    file_name:{
        type: String,
        trim: true
    },
    add_date:{
        type: Date,
        default: Date.now
    },
    updated_on:{
        type: Date,
        default: Date.now
    },
    verify_by:{
       name:{ type: String, trim: true},
       email:{ type: String, trim: true},
       mobile:{ type: String, trim: true},
       designation:{ type: String, trim: true},
    },
    added_by:{
       name:{ type: String, trim: true},
       email:{ type: String, trim: true},
       mobile:{ type: String, trim: true},
       designation:{ type: String, trim: true},
    }
});


const EmployeeSchema = new mongoose.Schema({
    name: {
        type: String,
        trim: true,
        //required: [true, 'Name Required']
    },
    email: {
        type: String,
        trim: true
    },
    alt_email: {
        type: String,
        trim: true
    },
    mobile_no: {
        type: String,
        trim: true
    },
    alt_mobile_no: {
        type: String,
        trim: true
    },
    aadhaar_no: {
        type: String,
        trim: true
    },
    date_of_birth:{
        type: Date
    },
    password: {
        type: String,
        trim: true, 
        minlength: [8, 'Password must be at least 8 characters long'], 
    },
    hashed_password:{
        type: String
    },
    device_id:{
        type: String
    },
    fcm_token:{
        type: String
    },
    designation: {
        type: String,
        trim: true,
        //required: [true, 'Employee Designation Required']
    },
    designation_id: {
        type: mongoose.Types.ObjectId
    },
    department:{
        type: String,
        trim: true
    },
    profile_status: { type: String, enum: ['Active','Inactive','Closed'], default: 'Active' }, 
    add_date:{
        type: Date
    },
    updated_on:{
        type: Date
    },
    otp:{
        type: String,
        trim: true
    },
    otp_sent_on:{
        type: Date
    },
    last_login:{
        type: Date
    },
    login_device:{
        type: String
    },
    employee_type:{
        type: String,
        enum:['onRole','onContract','emPanelled'],
        default: 'onRole',
        remark : 'onContract == consultant'
    },
    job_status:{
        type: String,
        enum:['joined','onNotice','Immediate','Closure'],
        default: 'joined'
    },
    termination_mode:{
        type: String,
        enum:['','Terminated','Resigned','Retired','Contract-Closer','Project-Closer'],
        default: ''
    },
    termination_reason:{
        type: String
    },
    batch_id:{
        type: Number
    },
    employee_code:{
        type: String, 
        unique: true,
        trim: true
    }, 
    father_name:{
        type: String,
        trim: true
    },
    gender:{
        type: String,
        enum:['Male','Female','Other'],
        default: 'Male'
    },
    marital_status:{
        type: String,
        enum:['Single','Married'],
        default: 'Single'
    },
    education_data:[educationListSchema],
    experience_info: [experienceListSchema],
    joining_date:{
        type: Date,
        default: Date.now,
        remark:'Date Of Joining'
    },
    date_of_leaving:{
        type: Date,
        remark:'Date Of Leaving, last working day'
    },
    valid_till:{
        type: Date,
        default: Date.now, 
        remark: 'Contract End Date'
    },
    probation_complete_date:{
        type: Date,
        default: Date.now
    },
    appraisal_date:{
        type: Date,
        default: Date.now,
        remark:'Next Appraisal Date'
    },
    reason_of_leaving:{
       type: String,
       trim: true
    },
    branch: {},
    occupation:{
        type: String,
        trim: true
    },
    salary_structure:{
        type: String,
        trim: true
    },
    attendance:{
        type: Number,
        default: 0,
        get: convertIntoFloat,
        remark:'Work Days'
    },
    division:{
        type: String,
        trim: true
    },
    region:{
        type: String,
        trim: true
    },
    grade:{
        type: String,
        trim: true
    },
    esi_number:{
        type: String,
        trim: true
    },
    esi_dispensary:{
        type: String,
        trim: true
    },
    pf_number:{
        type: String,
        trim: true
    },
    pf_department_no:{
        type: String,
        trim: true
    },
    pf_effective_from:{
        type: Date,
        default: Date.now
    },
    uan_number:{
        type: String,
        trim: true
    },
    pan_number:{
        type: String,
        trim: true
    },
    bank_name:{
        type: String,
        trim: true
    },
    bank_account_number:{
        type: Number,
        default: 0,
        trim: true
    },
    bank_branch:{
        type: String,
        trim: true
    },
    ifsc_code:{
        type: String,
        trim: true
    },
    bank_account_type:{
        type: String,
        enum : ['Current','Saving'],
        default: 'Saving'
    },
    present_address:{},
    permanent_address:{},
    both_address_same:{
        type: String,
        enum: ['yes','no'],
        default: 'no'
    },
    is_doc_verified:{
        type: String,
        enum: ['yes','no'],
        default: 'no'
    },
    employerBenefitType:{
        type: String,
        default: ''
    },
    employerBenefitTitle:{
        type: String,
        default: ''
    },
    basic_salary:{
        type: Number,
        default: 0,
        get: convertIntoFloat
    },
    salary_data:{},
    reimbursements:{},
    total_cto_annual:{
        type: Number,
        default: 0,
        get: convertIntoFloat
    },  
    total_cto_monthly:{
        type: Number,
        default: 0,
        get: convertIntoFloat
    }, 
    ctc_monthly:{
        type: Number,
        default: 0,
        get: convertIntoFloat
    },
    ctc_annual:{
        type: Number,
        default: 0,
        get: convertIntoFloat
    },
    salary_effective_date:{
        type: Date,
        default: Date.now
    },
    docs: [DocumentListSchema],
    reporting_manager:[],
    sanctioned_position:{
        type: String,
        trim: true
    },
    project_id:{
        type: mongoose.Types.ObjectId
    },
    project_name:{
        type: String,
        trim: true
    },
    contract_extension_dates:[contractExtensionDatesSchema],
    is_data_imported:{
        type: String,
        enum: ['yes','no'],
        default: 'no'
    },
    induction_status:{
        type: String,
        enum: ['Pending','Complete'],
        default: 'Pending'
    },
    kpi_kra:[],
    kpi:{
        type:String,
        trim: true,
        remark: 'Kpi'
    },
    kra:{
        type:String,
        trim: true,
        remark: 'Kra'
    },
    jd:{
        type: String,
        trim: true
    },
    total_experience:{
        type: String,
        trim: true
    },
    offices: [],
    notice_pay:{
        type:Number,
        default: 0,
        remark: 'pay to employee by company'
    },
    recoverable_payable:{
        type:Number,
        default: 0,
        remark: 'pay to company by employee'
    },
    leave_policy:[],
    family_details:[],
    reference_check_form_data:{},
    reference_check_form_status:{
        type: String,
        enum: ['Pending','Complete'],
        default: 'Pending'
    },
    induction_form_data:{},
    induction_form_status:{
        type: String,
        enum: ['Pending','Complete'],
        default: 'Pending'
    },
    induction_physical_form_docs:[physicalInductionDocsSchema],
    joining_kit_docs:[joiningKtiDocsSchema],
    joining_kit_status:{
        type: String,
        enum: ['Pending','Complete'],
        default: 'Pending'
    },
    offer_letter_docs:[joiningKtiDocsSchema],
    offer_letter_status:{
        type: String,
        enum: ['Pending','Complete'],
        default: 'Pending'
    },
    appointment_letter_docs:[joiningKtiDocsSchema],
    appointment_letter_status:{
        type: String,
        enum: ['Pending','Complete'],
        default: 'Pending'
    },
    candidate_id: {
        type: mongoose.Types.ObjectId
    }


}, { toJSON:{ getters: true, virtuals: true, transform: ( doc, converted )=>{ delete converted.id }}});



const EmployeeCI = mongoose.model('dt_employee_lists', EmployeeSchema );

module.exports = EmployeeCI;
