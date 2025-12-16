const mongoose = require('mongoose');

const WebSettingsSchema = new mongoose.Schema({ 
    site_title: {
        type:String,
        trim: true
    },
    meta_title: {
        type:String,
        trim: true
    },
    meta_description: {
        type:String,
        trim: true
    },
    logo_image: {
        type:String,
        trim: true,
        default: ''
    },
    fav_icon_image: {
        type:String,
        trim: true
    }, 
    water_mark_file: {
        type:String,
        trim: true
    },
    website_link: {
        type:String,
        trim: true
    },
    job_portal_link: {
        type:String,
        trim: true
    },
    meta_description: {
        type:String,
        trim: true
    },
    smtp_host: {
        type:String,
        trim: true
    }, 
    smtp_port: {
        type:String,
        trim: true
    }, 
    smtp_username: {
        type:String,
        trim: true
    }, 
    smtp_password: {
        type:String,
        trim: true
    }, 
    smtp_from_mail: {
        type:String,
        trim: true
    }, 
    smtp_reply_mail: {
        type:String,
        trim: true
    }, 
    smtp_encryption_type: {
        type:String,
        trim: true
    }, 
    smtp_email_content_type: {
        type:String,
        trim: true
    }, 
    smtp_enable_status: {
        type:String,
        enum: ['enabled','disabled'],
        default: 'disabled'
    },
    google_places_api: {
        type:String,
        trim: true
    }, 
    sms_auth_key: {
        type:String,
        trim: true
    }, 
    sms_route_id: {
        type:String,
        trim: true
    }, 
    sms_sender_id: {
        type:String,
        trim: true
    }, 
    sms_enable_status: {
        type:String,
        enum: ['enabled','disabled'],
        default: 'disabled'
    }, 
    organization_name: {
        type: String,
        trim: true,
        default: ''
    },
    organization_email_id: {
        type: String,
        trim: true
    },
    organization_mobile_no: {
        type:String,
        trim: true
    },
    organization_whatsapp_no: {
        type:String,
        trim: true
    },
    office_address: {
        type:String,
        trim: true
    },
    office_city: {
        type:String,
        trim: true
    },
    office_latitude: {
        type:String,
        trim: true
    },
    office_longitude: {
        type:String,
        trim: true
    },
    office_map_iframe: {
        type:String,
        trim: true
    },
    currency:{
        type:String,
        trim: true
    },
    time_zone:{
        type:String,
        trim: true
    },
    add_date:{
        type: Date
    },
    updated_on:{
        type: Date
    },
    ceo_email_id:{
        type:String,
        trim: true
    },
    ceo_name:{
        type:String,
        trim: true
    },
    ceo_digital_signature:{
        type:String,
        trim: true
    },
    default_hr_details:{
            name:{
                type:String,
                trim: true,
                default: ''
            },
            mobile_no:{
                type:String,
                trim: true,
                default: ''
            },
            designation:{
                type:String,
                trim: true,
                default: ''
            },
            email_id:{
                type:String,
                trim: true,
                default: ''
            }
    },
    social_media_links:{
            facebook_link:{
                type:String,
                trim: true,
                default: ''
            },
            instagram_link:{
                type:String,
                trim: true,
                default: ''
            },
            linkedin_link:{
                type:String,
                trim: true,
                default: ''
            },
            twitter_link:{
                type:String,
                trim: true,
                default: ''
            },
            youtube_link:{
                type:String,
                trim: true,
                default: ''
            }
    },
    hiring_approval_hr_email_id: {
        type:String,
        trim: true
    },
    header_color:{
        type:String,
        trim: true
    },
    footer_color:{
        type:String,
        trim: true
    },
    hod_hr_signature:{
        type:String,
        trim: true
    }


});

const WebSettingsCI = mongoose.model('dt_web_settings', WebSettingsSchema );

module.exports = WebSettingsCI;