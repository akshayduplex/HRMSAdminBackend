const mongoose = require('mongoose');

const BankSchema = new mongoose.Schema({
    name: { 
        type: String,
        trim: true,
        index: true 
    },
    ifsc_code: { 
        type: String,
        trim: true
    },
    status: { type: String, enum: ['Active','Inactive'], default: 'Active' },
    add_date:{
        type: Date
    },
    updated_on:{
        type: Date
    }
});

const BankCI = mongoose.model('dt_Banks', BankSchema );

module.exports = BankCI;