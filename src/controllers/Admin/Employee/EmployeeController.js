const EmployeeCI = require('../../../models/EmployeeCI.js');
const ProjectCl = require('../../../models/ProjectCl.js');
const LocationCl = require('../../../models/LocationCl.js');
const GradeCI = require('../../../models/GradeCI.js');
const DepartmentCI = require('../../../models/DepartmentCI.js');
const DesignationCl = require('../../../models/DesignationCl.js');
const LeaveTypeCI = require('../../../models/LeaveTypeCI.js');
const JobCl = require('../../../models/JobsCI.js');
const JobAppliedCandidateCl = require('../../../models/JobAppliedCandidateCl.js');
const { dbObjectId, dbObjectIdValidate } = require('../../../models/dbObject.js');


const dotenv = require("dotenv");
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
dotenv.config({path:'../src/config.env'});
const { generateJwtToken } = require('../../../middlewares/verifyToken.js');
const { OTP, dbDateFormat, isValidEmail, numbersOnly,copyFilesAndGetDetails, removeEmployeeFile, employeeResponseData, calculateTime , lettersOnly,removeCommasFromNumberString, convertExcelCustomDate, updateDatesInArray, convertDMYToYmdDateFormat, commonOnly , replaceNullUndefined, convertToDbDate, removeFile ,convertBitsIntoKbMb, getImageType, convertAnyDateFormat } = require('../../../middlewares/myFilters.js');
const { otpSmsTemplate } = require('../../../middlewares/smsTemplates.js');
const { otpEmailTemplate } = require('../../../middlewares/emailTemplate.js');
const { validationResult } = require('express-validator');
const { readExcelFile, readCSVFileData } = require('../../../middlewares/ImportExport.js'); 
const DepartmentCl = require('../../../models/DepartmentCI.js');

const uploadsDir =  './uploads';

const controller = {};


/*update designation count in project*/
const updateDesignationCountInProject = ( project_id, findDesignationData, employee_code = '', hired = 0, totalVacancy = 0 ) => { 
    const no_of_positions = findDesignationData.no_of_positions; 
    const hiredInBudget = findDesignationData.hired;

    let arrayFilters = { 'arrayFilters': [{'one.designation': findDesignationData.designation }] }

    let where = {}
    where['_id'] = dbObjectId( project_id );
    where['budget_estimate_list.designation'] = findDesignationData.designation;
    var saveData = {}
    saveData['hired'] =  hired + 1;
    saveData['hired'] =  totalVacancy - (hired + 1);
    saveData['budget_estimate_list.$[one].hired'] =  hiredInBudget + 1;
    saveData['budget_estimate_list.$[one].hired'] =  hiredInBudget + 1;
    saveData['budget_estimate_list.$[one].available_vacancy'] =  no_of_positions - (hiredInBudget + 1); 
        
    ProjectCl.updateOne( where , { $set : saveData } , arrayFilters )
    .then((up)=>{
        //console.log( up );
    })
}

const updateCandidateJobRecords = ( job_id, project_id )=>{  

    const where = {}
    where['applied_jobs.job_id'] = dbObjectId(job_id);
    if (project_id !== '') {
      where['applied_jobs.project_id'] = dbObjectId(project_id);
    }
    
    // Find the related candidates list
    JobAppliedCandidateCl.aggregate([
      {
        $match: where
      },
      {
        $unwind: "$applied_jobs" 
      },
      {
        $match: where 
      },
      {
        $group: {
          _id: null, 
          appliedCount: {
            $sum: {
              $cond: [{ $eq: ["$applied_jobs.form_status", "Applied"] }, 1, 0]
            }
          },
          shortlistCount: {
            $sum: {
              $cond: [{ $eq: ["$applied_jobs.form_status", "Shortlisted"] }, 1, 0]
            }
          },
          interviewedCount: {
            $sum: {
              $cond: [{ $eq: ["$applied_jobs.form_status", "Interview"] }, 1, 0]
            }
          },
          offeredCount: {
            $sum: {
              $cond: [{ $eq: ["$applied_jobs.form_status", "Offer"] }, 1, 0]
            }
          },
          hiredCount: {
            $sum: {
              $cond: [{ $eq: ["$applied_jobs.form_status", "Hired"] }, 1, 0]
            }
          },
          rejectedCount: {
            $sum: {
              $cond: [{ $eq: ["$applied_jobs.form_status", "Rejected"] }, 1, 0]
            }
          }
        }
      },
      {
        $project: {
          _id: 0, // Exclude _id from the final output
          applied: "$appliedCount",
          shortlist: "$shortlistCount",
          interviewed: "$interviewedCount",
          offered: "$offeredCount",
          hired: "$hiredCount",
          rejected: "$rejectedCount",
        }
      }
    ])
    .then((resultData)=>{ 


        JobCl.findOne({ _id: dbObjectId(job_id) }, {'total_vacancy': 1} )
        .then((d)=>{ 

                const total_vacancy = typeof d.total_vacancy !== 'undefined' && d.total_vacancy ? d.total_vacancy : 0;
        
                const saveData = [];
                const hireAvailableData = {}
                hireAvailableData.total_vacancy = total_vacancy;

                if( resultData.length > 0 ){ 
                    const getCountListData = resultData[0];
                    const total = Object.values(getCountListData).reduce((sum, value) => sum + value, 0); 

                    saveData.push({'level':'Total','value': parseInt( total ) });
                    saveData.push({'level':'Applied','value': parseInt( getCountListData.applied ) });
                    saveData.push({'level':'Shortlisted','value': parseInt( getCountListData.shortlist ) });
                    saveData.push({'level':'Interview','value': parseInt( getCountListData.interviewed ) });
                    saveData.push({'level':'Offer','value': parseInt( getCountListData.offered ) });
                    saveData.push({'level':'Hired','value': parseInt( getCountListData.hired ) });
                    saveData.push({'level':'Rejected','value': parseInt( getCountListData.rejected ) });

                    if( total_vacancy > 0 ){
                        hireAvailableData.hired = parseInt( getCountListData.hired );
                        hireAvailableData.available_vacancy = parseInt( total_vacancy ) - parseInt( getCountListData.hired ); 
                    }
                }else{
                    saveData.push({'level':'Total','value': parseInt( 0 ) });
                    saveData.push({'level':'Applied','value': parseInt( 0 ) });
                    saveData.push({'level':'Shortlisted','value': parseInt( 0 ) });
                    saveData.push({'level':'Interview','value': parseInt( 0 ) });
                    saveData.push({'level':'Offer','value': parseInt( 0 ) });
                    saveData.push({'level':'Hired','value': parseInt( 0 ) });
                    saveData.push({'level':'Rejected','value': parseInt( 0 ) });
                }

                    JobCl.updateOne(
                        { _id: dbObjectId(job_id) },
                        { 
                            $set: {
                                'form_candidates': [], 
                                'form_candidates': saveData ,
                                ...hireAvailableData
                            }
                        }
                    )
                    .then((d)=>{
                        //console.log( d ); 
                    }).catch((e)=>{
                        //console.log( e );
                    })
        });
    }) ;   
}


/****Mark Candidate as Hired***/
const markCandidateAsHiredStatus =  async(candidate_id, job_id) => { 
    try { 

        let where = {
            '_id': dbObjectId(candidate_id)
        };

        const getJobCandidateData = await JobAppliedCandidateCl.findOne( {'_id': dbObjectId(candidate_id)}, {'applied_jobs': 1})
         
        const findAppliedJobDocId = getJobCandidateData.applied_jobs.find((item)=>item.job_id.toString() ===  job_id.toString() );

        let arrayFilters = { 'arrayFilters': [{ 'one._id': findAppliedJobDocId._id }] };
        
        const saveData = {} ;
        saveData['applied_jobs.$[one].mark_as_hired'] = 'Yes';
        saveData['applied_jobs.$[one].form_status'] = 'Hired';
        await JobAppliedCandidateCl.updateOne(where, { $set: saveData }, arrayFilters);
        updateCandidateJobRecords( job_id.toString(), findAppliedJobDocId.project_id.toString() );
        //console.log("Candidate marked as hired successfully");
    } catch (error) {
       // console.error("Error marking candidate as hired:", error);
    }
};

/********* generate token for **********/
controller.generateToken = ( req, res )=>{
    if( !req.body ){
      return res.status(200).send( {status:false, message:'Bad Request'} );  
    } 
   let token = generateJwtToken( req.body );
   res.status(200).send( {status:true, data: token, message:'success'} );
}

/********* Add New Employee User,  Note: this is direct added for the testing purpose **********/
controller.addEmployeeUser = ( req, res )=>{

    const errors = validationResult(req);

    if (!errors.isEmpty()) { 
        return res.status(403).json({ status: false, message: errors.array()[0].msg });
    }

    saveData = {};
    saveData = req.body;
    saveData.profile_status = 'Active';
    saveData.add_date = dbDateFormat();
    saveData.updated_on =  dbDateFormat();
    saveData.otp_sent_on =  dbDateFormat();
    saveData.otp = OTP();

    EmployeeCI.findOne({email:saveData.email})
    .then( (ckData)=>{
         if( ckData ){
            return res.status(409).send( {'status':false, 'message': 'Email ID Already Registered'} );
         }
    
        const userData = new EmployeeCI( saveData );
        userData.save()
        .then( (data)=>{
            return res.status(200).send( {'status':true, 'message': 'Profile Added Successfully'} );
        })
        .catch( (error)=>{ 
            return res.status(403).send( {'status':false, 'message': error || 'Invalid Login Details'} ); 
        });
    }).catch( (error)=>{ 
        return res.status(403).send( {'status':false, 'message': error || 'Invalid Login Details'} ); 
    });
}


var importCandidateOnBoardingDocuments = async ( candidate_id, employee_code )=>{ 
    
    try{
        const employeeData = await EmployeeCI.findOne( {'employee_code': employee_code } ); 
        if( !employeeData ){
            return false;
        }

        const candidateData = await JobAppliedCandidateCl.findOne( {'_id': dbObjectId( candidate_id ) },{ onboarding_docs : 1, docs: 1 } );
    
        if( !candidateData ){
            return false;
        }

        /*prepare payload for save onboarding data*/
        const joiningKitDocs = [];
        const offerLetterDocs = [];
        const appointmentLetterDocs = [];
        const otherDocs = [];
 

        if( candidateData && candidateData?.onboarding_docs?.length > 0 ){
            var verifiedByDataDefault;
            candidateData?.onboarding_docs?.forEach( (mItem)=>{
                if( mItem?.uploaded_file_data?.file_name !== '' ){
                    const matchItem = mItem?.activity_log?.find( (elm)=> elm.action === 'verified' );
                    if( typeof matchItem !== 'undefined' ){
                        verifiedByDataDefault = matchItem;
                    }               
                }
            }); 

            candidateData?.onboarding_docs?.forEach( (item)=>{ 
                if( item?.uploaded_file_data?.file_name !== '' ){
                    
                    var addByData = item?.uploaded_file_data?.added_by_data; 
                    var verifiedByData = item?.activity_log?.find( (elm)=> elm.action === 'verified' );
 
                    let filePath = `${'./uploads/'}${ item?.uploaded_file_data?.file_name }`; 
                    let getCopyFile = copyFilesAndGetDetails( [filePath], './employee_uploads');
                    
                    if( getCopyFile && getCopyFile.length === 1 && getCopyFile[0]?.message ==='copied' ){ 
                        
                        const push = {}
                        push.document_name = item?.doc_name || '';
                        push.mime_type = getCopyFile[0]?.file_extension || '';
                        push.file_size = getCopyFile[0]?.file_size_bytes || '';
                        push.file_name = getCopyFile[0]?.file_name || '';
                        push.add_date = dbDateFormat();
                        push.updated_on = dbDateFormat();
                        if( addByData ){
                            push.added_by = addByData;
                        }

                        if( typeof verifiedByData !== 'undefined' ){
                            push.verify_by = {
                                name: verifiedByData?.name || '',
                                email: verifiedByData?.email || '',
                                mobile: verifiedByData?.mobile || '',
                                designation: verifiedByData?.designation || 'na',
                            }
                        }else if( typeof verifiedByDataDefault !== 'undefined' ){
                            push.verify_by = {
                                name: verifiedByDataDefault?.name || '',
                                email: verifiedByDataDefault?.email || '',
                                mobile: verifiedByDataDefault?.mobile || '',
                                designation: verifiedByDataDefault?.designation || 'na',
                            }
                        }

                        if( item?.doc_category === 'Joining Kit' ){
                            joiningKitDocs.push( push );
                        }else if( item?.doc_category === 'Appointment Letter' ){
                            appointmentLetterDocs.push( push );
                        }else if( item?.doc_category === 'Offer Letter' ){
                            offerLetterDocs.push( push );
                        }
                    }
                }
            });

        }

        if( candidateData && candidateData?.docs?.length > 0 ){

            candidateData?.docs?.forEach( (item)=>{ 
                if( item?.doc_category === 'KYC' && item?.file_name !== '' ){  
                    let filePath = `${'./uploads/'}${ item?.file_name }`; 
                    let getCopyFile = copyFilesAndGetDetails( [filePath], './employee_uploads');
                
                    if( getCopyFile && getCopyFile.length === 1 && getCopyFile[0]?.message ==='copied' ){ 
                        const push = {}
                        push.doc_category = item?.doc_category || '';
                        push.sub_doc_category = item?.sub_doc_category || '';
                        push.doc_name = item?.doc_name || '';
                        push.mime_type = getCopyFile[0]?.file_extension || '';
                        push.file_size = getCopyFile[0]?.file_size_bytes || '';
                        push.file_name = getCopyFile[0]?.file_name || '';
                        push.add_date = dbDateFormat();
                        push.updated_on = dbDateFormat();                     
                        otherDocs.push( push );
                    }
                }
            });

        }
    
        const saveData = {}
        if( otherDocs.length > 0 ){
            saveData.docs = otherDocs;
        }
        if( joiningKitDocs.length > 0 ){
            saveData.joining_kit_docs = joiningKitDocs;
        }
        if( offerLetterDocs.length > 0 ){
            saveData.offer_letter_docs = offerLetterDocs;
        }
        if( appointmentLetterDocs.length > 0 ){
            saveData.appointment_letter_docs = appointmentLetterDocs;
        }
    
        if( saveData && employeeData ){
            await EmployeeCI.updateOne( { _id: employeeData._id }, {$set: saveData});
        } 

        return true ;
    }catch( error ){ console.log( error );
        return false;
    }
}

/********* onBoard Employee User / Add General info **********/
controller.addEmployeeGeneralInfo = ( req, res )=>{

    const errors = validationResult(req);

    if (!errors.isEmpty()) { 
        return res.status(403).json({ status: false, message: errors.array()[0].msg });
    }

    const { employee_code , designation, project_id, candidate_id } = req.body;

    
    if( !req.body.hasOwnProperty('designation') ){
        return res.status(403).send( {'status':false, 'message': 'Designation is blank' } );
    }
    else if( req.body.designation === '' ){
        return res.status(403).send( {'status':false, 'message': 'Designation is blank' } );
    }

    saveData = {};
    saveData = req.body;
    saveData.profile_status = 'Active';
    saveData.designation = designation;
    saveData.add_date = dbDateFormat();
    saveData.updated_on =  dbDateFormat();
    saveData.otp_sent_on =  dbDateFormat();
    saveData.otp = OTP();
    if( typeof req.body.valid_till !== 'undefined' && req.body.valid_till !== '' ){
        saveData.valid_till = convertToDbDate( req.body.valid_till);
    }

    if( typeof req.body.date_of_birth !== 'undefined' && req.body.date_of_birth !== '' ){
        saveData.date_of_birth = convertToDbDate( req.body.date_of_birth);
    }

    if( typeof req.body.designation_id !== 'undefined' && req.body.designation_id !== '' ){
        saveData.designation_id = dbObjectId( req.body.designation_id);
    }

    if( typeof req.body.batch_id !== 'undefined' && req.body.batch_id !== '' ){
        saveData.batch_id = parseInt( req.body.batch_id);
    }

    if( typeof req.body.candidate_id !== 'undefined' && req.body.candidate_id !== '' ){
        saveData.candidate_id = dbObjectId( req.body.candidate_id);
    }
    

  

    ProjectCl.findOne( { _id: dbObjectId(project_id) }, { budget_estimate_list : 1, hired : 1, total_vacancy : 1} )
    .then( (dt)=>{
       
        if( dt ){

            if( typeof req.body.designation_id !== 'undefined' && req.body.designation_id !== '' ){ 
               var findDesignationData = dt.budget_estimate_list.find( (item)=> item.designation_id.toString() === req.body.designation_id.toString() );  
            }else{
               var findDesignationData = dt.budget_estimate_list.find( (item)=> item.designation === designation );  
            }
            
            saveData.ctc_pa = findDesignationData ? findDesignationData.ctc : 0;

            EmployeeCI.findOne( { employee_code : employee_code, profile_status : 'Active'}, { '_id': 1 } )
            .then( (ckData)=>{

                if( ckData ){ 
                        
                        EmployeeCI.updateOne( { _id: dbObjectId( ckData._id ) }, {$set: saveData} )
                        .then( (data)=>{ 

                            if( data.modifiedCount === 1 ){
                                if( typeof req.body.candidate_id !== 'undefined' && req.body.candidate_id !== '' && typeof req.body.job_id !== 'undefined' && req.body.job_id !== '' ){
                                markCandidateAsHiredStatus( req.body.candidate_id, req.body.job_id );
                                }
                                return res.status(200).send( {'status':true, 'data': dbObjectId( ckData._id ), 'message': 'Data Updated Successfully'} );
                            }else if( data.modifiedCount === 0 ){
                                return res.status(304).send( {'status':false, 'message': 'No Action Performed'} );
                            }else{
                                return res.status(403).send( {'status':false, 'message': process.env.DEFAULT_ERROR_MESSAGE } );
                            }
                        }).catch( (error)=>{
                            return res.status(403).send( {'status':false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE } ); 
                        });
                    
                }else{ 

                    //validate vacancy
                    // if( findDesignationData.available_vacancy === 0 ){
                    //     return res.status(403).send( {'status':false, 'message': 'Sorry!, No Available Vacancy For This Designation' } ); 
                    //}

                    const userData = new EmployeeCI( saveData );
                    userData.save()
                    .then( (data)=>{
                        EmployeeCI.findOne( { employee_code : employee_code, profile_status : 'Active'}, { '_id': 1 } )
                        .then( (ckData)=>{
                            if( typeof req.body.candidate_id !== 'undefined' && req.body.candidate_id !== '' && typeof req.body.job_id !== 'undefined' && req.body.job_id !== '' ){
                                markCandidateAsHiredStatus( req.body.candidate_id, req.body.job_id );
                            }
                            /********** update designation count in the project **********/
                            updateDesignationCountInProject( project_id, findDesignationData, employee_code, dt.hired, dt.total_vacancy  );
                            /*update document records from candidate panel*/
                            importCandidateOnBoardingDocuments( candidate_id, employee_code );
                            return res.status(200).send( {'status':true, 'data': dbObjectId( ckData._id ), 'message': 'Profile Added Successfully'} );
                        })
                        .catch( (error)=>{
                            console.log( error );
                            return res.status(403).send( {'status':false, 'message': error || 'Invalid Login Details'} ); 
                        });
                    })
                    .catch( (error)=>{  
                        return res.status(403).send( {'status':false, 'message': error || 'Invalid Login Details'} ); 
                    });
                }
            }).catch( (error)=>{    
                return res.status(403).send( {'status':false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE } ); 
            });
        }

    })
    .catch( (error)=>{  
        return res.status(403).send( {'status':false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE } ); 
    })

}

