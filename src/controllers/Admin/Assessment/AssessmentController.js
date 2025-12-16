const AssessmentCI = require('../../../models/AssessmentCI.js');
const JobAppliedCandidateCl = require('../../../models/JobAppliedCandidateCl.js');
const JobsCL = require('../../../models/JobsCI.js');
const { dbObjectId } = require('../../../models/dbObject.js');

const dotenv = require("dotenv");
dotenv.config({path:'../src/config.env'});
const { dbDateFormat, updateDatesInArray,replaceNullUndefined , getImageType, convertBitsIntoKbMb, removeFile, getHumanReadableDate, convertToDbDate, commonOnly } = require('../../../middlewares/myFilters.js');
const { readExcelFile } = require('../../../middlewares/ImportExport.js'); 
const { validationResult } = require('express-validator');
const { completeProfileMail } = require('../../../helpers/completeProfileMail.js'); 
const { uploadDocumentsMail } = require('../../../helpers/uploadDocumentsMail.js'); 



const uploadsDir =  './uploads';

const controller = {};


const updateCandidateJobRecords = ( job_id, form_status , old_form_status )=>{ 
  
    JobsCL.findOne( { _id : dbObjectId(job_id) }, {form_candidates:1})
    .then(( data )=>{
        
        if( typeof data.form_candidates !== 'undefined' && data.form_candidates ){
            const saveData = data.form_candidates.map((item)=>{
                const push = {}
                push.level = item.level;

                if( item.level === old_form_status ){
                    push.value = item.value - 1;
                }else if( item.level === form_status ){
                    push.value = item.value + 1;
                }else if( item.level === 'Total' && form_status === 'Applied' ){
                    push.value = item.value + 1;
                }else{
                    push.value = item.value;
                }
                return push;
            });
            
            JobsCL.updateOne( { _id: dbObjectId(job_id) }, { $set: {'form_candidates': saveData } } )
            .then((d)=>{
                //console.log( d );
            })
        }
    });
}


/********* Post New Assessment Data **********/
controller.addAssessment = async ( req, res )=>{

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

    saveData = {};
    saveData = req.body;
    saveData.add_date = dbDateFormat();
    saveData.updated_on =  dbDateFormat();


    if( req.file && req.file.filename ){  
         
            const excelData = await readExcelFile( uploadsDir+'/'+req.file.filename  ); 
                // Extract headers
                const headers = excelData[0]; 
                // Convert array of arrays to array of objects
                const excelJsonData = excelData.slice(1).map(row => {
                        const obj = {};
                        headers.forEach((header, index) => {
                            obj[header] = row[index];
                        });
                        return obj;
                }); 
                
                //collect Data into Database Need Format
                saveData.assessment_list = excelJsonData.map( (item)=>{
                    const clData = {}
                    clData.question = item.question;
                    clData.answer = item.answer;
                    clData.description = item.description;
                        const optionsValue = [];
                        optionsValue.push(item.optionA);
                        optionsValue.push(item.optionB);
                        optionsValue.push(item.optionC);
                        optionsValue.push(item.optionD);
                    clData.options = optionsValue; 
                    return clData;
                });  
    }

    /**************** Update Data *******************/ 
    const instData = new AssessmentCI( saveData );
    instData.save()
    .then( (data) => {
        return res.status(200).send( {'status':true, 'message': 'Data Submitted Successfully.'} );
    })
    .catch( (error)=>{ 
        return res.status(403).send( {'status':false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE} ); 
    });

}


