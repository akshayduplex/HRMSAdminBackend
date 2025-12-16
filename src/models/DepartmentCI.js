const mongoose = require('mongoose');

const DepartmentSchema = new mongoose.Schema({
    name: { 
        type: String,
        trim: true,
        index: true 
    },
    status: { type: String, enum: ['Active','Inactive'], default: 'Active' },
    add_date:{
        type: Date
    },
    updated_on:{
        type: Date
    },
    priority:{
        type: Number,
        default: 0
    }
});

const DepartmentCl = mongoose.model('dt_departments', DepartmentSchema );

module.exports = DepartmentCl;