/********* onBoard Employee User / Add Experience info **********/
controller.addEmployeeExperienceInfo = ( req, res )=>{

    const errors = validationResult(req);

    if (!errors.isEmpty()) { 
        return res.status(403).json({ status: false, message: errors.array()[0].msg });
    }

    const { _id , experience } = req.body;

    saveData = {}; 
    saveData.updated_on =  dbDateFormat();

    if( typeof experience !== 'undefined' && experience.length > 0  ){ 
        saveData.experience_info =  req.body.experience.map((item)=>{
            const pushData = {}
            pushData.employer_name =  item.employer_name;
            pushData.designation =  item.designation;
            if( typeof item.from_date !== 'undefined' && item.from_date !== '' ){
                pushData.from_date =  convertToDbDate( item.from_date );
            }
            if( typeof item.to_date !== 'undefined' && item.to_date !== '' ){
                pushData.to_date =  convertToDbDate( item.to_date );
            }      
            pushData.add_date =  dbDateFormat(); 
            return pushData;
        });
    }
    
    EmployeeCI.updateOne( { _id:  dbObjectId( _id ) }, {$set: {'experience_info':[],...saveData}} )
    .then( (data)=>{  
     
        if( data.modifiedCount === 1 ){
            return res.status(200).send( {'status':true, data: _id , 'message': 'Data Updated Successfully'} );
        }else if( data.modifiedCount === 0 ){
            return res.status(403).send( {'status':false, 'message': 'No Action Performed'} );
        }else{
            return res.status(403).send( {'status':false, 'message': process.env.DEFAULT_ERROR_MESSAGE } );
        }
    }).catch( (error)=>{ 
        return res.status(403).send( {'status':false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE } ); 
    }); 
}

/********* onBoard Employee User / Add Education info **********/
controller.addEmployeeEducationInfo = ( req, res )=>{

    const errors = validationResult(req);

    if (!errors.isEmpty()) { 
        return res.status(403).json({ status: false, message: errors.array()[0].msg });
    }

    const { _id , education } = req.body;

    saveData = {}; 
    saveData.updated_on =  dbDateFormat();

    if( typeof education !== 'undefined' && education.length > 0  ){ 
        saveData.education_data =  req.body.education.map((item)=>{
            const pushData = {}
            pushData.degree_certificates =  item.degree;
            pushData.passing_year =  item.year;
            pushData.marks =  item.marks;
            pushData.add_date =  dbDateFormat(); 
            return pushData;
        });
    }
    
    EmployeeCI.updateOne( { _id:  dbObjectId( _id ) }, {$set: {'education_data':[],...saveData}} )
    .then( (data)=>{  
     
        if( data.modifiedCount === 1 ){
            return res.status(200).send( {'status':true, data: _id , 'message': 'Data Updated Successfully'} );
        }else if( data.modifiedCount === 0 ){
            return res.status(403).send( {'status':false, 'message': 'No Action Performed'} );
        }else{
            return res.status(403).send( {'status':false, 'message': process.env.DEFAULT_ERROR_MESSAGE } );
        }
    }).catch( (error)=>{ 
        return res.status(403).send( {'status':false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE } ); 
    });
}

/********* onBoard Employee User / Classification info **********/
controller.addEmployeeClassificationInfo = ( req, res )=>{

    const errors = validationResult(req);

    if (!errors.isEmpty()) { 
        return res.status(403).json({ status: false, message: errors.array()[0].msg });
    }

    const { _id } = req.body;

    var saveData = {}; 
    saveData = req.body;
    saveData.updated_on = dbDateFormat();
    delete( saveData._id ) ;

    LeaveTypeCI.find( {status:'Active'}, { _id:0, name:1, sort_name:1, allowed_for_five_days:1, allowed_for_six_days:1, leave_type:1 } )
    .then( ( LeaveData )=>{ 
         
        EmployeeCI.findOne( { _id:  dbObjectId( _id ) }, { leave_policy : 1 } )
        .then( (empData)=>{ 

            const locationWhere = {}
            locationWhere.name = { $in: req.body.branch }
            
            LocationCl.find( locationWhere, { _id:1,state_id:1,name:1, state:1, latitude:1, longitude:1 } )
            .then( ( lData )=>{
                
                    saveData.offices = lData.map((item)=>{
                        const push = {}
                        push.city_id = item._id;
                        push.city_name = item.name;
                        push.state_id = item.state_id;
                        push.state_name = item.state;
                        push.latitude = item.latitude;
                        push.longitude = item.longitude;
                        return push;
                    }); 

                    
                    /****** Prepare Leave Policy********/
                    if( LeaveData && typeof empData.leave_policy !== 'undefined' && empData.leave_policy.length > 0){
                        saveData.leave_policy = LeaveData.map((item)=>{
                            const matchRecord = empData.leave_policy.find((elm)=>elm.sort_name === item.sort_name );
                            const push = {}
                            push.allowed = parseInt( saveData.attendance ) === 5 ? item.allowed_for_five_days : item.allowed_for_six_days;
                            push.raised = 0;
                            push.type = item.leave_type;
                            push.sort_name = item.sort_name;
                            push.name = item.name;
                            if( typeof matchRecord !== 'undefined' ){
                                push.raised = matchRecord.raised;
                            } 
                            return push;
                        });
                        
                    }else if( LeaveData ){
                        saveData.leave_policy = LeaveData.map((item)=>{ 
                            const push = {}
                            push.allowed = parseInt(saveData.attendance) === 5 ? item.allowed_for_five_days : item.allowed_for_six_days;
                            push.raised = 0;
                            push.type = item.leave_type;
                            push.sort_name = item.sort_name;
                            push.name = item.name;
                            return push;
                        });
                       
                    }
            
                    EmployeeCI.updateOne( { _id:  dbObjectId( _id ) }, {$set: saveData } )
                    .then( (data)=>{ 
                        return res.status(200).send( {'status':true, data: _id , 'message': 'Data Updated Successfully'} ); 
                    }).catch( (error)=>{ 
                        return res.status(403).send( {'status':false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE } ); 
                    });
            }).catch( (error)=>{ 
                return res.status(403).send( {'status':false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE } ); 
            });
        }).catch( (error)=>{ 
            return res.status(403).send( {'status':false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE } ); 
        });
    }).catch( (error)=>{ 
        return res.status(403).send( {'status':false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE } ); 
    });
}

/********* onBoard Employee User / PF Bank Details info **********/
controller.addEmployeePfInfo = ( req, res )=>{

    const errors = validationResult(req);

    if (!errors.isEmpty()) { 
        return res.status(403).json({ status: false, message: errors.array()[0].msg });
    }

    const { _id } = req.body;

    saveData = {}; 
    saveData = req.body;
    saveData.updated_on =  dbDateFormat();
    
    EmployeeCI.updateOne( { _id:  dbObjectId( _id ) }, {$set: saveData } )
    .then( (data)=>{
     
        if( data.modifiedCount === 1 ){
            return res.status(200).send( {'status':true, data: _id , 'message': 'Data Updated Successfully'} );
        }else if( data.modifiedCount === 0 ){
            return res.status(403).send( {'status':false, 'message': 'No Action Performed'} );
        }else{
            return res.status(403).send( {'status':false, 'message': process.env.DEFAULT_ERROR_MESSAGE } );
        }
    }).catch( (error)=>{ 
        return res.status(403).send( {'status':false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE } ); 
    });
}

/********* onBoard Employee User / Address  info **********/
controller.addEmployeeAddressInfo = ( req, res )=>{

    const errors = validationResult(req);

    if (!errors.isEmpty()) { 
        return res.status(403).json({ status: false, message: errors.array()[0].msg });
    }

    const { _id } = req.body;

    saveData = {}; 
    saveData = req.body;
    saveData.updated_on =  dbDateFormat();
    
    EmployeeCI.updateOne( { _id:  dbObjectId( _id ) }, {$set: saveData } )
    .then( (data)=>{
     
        if( data.modifiedCount === 1 ){
            return res.status(200).send( {'status':true, data: _id , 'message': 'Data Updated Successfully'} );
        }else if( data.modifiedCount === 0 ){
            return res.status(403).send( {'status':false, 'message': 'No Action Performed'} );
        }else{
            return res.status(403).send( {'status':false, 'message': process.env.DEFAULT_ERROR_MESSAGE } );
        }
    }).catch( (error)=>{ 
        return res.status(403).send( {'status':false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE } ); 
    });
}

/********* onBoard Employee User / Salary info **********/
controller.addEmployeeSalaryInfo = ( req, res )=>{
   
    const errors = validationResult(req);

    if (!errors.isEmpty()) { 
        return res.status(403).json({ status: false, message: errors.array()[0].msg });
    }

    const { _id,employee_type,childrenAI,reimbursements, totalCTOMonthly,totalCTOAnnual,gratuityEnabled,tds,takeHomeAnnual,reimbursementsAnnual,reimbursementsMonthly,ctcAnnual,takeHomeMonthly,grossAnnual,ctcMonthly,pfEmployer,grossMonthly,pfEmployee, professionalTax,employerBenefitTitle, employerBenefitAmount, employerBenefitType, basicPercent, gratuity,monthlySalary, others,carFacilityLimit,childrenHostelAI,transport,uniform, medical,special, basic, hraPercent, hraAmount, hra } = req.body;
      
    var pushData = {}; 
    pushData.basic = parseFloat( basic );
    pushData.hraPercent = parseFloat( hraPercent );
    pushData.hraAmount = parseFloat( hraAmount ); 
    pushData.hra = parseFloat( hra );
    pushData.childrenAI = parseFloat( childrenAI );
    pushData.childrenHostelAI = parseFloat( childrenHostelAI );
    pushData.transport = parseFloat( transport );
    pushData.medical = parseFloat( medical );
    pushData.special = parseFloat( special );
    pushData.uniform = parseFloat( uniform );
    pushData.carFacilityLimit = parseFloat( carFacilityLimit );
    pushData.others = parseFloat( others );
    pushData.gratuity = parseFloat( gratuity );
    pushData.monthlySalary = parseFloat( monthlySalary );
    pushData.basicPercent = parseFloat( basicPercent ); 
    pushData.employerBenefitAmount = parseFloat( employerBenefitAmount ); 
    pushData.professionalTax = parseFloat( professionalTax );
    pushData.tds = parseFloat( tds );
    pushData.pfEmployee = parseFloat( pfEmployee );
    pushData.pfEmployer = parseFloat( pfEmployer );
    pushData.grossMonthly = parseFloat( grossMonthly );
    pushData.grossAnnual = parseFloat( grossAnnual );
    pushData.ctcMonthly = parseFloat( ctcMonthly );
    pushData.ctcAnnual = parseFloat( ctcAnnual );
    pushData.takeHomeMonthly = parseFloat( takeHomeMonthly );
    pushData.takeHomeAnnual = parseFloat( takeHomeAnnual );
    pushData.reimbursementsMonthly = parseFloat( reimbursementsMonthly ); 
    pushData.reimbursementsAnnual = parseFloat( reimbursementsAnnual ); 
    pushData.totalCTOMonthly = parseFloat( totalCTOMonthly ); 
    pushData.totalCTOAnnual = parseFloat( totalCTOAnnual ); 
    pushData.gratuityEnabled = parseFloat( gratuityEnabled );  
 
    var saveData = {}
    saveData.salary_data = pushData; 
    saveData.employerBenefitType = employerBenefitType;
    saveData.basic_salary = parseFloat( basic );
    saveData.total_cto_annual = parseFloat( totalCTOAnnual ); 
    saveData.total_cto_monthly = parseFloat( totalCTOMonthly ); 
    saveData.ctc_monthly = parseFloat( ctcMonthly ); 
    saveData.ctc_annual = parseFloat( ctcAnnual ); 
    saveData.employerBenefitTitle = employerBenefitTitle;
    saveData.reimbursements = reimbursements; 
    saveData.updated_on = dbDateFormat();
    EmployeeCI.updateOne( { _id: dbObjectId( _id ) }, {$set: saveData} )
    .then( (data)=>{
     
        if( data.modifiedCount === 1 ){
            return res.status(200).send( {'status':true, data: _id , 'message': 'Data Updated Successfully'} );
        }else if( data.modifiedCount === 0 ){
            return res.status(403).send( {'status':false, 'message': 'No Action Performed'} );
        }else{
            return res.status(403).send( {'status':false, 'message': process.env.DEFAULT_ERROR_MESSAGE } );
        }
    }).catch( (error)=>{  
        return res.status(403).send( {'status':false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE } ); 
    });
}


controller.editEmployee = ( req , res ) => {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(200).json({ status: false, message: errors.array()[0].msg });
    }   
    
    const { _id, name , mobile_no } = req.body;

    let saveData = {}
    saveData.name = name;
    saveData.mobile_no = mobile_no;
    saveData.updated_on =  dbDateFormat(); 

    EmployeeCI.updateOne( { _id:  dbObjectId( _id ) }, {$set: saveData} )
    .then( (data)=>{ 
        if( data ){
            return res.status(200).send( {'status':true, 'message': 'Profile Updated Successfully'} );
        }else{
            return res.status(403).send( {'status':false, 'message': process.env.DEFAULT_ERROR_MESSAGE } ); 
        }
    }).catch( (error)=>{ 
        return res.status(403).send( {'status':false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE } ); 
    });
}

controller.deleteEmployeeById = ( req , res ) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(406 ).json({ status: false, message: errors.array()[0].msg });
    }   
    
    const { _id } = req.body; 

    // EmployeeCI.deleteOne( { _id:  dbObjectId( _id ) } )
    // .then( (data)=>{  
    //     if( data.deletedCount === 1 ){
    //         return res.status(200).send( {'status':true, 'message': 'Account Deleted Successfully'} );
    //     }else if( data.deletedCount === 0 ){
    //         return res.status(304).send( {'status':false, 'message': 'No Action Performed'} );
    //     }else{
    //         return res.status(403).send( {'status':false, 'message': process.env.DEFAULT_ERROR_MESSAGE } );
    //     }
    // }).catch( (error)=>{ 
    //     return res.status(403).send( {'status':false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE } ); 
    // });
}

controller.getEmployeeById = ( req , res ) => {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(406 ).json({ status: false, message: errors.array()[0].msg });
    }   
    const { _id } = req.body; 

    const fetchKeys = {}
    
    if( req.body.hasOwnProperty('scope_fields') && req.body.scope_fields.length > 0 ){
        req.body.scope_fields.forEach(field => {
            fetchKeys[field] = 1;  
        }); 
    }else{
        fetchKeys.__v = 0;
    }


    EmployeeCI.find( { _id:  dbObjectId( _id ) }, fetchKeys )
    .then( (data)=>{   
        if( data.length > 0 ){ 
            const outPutData = updateDatesInArray( replaceNullUndefined( data ), ['add_date', 'updated_on','salary_effective_date','pf_effective_from','joining_date','probation_complete_date','valid_till']  , 'datetime' );              
            return res.status(200).send( {'status':true, 'data': outPutData[0], 'message': 'API Accessed Successfully'} );
        }else{
            return res.status(204).send( {'status':false, 'message': 'No record matched'} );
        }
    }).catch( (error)=>{  
        return res.status(403).send( {'status':false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE } ); 
    });
}

controller.changeEmployeeStatus = ( req , res ) => {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(406 ).json({ status: false, message: errors.array()[0].msg });
    }   
    
    const { _id } = req.body;

    let saveData = {}
    saveData = req.body;
    saveData.updated_on =  dbDateFormat();

    EmployeeCI.updateOne( { _id:  dbObjectId( _id ) }, {$set: saveData} )
    .then( (data)=>{ 

        if( data.modifiedCount === 1 ){
            return res.status(200).send( {'status':true, 'message': 'Status Updated Successfully'} );
        }else if( data.modifiedCount === 0 ){
            return res.status(200).send( {'status':true, 'message': 'Status Updated Successfully'} );
        }else{
            return res.status(403).send( {'status':false, 'message': process.env.DEFAULT_ERROR_MESSAGE } );
        }
    }).catch( (error)=>{ 
        return res.status(403).send( {'status':false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE } ); 
    });
}

controller.getEmployeeList = ( req , res ) => {  
   
    const { page_no, per_page_record, scope_fields } = req.body;   

    const where = {}  
    const fetchKeys = {}
    
    if( req.body.hasOwnProperty('scope_fields') && scope_fields.length > 0 ){
        scope_fields.forEach(field => {
            fetchKeys[field] = 1;  
        }); 
    }else{
        fetchKeys.__v = 0;
    }


    if( req.body.hasOwnProperty('keyword') && req.body.keyword !== '' ){
        if( isValidEmail( req.body.keyword ) ){
            where['email'] =  req.body.keyword ; 
        }
        else if(  req.body.keyword.length === 10 ){
            where['mobile_no'] =  req.body.keyword; 
        }else if(  numbersOnly(req.body.keyword).length >= 4 && numbersOnly(req.body.keyword).length <= 6 ){
            where['employee_code'] =  req.body.keyword ; 
        }else{
            let searchKeyWord = new RegExp( lettersOnly( req.body.keyword ) );
            where['name'] = { $regex: searchKeyWord, $options: 'i' } 
        }  
    } 


    if( req.body.hasOwnProperty('profile_status') && req.body.profile_status !== '' ){
        where['profile_status'] =  commonOnly( req.body.profile_status ); 
    }

    if( req.body.hasOwnProperty('project_id') && req.body.project_id !== '' ){ 
        where['project_id'] = dbObjectId( req.body.project_id );
    } 

    if( req.body.hasOwnProperty('designation') && req.body.designation !== '' ){ 
        where['designation'] =  req.body.designation;
    } 

    if( req.body.hasOwnProperty('division') && req.body.division !== '' ){ 
        where['division'] =  req.body.division;
    } 
    if( req.body.hasOwnProperty('region') && req.body.region !== '' ){ 
        where['region'] =  req.body.region;
    } 
    if( req.body.hasOwnProperty('employee_type') && req.body.employee_type !== '' ){ 
        where['employee_type'] =  req.body.employee_type;
    } 
    if( req.body.hasOwnProperty('location_id') && req.body.location_id !== '' ){ 
        where['offices.city_id'] = dbObjectId( req.body.location_id );
    } 

    if( req.body.hasOwnProperty('state_id') && req.body.state_id !== '' ){ 
        where['offices.state_id'] = dbObjectId( req.body.state_id );
    }

    if( req.body.hasOwnProperty('type') && req.body.type === 'alumni' ){ 
        //where['profile_status'] = 'Closed';
        where['job_status'] = 'Closure';
    }

    const pageOptions = {
        page: parseInt( ((page_no ? page_no : 1) - 1)) || 0,
        limit: parseInt( per_page_record) || 10
    } 

    EmployeeCI.find( where, fetchKeys )
    .skip( pageOptions.page * pageOptions.limit )
    .limit( pageOptions.limit )
    .sort( { 'name': 1 } )
    .then( (data)=>{        

        if( data.length > 0 ){ 
            const outPutData = updateDatesInArray( replaceNullUndefined( data ), ['add_date', 'updated_on','salary_effective_date','pf_effective_from','joining_date','probation_complete_date','valid_till'] , 'date' );              
            return res.status(200).send( {'status':true, 'data': outPutData, 'message': 'API Accessed Successfully'} );
        }else{
            return res.status(204).send( {'status':false, 'message': 'No record matched'} );
        }
    }).catch( (error)=>{ 
        return res.status(403).send( {'status':false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE } ); 
    });
}