/********* Edit Assessment Data **********/
controller.editAssessment = async ( req, res )=>{

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

    saveData = {};
    saveData = req.body;
    saveData.add_date = dbDateFormat();
    saveData.updated_on =  dbDateFormat();


    if( req.file && req.file.filename ){  
            const excelData = await readExcelFile( uploadsDir+'/'+req.file.filename  ); 
                // Extract headers
                const headers = excelData[0]; 
                // Convert array of arrays to array of objects
                const excelJsonData = excelData.slice(1).map(row => {
                        const obj = {};
                        headers.forEach((header, index) => {
                            obj[header] = row[index];
                        });
                        return obj;
                }); 
                
                //collect Data into Database Need Format
                saveData.assessment_list = excelJsonData.map( (item)=>{
                    const clData = {}
                    clData.question = item.question;
                    clData.answer = item.answer;
                    clData.description = item.description;
                        const optionsValue = [];
                        optionsValue.push(item.optionA);
                        optionsValue.push(item.optionB);
                        optionsValue.push(item.optionC);
                        optionsValue.push(item.optionD);
                    clData.options = optionsValue; 
                    return clData;
                });   
                
                //remove file 
                removeFile( req.file.filename );
    }

    /**************** Update Data *******************/ 
    const instData = new AssessmentCI( saveData );
    instData.save()
    .then( (data) => {
        return res.status(200).send( {'status':true, 'message': 'Data Edited Successfully'} );
    })
    .catch( (error)=>{ 
        return res.status(403).send( {'status':false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE} ); 
    });

}


 
controller.deleteAssessmentById = ( req , res ) => {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(409).json({ status: false, message: errors.array()[0].msg });
    }   
    
    const { _id } = req.body;

    AssessmentCI.deleteOne( { _id:  dbObjectId( _id ) } )
    .then( (data)=>{  
        if( data.deletedCount === 1 ){ 
            return res.status(200).send( {'status':true, 'message': 'Data Deleted Successfully'} );
        }else if( data.deletedCount === 0 ){
            return res.status(304).send( {'status':false, 'message': 'No Action Performed'} );
        }else{
            return res.status(403).send( {'status':false, 'message': process.env.DEFAULT_ERROR_MESSAGE } );
        }
    }).catch( (error)=>{ 
        return res.status(403).send( {'status':false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE } ); 
    });
}

controller.getAssessmentById = ( req , res ) => {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(402).json({ status: false, message: errors.array()[0].msg });
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

    AssessmentCI.find( { _id:  dbObjectId( _id ) }, fetchKeys )
    .then( (data)=>{   
        if( data.length > 0 ){ 
            const outPutData = updateDatesInArray( replaceNullUndefined( data ), ['add_date', 'updated_on'] , 'date' );              
            return res.status(200).send( {'status':true, 'data': outPutData[0], 'message': 'API Accessed Successfully'} );
        }else{
            return res.status(204).send( {'status':false, 'message': 'No record matched'} );
        }
    }).catch( (error)=>{ 
        return res.status(403).send( {'status':false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE } ); 
    });
}

controller.changeAssessmentStatus = ( req , res ) => {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(409).json({ status: false, message: errors.array()[0].msg });
    }   
    
    const { _id } = req.body;

    let saveData = {}
    saveData = req.body;
    saveData.updated_on =  dbDateFormat();

    AssessmentCI.updateOne( { _id:  dbObjectId( _id ) }, {$set: saveData} )
    .then( (data)=>{ 

        if( data.modifiedCount === 1 ){
            return res.status(200).send( {'status':true, 'message': 'Status Updated Successfully'} );
        }else if( data.modifiedCount === 0 ){
            return res.status(304).send( {'status':false, 'message': 'No Action Performed'} );
        }else{
            return res.status(403).send( {'status':false, 'message': process.env.DEFAULT_ERROR_MESSAGE } );
        }
    }).catch( (error)=>{ 
        return res.status(403).send( {'status':false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE } ); 
    });
}

controller.getAssessmentList = ( req , res ) => {  
   
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

    const pageOptions = {
        page: parseInt( ((page_no ? page_no : 1) - 1)) || 0,
        limit: parseInt( per_page_record) || 10
    }

    AssessmentCI.find( where, fetchKeys )
    .skip( pageOptions.page * pageOptions.limit )
    .limit( pageOptions.limit )
    .sort( { 'job_title': 1 } )
    .then( (data)=>{  

        if( data.length > 0 ){ 
            const outPutData = updateDatesInArray( replaceNullUndefined( data ), ['add_date', 'updated_on'] , 'datetime' );              
            return res.status(200).send( {'status':true, 'data': outPutData, 'message': 'API Accessed Successfully'} );
        }else{
            return res.status(204).send( {'status':false, 'message': 'No record matched'} );
        }
    }).catch( (error)=>{ 
        return res.status(403).send( {'status':false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE } ); 
    });
}

