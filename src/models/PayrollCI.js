const mongoose = require('mongoose');

const PayrollSchema = new mongoose.Schema({
    project_name: { 
        type: mongoose.Types.ObjectId
    },
    project_name: { 
        type: String,
        trim: true
    },
    month: { 
        type: String,
        trim: true
    },
    year: { 
        type: String,
        trim: true
    },
    draft_date:{
        type: Date,
        default: Date.now
    },
    credit_date:{
        type: Date
    },
    total_payroll: { 
        type: Number, 
        default: 0 
    },
    total_reimbursement: { 
        type: Number, 
        default: 0 
    },
    total_employee: {
        type: Number, 
        default: 0 
    },
    total_days: {
        type: Number, 
        default: 0 
    },
    status: { type: String, enum: ['Import','RunPayroll','Credited'], default: 'Import' },
    add_date:{
        type: Date,
        default: Date.now
    },
    updated_on:{
        type: Date,
        default: Date.now
    }
});

const PayrollCI = mongoose.model('dt_payrolls', PayrollSchema );

module.exports = PayrollCI;