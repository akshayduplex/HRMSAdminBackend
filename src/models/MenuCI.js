const mongoose = require('mongoose');

const MenuSchema = new mongoose.Schema({
    name: { 
        type: String,
        trim: true
    },
    slug: {
        type: String,
        trim: true ,
        remark: 'Page Slug'
    },
    priority: {
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

const MenuCI = mongoose.model('dt_menu_lists', MenuSchema );

module.exports = MenuCI;