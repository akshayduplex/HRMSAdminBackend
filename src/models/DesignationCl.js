const mongoose = require('mongoose');
const { type } = require('os');


const priorityListSchema = new mongoose.Schema({
    priority: {
        type: Number,
        default : 0
    },
    project_id:{
        type : mongoose.Types.ObjectId
    }
});

const DesignationsSchema = new mongoose.Schema({
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
    },
    assigned_menu_list: [],
    priority: {
        type: Number,
        default : 0
    },
    priority_list: [priorityListSchema]
});

const DesignationCl = mongoose.model('dt_designations', DesignationsSchema );

module.exports = DesignationCl;