/********* Check Employee Login  **********/
controller.checkLoginEmployeeWithEmail = ( req , res ) => {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({ status: false, message: errors.array()[0].msg });
    } 
     
    const { email_id  } = req.body;

    EmployeeCI.findOne( {email: email_id, profile_status :'Active' } )
    .then( (loginData)=>{
        if( loginData ){

            if( loginData.profile_status !== 'Active' ){
                return res.status(401).send( {'status':true, 'message': `Your Profile is ${loginData.profile_status}, Please Contact to Your Website Administrative` } );
            }

            const otp = OTP();
            const saveData = {}
            saveData.otp = otp;
            saveData.updated_on = dbDateFormat();
            saveData.otp_sent_on = dbDateFormat();

            EmployeeCI.updateOne( { _id: loginData._id }, {$set: saveData} )
            .then( (data)=>{ 
                if( data ){ 
                    if( typeof loginData.mobile_no !== 'undefined' && loginData.mobile_no.length === 10 ){ 
                        otpSmsTemplate( loginData.mobile_no, otp );
                    }
                    if( typeof loginData.email !== 'undefined' && loginData.mobile_no.email !== '' ){ 
                        otpEmailTemplate( loginData.email, otp, loginData.name  );
                    }
                    
                    return res.status(200).send( {'status':true, data: {email_id}, 'message': 'OTP Sent Successfully at your registered email ID'} );
                }else{
                    return res.status(403).send( {'status':false, 'message':'Invalid Login Details'} );
                }
            }).catch( (error)=>{ 
                return res.status(403).send( {'status':false, 'message': error || 'Invalid Login Details'} ); 
            }); 
            
        } else{
            return res.status(403).send( {'status':false, 'message': 'Invalid Login Details'} );
        }       
        
    }).catch( (error)=>{ 
        return res.status(403).send( {'status':false, 'message': error || 'Invalid Login Details'} ); 
    });
}

/********* Verify Login OTP  **********/
controller.verifyOTP = ( req , res ) => {

    const errors = validationResult(req);

    if (!errors.isEmpty()) { 
        return res.status(400).json({ status: false, message: errors.array()[0].msg });
    } 
     
    const { email_id, otp, login_device  } = req.body;

    EmployeeCI.findOne( {email: email_id } )
    .then( (loginData)=>{ 

        if( loginData ){

            if( loginData.profile_status !== 'Active' ){
                return res.status(403).send( {'status':true, 'message': `Your Profile is ${loginData.profile_status}, Please Contact to Your Website Administrative` } );
            }

            if( loginData.otp.toString() !== otp.toString() ){
                return res.status(403).send( {'status':false, 'message':'OTP not matched'} );
            }

            const timeDifference = calculateTime( loginData.otp_sent_on , dbDateFormat() );

            if( timeDifference > 10 ){
                return res.status(403).send( {'status':false, 'message':'OTP Expired'} );
            } 
           
            const saveData = {}
            saveData.otp = '0000';
            saveData.updated_on = dbDateFormat();
            saveData.last_login = dbDateFormat();
            saveData.login_device = login_device;

            EmployeeCI.updateOne( { _id: loginData._id }, {$set: saveData} )
            .then( (data)=>{ 
                if( data ){ 
                    let jwtPayload = {}
                    jwtPayload._id = loginData._id;
                    jwtPayload.name = loginData.name;
                    jwtPayload.email = loginData.email;
                    jwtPayload.mobile_no = loginData.mobile_no;
                    let jwtToken = generateJwtToken( jwtPayload );
                    const userData = employeeResponseData( loginData, jwtToken );  
                    return res.status(200).send( {'status':true, 'data':userData, 'message': 'Logged in Successfully'} );
                }else{
                    return res.status(403).send( {'status':false, 'message':'Invalid Login Details'} );
                }
            }).catch( (error)=>{ 
                return res.status(403).send( {'status':false, 'message': error || 'Invalid Login Details'} ); 
            }); 
             
        } else{
            return res.status(403).send( {'status':false, 'message': 'Invalid Login Details'} );
        } 
        
    }).catch( (error)=>{  
        return res.status(403).send( {'status':false, 'message': error || 'Invalid Login Details'} ); 
    });
}


controller.getEmployeeAllList = async ( req , res ) => {  
   
    const { page_no, per_page_record, scope_fields } = req.body;   

    const where = {}  
    const fetchKeys = {}
    
    if( req.body.hasOwnProperty('scope_fields') && scope_fields.length > 0 ){
        scope_fields.forEach(field => {
            fetchKeys[field] = 1;  
        }); 
    }else{
        fetchKeys.__v = 0;
    }

    if( req.body.hasOwnProperty('keyword') && req.body.keyword !== '' ){
        if( isValidEmail( req.body.keyword ) ){
            where['email'] =  req.body.keyword ; 
        }
        else if(  req.body.keyword.length === 10 ){
            where['mobile_no'] =  req.body.keyword; 
        }else if(  numbersOnly(req.body.keyword).length >= 4 && numbersOnly(req.body.keyword).length <= 6 ){
            where['employee_code'] =  req.body.keyword ; 
        }else{
            let searchKeyWord = new RegExp( lettersOnly( req.body.keyword ) );
            where['name'] = { $regex: searchKeyWord, $options: 'i' } 
        }  
    }

    if( req.body.hasOwnProperty('status') && req.body.status !== '' ){
        if(['onRole','onContract','emPanelled'].includes(req.body.status)){
            where['employee_type'] =  commonOnly( req.body.status ); 
        }
        else if(['Active','Inactive','Closed'].includes(req.body.status)){
            where['profile_status'] =  commonOnly( req.body.status ); 
        }/*else{
            where['profile_status'] =  'Active';
        }*/ 
    }else{
        where['profile_status'] =  'Active';
    }


    const today = new Date();
    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    /****************  Filter Manual Start Script  ***************/
    if( req.body.hasOwnProperty('type') && req.body.type !== '' ){
        if(['Resigned'].includes(req.body.type)){
            where['termination_mode'] =  commonOnly( req.body.type ); 
        }
        else if(['onNotice'].includes(req.body.type)){
            where['job_status'] =  commonOnly( req.body.type );  
        }
        else if(['availablePosition'].includes(req.body.type)){
            where['job_status'] =  'onNotice'; 
        }
        else if(['workAnniversary'].includes(req.body.type)){
            where['joining_date'] =  { $gte: startOfDay, $lt: endOfDay }
        }
        else if(['todayBirthday'].includes(req.body.type)){ 
            where['date_of_birth'] =  { $gte: startOfDay, $lt: endOfDay }
        }
        else if(['inductionDue'].includes(req.body.type)){
            where['induction_form_status'] =  'Pending'; 
        }
        else if(['appraisalDue'].includes(req.body.type)){
            where['appraisal_date'] =  {$lt: new Date().toISOString() }; 
        }
        else if(['extensionPending'].includes(req.body.type)){
            where['valid_till'] =  {$lt: new Date().toISOString() }; 
        }
        
    }

    /*******************  Filter Manual End Script  **************/ 
    if( req.body.hasOwnProperty('project_id') && req.body.project_id !== '' ){ 
            where['project_id'] = dbObjectId( req.body.project_id );
    } 

    if( req.body.hasOwnProperty('designation') && req.body.designation !== '' ){ 
        where['designation'] =  req.body.designation ;
    }  

     /*************Add count System Start Code Here *********/
    if( req.body.hasOwnProperty('is_count') && req.body.is_count ==='yes' ){
        
        try{
             const resultData = await EmployeeCI.aggregate([
                        {
                            $match: where
                        },
                        {  
                            $facet: {
                            employeeTypeCounts: [
                                {
                                $group: {
                                    _id: "$employee_type",
                                    count: { $sum: 1 }
                                }
                                }
                            ],
                            profileStatusCounts: [
                                {
                                $group: {
                                    _id: "$profile_status",
                                    count: { $sum: 1 }
                                }
                                }
                            ]
                            }
                        },
                        {
                            $project: {
                            result: {
                                $mergeObjects: [
                                {
                                    $arrayToObject: {
                                    $map: {
                                        input: "$employeeTypeCounts",
                                        as: "et",
                                        in: {
                                        k: "$$et._id",
                                        v: "$$et.count"
                                        }
                                    }
                                    }
                                },
                                {
                                    $arrayToObject: {
                                    $map: {
                                        input: "$profileStatusCounts",
                                        as: "ps",
                                        in: {
                                        k: "$$ps._id",
                                        v: "$$ps.count"
                                        }
                                    }
                                    }
                                }
                                ]
                            }
                            }
                        },
                        {
                            $replaceRoot: {
                            newRoot: "$result"
                            }
                        }
                        ]);

                        
            const outputData = {}       
            outputData.on_role = resultData.length > 0 && resultData[0]?.onRole ? resultData[0]?.onRole : 0 ;
            outputData.on_contract =  resultData.length > 0 && resultData[0]?.onContract ? resultData[0]?.onContract : 0 ;
            outputData.active_profiles =  resultData.length > 0 && resultData[0]?.Active ? resultData[0]?.Active : 0 ;
            outputData.inactive_profiles =  resultData.length > 0 && resultData[0]?.Inactive ? resultData[0]?.Inactive : 0 ;
            outputData.kyc_pending = 0;

            return res.status(200).send( {'status':true, data: outputData,  'message': 'Success'} );  

        }catch( error ){ //console.log( error );
            return res.status(403).send( {'status':false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE } ); 
        }         
 
    }else{

            const pageOptions = {
                page: parseInt( ((page_no ? page_no : 1) - 1)) || 0,
                limit: parseInt( per_page_record) || 10
            }

            try{
                const data = await EmployeeCI.find( where, fetchKeys )
                    .skip( pageOptions.page * pageOptions.limit )
                    .limit( pageOptions.limit )
                    .sort( { _id: 1 } ); 

                    if( data.length > 0 ){ 
                        const outPutData = updateDatesInArray(  data , ['add_date', 'updated_on','joining_date','valid_till','date_of_birth','probation_complete_date','appraisal_date','salary_effective_date'] , 'datetime' );              
                        return res.status(200).send( {'status':true, 'data': outPutData, 'message': 'API Accessed Successfully'} );
                    }else{
                        return res.status(403).send( {'status':false, 'message': 'No record matched'} );
                    }
            }catch( error ){ console.log( error );
                return res.status(403).send( {'status':false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE } ); 
            }  
    }
}


controller.countEmployeeRecords = ( req , res )=>{

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(403).json({ status: false, message: errors.array()[0].msg });
    }    

    const { type } = req.body;  
    const fetchKeys = { _id: 1 }

    const now = new Date();
    const month = now.getMonth() + 1; // Add 1 to convert to 1-12 range
    const day = now.getDate();// Get the day of the month (1-31)

    let where = {}
    where['profile_status'] = 'Active';

    const today = new Date();
    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    /****************  Filter Manual Start Script  ***************/
    if( req.body.hasOwnProperty('type') && req.body.type !== '' ){
        if(['Resigned'].includes(req.body.type)){
            where['termination_mode'] =  commonOnly( req.body.type ); 
        }
        else if(['onNotice'].includes(req.body.type)){
            where['job_status'] =  commonOnly( req.body.type );  
        }
        else if(['workAnniversary'].includes(req.body.type)){
            where['joining_date'] =  { $gte: startOfDay, $lt: endOfDay }
        }
        else if(['todayBirthday'].includes(req.body.type)){ 
            where['date_of_birth'] =  { $gte: startOfDay, $lt: endOfDay }
        }
        else if(['inductionDue'].includes(req.body.type)){
            where['induction_form_status'] =  'Pending'; 
        }
        else if(['appraisalDue'].includes(req.body.type)){
            where['appraisal_date'] =  {$lt: new Date().toISOString() }; 
        }
    }
    /*******************  Filter Manual End Script  **************/ 
    
    if(['availablePosition','AvailableJobs'].includes(req.body.type)){ 

        JobCl.aggregate([
            {
              $match: {
                status: "Published",
                deadline: { $lte: new Date() }   
              }
            },
            {
              $group: {
                _id: null,
                total_vacancies: { $sum: "$available_vacancy" }
              }
            }
        ])
        .then( (data)=>{ 
            var countItems = parseInt( data?.[0]?.total_vacancies ) || 0 ; 
            return res.status(200).send( {'status':true, 'data': countItems, 'message': 'API Accessed Successfully'} );
            
        }).catch( (error)=>{
            return res.status(403).send( {'status':false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE } ); 
        });
    }else if( ['LeaveRequest'].includes(req.body.type)){  
            var countItems = 0 ; 
            return res.status(200).send( {'status':true, 'data': countItems, 'message': 'API Accessed Successfully'} );  
    }else{
        EmployeeCI.countDocuments( where, fetchKeys ) 
        .then( (data)=>{
            var countItems = parseInt( data ) || 0 ; 
            return res.status(200).send( {'status':true, 'data': countItems, 'message': 'API Accessed Successfully'} );
            
        }).catch( (error)=>{
            return res.status(403).send( {'status':false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE } ); 
        });
    }
}


/********* Import EmployeeData Data **********/
controller.importEmployeeData = async ( req, res )=>{

    if (req.body && typeof req.body === 'object') { 
        req.body = JSON.parse(JSON.stringify(req.body));
    }

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        if( req.file &&  req.file.filename ){
            removeFile( req.file.filename );
        }
        return res.status(402).json({ status: false, message: errors.array()[0].msg });
    } 

    const saveData = {}; 
    saveData.add_date = dbDateFormat();
    saveData.updated_on =  dbDateFormat();


    if( req.file && req.file.filename ){ 
        const uploadsDir4 =  './uploads';


        const filePath = path.join(uploadsDir4, req.file.filename); 

        fs.access(filePath, fs.constants.R_OK, (err) => {
            if (err) {
                console.error('No read access to the file', err);
            } else {
                console.log('File is readable');
            }
        });


        var csvData = []; 
        if( req.file &&  req.file.filename ){
            const excelData = await readExcelFile( uploadsDir4+'/'+req.file.filename  );   
            const headersData = excelData[0];
             csvData = excelData.slice(1).map(row => {
                    const obj = {};
                    headersData.forEach((header, index) => {
                        obj[header] = row[index];
                    });
                    return obj;
            });
            removeFile( req.file.filename );         
        }else{
            return res.status(403).json( {'status':false, 'message': 'Please choose valid Excel file'} ); 
        }  
    
        if ( csvData.length === 0) {  
            return res.status(403).json( {'status':false, 'message': 'No record in the file'} ); 
        } 
  

             /*fetch the employee Code in database */
             const collectEmployeeCode = csvData.map((item ) => {
                if( typeof item.employee_id !=='undefined' && item.employee_id !=='' ){
                    return String( item.employee_id );
                }   
            }); 
            

            const getOldEmployeeList =  await EmployeeCI.find( {'employee_code': {$in: collectEmployeeCode}} ,{_id:1,'employee_code':1});
 
            // Convert array of arrays to array of objects
            const bulkOps = []; 

            const NewCsvData = csvData.map(obj => { 
                for (const key in obj) {
                  if (obj[key] === "NA") {
                    obj[key] = "";
                  }
                }
                return obj;
              });
 


            for(var i=0; i < NewCsvData.length; i++ ){
                    let item = NewCsvData[i];
               if( typeof item.employee_email !=='undefined' && item.employee_email !=='' && isValidEmail(item.employee_email) && typeof item.employee_id !=='undefined' &&  String( item.employee_id ) !==''){
                let checkExistingEmpCode = getOldEmployeeList.find((elm)=> String( elm.employee_code) === String( item.employee_id ) );
                 
                if( typeof checkExistingEmpCode === 'undefined' ){
                        var objData = {}
                        if( typeof item.project_id !=='undefined' && item.project_id !== '' && typeof item.project_name !=='undefined' &&  item.project_name !=='' ){
                            objData.project_id = dbObjectId( item.project_id );
                            objData.project_name = item.project_name; 
                        }else{
                            objData.project_id = dbObjectId('66bf4924d30f7d512456280a');
                            objData.project_name = 'HLFPPT Corporate'; 
                        }
                        
                        objData.profile_status = 'Active';
                        objData.name = typeof item.employee_name !=='undefined' ? item.employee_name : '';
                        objData.email = typeof item.employee_email !=='undefined' ? item.employee_email : '';
                        objData.alt_email = typeof item.employee_alt_email !=='undefined' ? item.employee_alt_email : '';
                        objData.alt_mobile_no = typeof item.employee_alt_mobile_no !=='undefined' ? removeCommasFromNumberString( item.employee_alt_mobile_no ) : '';
                        objData.mobile_no = typeof item.employee_mobile_no !=='undefined' ? ( item.employee_mobile_no ) : '';
                        objData.aadhaar_no =  typeof item.aadhaar_no !=='undefined' ? item.aadhaar_no : '';
                        if( typeof item.date_of_birth !== 'undefined' && item.date_of_birth !=='' ){
                        objData.date_of_birth = convertToDbDate( item.date_of_birth );
                        }
                        objData.employee_code = typeof item.employee_id !=='undefined' ? item.employee_id : '';
                        objData.department = typeof item.department_name !=='undefined' ? item.department_name : 'NA';
                        objData.designation = typeof item.designation !=='undefined' ? item.designation : 'NA';
                        objData.occupation = typeof item.occupation !=='undefined' ? item.occupation : 'NA';
                        objData.salary_structure = typeof item.salary_structure !=='undefined' ? item.salary_structure : '';
                        objData.attendance = typeof item.working_days_type !=='undefined' ? item.working_days_type : '';
                        objData.division = typeof item.division !=='undefined' ? item.division : '';
                        objData.region = typeof item.region !=='undefined' ? item.region : '';
                        objData.branch = typeof item.location !=='undefined' ? [item.location] : [];
                        objData.grade = typeof item.grade !=='undefined' ? item.grade : '';
                        objData.gender = item.gender === 'Male' ? 'Male' : 'Female';
                        objData.employee_type = typeof item.employee_type !=='undefined' && item.employee_type === 'On Role' ? 'onRole' : 'onContract';
                        objData.marital_status = typeof item.marital_status !=='undefined' && item.marital_status === 'MARRIED' ? 'Married' : 'Single';
                        objData.batch_id = 0;
                        objData.father_name = typeof item.father_name !=='undefined' ? item.father_name : '';
                        if( typeof item.joining_date !== 'undefined' && item.joining_date !==''  ){
                        objData.joining_date = convertToDbDate(  item.joining_date  );
                        }
                        if( typeof item.appraisal_date !== 'undefined' && item.appraisal_date !=='' ){ 
                            objData.appraisal_date = convertToDbDate(  item.appraisal_date  );
                        }
                        if( typeof item.probation_complete_date !== 'undefined' && item.probation_complete_date !=='' ){
                        objData.probation_complete_date = convertToDbDate(  item.probation_complete_date  );
                        }
                        objData.pan_number = typeof item.pan_number !=='undefined' ? item.pan_number : '';
                        objData.uan_number = typeof item.uan_number !=='undefined' ? item.uan_number : '';
                        objData.esi_number = typeof item.esi_number !=='undefined' ? item.esi_number : '';
                        objData.pf_number = typeof item.pf_number !=='undefined' ? item.pf_number : '';
                        objData.esi_dispensary = typeof item.esi_dispensary !=='undefined' ? item.esi_dispensary : '';
                        if( typeof item.date_of_leaving !== 'undefined' && item.date_of_leaving !== '' ){ 
                        objData.date_of_leaving = convertToDbDate( item.date_of_leaving );
                        }
                        if( typeof item.pf_effective_from !== 'undefined' && item.pf_effective_from !== '' ){
                            objData.pf_effective_from = convertToDbDate( item.pf_effective_from );
                        }
                        if( typeof item.appraisal_date !== 'undefined'  && item.appraisal_date !== '' ){
                            objData.appraisal_date = convertToDbDate( item.appraisal_date );
                        }
                        
                        //objData.kpi_data = item.kpi_data;
                        //objData.kra_data = item.kra_data;
                        //objData.jd_data = item.jd_data;
                        objData.bank_name = typeof item.bank_name !=='undefined' && item.bank_name !=='' ? item.bank_name : '';
                        objData.bank_account_number = typeof item.bank_account_number !=='undefined' && item.bank_account_number !=='' ? item.bank_account_number : '';
                        objData.bank_branch = typeof item.bank_branch !=='undefined' && item.bank_branch !=='' ? item.bank_branch : '';
                        objData.bank_account_type = typeof item.bank_account_type !=='undefined' && item.bank_account_type ==='Saving' ? item.bank_account_type : 'Saving';
                        objData.ifsc_code = typeof item.ifsc_code !=='undefined' && item.ifsc_code !=='' ? item.ifsc_code : '';

                        let present_address2 = typeof item.present_address !=='undefined' && item.present_address !=='' ? item.present_address : '';
                        let permanent_address2 = typeof item.permanent_address !=='undefined'  && item.permanent_address !=='' ? item.permanent_address : '';
                        let both_address_same = objData.present_address === objData.permanent_address ?  true : false;

                        objData.permanent_address = { 'road_street': permanent_address2, 'both_address_same': both_address_same  }
                        objData.present_address = { 'road_street': present_address2  } 
                        
                    
                        if( typeof item.education_data !=='undefined' && item.education_data !==''){
                            objData.education_data = [{degree_certificates:item.education_data}];
                        }
                        if(typeof item.reason_of_leaving !=='undefined' && item.reason_of_leaving !==''){
                            objData.reason_of_leaving = item.reason_of_leaving;
                        }
                        objData.total_experience = typeof item.total_experience !=='undefined' ? item.total_experience : '';
                        objData.basic_salary = typeof item.basic_salary !=='undefined' && item.basic_salary !=='' ? parseFloat( item.basic_salary ) :0;
                        objData.salary_hra = typeof item.salary_hra !=='undefined' && item.salary_hra !=='' ? parseFloat( item.salary_hra ):0;
                        objData.salary_da = typeof item.salary_da !=='undefined' && item.salary_da !=='' ? parseFloat( item.salary_da ):0;
                        objData.salary_total = typeof item.salary_total !=='undefined' ? parseFloat( item.salary_total ) : 0;

                        const earnings = {}
                        earnings.transport_allowances = parseFloat( removeCommasFromNumberString( item.transport_allowances ));
                        earnings.medical_allowances = parseFloat( removeCommasFromNumberString( item.medical_allowances ));
                        earnings.children_allowances = parseFloat( removeCommasFromNumberString( item.children_allowances ));
                        earnings.special_allowances = parseFloat( removeCommasFromNumberString( item.special_allowances ));
                        earnings.project_allowances = parseFloat( removeCommasFromNumberString( item.project_allowances ));
                        earnings.charge_allowances = parseFloat( removeCommasFromNumberString( item.charge_allowances )); 
                        earnings.uniform_allowance = parseFloat( removeCommasFromNumberString( item.uniform_allowance ));
                        earnings.employee_pf = removeCommasFromNumberString( item.employee_pf );
                        earnings.accident_insurance_premium = parseFloat( removeCommasFromNumberString( item.accident_insurance_premium ));
                        earnings.sodexo_food_voucher = removeCommasFromNumberString( item.sodexo_food_voucher ); 
                        earnings.vehicle_fuel_allowances = parseFloat( removeCommasFromNumberString( item.vehicle_fuel_allowances )); 
                        earnings.vehicle_allowances = parseFloat( removeCommasFromNumberString( item.vehicle_allowances )); 
                        earnings.books_journals = parseFloat( removeCommasFromNumberString( item.books_journals )); 
                        earnings.telephone_allowances = parseFloat( removeCommasFromNumberString( item.telephone_allowances )); 
                        earnings.helper_allowance = parseFloat( removeCommasFromNumberString( item.helper_allowance )); 

                        objData.earning_data = earnings;
                        objData.salary_total = typeof item.salary_total !=='undefined' ?  parseFloat( removeCommasFromNumberString( item.salary_total )) : 0; 
                        objData.ctc = typeof item.ctc_per_month !=='undefined' ?  removeCommasFromNumberString( item.ctc_per_month ) : 0;
                        objData.ctc_pa = typeof item.ctc_per_anum !=='undefined' ?  removeCommasFromNumberString(  item.ctc_per_anum ) : 0; 
                        //console.log( objData );
                        bulkOps.push( objData );
                        
                   } 
                 }
                }  

                if ( bulkOps.length === 0) {  
                    return res.status(403).json( {'status':false, 'message': 'No record to be upload in database '} ); 
                } 
                
                //console.log(  bulkOps );
                //return res.status(200).send( {'status':true, 'message': 'Employee Data imported Successfully'} );
             
     EmployeeCI.insertMany( bulkOps )
     .then( (data) => {
         return res.status(200).send( {'status':true, 'message': 'Employee Data imported Successfully'} );
     })
     .catch( (error)=>{ 
        return res.status(403).send( {'status':false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE} ); 
      });
    }

}

