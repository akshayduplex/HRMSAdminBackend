const mongoose = require('mongoose');

const FinancialYearSchema = new mongoose.Schema({
    name: { 
        type: String,
        trim: true,
        index: true 
    },
    priority: { 
        type: Number,
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

const FinancialYearCl = mongoose.model('dt_financial_years', FinancialYearSchema );

module.exports = FinancialYearCl;