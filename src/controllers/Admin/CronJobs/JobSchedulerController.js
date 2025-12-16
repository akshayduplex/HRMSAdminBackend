const JobsCL = require('../../../models/JobsCI.js');
const EmployeeCI = require('../../../models/EmployeeCI.js');
const ProjectCl = require('../../../models/ProjectCl.js');
const JobAppliedCandidateCl = require('../../../models/JobAppliedCandidateCl.js');
const { dbObjectId } = require('../../../models/dbObject.js');
const dotenv = require("dotenv");
dotenv.config({path:'../src/config.env'});
const { dbDateFormat, addDaysDate, allDateFormat } = require('../../../middlewares/myFilters.js');
const { workAnniversaryMail } = require('../../../helpers/workAnniversaryMail.js');
const { birthdayWishMail } = require('../../../helpers/birthdayWishMail.js');
const { jobDeadlineAlertMail } = require('../../../helpers/jobDeadlineAlertMail.js');
const { RememberRatingMailToEmployee, RememberRatingMailToEmployeeViaLink } = require('../../../helpers/RememberRatingMailToEmployee.js');
 
const controller = {};

/********* fetch All Posted Jobs, which deadline is near **********/
controller.getNearDeadLineJobs = async ()=>{
    try { 

        // Query to find records with a deadline after 15 days from today
        const today = new Date();
        const dateAfter15Days = new Date(today);
        dateAfter15Days.setDate(today.getDate() + 14 ); 
      

        const currentMonth = dateAfter15Days.getUTCMonth() + 1;
        const currentDay = dateAfter15Days.getUTCDate();
        const currentYear = dateAfter15Days.getUTCFullYear(); 

        const where = {}
        where['status'] = 'Published';
        where['$expr'] =  {
             $and: [
                { $eq: [{ $month: '$deadline' }, currentMonth] },
                { $eq: [{ $dayOfMonth: '$deadline' }, currentDay] },
                { $eq: [{ $year: '$deadline' }, currentYear] }
              ],
        }
  
        const jobRecords = await JobsCL.find( where, {'project_id':1,'project_name':1,'designation':1,'job_title':1,'job_type':1,'deadline':1,'total_vacancy':1,'hired':1,'available_vacancy':1,'ctc_amount':1});
        
        /* extract projects name and employee */
        const extractProjectsIdsList = jobRecords.map( (item) => dbObjectId( item.project_id ));
        const getProjectsEmployeeList = await ProjectCl.find({_id: {$in: extractProjectsIdsList } }, { manager_list:1, in_charge_list:1 });
        
        const extractEmployeeIdsList = getProjectsEmployeeList.flatMap((item) => {
            const managerIds = item.manager_list?.map((mgr) => dbObjectId(mgr.emp_id)) || [];
            const inChargeIds = item.in_charge_list?.map((inCharge) => dbObjectId(inCharge.emp_id)) || [];
            return [...managerIds, ...inChargeIds];
        });
        
        const employeeList = await EmployeeCI.find({_id: {$in: extractEmployeeIdsList } },{name:1,email:1,project_id:1});
      
        /*Shoot Email To the Related Employee*/
        for( const jobRecord of jobRecords ){
            const getAllEmployeeList = employeeList.filter( (item)=> item.project_id.toString() === jobRecord.project_id.toString() );
            if( getAllEmployeeList ){
                for( const employee of getAllEmployeeList ){
                    if( employee.email !=='' ){
                        jobDeadlineAlertMail( jobRecord.project_name, jobRecord.job_title, jobRecord.total_vacancy, jobRecord.hired, jobRecord.available_vacancy, jobRecord.deadline, employee.name, employee.email  );
                    }
                //console.log( employee );
                //console.log( jobRecord );
                }
            }
        }


        //console.log( jobRecords); 
        //console.log( records); 
        
    } catch (error) {
        console.error('Error fetching records:', error);
    }
}

/********* fetch All Employee List For Birthday Wish **********/
controller.getBirthDayWishEmployeeList = async ()=>{
    try {  
        
        const today = new Date();
        const currentMonth = today.getUTCMonth() + 1; 
        const currentDay = today.getUTCDate();

        const where = {}
        where['profile_status'] = 'Active';
        where['$expr'] =  {
              $and: [
                { $eq: [{ $month: '$date_of_birth' }, currentMonth] },
                { $eq: [{ $dayOfMonth: '$date_of_birth' }, currentDay] },
              ],
            } 
       
        const records = await EmployeeCI.find( where,{'email':1,'name':1} );

        if( records.length > 0 ){
            for( const record of records){ 
                if( typeof record.email !== 'undefined' && record.email !=='' ){
                    birthdayWishMail( record.email, record.name ); 
                }
            }
        } 
    } catch (error) {
        console.error('Error fetching records:', error);
    }
}

