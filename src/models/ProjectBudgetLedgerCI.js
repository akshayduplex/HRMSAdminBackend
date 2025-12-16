const mongoose = require('mongoose');

const BudgetLedgerSchema = new mongoose.Schema({
    project_id:{
        type: mongoose.Types.ObjectId
    },
    project_name:{
        type: String,
        trim: true
    },
    financial_year: { 
        type: String,
        trim: true,
        required: true  
    },
    sanction: { 
        type: Number,
        default: 0,
        min: 0  
    },
    utilized: { 
        type: Number, 
        default: 0,
        min: 0  
    },
    available: { 
        type: Number, 
        default: 0,
        min: 0  
    },
    salary_of_month_date: {
        type: Date
    },
    add_date: {
        type: Date,
        default: Date.now  
    },
    updated_on: {
        type: Date,
        default: Date.now  
    }
});

const ProjectBudgetLedgerCI = mongoose.model('dt_project_budget_ledger', BudgetLedgerSchema);

module.exports = ProjectBudgetLedgerCI;
