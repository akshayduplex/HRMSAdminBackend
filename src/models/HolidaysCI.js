const mongoose = require('mongoose');

const HolidaysSchema = new mongoose.Schema({
    name: { 
        type: String,
        trim: true,
        index: true
    },
    schedule_date:{
        type: Date,
    },
    year:{
        type: String
    },
    state_list:[],
    status: { type: String, enum: ['Active','Inactive'], default: 'Active' },
    add_date:{
        type: Date
    },
    updated_on:{
        type: Date
    }
});

const HolidaysCI = mongoose.model('dt_holidays', HolidaysSchema );

module.exports = HolidaysCI;