controller.getSingleAssessmentList = ( req , res ) => {  
   
    const { candidate_id, content_type, job_id } = req.body; 

    const where = {}  
    const fetchKeys = {}

    if( req.body.hasOwnProperty('scope_fields') && req.body.scope_fields.length > 0 ){
        req.body.scope_fields.forEach(field => {
            fetchKeys[field] = 1;  
        });
    }else{
        fetchKeys.__v = 0;
    }    

    where.content_type = content_type;

    JobsCL.findOne( {_id: dbObjectId(job_id) }, { 'department':1} )
    .then( (jobData)=>{ 
         
        if(!jobData){
            return res.status(403).send( {'status':false, 'message': 'No Job ID Matched'} );
        }else{
           
                if(jobData && typeof jobData.department !=='undefined' ){
                    where.department = jobData.department;
                }
                
                AssessmentCI.aggregate([
                    { $match: where },
                    { $match: { 'assessment_list': { $exists: true, $not: { $size: 0 } } } },
                    { $sample: { size: 1 } },
                    { $project: { 'assessment_list.answer': 0 } }
                ])
                .then( (data)=>{  

                    if( data.length > 0 ){ 

                        const outPutData = updateDatesInArray(  data , ['add_date', 'updated_on'] , 'date' );              
                        const questionList = outPutData[0].assessment_list;
 
                        //random set
                        for (let i = questionList.length - 1; i > 0; i--) {
                        const j = Math.floor(Math.random() * (i + 1));
                        [questionList[i], questionList[j]] = [questionList[j], questionList[i]]; // Swap elements
                        } 

                        const NewQuestionList = questionList.slice(0, outPutData[0].no_of_display_questions ); 
 
                        outPutData[0].assessment_list = NewQuestionList;
                        return res.status(200).send( {'status':true, 'data': outPutData, 'message': 'API Accessed Successfully'} );
                    }else{
                        return res.status(403).send( {'status':false, 'message': 'No record matched'} );
                    }
                }).catch( (error)=>{  
                    return res.status(403).send( {'status':false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE } ); 
                });
        }
    }).catch( (error)=>{  
        return res.status(403).send( {'status':false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE } ); 
    });
}

