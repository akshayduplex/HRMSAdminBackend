const mongoose = require('mongoose');

const GradeSchema = new mongoose.Schema({
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

const GradeCI = mongoose.model('dt_grades', GradeSchema );

module.exports = GradeCI;