/********* fetch All Employee List to wish the Work Anniversary Wish **********/
controller.getWorkAnniversaryWishEmployeeList = async ()=>{
    try {  
        
        const today = new Date();
        const currentMonth = today.getUTCMonth() + 1;
        const currentDay = today.getUTCDate();
        const currentYear = today.getUTCFullYear(); 

        const where = {}
        where['profile_status'] = 'Active';
        where['$expr'] =  {
             $and: [
                { $eq: [{ $month: '$joining_date' }, currentMonth] },
                { $eq: [{ $dayOfMonth: '$joining_date' }, currentDay] },
                { $lt: [{ $year: '$joining_date' }, currentYear] }
              ],
            } 
       
        const records = await EmployeeCI.find( where,{'email':1,'name':1,'joining_date':1 } );
        
        if( records.length > 0 ){
            for( const record of records){
                if( typeof record.email !== 'undefined' && record.email !=='' ){
                    workAnniversaryMail( record.email, record.name, record.joining_date ); 
                }
            }
        } 
    } catch (error) {
        console.error('Error fetching records:', error);
    }
}



/********* fetch All records those interview has past away  working on 20-November-2025 **********/
controller.getPendingReviewCandidatesList = async ()=>{
    try { 

        // Query to find records with a deadline after 15 days from today
        const today = new Date();
        today.setHours(0, 0, 0, 0); 
        
        const dateBefore5Days = new Date(today);
        dateBefore5Days.setDate(today.getDate() -10 ); 
    
        // const where = {} 
        // where._id = dbObjectId( '690470eefbf4f08ef357e1b6' );
        // where['form_status'] = 'Interview'; 
        // where['applied_jobs.form_status'] = 'Interview';
        // where['applied_jobs.interview_status'] = 'Pending';
        // where['applied_jobs.interviewer'] = { $elemMatch: { feedback_status: { $in: ['Pending'] }, status: { $in: ['Accept','Pending'] } } };  
        // where["applied_jobs.interview_date"] = { 
        //     $gt: dateBefore5Days,
        //     $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
        // };

        const where = {
                _id: dbObjectId("6870dc41c0b14ea3c700e391"),
                form_status: "Interview", 
                applied_jobs: {
                    $elemMatch: {
                    form_status: "Interview",
                    interview_status: "Pending",
                    interview_date: {
                        $gt: dateBefore5Days,
                        $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
                    },
                    interviewer: {
                        $elemMatch: {
                        feedback_status: { $in: ["Pending"] },
                        status: { $in: ["Accept", "Pending"] }
                        }
                    }
                    }
                }
        };
  

        const candidatesList = await JobAppliedCandidateCl.find( where, {'_id':1,'name':1,'applied_jobs._id':1,'applied_jobs.form_status':1,'applied_jobs.job_designation':1,'applied_jobs.interview_date':1,'applied_jobs.interviewer.employee_id':1,'applied_jobs.interviewer.feedback_status':1,'applied_jobs.interviewer._id':1});

        /* extract projects name and employee */ 
        const extractEmployeeIdsList = [
            ...new Set(
                candidatesList
                .flatMap(candidate =>
                    (candidate.applied_jobs || []).flatMap(job =>
                    (job.interviewer || []).map(int => int.employee_id)
                    )
                )
            )
        ]; 

        const employeeList = await EmployeeCI.find({_id: {$in: extractEmployeeIdsList } },{name:1,email:1,project_id:1});
        

        /*Shoot Email To the Related Employee*/
        candidatesList.forEach( (candidates ) => { 
         
            if( candidates.applied_jobs && candidates?.applied_jobs.length > 0 ){

                candidates?.applied_jobs.forEach( (jobRecord ) => {   
                 
                    if( jobRecord?.interviewer?.length > 0 ) {
                    
                        const interviewerList = jobRecord?.interviewer;
                        const candidateName = candidates?.name;
                        const candidateDocId = candidates?._id.toString();
                        const applied_job_doc_id = jobRecord?._id.toString(); 
                        const interview_date = jobRecord?.interview_date;
                        const job_designation = jobRecord?.job_designation;

                        for( const interviewer of interviewerList ){ 
                            if( interviewer.feedback_status === 'Pending' ){ 
                                    const getEmployeeData = employeeList.find( (item)=> item._id.toString() === interviewer.employee_id.toString() );
                                     
                                    if( getEmployeeData && getEmployeeData?.email !== '' && interviewer?.employee_id?.toString() !== '' ){ 
                                        const newEmpId = interviewer?.employee_id?.toString();
                                        const newEmpEmail = getEmployeeData?.email;
                                        const newEmpName= getEmployeeData?.name;
                                        //RememberRatingMailToEmployee( getEmployeeData?.email, jobRecord.name, interview_date, getEmployeeData?.name );
                                        RememberRatingMailToEmployeeViaLink( newEmpEmail, newEmpName, interviewer?._id?.toString(), candidateName, candidateDocId, interview_date, applied_job_doc_id  );
                                    }
                            }
                        }
                    } 
                });
            }
        });


        //console.log( JSON.stringify( jobRecords ) ); 
        
    } catch (error) {
        console.error('Error fetching records:', error);
    }
}


