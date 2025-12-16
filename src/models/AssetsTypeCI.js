const mongoose = require('mongoose');

const AssetSchema = new mongoose.Schema({
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

const AssetsTypeCI = mongoose.model('dt_asset_types', AssetSchema );

module.exports = AssetsTypeCI;