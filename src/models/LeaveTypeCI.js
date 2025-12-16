const mongoose = require('mongoose');

const LeaveTypeSchema = new mongoose.Schema({
    name: { 
        type: String,
        trim: true
    },
    sort_name: { 
        type: String,
        trim: true
    },
    leave_type: { 
        type: String,
        enum: ['Paid','Unpaid'],
        default: 'Unpaid'
    },
    allowed_for_five_days: { 
        type: Number,
        trim: true,
        default: 0,
        remark:'5 Days Working'
    },
    allowed_for_six_days: { 
        type: Number,
        trim: true,
        default: 0,
        remark:'6 Days Working'
    },
    status: { type: String, enum: ['Active','Inactive'], default: 'Active' },
    add_date:{
        type: Date
    },
    updated_on:{
        type: Date
    }
});

const LeaveTypeCI = mongoose.model('dt_leave_types', LeaveTypeSchema );

module.exports = LeaveTypeCI;