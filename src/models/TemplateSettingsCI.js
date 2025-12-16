const mongoose = require('mongoose');

const attachmentSchema = new mongoose.Schema({
    doc_name: {
        type: String,
        trim: true
    },
    file_name: {
        type: String,
        trim: true
    },
    is_html: {
        type: String,
        enum: ['Yes', 'No'],
        default: 'No'
    },
    is_optional: {
        type: String,
        enum: ['Yes', 'No'],
        default: 'No'
    },
    add_date: {
        type: Date,
        default: Date.now
    }
});

const TemplateSettingSchema = new mongoose.Schema({
    job_type: {
        type: String,
        trim: true
    },
    attachments: [attachmentSchema],
    template: {
        type: String,
        trim: true
    },
    status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
    template_for: { type: String, enum: ['Offer Letter', 'Joining Kit', 'Appointment Letter', 'Joining Intimation'], default: 'Offer Letter' },
    add_date: {
        type: Date
    },
    updated_on: {
        type: Date
    },
    esic_status: {
        type: String,
        enum: ['Yes', 'No'],
        default: 'No'
    }
});

const TemplateSettingsCI = mongoose.model('dt_template_settings', TemplateSettingSchema);

module.exports = TemplateSettingsCI;