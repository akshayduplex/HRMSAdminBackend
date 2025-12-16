const mongoose = require('mongoose');
const { type } = require('os');

const JobLocationSchema = new mongoose.Schema({
    loc_id :{
        type: mongoose.Types.ObjectId
    },
    name:{
        type: String,
        trim: true
    }
}); 

const JobCommonSchema = new mongoose.Schema({ 
    name:{
        type: String,
        trim: true
    }
});
 

const JobSchema = new mongoose.Schema({
    project_id:{
        type: mongoose.Types.ObjectId
    },
    project_name:{
        type: String,
        trim: true
    },
    department:{
        type: String,
        trim: true
    },
    department_id:{
        type: mongoose.Types.ObjectId 
    },
    designation:{
        type: String,
        trim: true
    },
    designation_id:{
        type: mongoose.Types.ObjectId 
    },
    job_publish_code:{
        type: String,
        trim: true
    },
    job_title:{
        type: String,
        trim: true
    },
    job_title_slug:{
        type: String,
        trim: true
    },
    job_type:{
        type: String,
        trim: true
    }, 
    experience: {
        type: String,
        trim: true
    },
    location:[JobLocationSchema],
    salary_range:{
        type: String,
        trim: true
    },
    deadline:{
        type: Date
    },
    tags:[JobCommonSchema],
    description:{
        type: String
    },
    benefits:[JobCommonSchema],
    educations:[JobCommonSchema],
    company:{
        type: String,
        trim: true
    },
    form_personal_data:[],
    form_profile:[],
    form_social_links:[],
    requisition_form:{
        type: String,
        trim: true
    },
    working:{
        type: String,
        enum: ['onsite','offsite'],
        default: 'onsite'
    },
    assessment_status:{
        type: String,
        enum: ['enable','disable'],
        default: 'enable'
    },
    status:{
        type: String,
        enum: ['Published','Unpublished','Removed','Archived'],
        default: 'Published'
    },
    add_date:{
        type: Date,
        default: Date.now
    },
    updated_on:{
        type: Date,
        default: Date.now
    },
    form_candidates:[],
    total_vacancy:{
        type: Number,
        default: 0
    },
    hired:{
        type: Number,
        default: 0
    },
    available_vacancy:{
        type: Number,
        default: 0
    },
    ctc_amount:{
        type: Number,
        default: 0
    },
    region:{
        type: String,
        default: ''
    },
    region_list:[],
    division_list:[],
    division:{
        type: String,
        default: ''
    },
    requisition_form_id:{
        type: mongoose.Types.ObjectId
    },
    requisition_form_title:{
        type: String,
        default: ''
    },
    naukari_job_data:{
        publish_code: { type: String},
        publish_job_id: { type: String},
        publish_link: { type: String},
        job_board_id: { type: String},
        added_on: { type: Date },
        status: { type: String, enum:['','CREATED','DELETED'] },
        updated_on: { type: Date },
        expiry_date: { type: Date },
        posted_date: { type: Date },
        refreshed_date: { type: Date },
        refreshed_count: { type: Number, default: 0},
        min_salary: { type: Number, default: 0},
        max_salary: { type: Number, default: 0 },
        work_type: { type: String, default: 'In office'}
    },
    requisition_form_opening_type:{
        type: String,
        default: ''
    }

});

const JobCl = mongoose.model( 'dt_post_jobs', JobSchema );

module.exports = JobCl;