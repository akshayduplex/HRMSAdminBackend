const mongoose = require('mongoose');

const StateSchema = new mongoose.Schema({
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

const StateCI = mongoose.model('dt_states', StateSchema );

module.exports = StateCI;