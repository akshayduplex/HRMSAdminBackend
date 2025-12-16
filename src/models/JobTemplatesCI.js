const mongoose = require('mongoose');

const JobTemplatesSchema = new mongoose.Schema({
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
    title: { 
        type: String,
        trim: true
    },
    description: { 
        type: String,
        trim: true
    },
    status: { type: String, enum: ['Active','Inactive'], default: 'Active' },
    add_date:{
        type: Date,
        default: Date.now
    },
    updated_on:{
        type: Date,
        default: Date.now
    }
});

const JobTemplatesCI = mongoose.model('dt_job_templates', JobTemplatesSchema );

module.exports = JobTemplatesCI;