/********* Import EmployeeData Data Second **********/
controller.importEmployeeDataSecond = async ( req, res )=>{ 

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(402).json({ status: false, message: errors.array()[0].msg });
    }

    const {  employee_data } = req.body; 

    const saveData = {};
    saveData.add_date = dbDateFormat();
    saveData.updated_on =  dbDateFormat();

        var csvData = employee_data;  
    
        if ( csvData.length === 0) {  
            return res.status(403).json( {'status':false, 'message': 'No record in the file'} ); 
        }

        /******* fetch the employee Code in database ********/
        const collectEmployeeCode = csvData.map((item ) => {
            if( typeof item.employee_id !=='undefined' && item.employee_id !=='' ){
                return String( item.employee_id );
            }   
        }); 

        /*get all designation list*/
        const getAllDesignationList =  await DesignationCl.find( {'status':'Active'} ,{_id:1,'name':1});

        /*get all project list*/
        const getAllProjectList =  await ProjectCl.find( {'status':'Active'} ,{_id:1,'title':1});

        /*get all project list*/
        //const getAllDepartmentList =  await DepartmentCl.find( {'status':'Active'} ,{_id:1,'name':1});

        //console.log( collectEmployeeCode ); 

        const getOldEmployeeList =  await EmployeeCI.find( {'employee_code': {$in: collectEmployeeCode}} ,{_id:1,'employee_code':1});
 
        // Convert array of arrays to array of objects
        const bulkOps = []; 

        const NewCsvData = csvData.map(obj => { 
            for (const key in obj) {
                if (obj[key] === "NA") {
                obj[key] = "";
                }
            }
            return obj;
        });
 

            try{

            for(var i=0; i < NewCsvData.length; i++ ){
                    let item = NewCsvData[i];
              // if( typeof item.employee_email !=='undefined' && item.employee_email !=='' && isValidEmail(item.employee_email) && typeof item.employee_id !=='undefined' &&  String( item.employee_id ) !==''){
                if( typeof item.employee_id !=='undefined' &&  String( item.employee_id ) !==''){
                let checkExistingEmpCode = getOldEmployeeList.find((elm)=> String( elm.employee_code) === String( item.employee_id ) );
                 
                if( typeof checkExistingEmpCode === 'undefined' ){
                        var objData = {}

                        //maintain project ID
                        if( typeof item.project_name !=='undefined' && item.project_name !== '' ){
                            let matchProjectItem = getAllProjectList.find((elm)=> String( elm.title ) === String( item.project_name ) );
                          
                            if(  typeof matchProjectItem !== 'undefined' ){
                                objData.project_id =  matchProjectItem._id;
                                objData.project_name = matchProjectItem.title;
                            }
                        } 

                        if( typeof objData.project_id === 'undefined'  && typeof item.project_id !== 'undefined' && item.project_id !=='' && dbObjectIdValidate( item.project_id)){
                                objData.project_id = dbObjectId( item.project_id );
                        } 
                        if( typeof objData.project_name === 'undefined'  && typeof item.project_name !== 'undefined' && item.project_name !=='' ){
                            objData.project_name = item.project_name; 
                        }
                    

                        //maintain designation ID
                        if( typeof item.designation_name !=='undefined' && item.designation_name !== '' ){
                            let matchDesignationItem = getAllDesignationList.find((elm)=> String( elm.name ) === String( item.project_name ) );
                          
                            if(  typeof matchDesignationItem !== 'undefined' ){
                                objData.designation_id = matchDesignationItem._id;
                                objData.designation = matchDesignationItem.name;
                            }
                        } 

                        if( typeof objData.designation_id === 'undefined'  && typeof item.designation_id !== 'undefined' && item.designation_id !=='' && dbObjectIdValidate( item.designation_id)){
                                objData.designation_id = dbObjectId( item.designation_id );
                        } 
                        if( typeof objData.designation === 'undefined'  && typeof item.designation_name !== 'undefined' && item.designation_name !=='' ){
                            objData.designation = item.designation_name; 
                        } 
                        
                        
                        objData.employee_code = typeof item.employee_id !=='undefined' ? item.employee_id : '';

                        objData.profile_status = 'Active';
                        objData.name = typeof item.employee_name !=='undefined' ? item.employee_name : '';
                        objData.email = typeof item.employee_email !=='undefined' && isValidEmail(item.employee_email) ? item.employee_email : '';
                        objData.alt_email = typeof item.employee_alt_email !=='undefined' ? item.employee_alt_email : '';
                        objData.alt_mobile_no = typeof item.employee_alt_mobile_no !=='undefined' ? removeCommasFromNumberString( item.employee_alt_mobile_no ) : '';
                        objData.mobile_no = typeof item.employee_mobile_no !=='undefined' ? ( item.employee_mobile_no ) : '';
                        objData.aadhaar_no =  typeof item.aadhaar_no !=='undefined' ? item.aadhaar_no : 'NA';
                        if( typeof item.date_of_birth !== 'undefined' && item.date_of_birth !=='' ){
                          objData.date_of_birth = new Date( convertAnyDateFormat( item.date_of_birth ) );
                        }
                        
                        objData.department = typeof item.department_name !=='undefined' ? item.department_name : 'NA';
                       
                        objData.occupation = typeof item.occupation !=='undefined' ? item.occupation : 'NA';
                        objData.salary_structure = typeof item.salary_structure !=='undefined' ? item.salary_structure : '';
                        objData.attendance = typeof item.working_days_type !=='undefined' ? item.working_days_type : '';
                        objData.division = typeof item.division !=='undefined' ? item.division : '';
                        objData.region = typeof item.region !=='undefined' ? item.region : '';
                        objData.branch = typeof item.location !=='undefined' ? [item.location] : [];
                        objData.grade = typeof item.grade !=='undefined' ? item.grade : '';
                        objData.gender = item.gender === 'Male' ? 'Male' : 'Female';

                        var employeeType = '';
                        if( typeof item.employee_type !=='undefined' && item.employee_type !== '' ){
                            employeeType = item.employee_type;
                        }else if( typeof employee_type !=='undefined' ){
                            employeeType = employee_type;
                        }else{
                            employeeType = 'onContract';
                        }

                        if( ['ONROLE'].includes( employeeType.toUpperCase().replace(/\s/g, '') ) ){
                            objData.employee_type = 'onRole';
                        }
                        else if( ['ONCONTRACT','ONCONSULTANT'].includes( employeeType.toUpperCase().replace(/\s/g, '') ) ){
                            objData.employee_type = 'onContract';
                        }
                        else if( ['EMPANELED','EMPANELLED'].includes( employeeType.toUpperCase().replace(/\s/g, '') ) ){
                            objData.employee_type = 'emPanelled';
                        }

                        
                        objData.marital_status = typeof item.marital_status !=='undefined' && ['MARRIED'].includes( item.marital_status.toUpperCase().replace(/\s/g, '') ) ? 'Married' : 'Single';
                        objData.batch_id =  typeof item.batch_id !=='undefined' ? item.batch_id : 0;
                        objData.father_name = typeof item.father_name !=='undefined' ? item.father_name : '';
                        if( typeof item.joining_date !== 'undefined' && item.joining_date !==''  ){
                            objData.joining_date = new Date( convertAnyDateFormat( item.joining_date ) );
                        }
                        if( typeof item.appraisal_date !== 'undefined' && item.appraisal_date !=='' ){  
                            objData.appraisal_date = new Date( convertAnyDateFormat( item.appraisal_date ) );
                        }
                        if( typeof item.probation_complete_date !== 'undefined' && item.probation_complete_date !=='' ){
                        objData.probation_complete_date = new Date( convertAnyDateFormat(  item.probation_complete_date  ) );
                        }
                        objData.pan_number = typeof item.pan_number !=='undefined' ? item.pan_number : '';
                        objData.uan_number = typeof item.uan_number !=='undefined' ? item.uan_number : '';
                        objData.esi_number = typeof item.esi_number !=='undefined' ? item.esi_number : '';
                        objData.pf_number = typeof item.pf_number !=='undefined' ? item.pf_number : '';
                        objData.esi_dispensary = typeof item.esi_dispensary !=='undefined' ? item.esi_dispensary : '';
                        if( typeof item.date_of_leaving !== 'undefined' && item.date_of_leaving !== '' ){ 
                        objData.date_of_leaving = new Date( convertAnyDateFormat( item.date_of_leaving ) );
                        }
                        if( typeof item.pf_effective_from !== 'undefined' && item.pf_effective_from !== '' ){
                            objData.pf_effective_from = new Date( convertAnyDateFormat( item.pf_effective_from ) );
                        }
                        if( typeof item.appraisal_date !== 'undefined'  && item.appraisal_date !== '' ){
                            objData.appraisal_date = new Date( convertAnyDateFormat( item.appraisal_date ) );
                        }
                         
                        objData.jd_data = item.jd_data;
                        objData.bank_name = typeof item.bank_name !=='undefined' && item.bank_name !=='' ? item.bank_name : '';
                        objData.bank_account_number = typeof item.bank_account_number !=='undefined' && item.bank_account_number !=='' ? item.bank_account_number : '';
                        objData.bank_branch = typeof item.bank_branch !=='undefined' && item.bank_branch !=='' ? item.bank_branch : '';
                        objData.bank_account_type = typeof item.bank_account_type !=='undefined' && item.bank_account_type ==='Saving' ? item.bank_account_type : 'Saving';
                        objData.ifsc_code = typeof item.ifsc_code !=='undefined' && item.ifsc_code !=='' ? item.ifsc_code : '';

                        let present_address2 = typeof item.present_address !=='undefined' && item.present_address !=='' ? item.present_address : '';
                        let permanent_address2 = typeof item.permanent_address !=='undefined'  && item.permanent_address !=='' ? item.permanent_address : '';
                        let both_address_same = objData.present_address === objData.permanent_address ?  true : false;

                        objData.permanent_address = { 'road_street': permanent_address2, 'both_address_same': both_address_same  }
                        objData.present_address = { 'road_street': present_address2  } 
                        
                    
                        if( typeof item.education_data !=='undefined' && item.education_data !==''){
                            objData.education_data = [{degree_certificates:item.education_data}];
                        }
                        if(typeof item.reason_of_leaving !=='undefined' && item.reason_of_leaving !==''){
                            objData.reason_of_leaving = item.reason_of_leaving;
                        }
                        objData.total_experience = typeof item.total_experience !=='undefined' ? item.total_experience : '';
                     
                        objData.add_date = dbDateFormat(); 
                        objData.updated_on = dbDateFormat(); 

                        bulkOps.push( objData );
                        
                   } 
                 }
                }
                
            }catch (error) {
                console.error("Error caught:", error );
            }

            /******** Check Bulk Data ************/
            if ( bulkOps.length === 0) {  
                return res.status(403).json( {'status':false, 'message': 'No record to be upload in database '} ); 
            }
                
            //   console.log(  bulkOps );
            //  return res.status(200).send( {'status':true, 'message': 'Employee Data imported Successfully'} );
             
    EmployeeCI.insertMany( bulkOps )
    .then( (data) => {
       // console.log( data );
        return res.status(200).send( {'status':true, 'message': 'Employee Data imported Successfully'} );
    })
    .catch( (error)=>{ 
        return res.status(403).send( {'status':false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE} ); 
    }); 

}
 

