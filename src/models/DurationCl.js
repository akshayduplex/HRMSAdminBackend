const mongoose = require('mongoose');

const DurationSchema = new mongoose.Schema({
    duration: {
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

const DurationCl = mongoose.model('dt_durations', DurationSchema );

module.exports = DurationCl;