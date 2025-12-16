const mongoose = require('mongoose');

const SalaryStructureSchema = new mongoose.Schema({
    designation: { 
        type: String,
        trim: true
    },
    designation_id: { 
        type: mongoose.Types.ObjectId
    },
    employee_type:{
        type: String,
        enum:['onRole','onContract','emPanelled'],
        default: 'onRole'
    },
    status: { type: String, enum: ['Active','Inactive'], default: 'Active' },
    add_date:{
        type: Date
    },
    updated_on:{
        type: Date
    }
});

const SalaryStructureCI = mongoose.model('dt_salary_structure', SalaryStructureSchema );

module.exports = SalaryStructureCI;