/********* Import Employee Salary Data **********/
controller.importEmployeeSalaryData = async ( req, res )=>{  

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(402).json({ status: false, message: errors.array()[0].msg });
    }

    const {  job_type, employee_salary } = req.body; 

    const saveData = {}; 
    saveData.add_date = dbDateFormat();
    saveData.updated_on =  dbDateFormat();   
    
        if ( employee_salary.length === 0) {  
            return res.status(403).json( {'status':false, 'message': 'No record in the payload'} ); 
        } 
  

        /*fetch the employee Code in database */
        const collectEmployeeCode = employee_salary.map((item ) => {
            if( typeof item.employee_id !=='undefined' && item.employee_id !=='' ){
                return String( item.employee_id );
            }   
        });  

      

        var employeeType = ''; 
        if( ['ONROLE'].includes( job_type.toUpperCase().replace(/\s/g, '') ) ){
            employeeType = 'onRole';
        }
        else if( ['ONCONTRACT','ONCONSULTANT'].includes( job_type.toUpperCase().replace(/\s/g, '') ) ){
            employeeType = 'onContract';
        }
        else if( ['EMPANELED','EMPANELLED'].includes( job_type.toUpperCase().replace(/\s/g, '') ) ){
            employeeType = 'emPanelled';
        }

        const whereCondition = {}
        whereCondition['employee_type'] =  employeeType;
        whereCondition['employee_code'] =  {$in: collectEmployeeCode};  

        const getOldEmployeeList =  await EmployeeCI.find( whereCondition ,{_id:1,'employee_code':1,'_id':1});
 
        if( getOldEmployeeList.length === 0 ){
            return res.status(403).json( {'status':false, 'message': 'No employee record matched in database.'} );
        }

        // Convert array of arrays to array of objects
        const collectBulkOptions = [];

        const NewCsvData = employee_salary.map(obj => { 
            for (const key in obj) {
                if (obj[key] === "NA") {
                obj[key] = "";
                }
            }
            return obj;
        }); 
 
        try{

            for(var i=0; i < NewCsvData.length; i++ ){
               let item = NewCsvData[i];

               //console.log( item );

               if( typeof item.employee_id !=='undefined' &&  String( item.employee_id ) !==''){
                let checkExistingEmpCode = getOldEmployeeList.find((elm)=> String( elm.employee_code) === String( item.employee_id ) );
                 //console.log( checkExistingEmpCode );
                  
                if( ['object','Object'].includes( typeof checkExistingEmpCode ) && checkExistingEmpCode ){
                        var objData = {}

                        objData._id = checkExistingEmpCode._id;
                        objData.employee_code = checkExistingEmpCode.employee_code;

                        objData.basic_salary = typeof item.basic_salary !=='undefined' && item.basic_salary !=='' ? parseFloat( removeCommasFromNumberString( item.basic_salary )) :0;
                        objData.salary_hra = typeof item.salary_hra !=='undefined' && item.salary_hra !=='' ? parseFloat( removeCommasFromNumberString( item.salary_hra )) : 0;
                        objData.salary_da = typeof item.salary_da !=='undefined' && item.salary_da !=='' ? parseFloat( removeCommasFromNumberString( item.salary_da )) : 0;
                        objData.salary_total = typeof item.salary_total !=='undefined' && item.salary_total !=='' ? parseFloat( removeCommasFromNumberString( item.salary_total )) : 0;
                        objData.ctc = typeof item.ctc_per_month !=='undefined' ?  parseFloat( removeCommasFromNumberString( item.ctc_per_month )) : 0;
                        objData.ctc_pa = typeof item.ctc_per_anum !=='undefined' && item.ctc_per_anum !=='' ? parseFloat(removeCommasFromNumberString(  item.ctc_per_anum )) : 0; 

                        
                        const earnings = {}
                        earnings.transport_allowances = typeof item.transport_allowances !=='undefined' && item.transport_allowances !=='' ? parseFloat( removeCommasFromNumberString( item.transport_allowances ))  : 0; 
                        earnings.medical_allowances = typeof item.medical_allowances !=='undefined' && item.medical_allowances !=='' ? parseFloat( removeCommasFromNumberString( item.medical_allowances ))  : 0; 
                        earnings.children_allowances = typeof item.children_allowances !=='undefined' && item.children_allowances !=='' ? parseFloat( removeCommasFromNumberString( item.children_allowances )) : 0; 
                        earnings.special_allowances = typeof item.special_allowances !=='undefined' && item.special_allowances !=='' ? parseFloat( removeCommasFromNumberString( item.special_allowances )) : 0; 
                        earnings.project_allowances = typeof item.project_allowances !=='undefined' && item.project_allowances !=='' ? parseFloat( removeCommasFromNumberString( item.project_allowances )) : 0; 
                        earnings.charge_allowances = typeof item.charge_allowances !=='undefined' && item.charge_allowances !=='' ? parseFloat( removeCommasFromNumberString( item.charge_allowances )) : 0; 
                        earnings.uniform_allowance = typeof item.uniform_allowance !=='undefined' && item.uniform_allowance !=='' ? parseFloat( removeCommasFromNumberString( item.uniform_allowance )) : 0; 
                        earnings.employee_pf = typeof item.employee_pf !=='undefined' && item.employee_pf !=='' ? removeCommasFromNumberString( item.employee_pf ) : 0; 
                        earnings.accident_insurance_premium = typeof item.accident_insurance_premium !=='undefined' && item.accident_insurance_premium !=='' ? parseFloat( removeCommasFromNumberString( item.accident_insurance_premium )) : 0; 
                        earnings.sodexo_food_voucher = typeof item.sodexo_food_voucher !=='undefined' && item.sodexo_food_voucher !=='' ? removeCommasFromNumberString( item.sodexo_food_voucher ) : 0; 
                        earnings.vehicle_fuel_allowances = typeof item.vehicle_fuel_allowances !=='undefined' && item.vehicle_fuel_allowances !=='' ? parseFloat( removeCommasFromNumberString( item.vehicle_fuel_allowances )) : 0; 
                        earnings.vehicle_allowances = typeof item.vehicle_allowances !=='undefined' && item.vehicle_allowances !=='' ? parseFloat( removeCommasFromNumberString( item.vehicle_allowances )) : 0; 
                        earnings.books_journals = typeof item.books_journals !=='undefined' && item.books_journals !=='' ? parseFloat( removeCommasFromNumberString( item.books_journals )) : 0; 
                        earnings.telephone_allowances = typeof item.telephone_allowances !=='undefined' && item.telephone_allowances !=='' ? parseFloat( removeCommasFromNumberString( item.telephone_allowances )) : 0; 
                        earnings.helper_allowance = typeof item.helper_allowance !=='undefined' && item.helper_allowance !=='' ? parseFloat( removeCommasFromNumberString( item.helper_allowance )) : 0; 

                        objData.earning_data = earnings; 

                        //console.log( objData );
                     
                        collectBulkOptions.push( objData );
                        
                   } 
                }
            }
                
        }catch (error) {
            console.error("Error caught:", error );
            return res.status(403).json( {'status':false, 'message': 'No record to be upload in database '} ); 
        }

       // console.log( collectBulkOptions );

        /******** Check Bulk Data ************/
        if ( collectBulkOptions.length === 0) {  
            return res.status(403).json( {'status':false, 'message': 'No record to be upload in database '} ); 
        } 


        /************* prepare bulk write ************/
         const bulkWriteOps = collectBulkOptions.map((item) => ({
            updateOne: {
                filter: { 
                _id: item._id ,
                'employee_code': item.employee_code  
                },
                update: {
                    $set: {
                        'basic_salary': item.basic_salary,
                        'salary_hra': item.salary_hra,
                        'salary_da': item.salary_da,
                        'salary_total': item.salary_total,
                        'ctc': item.ctc,
                        'ctc_pa': item.ctc_pa,
                        'earning_data': item.earning_data,
                        'updated_on': dbDateFormat()
                    }
                }
            }
            }));
            
    EmployeeCI.bulkWrite( bulkWriteOps )
    .then( (data) => { 
        if( data?.modifiedCount > 0 ){
            const totalUpdatedRecords = data?.modifiedCount;
            return res.status(200).send( {'status':true, 'message': `${totalUpdatedRecords} Employee(s) Salary Data Imported Successfully` } );
        }else{
            return res.status(403).send( {'status':false, 'message': `Salary Data not Imported` } );
        }        
    })
    .catch( (error)=>{ 
        return res.status(403).send( {'status':false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE} ); 
    }); 

}




/********* Update JD Data **********/
controller.updateKpiKraJdData = ( req , res ) => {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(200).json({ status: false, message: errors.array()[0].msg });
    }   
    
    const { _id, type , kpi_kra_jd_data } = req.body;

    let saveData = {}
    if( type === 'kpi' ){
        saveData.kpi = kpi_kra_jd_data;
    }
    else if( type === 'kra' ){
        saveData.kra = kpi_kra_jd_data;
    }
    else if( type === 'jd' ){
        saveData.jd = kpi_kra_jd_data;
    }
    saveData.updated_on =  dbDateFormat(); 

    EmployeeCI.updateOne( { _id:  dbObjectId( _id ) }, {$set: saveData} )
    .then( (data)=>{ 
        if( data ){
            return res.status(200).send( {'status':true, 'message': 'Data Updated Successfully'} );
        }else{
            return res.status(200).send( {'status':false, 'message': process.env.DEFAULT_ERROR_MESSAGE } );
        }
    }).catch( (error)=>{ 
        return res.status(403).send( {'status':false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE } ); 
    });
}

/****************** Get Employee List With Grade Wise  *************/
controller.getEmployeeGradeWiseList = ( req , res ) => {   

    GradeCI.find( {'status':'Active'}, {'_id':0,'name':1,'priority':1} )
    .sort({'priority':1})
    .then((gd)=>{  

                EmployeeCI.aggregate([ 
                    {
                        $match: {
                        grade: { $ne: null }, 
                        grade: { $ne: "" },   
                        grade: { $exists: true } 
                        }
                    },
                    {
                    $group: {
                        _id: "$grade",  
                        employee_count: { $sum: 1 } 
                    }
                    }, 
                    {
                    $project: {
                        _id: 0,
                        grade: "$_id", 
                        employee_count: 1
                    }
                    },
                    {
                        $sort: { 
                            grade: 1 
                        }
                    }  
                ])
                .then( (data)=>{        

                    if( data.length > 0 ){ 

                        const ResultData = [];
                        for( var i = 0; i < gd.length; i++ ){
                            const pushData = {}
                            const findData = data.find((item)=> item.grade === gd[i].name );
                            if( findData ){
                                pushData.employee_count = findData.employee_count;
                                pushData.grade = gd[i].name;
                                ResultData.push( pushData );
                            } 
                        }
                                    
                        return res.status(200).send( {'status':true, 'data': ResultData, 'message': 'API Accessed Successfully'} );
                    }else{
                        return res.status(204).send( {'status':false, 'message': 'No record matched'} );
                    }
                }).catch( (error)=>{ 
                    return res.status(403).send( {'status':false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE } ); 
                });
    }).catch( (error)=>{ 
        return res.status(403).send( {'status':false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE } ); 
    });          
}


/***************** Get Employee list with job type  wise  ***********************/
controller.getEmployeeByJobTypeChart = ( req , res ) => {  

    const where = {}    
    if( req.body.hasOwnProperty('project_id') && req.body.project_id !== '' ){
        where['project_id'] = dbObjectId( req.body.project_id );
    }
    where['employee_type'] = {$in:["onRole","onContract"]}
 
    EmployeeCI.aggregate([
        {
            $match : where
        },
        {
            $group: {
              _id: "$employee_type",  
              count: { $sum: 1 }  
            }
        }
    ]).then( (data)=>{
        if( data.length > 0 ){ 
            const outPutData = replaceNullUndefined( data );              
            return res.status(200).send( {'status':true, 'data': outPutData, 'message': 'API Accessed Successfully'} );
        }else{
            return res.status(200).send( {'status':false, 'message': 'No record matched'} );
        }
    }).catch( (error)=>{ 
        return res.status(200).send( {'status':false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE } ); 
    });
}

/***************** Get Employee list with tenure wise  ***********************/
controller.getEmployeeByTenureChart = ( req , res ) => {  

    const where = {}    
    if( req.body.hasOwnProperty('project_id') && req.body.project_id !== '' ){
        where['project_id'] = dbObjectId( req.body.project_id );
    }
 
    EmployeeCI.aggregate([
        {
            $match : where
        },
        {
            $match: {
                joining_date: { $exists: true, $ne: null } 
            }
        },
        {
            $project: {
                year_diff: {
                    $subtract: [
                        { $year: new Date() },
                        { $year: "$joining_date" } 
                    ]
                }
            }
        },
        {
            $group: {
                _id: "$year_diff", 
                total_employees: { $sum: 1 } 
            }
        },
        {
            $project: {
                _id: 0,
                years_ago: "$_id",
                years_ago_text: { $concat: [{ $toString: "$_id" }, " Y"] },
                total_employees: 1
            }
        },
        {
            $sort: { 
                years_ago: 1 
            }
        }
    ]).then( (data)=>{
        if( data.length > 0 ){ 
            const outPutData = replaceNullUndefined( data );              
            return res.status(200).send( {'status':true, 'data': outPutData, 'message': 'API Accessed Successfully'} );
        }else{
            return res.status(200).send( {'status':false, 'message': 'No record matched'} );
        }
    }).catch( (error)=>{ 
        return res.status(200).send( {'status':false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE } ); 
    });
}


/***************** Get Employee list by gender wise  ***********************/
controller.getEmployeeByGenderChart = ( req , res ) => {  

    const where = {}    
    if( req.body.hasOwnProperty('project_id') && req.body.project_id !== '' ){
        where['project_id'] = dbObjectId( req.body.project_id );
    }
 
    EmployeeCI.aggregate([
        {
            $match : where
        },
        {
            $group: {
              _id: "$gender",  
              count: { $sum: 1 }  
            }
        }
    ]).then( (data)=>{
        if( data.length > 0 ){ 
            const total = data.reduce((sum, item) => sum + item.count, 0);  
            const percentages = data.map(item => ({
              gender: item._id,
              percentage: ((item.count / total) * 100).toFixed(2) 
            })); 
                       
            return res.status(200).send( {'status':true, 'data': percentages, 'message': 'API Accessed Successfully'} );
        }else{
            return res.status(200).send( {'status':false, 'message': 'No record matched'} );
        }
    }).catch( (error)=>{ 
        return res.status(200).send( {'status':false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE } ); 
    });
}

/***************** Get Employee list with year slots wise  ***********************/
controller.getEmployeeByYearWiseSlotChart = ( req , res ) => {  

    const where = {}    
    if( req.body.hasOwnProperty('project_id') && req.body.project_id !== '' ){
        where['project_id'] = dbObjectId( req.body.project_id );
    }
 
    EmployeeCI.aggregate([
        {
            $match: where
        },
        {
            $match: {
                date_of_birth: { $exists: true, $ne: null }
            }
        },
        {
            $project: {
                year_diff: {
                    $subtract: [
                        { $year: new Date() },
                        { $year: "$date_of_birth" }
                    ]
                }
            }
        },
        {
            $bucket: {
                groupBy: "$year_diff",
                boundaries: [0, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 100], // Define boundaries for age groups
                default: "Other",
                output: {
                    total_employees: { $sum: 1 },
                    age_group: {
                        $first: {
                            $switch: {
                                branches: [
                                    { case: { $and: [ { $gte: ["$year_diff", 0] }, { $lt: ["$year_diff", 20] } ] }, then: "0-19" },
                                    { case: { $and: [ { $gte: ["$year_diff", 20] }, { $lt: ["$year_diff", 25] } ] }, then: "20-24" },
                                    { case: { $and: [ { $gte: ["$year_diff", 25] }, { $lt: ["$year_diff", 30] } ] }, then: "25-29" },
                                    { case: { $and: [ { $gte: ["$year_diff", 30] }, { $lt: ["$year_diff", 35] } ] }, then: "30-34" },
                                    { case: { $and: [ { $gte: ["$year_diff", 35] }, { $lt: ["$year_diff", 40] } ] }, then: "35-39" },
                                    { case: { $and: [ { $gte: ["$year_diff", 40] }, { $lt: ["$year_diff", 45] } ] }, then: "40-44" },
                                    { case: { $and: [ { $gte: ["$year_diff", 45] }, { $lt: ["$year_diff", 50] } ] }, then: "45-49" },
                                    { case: { $and: [ { $gte: ["$year_diff", 50] }, { $lt: ["$year_diff", 55] } ] }, then: "50-54" },
                                    { case: { $and: [ { $gte: ["$year_diff", 55] }, { $lt: ["$year_diff", 60] } ] }, then: "55-59" },
                                    { case: { $and: [ { $gte: ["$year_diff", 60] }, { $lt: ["$year_diff", 65] } ] }, then: "60-64" },
                                    { case: { $and: [ { $gte: ["$year_diff", 65] }, { $lt: ["$year_diff", 70] } ] }, then: "65-69" },
                                    { case: { $gte: ["$year_diff", 70] }, then: "70+" }
                                ],
                                default: "Other"
                            }
                        }
                    }
                }
            }
        },
        {
            $group: {
                _id: "$age_group",
                total_employees: { $sum: "$total_employees" }
            }
        },
        {
            $project: {
                _id: 0,
                age_group: "$_id",
                total_employees: 1
            }
        },
        {
            $sort: {
                age_group: 1
            }
        }
    ]).then( (data)=>{
        if( data.length > 0 ){ 
            const outPutData = replaceNullUndefined( data );              
            return res.status(200).send( {'status':true, 'data': outPutData, 'message': 'API Accessed Successfully'} );
        }else{
            return res.status(200).send( {'status':false, 'message': 'No record matched'} );
        }
    }).catch( (error)=>{ 
        return res.status(200).send( {'status':false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE } ); 
    });
}

/***************** Get Employee list with Termination Type  wise  ***********************/
controller.getEmployeeByTerminationChart = ( req , res ) => {  

    const where = {}    
    if( req.body.hasOwnProperty('project_id') && req.body.project_id !== '' ){
        where['project_id'] = dbObjectId( req.body.project_id );
    }
 
    EmployeeCI.aggregate([
        {
            $match : where
        },
        {
            $match: {
                termination_mode: { $exists: true, $ne: null }
            }
        },
        {
            $group: {
              _id: "$termination_mode",  
              count: { $sum: 1 }  
            }
        }
    ]).then( (data)=>{
        if( data.length > 0 ){ 
            const resultData = [];
            for( var i = 0; i < data.length; i++ ){
                const push = {}
                push.terminated = 0;
                push.resigned = 0;
                push.retired = 0;
                push.contract_closer = 0;
                push.project_closer = 0;
                if( typeof data[i]._id !== 'undefined' && data[i]._id === 'Terminated' ){
                    push.terminated = parseInt( data[i].count );
                }
                if( typeof data[i]._id !== 'undefined' && data[i]._id === 'Resigned' ){
                    push.resigned = parseInt( data[i].count );
                }
                if( typeof data[i]._id !== 'undefined' && data[i]._id === 'Retired' ){
                    push.retired = parseInt( data[i].count );
                }
                if( typeof data[i]._id !== 'undefined' && data[i]._id === 'Contract-Closer' ){
                    push.contract_closer = parseInt( data[i].count );
                }
                if( typeof data[i]._id !== 'undefined' && data[i]._id === 'Project-Closer' ){
                    push.project_closer = parseInt( data[i].count );
                }
                resultData.push( push );
            }              
            return res.status(200).send( {'status':true, 'data': resultData, 'message': 'API Accessed Successfully'} );
        }else{
            return res.status(200).send( {'status':false, 'message': 'No record matched'} );
        }
    }).catch( (error)=>{ 
        return res.status(200).send( {'status':false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE } ); 
    });
}

/***************** Get Employee list on map  ***********************/
controller.getEmployeeCountForMapChart = ( req , res ) => { 

    const where = {}    
    if( req.body.hasOwnProperty('project_id') && req.body.project_id !== '' ){
        where['project_id'] = dbObjectId( req.body.project_id );
    }
     
    where.profile_status = 'Active';

    EmployeeCI.aggregate([
        {
            $match: where
        },
        {
            $unwind: "$offices" 
        },
        {
            $group: {
                _id: "$offices.city_name",
                count: { $sum: 1 }, 
                lat: { $first: "$offices.latitude" }, 
                lng: { $first: "$offices.longitude" } 
            }
        },
        {
            $project: {
                _id: 0, 
                name: "$_id", 
                count: 1,
                lat: 1,
                lng: 1
            }
        }
    ]).then( (data)=>{
        if( data.length > 0 ){ 
            
            return res.status(200).send( {'status':true, 'data': data, 'message': 'API Accessed Successfully'} );
        }else{
            return res.status(200).send( {'status':false, 'message': 'No record matched'} );
        }
    }).catch( (error)=>{ 
        return res.status(200).send( {'status':false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE } ); 
    });
}

