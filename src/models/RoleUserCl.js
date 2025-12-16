const mongoose = require('mongoose');

const RoleUserSchema = new mongoose.Schema({
    name: {
        type: String,
        trim: true,
        required: [true, 'Name Required']
    },
    email: {
        type: String,
        trim: true,
        unique: true, 
        required: [true, 'Email ID Required']
    },
    mobile_no: {
        type: String,
        trim: true,
        required: [true, 'MObile No Required']
    }, 
    /*password: {
        type: String,
        trim: true,
        //required: [true, 'Password is required'],
        minlength: [8, 'Password must be at least 8 characters long'],
        validate: {
            validator: function(v) {
                return /(?=.*[0-9])(?=.*[!@#$%^&*])/.test(v);
            },
            message: props => `${props.value} is not a valid password! Password must contain at least one number and one special character.`
        }
    },
    hashed_password:{
        type: String
    },*/
    device_id:{
        type: String
    },
    fcm_token:{
        type: String
    },
    designation: {
        type: String,
        required: [true, 'User Designation Required']
    },
    designation_id: {
        type: mongoose.Types.ObjectId
    },
    profile_status: { type: String, enum: ['Active','Inactive','Blocked'], default: 'Active' },
    add_date:{
        type: Date
    },
    updated_on:{
        type: Date
    },
    otp:{
        type: String,
        trim: true
    },
    otp_sent_on:{
        type: Date
    },
    last_login:{
        type: Date
    },
    login_device:{
        type: String
    },
    permissions:[],
    special_permissions: {
        reference_check_skip: { type: String, enum: ['yes','no'], default: 'no'}
    },
    employee_doc_id: {
        type: mongoose.Types.ObjectId
    },

});

const RoleUserCl = mongoose.model('dt_role_users', RoleUserSchema );

module.exports = RoleUserCl;
