const mongoose = require('mongoose');

const DivisionSchema = new mongoose.Schema({
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

const DivisionCI = mongoose.model('dt_Divisions', DivisionSchema );

module.exports = DivisionCI;