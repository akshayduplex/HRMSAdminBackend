const mongoose = require('mongoose');
 
const AssignHistoryLog = new mongoose.Schema({
    employee_name:{ type:String },
    employee_doc_id:{ type: mongoose.Types.ObjectId },
    employee_code:{ type:String },
    assign_date:{
        type: Date,
    },
    assign_condition:{
        type: String,
        trim: true,
        remark: 'description'
    },
    assign_condition_status:{
        type: String,
        trim: true
    },
    assign_device_image: {},
    signed_declaration_form:{
        type:String,
        trim: true
    },
    return_date:{
        type: Date,
    },
    return_condition:{
        type: String,
        trim: true,
        remark: 'description'
    },
    return_condition_status:{
        type: String,
        trim: true
    },
    return_condition_device_image: {},
    status:{
        type: String,
        enum: ['Assigned','Returned'],
        default: 'Assigned'
    },
});


const AssetSchema = new mongoose.Schema({
    asset_name: { 
        type: String,
        trim: true
    }, 
    asset_code: { 
        type: String,
        trim: true
    }, 
    serial_no: { 
        type: String,
        trim: true
    },
    asset_type:{
        type:String,
        trim: true
    },
    current_employee:{
        name:{
            type:String,
            trim:true
        },
        employee_doc_id:{
            type: mongoose.Types.ObjectId
        },
        code:{
            type:String,
            trim:true
        },
        assign_date:{
            type: Date,
        }
    },
    assign_status:{
        type: String,
        enum: ['Assigned','Unassigned'],
        default: 'Unassigned'
    },
    assigned_history: [AssignHistoryLog],
    status: { type: String, enum: ['Active','Inactive'], default: 'Active', remark:'Device Status' },
    add_date:{
        type: Date,
        default: Date.now
    },
    updated_on:{
        type: Date
    }
});

const AssetsItemCI = mongoose.model('dt_asset_items', AssetSchema );

module.exports = AssetsItemCI;