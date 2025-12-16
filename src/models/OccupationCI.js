const mongoose = require('mongoose');

const OccupationSchema = new mongoose.Schema({
    name: { 
        type: String,
        trim: true
    },
    status: { type: String, enum: ['Active','Inactive'], default: 'Active' },
    add_date:{
        type: Date
    },
    updated_on:{
        type: Date
    }
});


const OccupationCI = mongoose.model('dt_occupations', OccupationSchema );

module.exports = OccupationCI;