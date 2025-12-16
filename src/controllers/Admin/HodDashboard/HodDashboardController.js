const RequisitionFormCI = require('../../../models/RequisitionFormCI.js') ;  
const JobAppliedCandidateCl = require('../../../models/JobAppliedCandidateCl.js');
const ApprovalNoteCI = require('../../../models/ApprovalNoteCI.js');
const EmployeeCI = require('../../../models/EmployeeCI.js');

const { dbObjectId } = require('../../../models/dbObject.js');
const dotenv = require("dotenv");
dotenv.config({path:'../src/config.env'});
const fs = require('fs');

const { dbDateFormat, updateDatesInArray,replaceNullUndefined , lettersOnly, commonOnly} = require('../../../middlewares/myFilters.js');
 
const { validationResult } = require('express-validator');


const controller = {};

/********* Get Dashboard Data **********/
controller.getRecords = async ( req, res )=>{

    const { employee_id } = req.query; 

    /**************** get default **************/
    const hrConfig = JSON.parse( fs.readFileSync('./src/config/hr_config_file.txt', 'utf8' ) ); 
    var hiring_approval_hr_email_id =  hrConfig?.hiring_approval_hr_email_id || '';  
    const employeeIdData = await EmployeeCI.findOne( { email: hiring_approval_hr_email_id },{_id:1} );



    //console.log( employee_id );
 
    const resultData = {}

    /*count all Mpr Data */ 
    resultData['total_mpr'] = await RequisitionFormCI.countDocuments( { 
        activity_data: {
            $elemMatch: {
                employee_doc_id: employee_id
            }
        }
    } );
    resultData['total_pending_mpr'] = await RequisitionFormCI.countDocuments({
        status:'Pending',
        activity_data: {
            $elemMatch: {
                status: "Pending",
                employee_doc_id: employee_id
            }
        }
    });
    resultData['total_approved_mpr'] = await RequisitionFormCI.countDocuments({
        status:'Approved',
        activity_data: {
            $elemMatch: {
                status: "Approved",
                employee_doc_id: employee_id
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
                emp_doc_id: employee_id
            }
        }
    });;
    resultData['total_approved_approval_notes'] = await ApprovalNoteCI.countDocuments({
        status: 'Completed',
        panel_members_list: {
            $elemMatch: {
                approval_status: "Approved",
                employee_doc_id: employee_id
            }
        }
    });


    const  today = new Date();
           today.setHours(0, 0, 0, 0);

    /*count all candidate INterview Data */  
    resultData['total_upcoming_interview'] = await JobAppliedCandidateCl.countDocuments({
        form_status: "Interview",
        applied_jobs: {
            $elemMatch: {
                form_status: "Interview",
                interview_date: { $gt: today },
                interviewer: { $elemMatch: { status: { $in: ['Pending', 'Accept'] }, employee_id: dbObjectId(employee_id) } }
            }
        }
    });
    resultData['total_completed_interview'] = await JobAppliedCandidateCl.countDocuments({
        form_status: "Interview",
        applied_jobs: {
            $elemMatch: {
                form_status: "Interview",
                interview_date: { $lt: today },
                interviewer: { $elemMatch: { status: 'Accept', employee_id: dbObjectId(employee_id) } }
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
                interviewer: { $elemMatch: { status: 'Accept', feedback_status : 'Pending', employee_id: dbObjectId(employee_id) } }
            }
        }
    });


    /*count all Approval Notes Data */
    // resultData['total_appointment_letter'] = await ApprovalNoteCI.countDocuments({
    //     'candidate_list.appointment_letter_verification_status.status': { $in: ['Complete', 'Pending'] }
    // });
    // resultData['total_approved_appointment_letter'] = await ApprovalNoteCI.countDocuments({
    //     'candidate_list.appointment_letter_verification_status.status':'Complete'
    // });
    // resultData['total_pending_appointment_letter'] = await ApprovalNoteCI.countDocuments({
    //     'candidate_list.appointment_letter_verification_status.status':'Pending'
    // }); 

    const appointmentLetterCount = await ApprovalNoteCI.aggregate([
    { $unwind: "$candidate_list" },
    {
        $match: {
            "candidate_list.appointment_letter_verification_status": { 
                $exists: true, 
                $ne: null,
                $type: "object"
                },
            "candidate_list.appointment_letter_verification_status.status": {
                $in: ["Complete", "Pending"]
            },
            "candidate_list.document_status.appointment_letter": {
                $in: [ "generated","approved","uploaded"]
            }
        }
    },
    { $count: "total" }
    ]);

    resultData['total_appointment_letter'] = appointmentLetterCount[0]?.total || 0;


    const appointmentLetterCountComplete = await ApprovalNoteCI.aggregate([
        { $unwind: "$candidate_list" },
        {
            $match: {
                "candidate_list.document_status.appointment_letter": {
                    $in: ["approved","uploaded"]
                },
                "candidate_list.appointment_letter_verification_status": { 
                $exists: true, 
                $ne: null,
                $type: "object"
                },
                "candidate_list.appointment_letter_verification_status.status": {
                    $in: ["Complete"]
                }                
            }
        },
        { $count: "total" }
        ]);

    resultData['total_approved_appointment_letter'] = appointmentLetterCountComplete[0]?.total || 0;


    const appointmentLetterCountPending = await ApprovalNoteCI.aggregate([
        { $unwind: "$candidate_list" },
        {
            $match: {
                "candidate_list.document_status.appointment_letter": { $in: ["generated"] },
                "candidate_list.appointment_letter_verification_status": { 
                $exists: true, 
                $ne: null,
                $type: "object"
                },
                "candidate_list.appointment_letter_verification_status.status": {
                    $in: ["Pending"]
                } 
            }
        },
        { $count: "total" }
        ]);

    resultData['total_pending_appointment_letter'] = appointmentLetterCountPending[0]?.total || 0;



    return res.status(200).send( {'status':true, data: resultData, 'message': 'Success'} );

}

 

module.exports = controller;