controller.checkAssessmentData = ( req , res ) => {  
   
    const { candidate_id, assessment_id, answer_list } = req.body; 

   // console.log( answer_list );

    const where = {}  
    const fetchKeys = {}
    fetchKeys.marking_per_question = 1;
    fetchKeys.no_of_display_questions = 1;
    fetchKeys.min_passing = 1;
    fetchKeys.content_type = 1;
    fetchKeys.no_of_attempts = 1;
    fetchKeys['assessment_list.answer'] = 1;  
    fetchKeys['assessment_list._id'] = 1;  
    
    where['_id'] = dbObjectId( assessment_id );

    AssessmentCI.findOne( where , fetchKeys )
    .then( (assessmentData)=>{  

        if( assessmentData ){ 
            const markingPerQuestion = assessmentData.marking_per_question;
            const minPassingPercentage = assessmentData.min_passing;
            const no_of_attempts = assessmentData.no_of_attempts;
            let totalMarksObtained = 0;

            answer_list.forEach(answer => {
            const question = assessmentData.assessment_list.find(q => q._id.toString() === answer._id); 
            if (question && question.answer === answer.answer) {
            totalMarksObtained += markingPerQuestion;
            }
            });

            const totalPossibleMarks = assessmentData.no_of_display_questions * assessmentData.marking_per_question;
            const percentageObtained = (totalMarksObtained / totalPossibleMarks) * 100;
            const finalResult =  percentageObtained >= minPassingPercentage ? 'Pass' : 'Fail'; 
             

            const resultData = {}
            resultData.result = finalResult;
            resultData.percentage = String( percentageObtained );

            const saveData = {}
            if( assessmentData.content_type === 'Comprehensive'){
            saveData.assessment_status = 'Complete'; 
            saveData.assessment_result = finalResult;
            }
            saveData.score = percentageObtained;

            if( assessmentData.content_type === 'Comprehensive'){
                saveData.comprehensive_final_score = percentageObtained;
                saveData.comprehensive_score_final_result = finalResult;
            }else{
                saveData.mcq_final_score = percentageObtained;
                saveData.mcq_score_final_result = finalResult;
            }

            const assessmentResult = {};
            assessmentResult.type = assessmentData.content_type;
            assessmentResult.result = finalResult;
            assessmentResult.score = percentageObtained; 
            

            const pushMergeData = {}
            pushMergeData.assessment_result_data = assessmentResult;

            if( finalResult === 'Pass'){
                const pushPageSteps = {}
                if( assessmentData.content_type === 'MCQ'){
                    pushPageSteps.step = 2;
                    pushPageSteps.page = 'profile';
                    pushPageSteps.status = 'pending';
                    saveData.kyc_steps = 'Profile';
                    saveData.mcq_attempts = 'Complete';
                }else if( assessmentData.content_type === 'Comprehensive'){
                    pushPageSteps.step = 4;
                    pushPageSteps.page = 'docs';
                    pushPageSteps.status = 'pending';
                    saveData.kyc_steps = 'Document';
                    saveData.comprehensive_attempts = 'Complete';
                    saveData.comprehensive_attempts = 'Complete';
                }

                pushMergeData.page_steps = pushPageSteps;
            } 

            JobAppliedCandidateCl.findOne( { '_id' : dbObjectId( candidate_id )}, {'page_steps':1,'job_id':1,'email':1, 'name':1,'assessment_result_data':1,'job_id':1,'form_status':1,'applied_jobs':1} )
            .then((profileData)=>{ 
                
                const getPageSteps = profileData.page_steps.find((item)=> item.page === assessmentData.content_type );

                const countNoOfAttempts = profileData.assessment_result_data.filter((item)=> item.type === assessmentData.content_type );
                 
                if( getPageSteps ){  
                
                        let arrayFilters = { 'arrayFilters': [{'one._id': getPageSteps._id }] }

                        let where = {}
                        where['_id'] = dbObjectId( candidate_id );
                        where['page_steps._id'] = getPageSteps._id;
                        
                        if( countNoOfAttempts < no_of_attempts && finalResult === 'Fail' ){
                            saveData['page_steps.$[one].status'] = 'pending';
                        }else{
                            saveData['page_steps.$[one].status'] = 'complete';
                            if( assessmentData.content_type === 'MCQ'){
                                saveData.mcq_attempts = 'Complete';
                            }else{
                                saveData.comprehensive_attempts = 'Complete';
                            }
                        }
                       

                         JobAppliedCandidateCl.updateOne( { '_id' : dbObjectId( candidate_id )}, { $set : saveData } , arrayFilters )
                        .then((d)=>{
                                JobAppliedCandidateCl.updateOne( { '_id' : dbObjectId( candidate_id )}, { $push : pushMergeData } )
                                .then((d)=>{
                                    if( assessmentData.content_type === 'MCQ' && finalResult === 'Pass' ){
                                        completeProfileMail( profileData.email, profileData.name );
                                        return res.status(200).send( {'status':true, 'data': resultData, 'message': 'API Accessed Successfully'} ); 
                                    }else if( assessmentData.content_type === 'Comprehensive' && finalResult === 'Pass' ){
                                        const getCurrentJobData = profileData.applied_jobs.find((item)=> item.form_status === 'Applied' && item.job_id.toString() === profileData.job_id.toString()  );
                                        if( getCurrentJobData ){
                                            let arrayFilters2 = { 'arrayFilters': [{'one._id': getCurrentJobData._id }] }
                                            var saveData = {}
                                            saveData.form_status = 'Shortlisted';
                                            saveData['applied_jobs.$[one].form_status'] = 'Shortlisted';
                                            JobAppliedCandidateCl.updateOne( { '_id' : dbObjectId( candidate_id )}, { $set : saveData } , arrayFilters2 )
                                            .then(( result )=>{
                                                //console.log( result ); 
                                                uploadDocumentsMail( profileData.email, profileData.name );
                                                updateCandidateJobRecords( profileData.job_id , 'Shortlisted', 'Applied' );
                                                return res.status(200).send( {'status':true, 'data': resultData, 'message': 'API Accessed Successfully'} ); 
                                            });
                                        }
                                        else{
                                            return res.status(200).send( {'status':true, 'data': resultData, 'message': 'API Accessed Successfully'} ); 
                                        }  
                                    }else{
                                        return res.status(200).send( {'status':true, 'data': resultData, 'message': 'API Accessed Successfully'} ); 
                                    }
                                }).catch( (error)=>{ 
                                    return res.status(403).send( {'status':false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE } ); 
                                });
                        }).catch( (error)=>{ 
                            return res.status(403).send( {'status':false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE } ); 
                        });
                }else{
                    return res.status(403).send( {'status':false, 'message': process.env.DEFAULT_ERROR_MESSAGE } ); 
                }
            }).catch( (error)=>{
                return res.status(403).send( {'status':false, 'message': process.env.DEFAULT_ERROR_MESSAGE } ); 
            });
        }else{
            return res.status(403).send( {'status':false, 'message': process.env.DEFAULT_ERROR_MESSAGE } ); 
        }
         
    }).catch( (error)=>{
        return res.status(403).send( {'status':false, 'message': process.env.DEFAULT_ERROR_MESSAGE } ); 
    });
}

module.exports = controller;
