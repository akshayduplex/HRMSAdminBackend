const mongoose = require('mongoose');

const CandidateDiscussionSchema = new mongoose.Schema({
    candidate_id:{
        type: mongoose.Types.ObjectId,
    },
    project_id:{
        type: mongoose.Types.ObjectId,
    },
    candidate_name: { 
        type: String,
        trim: true
    },
    discuss_with: { 
        type: String,
        trim: true
    },
    subject: {
        type: String,
        trim: true
    }, 
    discussion: { 
        type: String,
        trim: true
    },
    add_date:{
        type: Date
    }
});

const CandidateDiscussionHistoryCI = mongoose.model('dt_candidates_discussions', CandidateDiscussionSchema );

module.exports = CandidateDiscussionHistoryCI;