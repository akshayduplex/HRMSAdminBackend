const mongoose = require('mongoose');

const activityDataSchema = mongoose.Schema({
    name:{
        type: String,
        trim: true
    },
    email:{
        type: String,
        trim: true
    },
    mobile:{
        type: String,
        trim: true
    }, 
    designation:{
        type: String,
        trim: true
    },
    type:{
        type: String,
        enum: ['raised','entry'],
        default: 'entry'
    },
    status:{
        type: String,
        enum: ['Pending','Approved','Reject'],
        default: 'Pending'
    },
    comment:{
        type: String,
        trim: true
    },
    comment_date:{
        type: Date
    },
    added_date:{
        type: Date,
        default: Date.now()
    },
    employee_designation:{
        type: String,
        trim: true
    },
    employee_doc_id:{
        type: String,
        trim: true
    },
    priority:{
        type: Number,
        default: 0
    },
    signature:{
        type: String,
        trim: true
    }

});


const RequisitionSchema = new mongoose.Schema({
    title: { 
        type: String,
        trim: true
    },
    project_id: { 
        type: mongoose.Types.ObjectId
    },
    project_name: { 
        type: String,
        trim: true
    },
    project_duration:{
        type: String,
        trim: true
    },
    designation_id: { 
        type: mongoose.Types.ObjectId
    },
    designation_name: { 
        type: String,
        trim: true
    },
    department_id: { 
        type: mongoose.Types.ObjectId
    },
    department_name: { 
        type: String,
        trim: true
    },
    type_of_opening: { 
        type: String,
        enum: ['new','replacement','planned_non_budgeted'],
        default: 'new'
    },
    fund_type: { 
        type: String,
        enum: ['Funded','Non Funded'],
        default: 'Non Funded'
    },
    ctc_per_annum: { 
        type: Number,
        default: 0
    },
    ctc_per_month: { 
        type: Number,
        default: 0
    },
    grade: { 
        type: String,
        trim: true
    },
    minimum_experience: { 
        type: String,
        trim: true
    },
    maximum_experience: { 
        type: String,
        trim: true
    },
    no_of_vacancy: { 
        type: Number,
        default: 0
    },
    reporting_structure: { 
        type: String,
        trim: true,
        remark: 'designation'
    },
    reporting_structure_id: {
        type: mongoose.Types.ObjectId
    },
    vacancy_frame: {
        type: Number,
        default: 0,
        remark: 'no of vacancy'
    },
    place_of_posting:[],
    job_description:{
        type:String,
        trim: true
    },
    qualification:{
        type:String,
        trim: true
    },
    skills:{
        type:String,
        trim: true
    },
    tags:{
        type:String,
        trim: true
    },
    status: { type: String, enum: ['Pending','Approved','Reject'], default: 'Pending' },
    add_date:{
        type: Date
    },
    updated_on:{
        type: Date
    },
    requisition_form:{
        type: String,
        trim: true
    },
    raised_on:{
        type: Date,
        remark: 'Replacement Date'
    },
    deadline_date:{
        type: Date,
        default: Date.now
    },
    replacement_date:{
        type: Date,
        default: Date.now
    },
    replacement_mpr_details:{
       mpr_id:{ type: mongoose.Types.ObjectId },
       mpr_title:{ type: String }
    },
    activity_data:[activityDataSchema],
    replacement_employee_list:[],
    mode_of_employment:{
        type: String,
        default: ''
    }
});
 


const RequisitionFormCI = mongoose.model('dt_requisition_forms', RequisitionSchema );

module.exports = RequisitionFormCI;