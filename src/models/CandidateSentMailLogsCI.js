const mongoose = require('mongoose');

const SentMailFormatSchema = new mongoose.Schema({
    candidate_id: { 
        type: mongoose.Types.ObjectId,
        ref: "dt_candidates"
    },
    doc_category:{
        type: String
    },
    reference_doc_id: { 
        type: mongoose.Types.ObjectId,
        ref: "dt_approval_notes"
    },
    content_data: { 
        type: String,
        trim: true
    },
    attachments:[{
        doc_name: {type: String},
        file_name: {type: String}
    }],
    add_date:{
        type: Date
    },
    updated_on:{
        type: Date
    },
    added_by_data:{
        name: {type: String},
        email: { type: String},
        mobile:{ type: String},
        designation: {type: String}
    }
});

const CandidateSentMailLogsCI = mongoose.model('dt_candidate_sent_mail_logs', SentMailFormatSchema );

module.exports = CandidateSentMailLogsCI;