/******************  Employee Fnf ***************/
controller.employeeFnf = ( req , res ) => {

    if (req.body && typeof req.body === 'object') { 
        req.body = JSON.parse(JSON.stringify(req.body));
    }

    const errors = validationResult(req);

    const { asset_handover_form, exit_interview_form  } = req.files;

    if (!errors.isEmpty()) {
        
        if( typeof asset_handover_form !== 'undefined' && asset_handover_form.length > 0 && asset_handover_form[0].filename !== '' ){ 
            removeFile( asset_handover_form[0].filename );
        }
        if( typeof exit_interview_form !== 'undefined' && exit_interview_form.length > 0 && exit_interview_form[0].filename !== '' ){
            removeFile( exit_interview_form[0].filename  );
        }
        return res.status(402).json({ status: false, message: errors.array()[0].msg });
    }       
    
    const { _id, termination_mode, ejection_mode, termination_reason, date_of_leaving  } = req.body; 
    
    const saveData = {}
    saveData.termination_mode = termination_mode;
    saveData.termination_reason = termination_reason;
    if( date_of_leaving !== '' ){
    saveData.date_of_leaving = dbDateFormat( termination_reason );
    }
    
    if( req.body.hasOwnProperty('notice_pay') && req.body.notice_pay !== '' ){
        saveData.notice_pay = req.body.notice_pay;
    }
    if( req.body.hasOwnProperty('recoverable_payable') && req.body.recoverable_payable !== ''  ){
        saveData.recoverable_payable = req.body.recoverable_payable;
    } 

    if( ejection_mode === 'Notice' ){
        saveData.job_status = 'onNotice';
    }else if( ejection_mode === 'Immediate' ){
        saveData.job_status = 'Immediate';
        saveData.profile_status = 'Closed'; 
    }

    /*close Project/Profile Conditions*/
    if( ['Retired','Contract-Closer','Project-Closer'].includes( termination_mode) ){
        saveData.profile_status = 'Closed';
        saveData.job_status = 'Closure';
    }


    

    const where = {}
    where._id = dbObjectId( _id );

    EmployeeCI.updateOne( where, {$set: saveData })
    .then((d)=>{
        return res.status(200).send( {'status':true, 'message': 'Profile Updated Successfully'} );
    })
    .catch( (error)=>{ 
        return res.status(200).send( {'status':false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE } ); 
    });
}

/********* Employee Notice Close   **********/
controller.employeeNoticeClose = ( req , res ) => {

    const errors = validationResult(req);

    if (!errors.isEmpty()) { 
        return res.status(400).json({ status: false, message: errors.array()[0].msg });
    } 
     
    const { _id } = req.body;

    const where = {}
    where._id = dbObjectId( _id );

    EmployeeCI.updateOne( where, {$set: {'profile_status':'Closed'} })
    .then((d)=>{
        return res.status(200).send( {'status':true, 'message': 'Profile Closed Successfully'} );
    })
    .catch( (error)=>{ 
        return res.status(200).send( {'status':false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE } ); 
    });

}

/********* Employee By Department Wise   **********/
controller.getEmployeeWithDepartmentWise = ( req , res ) => { 


    DepartmentCI.find( {'status':'Active'}, {'_id':0,'name':1,'priority':1} )
    .sort({'priority':1})
    .then((departmentData)=>{

                const where = {} 
                where['profile_status'] = 'Active';

                /**********  filter Manual Search ***********/
                if( req.body.hasOwnProperty('project_id') && req.body.project_id !== '' ){
                    where['project_id'] = dbObjectId( req.body.project_id );
                } 
            
                EmployeeCI.aggregate([
                    {
                        $match: where
                    },
                    {
                        $group: {
                          _id: "$department", 
                          count: { $sum: 1 }  
                        }
                      },
                      {
                        $project: {
                          department: "$_id",  
                          count: 1,
                          _id: 0  
                        }
                      }
                ]).then( (data)=>{
                    if( data.length > 0 ){ 
                        const outPutData = replaceNullUndefined( data );  
                        
                        const ResultData = [];
                        for( var i = 0; i < departmentData.length; i++ ){
                            const pushData = {}
                            const findData = outPutData.find((item)=> item.department === departmentData[i].name );
                            if( findData ){
                                pushData.count = parseInt( findData.count ); 
                                pushData.department = departmentData[i].name;
                                ResultData.push( pushData );
                            } 
                        }
                        return res.status(200).send( {'status':true, 'data': ResultData, 'message': 'API Accessed Successfully'} );
                    }else{
                        return res.status(200).send( {'status':false, 'message': 'No record matched'} );
                    }
                }).catch( (error)=>{ 
                    return res.status(200).send( {'status':false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE } ); 
                });

    }).catch( (error)=>{ 
        return res.status(200).send( {'status':false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE } ); 
    });
}


/********* Update kra KPI Data **********/
controller.updateKpiKraBulkData = ( req , res ) => {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(200).json({ status: false, message: errors.array()[0].msg });
    }   
    
    const { _id, session_year, kpi_kra_data } = req.body;

    EmployeeCI.findOne( { _id:  dbObjectId( _id ) }, {kpi_kra:1})
    .then(( oldData )=>{ 

    let saveData = {}     
    saveData.updated_on =  dbDateFormat(); 

    const prepareData = [];

    if( typeof oldData.kpi_kra !=='undefined' && oldData.kpi_kra.length > 0 ){
        const oldOtherSessionData = oldData.kpi_kra.filter((item)=> item.session_year !== session_year );
        for( var i = 0; i < oldOtherSessionData.length; i++ ){
            const push = {}
            push.sno = parseInt(oldOtherSessionData[i].sno);
            push.kpi = oldOtherSessionData[i].kpi;
            push.kra = oldOtherSessionData[i].kra;
            push.weightage = parseInt( oldOtherSessionData[i].weightage );
            push.target = parseInt( oldOtherSessionData[i].target );
            push.session_year = oldOtherSessionData[i].session_year;
            prepareData.push( push );
        }  
    }
        
    for( var i = 0; i < kpi_kra_data.length; i++ ){
        const push = {}
        push.sno = parseInt( kpi_kra_data[i].sno );
        push.kpi = kpi_kra_data[i].kpi;
        push.kra = kpi_kra_data[i].kra;
        push.weightage = parseInt( kpi_kra_data[i].weightage );
        push.target = parseInt( kpi_kra_data[i].target );
        push.session_year = session_year;
        prepareData.push( push );
    } 

    saveData.kpi_kra = [];
    saveData.kpi_kra = prepareData;

            EmployeeCI.updateOne( { _id:  dbObjectId( _id ) }, {$set: saveData} )
            .then( (data)=>{ 
                if( data ){
                    return res.status(200).send( {'status':true, 'message': 'Data Updated Successfully'} );
                }else{
                    return res.status(200).send( {'status':false, 'message': process.env.DEFAULT_ERROR_MESSAGE } );
                }
            }).catch( (error)=>{  
                return res.status(403).send( {'status':false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE } ); 
            });

    }).catch( (error)=>{
        return res.status(403).send( {'status':false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE } ); 
    });
}


/********* Update Employee Reporting Manager Data **********/
controller.updateReportingManagerData = ( req , res ) => {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(406).json({ status: false, message: errors.array()[0].msg });
    }

    const { _id, manager_id, manager_name, work_type } = req.body;

    EmployeeCI.findOne( { _id:  dbObjectId( _id ) }, { reporting_manager : 1} )
    .then( (data)=>{  
        
        const findItem = data.reporting_manager.find((item)=>item.manager_id.toString() === manager_id ); 

        if( findItem ){

                let arrayFilters = { 'arrayFilters': [{'one._id': findItem._id }] }

                let where = {}
                where['_id'] = dbObjectId( _id );
                where['reporting_manager._id'] = findItem._id;
                var saveData = {} 
                saveData.updated_on = dbDateFormat(); 
                saveData['reporting_manager.$[one].manager_id'] = dbObjectId( manager_id );
                saveData['reporting_manager.$[one].manager_name'] = manager_name;
                saveData['reporting_manager.$[one].work_type'] = work_type;

                EmployeeCI.updateOne( { _id:  dbObjectId( _id ) }, {$set: saveData}, arrayFilters  )
                .then( (upData)=>{ 
                    return res.status(200).send( {'status':true, 'message': 'Manager Data Updated Successfully'} ); 
                }).catch( (error)=>{
                    return res.status(403).send( {'status':false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE } ); 
                });
        }else{

                let saveData = {}
                saveData.updated_on = dbDateFormat(); 

                const savePriorityData = {}
                savePriorityData.manager_id = dbObjectId( manager_id ); 
                savePriorityData.manager_name =  manager_name;
                savePriorityData.work_type =  work_type; 

                EmployeeCI.updateOne( { _id:  dbObjectId( _id ) }, {$set: saveData, $push : {'reporting_manager': savePriorityData }} )
                .then( (upData)=>{ 
                    return res.status(200).send( {'status':true, 'message': 'Manager Data Updated Successfully'} ); 
                }).catch( (error )=>{ 
                    return res.status(403).send( {'status':false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE } ); 
                });
        }
    }).catch( (error)=>{  
        return res.status(403).send( {'status':false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE } ); 
    }); 
}

/********* Delete Reporting Manager Data **********/
controller.deleteReportingManagerData = ( req , res ) => {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(406).json({ status: false, message: errors.array()[0].msg });
    }

    const { _id, manager_id } = req.body; 

    EmployeeCI.updateOne(
        { _id: dbObjectId( _id ) },
        { $pull: { reporting_manager: { manager_id:  dbObjectId( manager_id ) } } }
      )
      .then( (upData)=>{ 
        return res.status(200).send( {'status':true, 'message': 'Manager Data Deleted Successfully'} );           
    }).catch( (error)=>{  
        return res.status(403).send( {'status':false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE } ); 
    });
    
}



/***************** Get Contract Closer Month Wise  ***********************/
controller.getContractCloserChart = ( req , res ) => {  

    const where = {}    
    if( req.body.hasOwnProperty('project_id') && req.body.project_id !== '' ){
        where['project_id'] = dbObjectId( req.body.project_id );
    }

    where['employee_type'] = "onContract";
    where['job_status'] = "Closure";
    where['termination_mode'] = {$in: ["Contract-Closer","Project-Closer"]};

    
 
    EmployeeCI.aggregate([
        {
          $match: where
        },
        {
          $group: {
            _id: { 
              year: { $year: "$date_of_leaving" },   
              month: { $month: "$date_of_leaving" }
            },
            count: { $sum: 1 } 
          }
        },
        {
          $sort: { "_id.year": -1, "_id.month": -1 } 
        },
        {
          $project: {
            _id: 0, 
            month: { 
              $let: {
                vars: {
                  monthsInString: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
                },
                in: { $arrayElemAt: ["$$monthsInString", { $subtract: ["$_id.month", 1] }] }
              }
            },
            year: "$_id.year",
            count: 1 
          }
        }
      ]).then( (data)=>{
        
            const monthList = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
            const resultData = [];
            for( var i = 0; i < monthList.length; i++ ){
                const push = {}
                push.month = monthList[i];
                push.count = 0;  
                const findData = data.find((item)=>item.month === monthList[i] );
                if( typeof findData !== 'undefined' && findData ){
                    push.month = monthList[i];
                    push.count = findData.count || 0; 
                }
                resultData.push( push );
            }              
            return res.status(200).send( {'status':true, 'data': resultData, 'message': 'API Accessed Successfully'} ); 
    }).catch( (error)=>{ 
        return res.status(200).send( {'status':false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE } ); 
    });
}


/***************** Get Contract Closer Month Wise  ***********************/
controller.getOnRoleVsContractChart = ( req , res ) => {  

    if( req.body.hasOwnProperty('project_id') && req.body.project_id !== '' ){

        const where = {} 
        where['status'] = 'Active';           

        DesignationCl.aggregate([
            {
                $match: where 
            },
            { 
                $unwind: "$priority_list" 
            },
            {
                $match: {'priority_list.project_id':dbObjectId( req.body.project_id ) } 
            },
            {
                $project: {
                    _id: '$_id', 
                    name: '$name', 
                    priority: "$priority_list.priority", 
                }
            } ,
            {
                $sort: { priority: 1 }  
            }
        ]).then( (designationData)=>{

                    const where = {}  
                         where['project_id'] = dbObjectId( req.body.project_id ); 

                        EmployeeCI.aggregate([
                            {
                            $group: {
                                _id: {
                                designation: "$designation",
                                employee_type: "$employee_type" 
                                },
                                count: { $sum: 1 }
                            }
                            },
                            {
                            $group: {
                                _id: "$_id.designation",
                                onrole: {
                                $sum: {
                                    $cond: [{ $eq: ["$_id.employee_type", "onRole"] }, "$count", 0]
                                }
                                },
                                oncontract: {
                                $sum: {
                                    $cond: [{ $eq: ["$_id.employee_type", "onContract"] }, "$count", 0]
                                }
                                }
                            }
                            },
                            {
                            $project: {
                                _id: 0,
                                designation: "$_id",
                                onrole: "$onrole",
                                oncontract: "$oncontract"
                            }
                            }
                        ])
                        .then( (data)=>{ 
                        
                            if( data.length > 0 ){ 
                                const outPutData = replaceNullUndefined( data );  
                        
                                const ResultData = [];
                                for( var i = 0; i < designationData.length; i++ ){
                                    const pushData = {}
                                    const findData = outPutData.find((item)=> item.designation === designationData[i].name );
                                    if( findData ){
                                        pushData.designation = designationData[i].name;
                                        pushData.onrole = parseInt( findData.onrole ); 
                                        pushData.oncontract = parseInt( findData.oncontract ); 
                                        ResultData.push( pushData );
                                    }
                                } 
    
                                return res.status(200).send( {'status':true, 'data': ResultData, 'message': 'API Accessed Successfully'} ); 
                            }else{
                                return res.status(200).send( {'status':false, 'message': 'No record matched'} );
                            }  
                        }).catch( (error)=>{ 
                            return res.status(200).send( {'status':false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE } ); 
                        });

        }).catch( (error)=>{ 
            return res.status(200).send( {'status':false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE } ); 
        });
    }else{
        DesignationCl.find( {'status':'Active'}, {_id:0,name:1,priority:1} )
            .sort({'priority':1})
            .then((designationData)=>{

                    EmployeeCI.aggregate([
                        {
                        $group: {
                            _id: {
                            designation: "$designation",
                            employee_type: "$employee_type" 
                            },
                            count: { $sum: 1 }
                        }
                        },
                        {
                        $group: {
                            _id: "$_id.designation",
                            onrole: {
                            $sum: {
                                $cond: [{ $eq: ["$_id.employee_type", "onRole"] }, "$count", 0]
                            }
                            },
                            oncontract: {
                            $sum: {
                                $cond: [{ $eq: ["$_id.employee_type", "onContract"] }, "$count", 0]
                            }
                            }
                        }
                        },
                        {
                        $project: {
                            _id: 0,
                            designation: "$_id",
                            onrole: "$onrole",
                            oncontract: "$oncontract"
                        }
                        }
                    ])
                    .then( (data)=>{  

                        if( data.length > 0 ){ 
                            const outPutData = replaceNullUndefined( data );  
                    
                            const ResultData = [];
                            for( var i = 0; i < designationData.length; i++ ){
                                const pushData = {}
                                const findData = outPutData.find((item)=> item.designation === designationData[i].name );
                                if( findData ){
                                    pushData.designation = designationData[i].name;
                                    pushData.onrole = parseInt( findData.onrole ); 
                                    pushData.oncontract = parseInt( findData.oncontract ); 
                                    ResultData.push( pushData );
                                }
                            } 

                            return res.status(200).send( {'status':true, 'data': ResultData, 'message': 'API Accessed Successfully'} ); 
                        }else{
                            return res.status(200).send( {'status':false, 'message': 'No record matched'} );
                        }    
                    }).catch( (error)=>{ 
                        return res.status(200).send( {'status':false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE } ); 
                    }); 

            }).catch( (error)=>{ 
                return res.status(200).send( {'status':false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE } ); 
            });
    }
}

/***************** Get Appraisal Cycle Month Wise  ***********************/
controller.getAppraisalCycleChart = ( req , res ) => {  
 

    where['employee_type'] = "onContract";
    where['job_status'] = "Closure";
    where['termination_mode'] = {$in: ["Contract-Closer","Project-Closer"]}; 
    
 
    EmployeeCI.aggregate([
        {
          $match: where
        },
        {
          $group: {
            _id: { 
              year: { $year: "$date_of_leaving" },   
              month: { $month: "$date_of_leaving" }
            },
            count: { $sum: 1 } 
          }
        },
        {
          $sort: { "_id.year": -1, "_id.month": -1 } 
        },
        {
          $project: {
            _id: 0, 
            month: { 
              $let: {
                vars: {
                  monthsInString: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
                },
                in: { $arrayElemAt: ["$$monthsInString", { $subtract: ["$_id.month", 1] }] }
              }
            },
            year: "$_id.year",
            count: 1 
          }
        }
      ]).then( (data)=>{
        
            const monthList = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
            const resultData = [];
            for( var i = 0; i < monthList.length; i++ ){
                const push = {}
                push.month = monthList[i];
                push.count = 0;  
                const findData = data.find((item)=>item.month === monthList[i] );
                if( typeof findData !== 'undefined' && findData ){
                    push.month = monthList[i];
                    push.count = findData.count || 0; 
                }
                resultData.push( push );
            }    
            return res.status(200).send( {'status':true, 'data': resultData, 'message': 'API Accessed Successfully'} ); 
    }).catch( (error)=>{ 
        return res.status(200).send( {'status':false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE } ); 
    });
}


controller.getDesignationWiseEmployeeList = ( req , res ) => {  
   
    const { page_no, per_page_record, scope_fields  } = req.body;   

    const where = {}  
    const fetchKeys = {}
    
    if( req.body.hasOwnProperty('scope_fields') && scope_fields.length > 0 ){
        scope_fields.forEach(field => {
            fetchKeys[field] = 1;  
        }); 
    }else{
        fetchKeys.__v = 0;
    }

    if( req.body.hasOwnProperty('keyword') && req.body.keyword !== '' ){
        if( isValidEmail( req.body.keyword ) ){
            where['email'] =  req.body.keyword ; 
        }
        else if(  req.body.keyword.length === 10 ){
            where['mobile_no'] =  req.body.keyword; 
        }else if(  numbersOnly(req.body.keyword).length >= 4 && numbersOnly(req.body.keyword).length <= 6 ){
            where['employee_code'] =  req.body.keyword ; 
        }else{
            let searchKeyWord = new RegExp( lettersOnly( req.body.keyword ) );
            where['name'] = { $regex: searchKeyWord, $options: 'i' } 
        }  
    } 

    if( req.body.hasOwnProperty('project_id') && req.body.project_id !== '' ){ 
        where['project_id'] =  dbObjectId( req.body.project_id );  
    } 

    if( req.body.hasOwnProperty('designation_id') && req.body.designation_id !== '' ){ 
        where['designation_id'] =  dbObjectId( req.body.designation_id );  
    }else if( req.body.hasOwnProperty('designation') && req.body.designation !== '' ){ 
        where['designation'] = req.body.designation ;  
    }  

    if( req.body.hasOwnProperty('batch_id') && req.body.batch_id !== '' ){ 
       // where['batch_id'] =  parseInt( req.body.batch_id );  
    }  

    const pageOptions = {
        page: parseInt( ((page_no ? page_no : 1) - 1)) || 0,
        limit: parseInt( per_page_record) || 10
    } 
    

    EmployeeCI.find( where, fetchKeys )
    .skip( pageOptions.page * pageOptions.limit )
    .limit( pageOptions.limit )
    .sort( { _id: 1 } )
    .then( (data)=>{ 

        if( data.length > 0 ){ 
            const outPutData = updateDatesInArray(  replaceNullUndefined( data ) , ['appraisal_date','joining_date'] , 'date' );              
            return res.status(200).send( {'status':true, 'data': outPutData, 'message': 'API Accessed Successfully'} );
        }else{
            return res.status(403).send( {'status':false, 'message': 'No record matched'} );
        }
    }).catch( (error)=>{
        
        return res.status(403).send( {'status':false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE } ); 
    });
}

