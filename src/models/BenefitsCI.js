const mongoose = require('mongoose');

const BenefitSchema = new mongoose.Schema({
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

const BenefitsCl = mongoose.model('dt_benefits', BenefitSchema );

module.exports = BenefitsCl;