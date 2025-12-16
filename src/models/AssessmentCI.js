const mongoose = require('mongoose');


const assessmentListSchema = new mongoose.Schema({
   question:{
        type:String
   },
   answer:{
        type:String
   },
   options:[],
   description:{
        type:String
   }
});

const AssessmentSchema = new mongoose.Schema({
    content_type: { type: String, enum: ['MCQ','Comprehensive'], default: 'MCQ' },
    no_of_display_questions: { 
        type: Number,
        default: 0
    },
    duration: { 
        type: String,
        trim: true
    },
    marking_per_question:{
        type: Number,
        default: 0
    },
    min_passing:{
        type: Number,
        default: 0
    },
    no_of_attempts:{
        type: Number,
        default: 0
    },
    reading_duration:{
        type: Number,
        default: 0
    },
    content:{
        type: String
    },  
    department:{
        type:String
    },
    status: { type: String, enum: ['Active','Inactive'], default: 'Active' },
    add_date:{
        type: Date,
        default: Date.now
    },
    updated_on:{
        type: Date,
        default: Date.now
    },
    assessment_list: [assessmentListSchema]
});

const AssessmentCI = mongoose.model('dt_assessments', AssessmentSchema );

module.exports = AssessmentCI;