controller.uploadEmployeeSignature = ( req , res ) => {

    if (req.body && typeof req.body === 'object') { 
        req.body = JSON.parse(JSON.stringify(req.body));
    } 
    
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        if( req.file &&  req.file.filename ){
            removeFile( req.file.filename );
        }
        return res.status(403).json({ status: false, message: errors.array()[0].msg });
    }
    
    const { _id, doc_category, doc_name, sub_doc_category, add_by_name, add_by_email, add_by_mobile,add_by_designation } = req.body;  

    const saveData = {}
    saveData.updated_on = dbDateFormat();
   
    EmployeeCI.findOne({'_id': dbObjectId( _id )}, {'docs':1,'email':1 } )
    .then( (data)=>{  

            const findDocInList = data.docs.length > 0 ? data.docs.find((item)=> item.doc_category === doc_category && item.doc_name === doc_name ) : false;
        
            if( typeof findDocInList !== 'undefined' && findDocInList ){ 
                let arrayFilters = { 'arrayFilters': [{'one._id': findDocInList._id }] }
                let where = {}
                where['_id'] = dbObjectId( _id );
                where['docs._id'] = findDocInList._id;
                
                saveData['docs.$[one].doc_category'] = doc_category;
                if(typeof sub_doc_category !== 'undefined' ){
                saveData['docs.$[one].sub_doc_category'] = sub_doc_category; 
                }
                saveData['docs.$[one].doc_name'] = doc_name;
                saveData['docs.$[one].file_name'] = req.file.filename;
                saveData['docs.$[one].mime_type'] = getImageType(req.file.mimetype);
                saveData['docs.$[one].file_size'] = convertBitsIntoKbMb(req.file.size);
                saveData['docs.$[one].add_date']  = dbDateFormat();
                saveData['docs.$[one].status']  = 'complete'; 
                if(typeof req.body.add_by_name !== 'undefined' && req.body.add_by_name !== '' ){
                    saveData['docs.$[one].added_by'] = { name: add_by_name || 'na', email:add_by_email || 'na', mobile: add_by_mobile || 'na',designation: add_by_designation || 'na' };
                }
                
                EmployeeCI.updateOne( where, { $set: saveData }, arrayFilters )
                .then( (resp)=>{  
                    if( findDocInList.file_name ){
                        removeFile( findDocInList.file_name );
                    }
                    return res.status(200).send( {'status':true, 'message': `${doc_name} Updated Successfully` } ); 
                })
                .catch( (error) => {
                    return res.status(403).send( {'status':false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE } ); 
                })
            }else{
                var saveDoc =  {}
                saveDoc.doc_category = doc_category;
                if(typeof sub_doc_category !== 'undefined' ){
                saveDoc.sub_doc_category = sub_doc_category;
                }
                saveDoc.doc_name = doc_name;
                saveDoc.docs = [];
                saveDoc.file_name = req.file.filename;
                saveDoc.mime_type = getImageType(req.file.mimetype);
                saveDoc.file_size = convertBitsIntoKbMb(req.file.size);
                saveDoc.add_date = dbDateFormat(); 
                saveDoc.status  = 'complete';
                if(typeof req.body.add_by_name !== 'undefined' && req.body.add_by_name !== '' ){
                    saveDoc.added_by = { name: add_by_name || 'na', email:add_by_email || 'na', mobile: add_by_mobile || 'na',designation: add_by_designation || 'na' };
                    saveDoc.verify_by = { name: add_by_name || 'na', email:add_by_email || 'na', mobile: add_by_mobile || 'na',designation: add_by_designation || 'na' };
                }
                
                
                EmployeeCI.updateOne( { _id:  dbObjectId( _id ) }, { $set: saveData , $push: { docs: saveDoc } } )
                .then( (data)=>{ 
                    return res.status(200).send( {'status':true, 'message': `${doc_name} Updated Successfully` } ); 
                }).catch( (error)=>{
                    return res.status(403).send( {'status':false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE } ); 
                });
            }

    }).catch((error)=>{
        return res.status(403).send( {'status':false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE } ); 
    });
}


controller.uploadEmployeeKycDocs = ( req , res ) => {

    if (req.body && typeof req.body === 'object') { 
        req.body = JSON.parse(JSON.stringify(req.body));
    } 
    
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        if( req.file &&  req.file.filename ){
            removeEmployeeFile( req.file.filename );
        }
        return res.status(403).json({ status: false, message: errors.array()[0].msg });
    }
    
    const { _id, doc_category, doc_name, sub_doc_category, add_by_name, add_by_email, add_by_mobile,add_by_designation  } = req.body;  

    const saveData = {}
    saveData.updated_on = dbDateFormat();
   
    EmployeeCI.findOne({'_id': dbObjectId( _id )}, {'docs':1,'email':1 } )
    .then( (data)=>{  

            const findDocInList = data.docs.length > 0 ? data.docs.find((item)=> item.doc_category === doc_category && item.doc_name === doc_name ) : false;
        
            if( typeof findDocInList !== 'undefined' && findDocInList ){ 
                let arrayFilters = { 'arrayFilters': [{'one._id': findDocInList._id }] }
                let where = {}
                where['_id'] = dbObjectId( _id );
                where['docs._id'] = findDocInList._id;
                
                saveData['docs.$[one].doc_category'] = doc_category;
                if(typeof sub_doc_category !== 'undefined' ){
                saveData['docs.$[one].sub_doc_category'] = sub_doc_category; 
                }
                saveData['docs.$[one].doc_name'] = doc_name;
                saveData['docs.$[one].file_name'] = req.file.filename;
                saveData['docs.$[one].mime_type'] = getImageType(req.file.mimetype);
                saveData['docs.$[one].file_size'] = convertBitsIntoKbMb(req.file.size);
                saveData['docs.$[one].add_date']  = dbDateFormat();
                saveData['docs.$[one].status']  = 'complete';
                if(typeof req.body.add_by_name !== 'undefined' && req.body.add_by_name !== '' ){
                    saveData['docs.$[one].added_by'] = { name: add_by_name || 'na', email:add_by_email || 'na', mobile: add_by_mobile || 'na',designation: add_by_designation || 'na' };
                }
                
                EmployeeCI.updateOne( where, { $set: saveData }, arrayFilters )
                .then( (resp)=>{  
                    if( findDocInList.file_name ){
                        removeEmployeeFile( findDocInList.file_name );
                    }
                    return res.status(200).send( {'status':true, 'message': `${doc_name} Updated Successfully` } ); 
                })
                .catch( (error) => {
                    return res.status(403).send( {'status':false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE } ); 
                })
            }else{
                var saveDoc =  {}
                saveDoc.doc_category = doc_category;
                if(typeof sub_doc_category !== 'undefined' ){
                saveDoc.sub_doc_category = sub_doc_category;
                }
                saveDoc.doc_name = doc_name;
                saveDoc.docs = [];
                saveDoc.file_name = req.file.filename;
                saveDoc.mime_type = getImageType(req.file.mimetype);
                saveDoc.file_size = convertBitsIntoKbMb(req.file.size);
                saveDoc.add_date = dbDateFormat(); 
                saveDoc.status  = 'complete';
                if(typeof req.body.add_by_name !== 'undefined' && req.body.add_by_name !== '' ){
                    saveDoc.added_by = { name: add_by_name || 'na', email:add_by_email || 'na', mobile: add_by_mobile || 'na',designation: add_by_designation || 'na' };
                    saveDoc.verify_by = { name: add_by_name || 'na', email:add_by_email || 'na', mobile: add_by_mobile || 'na',designation: add_by_designation || 'na' };
                }
                
                EmployeeCI.updateOne( { _id:  dbObjectId( _id ) }, { $set: saveData , $push: { docs: saveDoc } } )
                .then( (data)=>{ 
                    return res.status(200).send( {'status':true, 'message': `${doc_name} Updated Successfully` } ); 
                }).catch( (error)=>{
                    return res.status(403).send( {'status':false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE } ); 
                });
            }

    }).catch((error)=>{
        return res.status(403).send( {'status':false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE } ); 
    });
}

controller.addEmployeeFamilyDetails = ( req, res )=>{

        const errors = validationResult(req);

        if (!errors.isEmpty()) { 
            return res.status(403).json({ status: false, message: errors.array()[0].msg });
        }

        const { employee_doc_id , family_data } = req.body;
       

        saveData = {}; 
        saveData.updated_on =  dbDateFormat();
        
        if( typeof req.body.family_data !== 'undefined' && req.body.family_data !== '' ){
            saveData.family_details =  req.body.family_data.map((item)=>{
                const push = {}
                push.name = item.name;
                push.age = item.age;
                push.name = item.name;
                push.gender = item.gender;
                push.relationship = item.relationship;
                push.is_independent = item.is_independent;
                push.occupation = item.occupation;
                push.add_by = item.add_by;
                push.add_date = dbDateFormat();
                return push;
            });
        }

        EmployeeCI.updateOne( { _id:  dbObjectId( employee_doc_id ) }, { $set: saveData } )
        .then( (data)=>{ 
            return res.status(200).send( {'status':true, 'message': `Family Data Updated Successfully` } ); 
        }).catch( (error)=>{
            return res.status(403).send( {'status':false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE } ); 
        });
}
 
/*Add Reference Check Form Data*/
controller.addReferenceCheckData = ( req, res )=>{

    const errors = validationResult(req);

    if (!errors.isEmpty()) { 
        return res.status(403).json({ status: false, message: errors.array()[0].msg });
    }

    const { employee_doc_id  } = req.body;
   

    saveData = {}; 
    delete( req.body.employee_doc_id );
    req.body.add_date = dbDateFormat();
    saveData.reference_check_form_data = req.body;
    saveData.updated_on =  dbDateFormat(); 
    saveData.reference_check_form_status = 'Complete';
   

    EmployeeCI.updateOne( { _id:  dbObjectId( employee_doc_id ) }, { $set: saveData } )
    .then( (data)=>{ 
        return res.status(200).send( {'status':true, 'message': `Family Data Updated Successfully` } ); 
    }).catch( (error)=>{
        return res.status(403).send( {'status':false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE } ); 
    });
}

/*Add Induction Form Data*/
controller.addInductionFormData = ( req, res )=>{

    if (req.body && typeof req.body === 'object') { 
        req.body = JSON.parse(JSON.stringify(req.body));
    } 
    
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        if( req.file && typeof req.file.filename !== 'undefined' && req.file.filename !== '' ){
            removeEmployeeFile( req.file.filename );
        }
        return res.status(403).json({ status: false, message: errors.array()[0].msg });
    }

    const { employee_doc_id  } = req.body;
   

    saveData = {}; 
    delete( req.body.employee_doc_id );
    req.body.add_date = dbDateFormat();
    if(req.file && typeof req.file.filename !== 'undefined' && req.file.filename !== '' ){
     req.body.signature = req.file.filename;
    }

    saveData.induction_form_data = req.body;
    saveData.updated_on =  dbDateFormat();  
    saveData.induction_form_status = 'Complete';
   

    EmployeeCI.updateOne( { _id:  dbObjectId( employee_doc_id ) }, { $set: saveData } )
    .then( (data)=>{ 
        return res.status(200).send( {'status':true, 'message': `Induction Data Updated Successfully` } ); 
    }).catch( (error)=>{
        return res.status(403).send( {'status':false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE } ); 
    });
}

/*Add Employee Joining Kit Document Data*/
controller.uploadEmployeeJoiningKit = ( req , res ) => {

    if (req.body && typeof req.body === 'object') { 
        req.body = JSON.parse(JSON.stringify(req.body));
    }
    
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        if( req.file &&  req.file.filename ){
            removeEmployeeFile( req.file.filename );
        }
        return res.status(403).json({ status: false, message: errors.array()[0].msg });
    }
    
    if( !req.file ){
        return res.status(403).send( {'status':false, 'message': 'Please browse image' } ); 
    }
    
    const { employee_doc_id, document_name, add_by_name,add_by_email,add_by_mobile,add_by_designation } = req.body;  

    const saveData = {}
    saveData.updated_on = dbDateFormat();
    saveData.joining_kit_status = 'Complete';
    
    EmployeeCI.findOne({'_id': dbObjectId( employee_doc_id )}, {'joining_kit_docs':1,'email':1 } )
    .then( (data)=>{   
            const findDocInList = typeof data.joining_kit_docs !=='undefined' && data.joining_kit_docs.length > 0 ? data.joining_kit_docs.find((item)=> item.document_name === document_name ) : false;
           
            if( typeof findDocInList !== 'undefined' && findDocInList ){  
                let arrayFilters = { 'arrayFilters': [{'one._id': findDocInList._id }] }
                let where = {}
                where['_id'] = dbObjectId( employee_doc_id );
                where['joining_kit_docs._id'] = findDocInList._id;
                saveData['joining_kit_docs.$[one].document_name'] = document_name;
                saveData['joining_kit_docs.$[one].file_name'] = req.file.filename;
                saveData['joining_kit_docs.$[one].mime_type'] = getImageType(req.file.mimetype);
                saveData['joining_kit_docs.$[one].file_size'] = convertBitsIntoKbMb(req.file.size);
                saveData['joining_kit_docs.$[one].updated_on']  = dbDateFormat(); 
                if(typeof req.body.add_by_name !== 'undefined' && req.body.add_by_name !== '' ){
                saveData['joining_kit_docs.$[one].added_by'] = { name: add_by_name || 'na', email:add_by_email || 'na', mobile: add_by_mobile || 'na',designation: add_by_designation || 'na' };
                }
               
                EmployeeCI.updateOne( where, { $set: saveData }, arrayFilters )
                .then( (resp)=>{
                    if( findDocInList.file_name ){
                        removeEmployeeFile( findDocInList.file_name );
                    }
                    return res.status(200).send( {'status':true, 'message': `${document_name} Updated Successfully` } ); 
                })
                .catch( (error) => {  
                    return res.status(403).send( {'status':false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE } ); 
                })
            }else{
                var saveDoc =  {}
                saveDoc.document_name = document_name;
                saveDoc.file_name = req.file.filename;
                saveDoc.mime_type = getImageType(req.file.mimetype);
                saveDoc.file_size = convertBitsIntoKbMb(req.file.size);
                saveDoc.add_date = dbDateFormat(); 
                if(typeof req.body.add_by_name !== 'undefined' && req.body.add_by_name !== '' ){
                    saveDoc.added_by = { name: add_by_name || 'na', email:add_by_email || 'na', mobile: add_by_mobile || 'na',designation: add_by_designation || 'na' };
                    saveDoc.verify_by = { name: add_by_name || 'na', email:add_by_email || 'na', mobile: add_by_mobile || 'na',designation: add_by_designation || 'na' };
                }
                
                EmployeeCI.updateOne( { _id:  dbObjectId( employee_doc_id ) }, { $set: saveData , $push: { joining_kit_docs: saveDoc } } )
                .then( (data)=>{ 
                    return res.status(200).send( {'status':true, 'message': `${document_name} Uploaded Successfully` } ); 
                }).catch( (error)=>{  
                    return res.status(403).send( {'status':false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE } ); 
                });
            }

    }).catch((error)=>{
        return res.status(403).send( {'status':false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE } ); 
    });
}

/*Add Employee Appointment Letter Document Data*/
controller.uploadEmployeeOfferLetter = ( req , res ) => {

    if (req.body && typeof req.body === 'object') { 
        req.body = JSON.parse(JSON.stringify(req.body));
    }
    
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        if( req.file &&  req.file.filename ){
            removeEmployeeFile( req.file.filename );
        }
        return res.status(403).json({ status: false, message: errors.array()[0].msg });
    }
    
    if( !req.file ){
        return res.status(403).send( {'status':false, 'message': 'Please browse image' } ); 
    }
    
    const { employee_doc_id, document_name, add_by_name,add_by_email,add_by_mobile,add_by_designation  } = req.body;  

    const saveData = {}
    saveData.updated_on = dbDateFormat();
    saveData.offer_letter_status = 'Complete';
    
    EmployeeCI.findOne({'_id': dbObjectId( employee_doc_id )}, {'offer_letter_docs':1,'email':1 } )
    .then( (data)=>{   
            const findDocInList = typeof data.offer_letter_docs !=='undefined' && data.offer_letter_docs.length > 0 ? data.offer_letter_docs.find((item)=> item.document_name === document_name ) : false;
           
            if( typeof findDocInList !== 'undefined' && findDocInList ){  
                let arrayFilters = { 'arrayFilters': [{'one._id': findDocInList._id }] }
                let where = {}
                where['_id'] = dbObjectId( employee_doc_id );
                where['offer_letter_docs._id'] = findDocInList._id;
                saveData['offer_letter_docs.$[one].document_name'] = document_name;
                saveData['offer_letter_docs.$[one].file_name'] = req.file.filename;
                saveData['offer_letter_docs.$[one].mime_type'] = getImageType(req.file.mimetype);
                saveData['offer_letter_docs.$[one].file_size'] = convertBitsIntoKbMb(req.file.size);
                saveData['offer_letter_docs.$[one].updated_on']  = dbDateFormat(); 
                if(typeof req.body.add_by_name !== 'undefined' && req.body.add_by_name !== '' ){
                saveData['offer_letter_docs.$[one].added_by'] = { name: add_by_name || 'na', email:add_by_email || 'na', mobile: add_by_mobile || 'na',designation: add_by_designation || 'na' };
                }
               
                EmployeeCI.updateOne( where, { $set: saveData }, arrayFilters )
                .then( (resp)=>{
                    if( findDocInList.file_name ){  
                        removeEmployeeFile( findDocInList.file_name );
                    }
                    return res.status(200).send( {'status':true, 'message': `${document_name} Updated Successfully` } ); 
                })
                .catch( (error) => {  
                    return res.status(403).send( {'status':false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE } ); 
                })
            }else{
                var saveDoc =  {}
                saveDoc.document_name = document_name;
                saveDoc.file_name = req.file.filename;
                saveDoc.mime_type = getImageType(req.file.mimetype);
                saveDoc.file_size = convertBitsIntoKbMb(req.file.size);
                saveDoc.add_date = dbDateFormat();
                if(typeof req.body.add_by_name !== 'undefined' && req.body.add_by_name !== '' ){
                    saveDoc.added_by = { name: add_by_name || 'na', email:add_by_email || 'na', mobile: add_by_mobile || 'na',designation: add_by_designation || 'na' };
                    saveDoc.verify_by = { name: add_by_name || 'na', email:add_by_email || 'na', mobile: add_by_mobile || 'na',designation: add_by_designation || 'na' };
                }
                
                EmployeeCI.updateOne( { _id:  dbObjectId( employee_doc_id ) }, { $set: saveData , $push: { offer_letter_docs: saveDoc } } )
                .then( (data)=>{
                    return res.status(200).send( {'status':true, 'message': `${document_name} Uploaded Successfully` } ); 
                }).catch( (error)=>{
                    return res.status(403).send( {'status':false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE } ); 
                });
            }

    }).catch((error)=>{
        return res.status(403).send( {'status':false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE } ); 
    });
}

