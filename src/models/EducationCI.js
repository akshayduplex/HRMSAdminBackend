const mongoose = require('mongoose');

const EducationSchema = new mongoose.Schema({
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
    }
});

const EducationCl = mongoose.model('dt_education_lists', EducationSchema );

module.exports = EducationCl;