const mongoose = require("mongoose"); 

const CompanyDetailsSchema =  new mongoose.Schema({
    whatsapp_no:{
        type: String,
        trim: true,
        required: true
    }, 
    mobile_no:{
        type: String,
        trim: true,
        required: true
    },   
    email_no:{
        type: String,
        trim: true,
        required: true
    },  
    chat_url:{
        type: String,
        trim: true
    }, 
    company_name:{
        type: String,
        trim: true,
        required: true
    }, 
    company_address:{
        type: String,
        trim: true,
        required: true
    }, 
    add_date:{
        type: Date,
        trim: true
    },
    update_date:{
        type: Date,
        trim: true
    },

})

const CompanyDetails = mongoose.model('dt_company_details', CompanyDetailsSchema  );

module.exports = { CompanyDetails }