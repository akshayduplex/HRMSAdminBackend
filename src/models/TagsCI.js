const mongoose = require('mongoose');

const TagsSchema = new mongoose.Schema({
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

const TagsCl = mongoose.model('dt_tags', TagsSchema );

module.exports = TagsCl;