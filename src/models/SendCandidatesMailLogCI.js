const mongoose = require('mongoose');

const SendCandidatesMailLogCISchema = new mongoose.Schema({
    candidate_id:{
        type: mongoose.Types.ObjectId,
    },
    job_id:{
        type: mongoose.Types.ObjectId,
    },
    approval_id:{
        type: mongoose.Types.ObjectId,
    },
    purpose: { type: String, enum: ['Offer Letter','Joining Kit','Appointment Letter'], default: 'Offer Letter' },
    subject: {
        type: String,
        trim: true
    },
    content_data: { 
        type: String,
        trim: true
    },
    add_date:{
        type: Date
    }
});

const SendCandidatesMailLogCI = mongoose.model('dt_candidates_mail_log', SendCandidatesMailLogCISchema );

module.exports = SendCandidatesMailLogCI;