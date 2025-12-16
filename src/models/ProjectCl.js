const mongoose = require('mongoose');

const ExtendDateSchema = new mongoose.Schema({
    from:{
        type: Date,
        default: Date
    },
    to:{
        type: Date,
        default: Date
    },
    add_date:{
        type: Date,
        default: Date
    }
});

const ExtendBudgetSchema = new mongoose.Schema({
    before_amount:{
        type: Number,
        default: 0
    },
    after_amount:{
        type: Number,
        default: 0
    },
    add_date:{
        type: Date,
        default: Date.now
    }
})

const EmployeeList = new mongoose.Schema({
    employee_id:{
        type: mongoose.Types.ObjectId
    },
    employee_office_id:{
        type: String
    },
    employee_name:{
        type: String,
        trim: true
    },
    designation:{
        type: String,
        trim: true
    },
    role_type:{
        type: String,
        trim: true
    },
    attendance:{
        type: Number,
        default: 0
    },
    payout:{
        type: Number,
        default: 0
    },
    add_date:{
        type: Date,
        default: Date.now
    }
});

const BudgetEstimate = new mongoose.Schema({
    designation:{
        type: String,
        trim: true
    },
    designation_id:{
        type: mongoose.Types.ObjectId
    },
    department:{
        type: String,
        trim: true
    },
    no_of_positions:{
        type: Number,
        default: 0
    },
    ctc:{
        type: Number,
        default: 0
    },
    total_ctc:{
        type: Number,
        default: 0
    },
    hired:{
        type: Number,
        default: 0
    },
    available_vacancy:{
        type: Number,
        default: 0,
        remark : 'vacant'
    },
    resigned:{
        type: Number,
        default: 0
    },
    add_date:{
        type: Date,
        default: Date.now
    },
    vacant_date:{
        type: Date,
        default: Date.now,
        remark : 'available vacant date'
    },
    employee_type:{
        type: String,
        enum:['onRole','onContract','emPanelled'],
        default: 'onRole',
        remark : 'onContract == consultant'
    },
    regions:[],
    divisions:[]
})
const budgetLedgerSchema = new mongoose.Schema({
    financial_year: {
        type: String,
        trim: true
    }, 
    initial_amount: { 
        type: Number,
        default: 0,
        min: 0  
    },
    utilized_amount: { 
        type: Number, 
        default: 0,
        min: 0  
    },
    available_amount: { 
        type: Number, 
        default: 0,
        min: 0  
    },
    salary_month_date: {
        type: Date
    },
    add_date: {
        type: Date,
        default: Date.now  
    },
    updated_at: {
        type: Date,
        default: Date.now  
    }
});



const ProjectSchema = new mongoose.Schema({
    title: { 
        type: String,
        trim: true,
        index: true
    },
    logo:{
        type: String,
        trim: true
    },
    location: [],
    manager_name:{
        type: String,
        trim: true
    },
    manager_list: [],
    incharge_name :{
        type: String,
        trim: true
    },
    in_charge_list: [],
    start_date:{
        type: Date,
        default: Date.now
    },
    end_date:{
        type: Date,
        default: Date.now
    },
    duration:{
        type: String,
        trim: true
    }, 
    total_payout:{
        type: Number,
        default: 0
    },
    status: { type: String, enum: ['Active','Closed'], default: 'Active' },
    add_date:{
        type: Date,
        default: Date.now
    },
    updated_on:{
        type: Date,
        default: Date.now
    },
    closed_on:{
        type: Date
    },
    extend_date_list: [ExtendDateSchema],
    extend_budget_list: [ExtendBudgetSchema],
    employee_list: [EmployeeList],
    budget:{
        type: Number,
        default: 0,
        remark:'total budget estimation/sanction budget'
    },
    per_month_budget:{
        type: Number,
        default: 0,
        remark:'total budget estimation/sanction budget'
    },
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
    budget_estimate_list: [BudgetEstimate] ,
    project_budget:{},
    budget_ledger:[budgetLedgerSchema],


});

const ProjectCl = mongoose.model('dt_projects', ProjectSchema );

module.exports = ProjectCl;

/**
 * 
 * ------------- project_budget:
 * objects : {
 * sanctioned:00
 * utilized:00
 * available: 
 * }---------
 * 
 */