controller.sendRatingMailForCandidate = async (req, res )=>{

    if( !req.body.hasOwnProperty('candidate_id') || req.body.candidate_id === '' ){
         return res.status(403).json({status: false, message:'Candidate Document ID is Required'});
    }
    if( !req.body.hasOwnProperty('interview_id') || req.body.interview_id === '' ){
         return res.status(403).json({status: false, message:'Interviewer Document ID is Required'});
    }
    if( !req.body.hasOwnProperty('applied_job_id') || req.body.applied_job_id === '' ){
         return res.status(403).json({status: false, message:'Applied Job Document ID is Required'});
    }

    const { candidate_id, interview_id, applied_job_id } = req.body;

    try {  

        const where = {
                _id: dbObjectId( candidate_id ), 
                applied_jobs: {
                    $elemMatch: {
                    form_status: { $in: ["Interview","Offer"] }, 
                    interviewer: {
                        $elemMatch: {
                        feedback_status: { $in: ["Pending"] },
                        status: { $in: ["Accept", "Pending"] },
                        _id: { $in: dbObjectId( interview_id ) }
                        }
                    }
                    }
                }
        };
  
        const candidatesList = await JobAppliedCandidateCl.find( where, {'_id':1,'name':1,'applied_jobs._id':1,'applied_jobs.form_status':1,'applied_jobs.job_designation':1,'applied_jobs.interview_date':1,'applied_jobs.interviewer.employee_id':1,'applied_jobs.interviewer.feedback_status':1,'applied_jobs.interviewer._id':1});
         
        if( candidatesList.length === 0 ){
            return res.status(403).json({status: false, message:'No Candidate Data Found'});
        }
 
        /*Shoot Email To the Related Employee*/
        candidatesList.forEach( (candidates ) => { 
         
            if( candidates.applied_jobs && candidates?.applied_jobs.length > 0 ){

                candidates?.applied_jobs.forEach( (jobRecord ) => {   
                 
                    const applied_job_doc_id = jobRecord?._id.toString(); 
                    
                    if( jobRecord?.interviewer?.length > 0 && applied_job_id && applied_job_doc_id === applied_job_id) {
                    
                        const interviewerList = jobRecord?.interviewer;
                        const candidateName = candidates?.name;
                        const candidateDocId = candidates?._id.toString(); 
                        const interview_date = jobRecord?.interview_date;
                        const job_designation = jobRecord?.job_designation;

                        for( const interviewer of interviewerList ){  
                            if( interviewer.feedback_status === 'Pending' && interviewer?._id?.toString() === interview_id?.toString() ){ 
                              
                                EmployeeCI.findOne({ _id: interviewer?.employee_id },{name:1,email:1,project_id:1})
                                .then(( getEmployeeData )=>{  
                                    if( getEmployeeData ){ 

                                        if( getEmployeeData && getEmployeeData?.email !== '' && interviewer?.employee_id?.toString() !== '' ){ 
                                            const newEmpId = interviewer?.employee_id?.toString();
                                            const newEmpEmail = getEmployeeData?.email;
                                            const newEmpName= getEmployeeData?.name;
                                            //RememberRatingMailToEmployee( getEmployeeData?.email, jobRecord.name, interview_date, getEmployeeData?.name );
                                            RememberRatingMailToEmployeeViaLink( newEmpEmail, newEmpName, interviewer?._id?.toString(), candidateName, candidateDocId, interview_date, applied_job_doc_id , job_designation );
                                        }
                                    }
                                })
                            }
                        }
                    } 
                });
            }
        });


        return res.status(200).json({status: true, message:'Reminder Mail Sent Successfully'});
        
    } catch (error) { console.log( error );
        return res.status(403).json({status: false, message: error || 'Some Error Occurred'});
    }
}

module.exports = controller;