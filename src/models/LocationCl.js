const mongoose = require('mongoose');

const LocationSchema = new mongoose.Schema({
    name: { 
        type: String,
        trim: true,
        index: true 
    },
    state: { 
        type: String,
        trim: true,
        index: true 
    },
    state_id: { 
        type: mongoose.Types.ObjectId
    },
    latitude:{
        type:Number,
        default: 0
    },
    longitude:{
        type: Number,
        default: 0
    },
    status: { type: String, enum: ['Active','Inactive'], default: 'Active' },
    add_date:{
        type: Date
    },
    updated_on:{
        type: Date
    }
});

const LocationCl = mongoose.model('dt_locations', LocationSchema );

module.exports = LocationCl;