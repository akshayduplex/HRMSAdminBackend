const mongoose = require('mongoose');

const CurrencySchema = new mongoose.Schema({
    country: { 
        type: String,
        trim: true,
        index: true
    },
    currency: { 
        type: String,
        trim: true,
        default: ''
    },
    code: { 
        type: String,
        trim: true,
        default: ''
    },
    symbol: { 
        type: String,
        trim: true,
        default: ''
    },
    status: { type: String, enum: ['Active','Inactive'], default: 'Active' },
    add_date:{
        type: Date
    },
    updated_on:{
        type: Date
    }
});

const CurrencyCI = mongoose.model('dt_currencies', CurrencySchema );

module.exports = CurrencyCI;