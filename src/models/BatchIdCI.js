const mongoose = require('mongoose');

const BatchIdSchema = new mongoose.Schema({
    batch_id: { 
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

const BatchIdCI = mongoose.model('dt_Batch_ids', BatchIdSchema );

module.exports = BatchIdCI;