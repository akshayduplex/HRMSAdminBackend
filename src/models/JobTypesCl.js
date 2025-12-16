const mongoose = require('mongoose');

const JobTypeSchema = new mongoose.Schema({
    name: { 
        type: String,
        trim: true,
        index: true 
    },
    job_code: { 
        type: String,
        trim: true
    },
    status: { type: String, enum: ['Active','Inactive'], default: 'Active' },
    add_date:{
        type: Date
    },
    updated_on:{
        type: Date
    }
});

const JobTypeCl = mongoose.model('dt_job_types', JobTypeSchema );

module.exports = JobTypeCl;