const mongoose = require('mongoose');

const AppraisalCycleSchema = new mongoose.Schema({
    name: { 
        type: String,
        trim: true,
        index: true 
    },
    from_date: { 
        type: Date,
        default: Date.now()
    },
    to_date: { 
        type: Date,
        default: Date.now()
    },
    status: { type: String, enum: ['Active','Inactive'], default: 'Active' },
    add_date:{
        type: Date
    },
    updated_on:{
        type: Date
    }
});

const AppraisalCycleCI = mongoose.model('dt_appraisal_cycle', AppraisalCycleSchema );

module.exports = AppraisalCycleCI;