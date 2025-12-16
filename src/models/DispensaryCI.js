const mongoose = require('mongoose');

const DispensarySchema = new mongoose.Schema({
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

const DispensaryCI = mongoose.model('dt_Dispensaries', DispensarySchema );

module.exports = DispensaryCI;