/*Add Employee Offer Letter Document Data*/
controller.uploadEmployeeAppointmentLetter = ( req , res ) => {

    if (req.body && typeof req.body === 'object') { 
        req.body = JSON.parse(JSON.stringify(req.body));
    }
    
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        if( req.file &&  req.file.filename ){
            removeEmployeeFile( req.file.filename );
        }
        return res.status(403).json({ status: false, message: errors.array()[0].msg });
    }
    
    if( !req.file ){
        return res.status(403).send( {'status':false, 'message': 'Please browse image' } ); 
    }
    
    const { employee_doc_id, document_name, add_by_name,add_by_email,add_by_mobile,add_by_designation  } = req.body;  

    const saveData = {}
    saveData.updated_on = dbDateFormat();
    saveData.appointment_letter_status = 'Complete';
    
    EmployeeCI.findOne({'_id': dbObjectId( employee_doc_id )}, {'appointment_letter_docs':1,'email':1 } )
    .then( (data)=>{   
            const findDocInList = typeof data.appointment_letter_docs !=='undefined' && data.appointment_letter_docs.length > 0 ? data.appointment_letter_docs.find((item)=> item.document_name === document_name ) : false;
           
            if( typeof findDocInList !== 'undefined' && findDocInList ){  
                let arrayFilters = { 'arrayFilters': [{'one._id': findDocInList._id }] }
                let where = {}
                where['_id'] = dbObjectId( employee_doc_id );
                where['appointment_letter_docs._id'] = findDocInList._id;
                saveData['appointment_letter_docs.$[one].document_name'] = document_name;
                saveData['appointment_letter_docs.$[one].file_name'] = req.file.filename;
                saveData['appointment_letter_docs.$[one].mime_type'] = getImageType(req.file.mimetype);
                saveData['appointment_letter_docs.$[one].file_size'] = convertBitsIntoKbMb(req.file.size);
                saveData['appointment_letter_docs.$[one].updated_on']  = dbDateFormat(); 
                if(typeof req.body.add_by_name !== 'undefined' && req.body.add_by_name !== '' ){
                saveData['appointment_letter_docs.$[one].added_by'] = { name: add_by_name || 'na', email:add_by_email || 'na', mobile: add_by_mobile || 'na',designation: add_by_designation || 'na' };
                }

                EmployeeCI.updateOne( where, { $set: saveData }, arrayFilters )
                .then( (resp)=>{
                    if( findDocInList.file_name ){  
                        removeEmployeeFile( findDocInList.file_name );
                    }
                    return res.status(200).send( {'status':true, 'message': `${document_name} Updated Successfully` } ); 
                })
                .catch( (error) => {  
                    return res.status(403).send( {'status':false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE } ); 
                })
            }else{
                var saveDoc =  {}
                saveDoc.document_name = document_name;
                saveDoc.file_name = req.file.filename;
                saveDoc.mime_type = getImageType(req.file.mimetype);
                saveDoc.file_size = convertBitsIntoKbMb(req.file.size);
                saveDoc.add_date = dbDateFormat();
                if(typeof req.body.add_by_name !== 'undefined' && req.body.add_by_name !== '' ){
                    saveDoc.added_by = { name: add_by_name || 'na', email:add_by_email || 'na', mobile: add_by_mobile || 'na',designation: add_by_designation || 'na' };
                    saveDoc.verify_by = { name: add_by_name || 'na', email:add_by_email || 'na', mobile: add_by_mobile || 'na',designation: add_by_designation || 'na' };
                }
                
                EmployeeCI.updateOne( { _id:  dbObjectId( employee_doc_id ) }, { $set: saveData , $push: { appointment_letter_docs: saveDoc } } )
                .then( (data)=>{
                    return res.status(200).send( {'status':true, 'message': `${document_name} Uploaded Successfully` } ); 
                }).catch( (error)=>{
                    return res.status(403).send( {'status':false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE } ); 
                });
            }

    }).catch((error)=>{
        return res.status(403).send( {'status':false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE } ); 
    });
}

/*Add Employee Induction Physical Form Data*/
controller.uploadEmployeePhysicalForm = ( req , res ) => {

    if (req.body && typeof req.body === 'object') { 
        req.body = JSON.parse(JSON.stringify(req.body));
    }
    
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        if( req.file &&  req.file.filename ){
            removeEmployeeFile( req.file.filename );
        }
        return res.status(403).json({ status: false, message: errors.array()[0].msg });
    }
    
    
    const { employee_doc_id, document_name, add_by_name,add_by_email,add_by_mobile,add_by_designation } = req.body;  

    const saveData = {}
    saveData.updated_on = dbDateFormat();
    
    EmployeeCI.findOne({'_id': dbObjectId( employee_doc_id )}, {'induction_physical_form_docs':1,'email':1 } )
    .then( (data)=>{   
            const findDocInList = typeof data.induction_physical_form_docs !=='undefined' && data.induction_physical_form_docs.length > 0 ? data.induction_physical_form_docs.find((item)=> item.document_name === document_name ) : false;
           
            if( typeof findDocInList !== 'undefined' && findDocInList ){  
                let arrayFilters = { 'arrayFilters': [{'one._id': findDocInList._id }] }
                let where = {}
                where['_id'] = dbObjectId( employee_doc_id );
                where['induction_physical_form_docs._id'] = findDocInList._id;
                saveData['induction_physical_form_docs.$[one].document_name'] = document_name;
                saveData['induction_physical_form_docs.$[one].file_name'] = req.file.filename;
                saveData['induction_physical_form_docs.$[one].mime_type'] = getImageType(req.file.mimetype);
                saveData['induction_physical_form_docs.$[one].file_size'] = convertBitsIntoKbMb(req.file.size);
                saveData['induction_physical_form_docs.$[one].updated_on']  = dbDateFormat(); 
                if(typeof req.body.add_by_name !== 'undefined' && req.body.add_by_name !== '' ){
                saveData['induction_physical_form_docs.$[one].added_by'] = { name: add_by_name || 'na', email:add_by_email || 'na', mobile: add_by_mobile || 'na',designation: add_by_designation || 'na' };
                }
               
                EmployeeCI.updateOne( where, { $set: saveData }, arrayFilters )
                .then( (resp)=>{
                    if( findDocInList.file_name ){  
                        removeEmployeeFile( findDocInList.file_name );
                    }
                    return res.status(200).send( {'status':true, 'message': `${document_name} Updated Successfully` } ); 
                })
                .catch( (error) => {  
                    return res.status(403).send( {'status':false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE } ); 
                })
            }else{
                var saveDoc =  {}
                saveDoc.document_name = document_name;
                saveDoc.file_name = req.file.filename;
                saveDoc.mime_type = getImageType(req.file.mimetype);
                saveDoc.file_size = convertBitsIntoKbMb(req.file.size);
                saveDoc.add_date = dbDateFormat(); 
                if(typeof req.body.add_by_name !== 'undefined' && req.body.add_by_name !== '' ){
                    saveDoc.added_by = { name: add_by_name || 'na', email:add_by_email || 'na', mobile: add_by_mobile || 'na',designation: add_by_designation || 'na' };
                    saveDoc.verify_by = { name: add_by_name || 'na', email:add_by_email || 'na', mobile: add_by_mobile || 'na',designation: add_by_designation || 'na' };
                }
                
                EmployeeCI.updateOne( { _id:  dbObjectId( employee_doc_id ) }, { $set: saveData , $push: { induction_physical_form_docs: saveDoc } } )
                .then( (data)=>{ 
                    return res.status(200).send( {'status':true, 'message': `${document_name} Uploaded Successfully` } ); 
                }).catch( (error)=>{  
                    return res.status(403).send( {'status':false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE } ); 
                });
            }

    }).catch((error)=>{
        return res.status(403).send( {'status':false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE } ); 
    });
}


/*********************** removed after use on 14-April-2025 ************************/
// controller.importEmployeeDataSecondUpdateDOBJoinDate = async ( req, res )=>{ 

//     const errors = validationResult(req);

//     if (!errors.isEmpty()) {
//         return res.status(402).json({ status: false, message: errors.array()[0].msg });
//     }

//     const {  employee_data } = req.body; 

//     const saveData = {};
//     saveData.add_date = dbDateFormat();
//     saveData.updated_on =  dbDateFormat();

//         var csvData = employee_data;  
    
//         if ( csvData.length === 0) {  
//             return res.status(403).json( {'status':false, 'message': 'No record in the file'} ); 
//         }
   
//         // Convert array of arrays to array of objects
//         const bulkOps = []; 

//         const NewCsvData = csvData.map(obj => { 
//             for (const key in obj) {
//                 if (obj[key] === "NA") {
//                 obj[key] = "";
//                 }
//             }
//             return obj;
//         });

       

//         const NewCsvData2 = NewCsvData.map(obj => { 
//             var push = {}
//             push.employee_code = ( obj.A ) ;
//             const [month, day, year] = ( obj.B ).split('/');
//             push.date_of_birth =  `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
//             push.date_of_birth_db = new Date( push.date_of_birth );

//             const [month1, day1, year1] = ( obj.C ).split('/');
//             push.joining_date = `${year1}-${month1.padStart(2, '0')}-${day1.padStart(2, '0')}`; 
//             push.joining_date_db = new Date( push.joining_date );
//             return push;
//         });



//        /************* prepare bulk write ************/
//        const bulkWriteOps = NewCsvData2.map((item) => ({
//         updateOne: {
//             filter: { 
//             'employee_code': item.employee_code  
//             },
//             update: {
//                 $set: {
//                     'joining_date': item.joining_date_db,
//                     'date_of_birth': item.date_of_birth_db,
//                     'updated_on': dbDateFormat()
//                 }
//             }
//         }
//         }));
        
//     EmployeeCI.bulkWrite( bulkWriteOps )
//     .then( (data) => {
//         //console.log( data );
//         return res.status(200).send( {'status':true, 'message': 'Employee Data imported Successfully'} );
//     })
//     .catch( (error)=>{ 
//         return res.status(403).send( {'status':false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE} ); 
//     }); 

// }

controller.importEmployeeDataSecondUpdateDOBJoinDate = async ( req, res )=>{ 

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(402).json({ status: false, message: errors.array()[0].msg });
    }

    const {  employee_data } = req.body;  

        var csvData = employee_data;  
    
        if ( csvData.length === 0) {  
            return res.status(403).json( {'status':false, 'message': 'No record in the file'} ); 
        }
   
        // Convert array of arrays to array of objects
        const bulkOps = []; 

        const NewCsvData = csvData.map(obj => { 
            for (const key in obj) {
                if (obj[key] === "NA") {
                obj[key] = "";
                }
            }
            return obj;
        });
 
       /************* prepare bulk write ************/
       const bulkWriteOps = NewCsvData.map((item) => ({
        updateOne: {
            filter: { 
            'employee_code': item.employee_id  
            },
            update: {
                $set: {
                    'designation': item.designation,
                    'department': item.department_name,
                    'division': item.division,
                    'updated_on': dbDateFormat()
                }
            }
        }
        }));
        
    EmployeeCI.bulkWrite( bulkWriteOps )
    .then( (data) => {
        //console.log( data );
        return res.status(200).send( {'status':true, 'message': 'Employee Data imported Successfully'} );
    })
    .catch( (error)=>{ 
        return res.status(403).send( {'status':false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE} ); 
    }); 

}


controller.deleteEmployeeBulkEmployee = async (req, res ) => {


    const empData = req.body.emp_data;
    
       //console.log( empData );
       const empList = empData.map((item)=>{ 
        return Number( item.employee_id )
       })
       //console.log( empList );
       if( empList.length > 0 ){
       const data = await EmployeeCI.deleteMany({
            employee_code: { $in: empList }
        });
    
        //console.log( data );
       }
    
    
    return  res.status(500).send({ 'status': false, data: req.body, 'message': error.message });
}


/******* Upload OnBoarding documents **********/
controller.saveOBoardingDocuments = async ( req, res )=>{

    if (req.body && typeof req.body === 'object') { 
        req.body = JSON.parse(JSON.stringify(req.body));
    }

    const errors = validationResult(req);

    const documents = [];

    req.files.forEach((file) => {
        const match = file.fieldname.match(/attachments\[(\d+)\]\[file_name\]/);
        const idx = match ? Number(match[1]) : -1;

        let docName = 'Untitled';

        // Try structured access first
        if (req.body.attachments && req.body.attachments[idx] && req.body.attachments[idx].doc_name) {
            docName = req.body.attachments[idx].doc_name;
        }

        // Fallback to flat key if structured fails
        const flatKey = `attachments[${idx}][doc_name]`;
        if (!docName || docName === 'Untitled') {
            docName = req.body[flatKey] || 'Untitled';
        }

        if (idx !== -1 ) {
            documents.push({
            doc_name: docName,
            file_name: file.filename, 
            add_date: new Date()
            });
        }
    });
 


    if (!errors.isEmpty()) { 
        deleteUploadedImage( documents ); 
        return res.status(406 ).json({ status: false, message: errors.array()[0].msg });
    } 

    
    const { doc_id, job_type, status, template, template_for } = req.body;

    saveData = {};
    saveData.template = template;
    saveData.job_type = normalizeEmployeeType( job_type );
    saveData.status = status;
    saveData.template_for = template_for;
    saveData.updated_on = dbDateFormat(); 

    const whereCheck = {}
    whereCheck.job_type = saveData.job_type;
    whereCheck.template_for = saveData.template_for;

    try{
            const ckData = await TemplateSettingsCI.findOne( whereCheck ); 

            if( ckData ){ 

                /*Remove Old Documents*/ 
                const findMatchDocs = [];
                ckData.attachments.forEach((item)=>{
                    var findDoc = documents.find( (elm)=>elm.doc_name === item.doc_name );
                    if( findDoc ){
                        removeFile( item.file_name );
                    }else{
                        findMatchDocs.push( item );
                    }
                });

                const mergeAllAttachment = [...findMatchDocs,...documents];
                
                saveData.attachments = mergeAllAttachment;
                await TemplateSettingsCI.updateOne( { _id: ckData._id }, { $set: saveData } )
             
                return res.status(200).send( {'status':true, 'message': 'Template Updated Successfully'} );
            }
            else if( !ckData ){
                saveData.attachments = documents;
                saveData.add_date = dbDateFormat();
                await TemplateSettingsCI.create( saveData ); 
                return res.status(200).send( {'status':true, 'message': 'Template Added Successfully'} );
            } 
        
    }catch(error){  console.log( error );
        return res.status(403).send( {'status':false, 'message': process.env.DEFAULT_ERROR_MESSAGE } ); 
    } 
}


controller.deleteEmployeeDocuments = async( req, res )=>{  

    const errors = validationResult(req); 
    const documents = []; 

    if (!errors.isEmpty()) {  
        return res.status(406 ).json({ status: false, message: errors.array()[0].msg });
    }  
    
    const { employee_doc_id, onboard_doc_id, doc_type } = req.body;
   
    try{
 
        
        const where = {}   
        where._id = dbObjectId( employee_doc_id ); 

        /************* Fetch Template Data ***************/ 
        var fetchKeys ; var pullData; var checkOldDocument;
        if( doc_type === 'docs' ){
                fetchKeys = {docs:1}
                const employeeData = await EmployeeCI.findOne( { _id: dbObjectId( employee_doc_id ) }, fetchKeys );  
                if( !employeeData ){
                    return res.status(403).json( {'status':false,  'message': 'Candidate Not Found'} );
                }

                /*check if any old document id is available*/
                checkOldDocument =  employeeData?.docs?.find( (item)=> item._id.toString() === onboard_doc_id );
                if( !checkOldDocument ){ 
                    return res.status(403).send( {'status':false, 'message': `Document ID Not Matched`} );
                }  
                if( checkOldDocument.docs?.file_name && checkOldDocument.docs?.file_name !== '' ){
                    removeEmployeeFile( checkOldDocument.docs?.file_name );
                } 
                
                where['docs._id'] =  { $in: [dbObjectId(onboard_doc_id)] }  
                pullData =  { docs: { _id: dbObjectId( onboard_doc_id ) } } 
                 
        }
        else if( doc_type === 'joining_kit_docs' ){
                fetchKeys = {joining_kit_docs:1}
                const employeeData = await EmployeeCI.findOne( { _id: dbObjectId( employee_doc_id ) }, fetchKeys );  
                if( !employeeData ){
                    return res.status(403).json( {'status':false,  'message': 'Candidate Not Found'} );
                }

                /*check if any old document id is available*/
                checkOldDocument = employeeData?.joining_kit_docs?.find( (item)=> item._id.toString() === onboard_doc_id );
                if( !checkOldDocument ){ 
                    return res.status(403).send( {'status':false, 'message': `Document ID Not Matched`} );
                }  
                if( checkOldDocument.joining_kit_docs?.file_name && checkOldDocument.joining_kit_docs?.file_name !== '' ){
                    removeEmployeeFile( checkOldDocument.joining_kit_docs?.file_name );
                }

                where['joining_kit_docs._id'] =  { $in: [dbObjectId(onboard_doc_id)] }  
                pullData =  { joining_kit_docs: { _id: dbObjectId( onboard_doc_id ) } } 
                
        }
        else if( doc_type === 'offer_letter_docs' ){
                fetchKeys = {offer_letter_docs:1} 
                const employeeData = await EmployeeCI.findOne( { _id: dbObjectId( employee_doc_id ) }, fetchKeys );  
                if( !employeeData ){
                    return res.status(403).json( {'status':false,  'message': 'Candidate Not Found'} );
                }

                /*check if any old document id is available*/
                checkOldDocument =  employeeData?.offer_letter_docs?.find( (item)=> item._id.toString() === onboard_doc_id );
                if( !checkOldDocument ){ 
                    return res.status(403).send( {'status':false, 'message': `Document ID Not Matched`} );
                }  
                if( checkOldDocument.offer_letter_docs?.file_name && checkOldDocument.offer_letter_docs?.file_name !== '' ){
                    removeEmployeeFile( checkOldDocument.offer_letter_docs?.file_name );
                }

                where['offer_letter_docs._id'] =  { $in: [dbObjectId(onboard_doc_id)] }  
                pullData =  { offer_letter_docs: { _id: dbObjectId( onboard_doc_id ) } } 
        }
        else if( doc_type === 'appointment_letter_docs' ){
             fetchKeys = {appointment_letter_docs:1}
             const employeeData = await EmployeeCI.findOne( { _id: dbObjectId( employee_doc_id ) }, fetchKeys );  
                if( !employeeData ){
                    return res.status(403).json( {'status':false,  'message': 'Candidate Not Found'} );
                }

                /*check if any old document id is available*/
                checkOldDocument =  employeeData?.appointment_letter_docs?.find( (item)=> item._id.toString() === onboard_doc_id );
                if( !checkOldDocument ){ 
                    return res.status(403).send( {'status':false, 'message': `Document ID Not Matched`} );
                }  
                if( checkOldDocument.appointment_letter_docs?.file_name && checkOldDocument.appointment_letter_docs?.file_name !== '' ){
                    removeEmployeeFile( checkOldDocument.appointment_letter_docs?.file_name );
                }

                where['appointment_letter_docs._id'] =  { $in: [dbObjectId(onboard_doc_id)] }  
                pullData =  { appointment_letter_docs: { _id: dbObjectId( onboard_doc_id ) } } 
        }

        
        if( onboard_doc_id && checkOldDocument && pullData ){   
            try{   
                await EmployeeCI.updateOne( where, { $pull: pullData } ) ; 
                return res.status(200).send( {'status':true, 'message': `Document Removed Successfully`} );
            }catch(error){  console.log( error );
                return res.status(403).json( {'status':false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE } ); 
            }
        }else{
            return res.status(403).send( {'status':false, 'message': `Some Error Occurred` } );
        } 
         
    }catch(error){  console.log( error );
        return res.status(403).json( {'status':false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE } ); 
    }
    
}




module.exports = controller;