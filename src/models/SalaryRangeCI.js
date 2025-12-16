const mongoose = require('mongoose');

const SalaryRangeSchema = new mongoose.Schema({
    label: { 
        type: String,
        trim: true,
        index: true 
    },
    from:{
        type:Number,
        default: 0
    },
    to:{
        type:Number,
        default: 0
    },
    status: { type: String, enum: ['Active','Inactive'], default: 'Active' },
    add_date:{
        type: Date
    },
    updated_on:{
        type: Date
    }
});

const SalaryRangeCI = mongoose.model('dt_salary_ranges', SalaryRangeSchema );

module.exports = SalaryRangeCI;