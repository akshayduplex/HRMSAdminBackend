const mongoose = require('mongoose');

const AppliedFromSchema = new mongoose.Schema({
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

const AppliedFromCI = mongoose.model('dt_applied_from_lists', AppliedFromSchema );

module.exports = AppliedFromCI;