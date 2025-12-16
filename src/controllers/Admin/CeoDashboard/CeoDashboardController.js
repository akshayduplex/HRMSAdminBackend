const RequisitionFormCI = require('../../../models/RequisitionFormCI.js') ;  
const JobAppliedCandidateCl = require('../../../models/JobAppliedCandidateCl.js');
const ApprovalNoteCI = require('../../../models/ApprovalNoteCI.js');

const { dbObjectId } = require('../../../models/dbObject.js');
const dotenv = require("dotenv");
dotenv.config({path:'../src/config.env'});
const { dbDateFormat, updateDatesInArray,replaceNullUndefined , lettersOnly, commonOnly} = require('../../../middlewares/myFilters.js');
 
const { validationResult } = require('express-validator');


const controller = {};

/********* Get Dashboard Data **********/
controller.getRecords = async ( req, res )=>{
 
    const resultData = {}

    /*count all Mpr Data */ 
    resultData['total_mpr'] = await RequisitionFormCI.countDocuments( { 
        activity_data: {
            $elemMatch: { 
                designation: "CEO"
            }
        }
    } );
    resultData['total_pending_mpr'] = await RequisitionFormCI.countDocuments({
        status:'Pending',
        activity_data: {
            $elemMatch: {
                status: "Pending",
                designation: "CEO"
            }
        }
    });
    resultData['total_approved_mpr'] = await RequisitionFormCI.countDocuments({
        status:'Approved',
        activity_data: {
            $elemMatch: {
                status: "Approved",
                designation: "CEO"
            }
        }
    });
    

    /************* count all Approval Notes Data ****************/  
    resultData['total_approval_notes'] = await ApprovalNoteCI.countDocuments( {} );
    resultData['total_pending_approval_notes'] = await ApprovalNoteCI.countDocuments({
        status: 'Inprogress',
        panel_members_list: {
            $elemMatch: {
                approval_status: "Pending",
                designation: "CEO"
            }
        }
    });
    resultData['total_approved_approval_notes'] = await ApprovalNoteCI.countDocuments({
        status: 'Completed',
        panel_members_list: {
            $elemMatch: {
                approval_status: "Approved",
                designation: "CEO"
            }
        }
    });


    const  today = new Date();
           today.setHours(0, 0, 0, 0);

    /*count all Approval Notes Data */  
    resultData['total_upcoming_interview'] = await JobAppliedCandidateCl.countDocuments({
        form_status: "Interview",
        applied_jobs: {
            $elemMatch: {
                form_status: "Interview",
                interview_date: { $gt: today },
                interviewer: { $elemMatch: { status: { $in: ['Pending', 'Accept'] }, designation: { $in: ['CEO', 'CEO Sir','ceo','ceo sir','C E O'] } } }
            }
        }
    });
    resultData['total_completed_interview'] = await JobAppliedCandidateCl.countDocuments({
        form_status: "Interview",
        applied_jobs: {
            $elemMatch: {
                form_status: "Interview",
                interview_date: { $lt: today },
                interviewer: { $elemMatch: { status: 'Accept', designation: { $in: ['CEO', 'CEO Sir','ceo','ceo sir','C E O'] } } }
            }
        }
    });
    resultData['total_pending_interview_feedback'] = await JobAppliedCandidateCl.countDocuments({
        form_status: "Interview",
        applied_jobs: {
            $elemMatch: {
                form_status: "Interview",
                interview_date: { $lt: today },
                profile_avg_rating: 0,
                interviewer: { $elemMatch: { status: 'Accept', feedback_status : 'Pending', designation: { $in: ['CEO', 'CEO Sir','ceo','ceo sir','C E O'] } } }
            }
        }
    });

    return res.status(200).send( {'status':true, data: resultData, 'message': 'Success'} );

}

module.exports = controller;
