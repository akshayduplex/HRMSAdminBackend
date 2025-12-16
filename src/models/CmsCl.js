const mongoose = require('mongoose');

const AllCmsSchema = new mongoose.Schema({
    page_slug: { 
        type: String,
        trim: true 
    },
    meta_title: {
        type: String,
        trim: true,
        required: [true, 'Meta Title Required']
    },
    meta_description: {
        type: String,
        trim: true,
        required: [true, 'Meta Description Required']
    },
    meta_keyword: {
        type: String,
        trim: true,
        required: [true, 'Meta Keyword Required']
    },
    h_one_heading: {
        type: String,
        trim: true,
        required: [true, 'H1 Heading Required']
    },
    content_data: {
        type: String,
        trim: true,
        required: [true, 'Content Required']
    },
    status: { type: String, enum: ['Active','Inactive'], default: 'Active' },
    add_date:{
        type: Date
    },
    updated_on:{
        type: Date
    }
});

const CmsCl = mongoose.model('dt_cms', AllCmsSchema );

module.exports = CmsCl;