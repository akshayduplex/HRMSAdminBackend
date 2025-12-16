const JobsCL = require('../../../models/JobsCI.js'); 
const RequisitionFormCI = require('../../../models/RequisitionFormCI.js');  
const JobAppliedCandidateCl = require('../../../models/JobAppliedCandidateCl.js');
const EmployeeCI = require('../../../models/EmployeeCI.js');
const JobCl = require('../../../models/JobsCI.js');
const CandidateDiscussionHistoryCI = require('../../../models/CandidateDiscussionHistoryCI.js'); 
const ApprovalNoteCI = require('../../../models/ApprovalNoteCI.js');

const { dbObjectId } = require('../../../models/dbObject.js');
const dotenv = require("dotenv");
const fs 	  = require('fs');
const url = require('url');
const path = require('path');
dotenv.config({path:'../src/config.env'});
const { dbDateFormat, allDateFormat, generateUnique10DigitNumbers, getSalaryRange, isValidEmail , validateYearWithRange, getWriteDataFromFile, writeDataInFileAnyPath, generateRandomEmail, removeDuplicatesAppliedFrom, updateDatesInArray,updateDatesInObject, replaceNullUndefined ,removeBlankValuesFromObject, getImageType, convertBitsIntoKbMb, removeFile, getHumanReadableDate, convertToDbDate, commonOnly } = require('../../../middlewares/myFilters.js');


const { validationResult } = require('express-validator');

const organizationConfig = JSON.parse( fs.readFileSync('./src/config/organization_config_file.txt', 'utf8' ) );
const companyName = organizationConfig?.organization_name;
 //console.log( organizationConfig );

const axios = require('axios');
const uploadsDir =  './uploads';

const INDUSTRY_TYPE = process.env.INDUSTRY_TYPE;
const controller = {};

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
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

        JobsCL.findOne({ _id: dbObjectId(job_id) }, {'total_vacancy': 1} )
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

                   JobsCL.updateOne(
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
                    })
        });
    }) ;  
    
}


/********* Post New Job on Naukri Data **********/
controller.courseTypeList = async ( req, res )=>{  
     var output = [];
     output.push( {'course_type':'ug courses','course_name':'Graduation'});
     output.push( {'course_type':'ug courses','course_name':'Diploma and Certification'});
     output.push( {'course_type':'ug courses','course_name':'MBBS'});
     output.push( {'course_type':'pg courses','course_name':'Post Graduation'});
     output.push( {'course_type':'doctorate courses','course_name':'Doctorate'});

     return res.status(200).json({ status: true, data: output, message: 'API Accessed Successfully' });
}

/********* get Qualification List **********/
controller.qualificationList = async ( req, res )=>{  

    const errors = validationResult(req);

    if (!errors.isEmpty()) { 
        return res.status(402).json({ status: false, message: errors.array()[0].msg });
    } 

    const { course_type } = req.body;

    var courseTypeName = '';

    if( course_type === 'doctorate courses' ){
        courseTypeName = 'doctorate';
    }
    else if( course_type === 'pg courses' ){
        courseTypeName = 'post-graduate';
    }
    else if( course_type === 'ug courses' ){
        courseTypeName = 'under-graduate';
    }

    const APIUrl = `https://api.zwayam.com/amplify/v2/reference/courses?courseType=${courseTypeName}`;
 

    try{
        const apiResponseData = await axios.get( APIUrl );
        const apiResponse = apiResponseData?.data; 

        if( apiResponseData?.data && apiResponse.length > 0 ){ 
            const resultData = apiResponse.map( (item)=>{
                return {'qualification': item }
            })
            return res.status(200).json({status: true, data:resultData, 'message': 'API Accessed Successfully'});
        }else{
            return res.status(403).json({status: false, 'message': 'No Record Found From Naukri Portal'}); 
        }

    } catch( error ){
       // console.error('Error posting job:', error.response?.data || error.message);
        return res.status(403).json({status: false, 'message': error.response?.data || error.message });
    }
}

/********* get Specialization List **********/
controller.specializationList = async ( req, res )=>{  

    const errors = validationResult(req);

    if (!errors.isEmpty()) { 
        return res.status(402).json({ status: false, message: errors.array()[0].msg });
    }

    const { course_type, qualification } = req.body; 

    var courseTypeName = '';

    if( course_type === 'doctorate courses' ){
        courseTypeName = 'doctorate';
    }
    else if( course_type === 'pg courses' ){
        courseTypeName = 'post-graduate';
    }
    else if( course_type === 'ug courses' ){
        courseTypeName = 'under-graduate';
    }

    const APIUrl = `https://api.zwayam.com/amplify/v2/reference/courses/${courseTypeName}/specializations?courseId=${qualification}`; 

    try{
        const apiResponseData = await axios.get( APIUrl );

        const apiResponse = apiResponseData?.data;

        if( apiResponseData?.data && apiResponse.length > 0 ){ 
            const resultData = apiResponse.map( (item)=>{
                return {'specialization': item }
            })
            return res.status(200).json({status: true, data:resultData, 'message': 'API Accessed Successfully'});
        }else{
            return res.status(403).json({status: false, 'message': 'No Record Found From Naukri Portal'});  
        }

    } catch( error ){ 
        return res.status(403).json({status: false, 'message': error.response?.data || error.message });
    }
}


/********* Post New Job on Naukri Data **********/
controller.publishJob = async ( req, res )=>{  

    const errors = validationResult(req);

    if (!errors.isEmpty()) { 
        return res.status(402).json({ status: false, message: errors.array()[0].msg });
    } 

    const { job_doc_id, education_data,  work_type, action } = req.body;

     
    /************ fetch records *********** */
    const where = {}
    where._id = dbObjectId( job_doc_id );
    where.status = 'Published';
    where.deadline = { $gt : new Date( new Date().setHours( '00', '00', '00' )) }

    //console.log( where );
    const jobKeys = {_id:1, naukari_job_data: 1, job_title:1,job_publish_code:1,job_type:1, company:1, working:1, requisition_form_id:1, designation:1, description:1, location:1, benefits:1, educations:1 } 
    const jobData = await JobsCL.findOne( where, jobKeys );
    //console.log( jobData );

    if( !jobData ){
        return res.status(403).json({status: false, 'message':'No Job Found'});
    }

    //console.log( jobData?.naukari_job_data?.publish_job_id );

    if( typeof jobData?.naukari_job_data?.publish_job_id !== 'undefined' && jobData?.naukari_job_data?.publish_job_id !== '' && action === 'add' && jobData?.naukari_job_data?.status === 'CREATED'){
        return res.status(403).json({status: false, 'message':'Job Already Published On Naukri'});
    }

    if( req.body.hasOwnProperty('min_salary') && parseFloat(req.body.min_salary) >= 0 && req.body.hasOwnProperty('max_salary') && parseFloat(req.body.max_salary) >= 0 && parseFloat(req.body.min_salary) > parseFloat(req.body.max_salary) ){
        return res.status(403).json({status: false, 'message':'Maximum salary must be greater than or equal to minimum salary'});
    }


    /***********  Find Requisition form *****************/
    var whereReq = {}
    whereReq._id = jobData.requisition_form_id;
    const ReqKeys = { ctc_per_annum:1,educations:1,ctc_per_month:1,minimum_experience:1,maximum_experience:1,no_of_vacancy:1, designation_name:1, qualification:1, skills:1 }
    const RequisitionFormData = await RequisitionFormCI.findOne( whereReq , ReqKeys );

    if( !RequisitionFormData ){
        return res.status(403).json({status: false, 'message':'No Requisition Form Data Found'});
    }

    /*Prepare the job Locations*/
    let jobLocations = [];

    jobData?.location?.slice(0, 3).forEach(item => {
    const locationParts = (item.name + ', India').split(',').map(l => l.trim());
    const locObj = [];

    if (locationParts.length === 1) {
        locObj.push({ city: locationParts[0] });
    } else if (locationParts.length === 2) {
        locObj.push({ city: locationParts[0] });
        locObj.push({ state: locationParts[1] });
    } else if (locationParts.length >= 3) {
        locObj.push({ city: locationParts[0] });
        locObj.push({ state: locationParts[1] });
        locObj.push({ country: locationParts[2] });
    }

    // Push only one formatted location object per location
    const formattedLocation = {};
    locObj.forEach(loc => Object.assign(formattedLocation, loc));
    jobLocations.push(formattedLocation);
    });

    /* Prepare Benefits */
    const jobBenefits = jobData?.benefits?.map( (item)=>{
        return item.name;
    });

    const getSalaryValue = String( RequisitionFormData?.ctc_per_annum );
    // Remove anything that's not a digit or comma
    const getSalaryValue2 = getSalaryValue.replace(/[^\d,]/g, ''); 
    // Remove the commas
    const getSalaryValue3 = getSalaryValue2.replace(/,/g, ''); 
    // Convert to number
    const getSalaryValue4 = Number(getSalaryValue3);

 
    if( req.body.hasOwnProperty('min_salary') && req.body.min_salary === '' && req.body.hasOwnProperty('max_salary') && req.body.max_salary === '' && getSalaryValue4 === 0 ){
      return res.status(403).json({status: false, 'message': 'Please enter valid salary value in MPR form and try to publish job again'});  
    }
 

    const NAUKRI_JOBS_API_KEY = process.env.NAUKRI_JOBS_API_KEY;  
    const NAUKRI_JOBS_STATUS = process.env.NAUKRI_JOBS_STATUS;  
    const NAUKRI_JOBS_SALARY_STATUS = process.env.NAUKRI_JOBS_SALARY_STATUS; 

    var referenceCode = '';
    if( jobData?.naukari_job_data?.publish_code !== '' && action === 'update' ){
        referenceCode = jobData?.naukari_job_data?.publish_code;
    }else{
        referenceCode =  generateUnique10DigitNumbers( 10 );
    }
    //var salaryRange = getSalaryRange( getSalaryValue4 ); 
    
   

    const payload = {}
    payload.title = jobData.job_title;
    payload.jobType = NAUKRI_JOBS_STATUS === 'LIVE' ? 'hot' : 'hidden'; //hot for live, hidden for testing purpose
    payload.description = jobData.description;
    //payload.minSalary = salaryRange.minSalary;
    //payload.maxSalary = salaryRange.maxSalary; 

    if( req.body.hasOwnProperty('min_salary') && parseFloat(req.body.min_salary) >= 0 && req.body.hasOwnProperty('max_salary') && parseFloat(req.body.max_salary) >= 0 ){
        payload.minSalary = parseFloat(req.body.min_salary);
        payload.maxSalary = parseFloat(req.body.max_salary);
    }else{
        payload.minSalary = getSalaryValue4;
        payload.maxSalary = getSalaryValue4;
    }

    if( parseFloat(payload.maxSalary) < 50000 ){
        //return res.status(403).json({status: false, 'message': 'Salary value must be greater than or equal to 50000 ₹'});  
    }
 
    payload.salaryCurrency = 'INR';
    payload.industry = INDUSTRY_TYPE;
    payload.workMode = work_type || 'In office';
    payload.employmentType = ['OnRole','On Role','onRole'].includes( jobData.job_type ) ? 'Full Time, Permanent' : 'Full Time, Temporary/Contractual';
    payload.orgName = companyName || jobData.company;
    payload.website = process.env.CANDIDATE_PANEL_URL || 'https://jobs.hlfppt.org';
    payload.minWorkExperience = parseInt( RequisitionFormData.minimum_experience ) || 1;
    payload.maxWorkExperience = parseInt( RequisitionFormData.maximum_experience ) || 4;
    payload.keySkills = jobBenefits.length > 0 ? jobBenefits : [""];
    payload.locations = jobLocations;
    payload.educationQualifications = education_data;
    payload.distributeTo = ["naukri"]; //Enum values: naukri, iimjobs, hirist
    payload.showSalary = NAUKRI_JOBS_SALARY_STATUS === 'SHOW' ? true : false;   //true//false
    payload.notifyEmail = "deepaksingh@hlfppt.org";
    payload.questions = [];
    if( action === 'add' ){
    payload.referenceCode = referenceCode;
    }

    //console.log( payload );

    try{

        if( action === 'add' ){
            const apiResponseData = await axios.post('https://api.zwayam.com/amplify/v2/jobs', payload, {
                headers: {
                'Content-Type': 'application/json',
                'api_key': NAUKRI_JOBS_API_KEY 
                }
            });

            const apiResponse = apiResponseData?.data; 

           // console.log( apiResponse );

            if( apiResponseData?.data && apiResponse?.id && apiResponse?.id !== '' ){
                const postedId = apiResponse?.id;
                if( postedId ){ 
                    var getJobDetailUrl = `https://api.zwayam.com/amplify/v2/jobs/${postedId}`;
                    const apiIdData = await axios.get( getJobDetailUrl , {
                        headers: {
                        'Content-Type': 'application/json',
                        'api_key': NAUKRI_JOBS_API_KEY 
                        }
                    });

                    //console.log( 'details', apiIdData?.data );

                    var saveData = {}
                    saveData.publish_code = referenceCode;
                    saveData.publish_job_id = postedId;
                    saveData.job_board_id = apiIdData?.data?.jobStatus?.naukri?.jobBoardJobId || '';
                    saveData.added_on = dbDateFormat();
                    saveData.status = 'CREATED';
                    saveData.updated_on = dbDateFormat();
                    if( apiIdData?.data?.jobStatus?.naukri?.expiryDate !== '' ){
                        saveData.expiry_date = apiIdData?.data?.jobStatus?.naukri?.expiryDate || '';
                    }
                    if( apiIdData?.data?.jobStatus?.naukri?.postedDate !== '' ){
                        saveData.posted_date = apiIdData?.data?.jobStatus?.naukri?.postedDate || '';
                    }
                    
                    if( apiIdData?.data && apiIdData?.data?.jobStatus?.naukri?.status === 'CREATED' ){
                        saveData.publish_link = apiIdData?.data?.jobStatus?.naukri?.url;
                    }
                    
                    saveData.min_salary = payload.minSalary;
                    saveData.max_salary = payload.maxSalary;
                    saveData.work_type  = work_type || 'In office';
 

                    await JobsCL.updateOne( {_id: dbObjectId( job_doc_id ) } , { $set: {'naukari_job_data': saveData }});
                }
                return res.status(200).json({status: true, 'message': 'Job Posted Successfully'});
            }else{
                return res.status(403).json({status: false, 'message': 'Some Error Occurred'});  
            }

        }else if( action === 'update' && typeof jobData?.naukari_job_data?.publish_job_id !== 'undefined'){
            payload.jobId = jobData?.naukari_job_data?.publish_job_id;
            var apiResponseDataUp = await axios.put(`https://api.zwayam.com/amplify/v2/jobs/${payload.jobId}`, payload, {
                headers: {
                'Content-Type': 'application/json',
                'api_key': NAUKRI_JOBS_API_KEY
                }
            });
            //console.log( 'updated', apiResponseDataUp );

            if( payload.jobId !== '' ){
                var postedId = payload.jobId;
                if( postedId ){ 
                    var getJobDetailUrl = `https://api.zwayam.com/amplify/v2/jobs/${postedId}`;
                    var apiIdData = await axios.get( getJobDetailUrl , {
                        headers: {
                        'Content-Type': 'application/json',
                        'api_key': NAUKRI_JOBS_API_KEY 
                        }
                    });

                    //console.log( 'details', apiIdData?.data );

                    var saveData = {} 
                    
                    if( apiIdData?.data && ['CREATED','UPDATED'].includes( apiIdData?.data?.jobStatus?.naukri?.status) && apiIdData?.data?.jobStatus?.naukri?.url ){
                        saveData.publish_link = apiIdData?.data?.jobStatus?.naukri?.url || ''; 
                        saveData.publish_code = apiIdData?.data?.referenceCode;
                        saveData.job_board_id = apiIdData?.data?.jobStatus?.naukri?.jobBoardJobId || '';
                        saveData.publish_job_id = payload.jobId;
                        saveData.status = 'CREATED';
                        saveData.updated_on = dbDateFormat();

                        if( apiIdData?.data?.jobStatus?.naukri?.expiryDate !== '' ){
                            saveData.expiry_date = apiIdData?.data?.jobStatus?.naukri?.expiryDate || '';
                        }
                        if( apiIdData?.data?.jobStatus?.naukri?.postedDate !== '' ){
                            saveData.posted_date = apiIdData?.data?.jobStatus?.naukri?.postedDate || '';
                        }

                        if( jobData?.naukari_job_data?.min_salary >= 0 && jobData?.naukari_job_data?.max_salary >= 0 ){ 
                            saveData.min_salary = jobData?.naukari_job_data?.min_salary || payload.minSalary;
                            saveData.max_salary = jobData?.naukari_job_data?.max_salary || payload.maxSalary;
                            saveData.work_type  = work_type || 'In office';
                        }else{
                            saveData.min_salary = payload.minSalary;
                            saveData.max_salary = payload.maxSalary;
                            saveData.work_type  = work_type || 'In office';
                        }

                        await JobsCL.updateOne( {_id: dbObjectId( job_doc_id ) } , { $set: {'naukari_job_data': saveData }});
                    }
                }
                if( apiIdData?.data && apiIdData?.data?.jobStatus?.naukri?.status === 'CREATE_PENDING' ){
                    return res.status(200).json({status: true, 'message': 'Job publish status is pending at Naukri'});
                }else{
                    return res.status(200).json({status: true, 'message': 'Job updated successfully'});
                }
            }else{
                return res.status(403).json({status: false, 'message': 'Some Error Occurred'});  
            } 
        }else{
            return res.status(403).json({status: false, 'message': 'Job Not Found'});
        }

    } catch( error ){
        return res.status(403).json({status: false, 'message': error.response?.data || error.message });
    }
}


/********* get publish Job List from Naukri Data **********/
controller.getPublishJobList = async ( req, res )=>{  

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(402).json({ status: false, message: errors.array()[0].msg });
    }

    const { page_no } = req.body; 
    const NAUKRI_JOBS_API_KEY = process.env.NAUKRI_JOBS_API_KEY; 

    const payload = {}
    payload.page = page_no > 0 ? parseInt( page_no ) -1 : 0;

    if( req.body.hasOwnProperty('from_date') && req.body.from_date !== '' && req.body.hasOwnProperty('to_date') && req.body.to_date !== ''){
        payload.fromDate = allDateFormat( new Date( req.body.from_date ).setHours(0, 0, 0, 0), 'YYYY-MM-DD HH:mm:ss' );
        payload.toDate = allDateFormat( new Date( req.body.to_date ).setHours(23, 59, 59, 999), 'YYYY-MM-DD HH:mm:ss' );
    }
  
 
    const queryParams = new URLSearchParams(payload).toString();
    const postUrl = `https://api.zwayam.com/amplify/v2/jobs?${queryParams}`; 
  

    try{
        const apiResponse = await axios.get( postUrl , {
            headers: {
            'Content-Type': 'application/json',
            'api_key': NAUKRI_JOBS_API_KEY 
            }
        }); 
 

        if( apiResponse?.data?.data.length > 0 && apiResponse?.data?.totalCount ){
            return res.status(200).json({status: true, data: apiResponse?.data, 'message': 'Data Accessed Successfully'});
        }else{
            return res.status(403).json({status: false, 'message': 'No Record Found'});  
        }

    } catch( error ){
        console.error('Error posting job:', error.response?.data || error.message);
        return res.status(403).json({status: false, 'message': error.response?.data || error.message });
    }
}


controller.getPublishJobDetails = async( req, res )=>{

    const errors = validationResult(req);

    if (!errors.isEmpty()) { 
        return res.status(402).json({ status: false, message: errors.array()[0].msg });
    } 

    const { job_doc_id } = req.body;

    const NAUKRI_JOBS_API_KEY = process.env.NAUKRI_JOBS_API_KEY; 
 
    /************ fetch records *********** */
    const where = {}
    where._id = dbObjectId( job_doc_id );
    const jobKeys = {_id:1, naukari_job_data: 1 } 
    const jobData = await JobsCL.findOne( where, jobKeys );

    //console.log( jobData )

    if( !jobData ){
        return res.status(402).json({ status: false, message: 'NO Job Record Found ' });
    }

    if( jobData?.naukari_job_data?.publish_job_id === '' ){
        return res.status(402).json({ status: false, message: 'NO Job Record Found ' });
    }

     var  jobId = jobData?.naukari_job_data?.publish_job_id;

        try{

            var apiResponseDataUp = await axios.get(`https://api.zwayam.com/amplify/v2/jobs/${jobId}`, {
                headers: {
                'Content-Type': 'application/json',
                'api_key': NAUKRI_JOBS_API_KEY 
                }
            });

            if( apiResponseDataUp.data ){
                return res.status(200).json({status: true, data:  apiResponseDataUp.data, 'message': 'Data fetched Successfully'});
            }else{
                return res.status(402).json({ status: false, message: 'NO Job Record Found ' }); 
            }

        } catch( error ){ 
             return res.status(403).json({status: false, 'message': error.response?.data || error.message });
         } 
}

/************ unpublish job records *********** */
controller.UnPublishJob = async( req, res )=>{

    const errors = validationResult(req);

    if (!errors.isEmpty()) { 
        return res.status(402).json({ status: false, message: errors.array()[0].msg });
    } 

    const { job_doc_id } = req.body;

    const NAUKRI_JOBS_API_KEY = process.env.NAUKRI_JOBS_API_KEY; 
 
    /************ fetch records *********** */
    const where = {}
    where._id = dbObjectId( job_doc_id );
    const jobKeys = {_id:1, naukari_job_data: 1 } 
    const jobData = await JobsCL.findOne( where, jobKeys );

   // console.log( jobData )

    if( !jobData ){
        return res.status(402).json({ status: false, message: 'No Job Record Found' });
    }

    if( jobData?.naukari_job_data?.publish_job_id !=='' && jobData?.naukari_job_data?.status === 'DELETED' ){
        return res.status(402).json({ status: false, message: 'Job Already Unpublished' });
    }


     var  jobId = jobData?.naukari_job_data?.publish_job_id;
     //jobId = '67c1d2b7-bb24-44fe-98c4-5e45f1071b44';


        try{

            var apiResponseDataUp = await axios.post(`https://api.zwayam.com/amplify/v2/jobs/${jobId}/unpublish`, {jobBoards:['naukri']}, {
                headers: {
                'Content-Type': 'application/json',
                'api_key': NAUKRI_JOBS_API_KEY 
                }
            });  

           await JobsCL.updateOne( where, { $set:{'naukari_job_data.status':'DELETED'}} );
             
           return res.status(200).json({status: true, 'message': 'Job Unpublished Successfully'});

        } catch( error ){ 
             return res.status(403).json({status: false, 'message': error.response?.data || error.message });
        } 
}


/********* Get Applications against Naukri Data **********/
controller.getApplicantsFromNaukri = async ( req, res )=>{  

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(402).json({ status: false, message: errors.array()[0].msg });
    }

    const { job_doc_id, page_no } = req.body; 
    const NAUKRI_JOBS_API_KEY = process.env.NAUKRI_JOBS_API_KEY;  
 
    /************ Fetch Records *********** */
    const where = {}
    where._id = dbObjectId( job_doc_id );
    const jobKeys = {_id:1, naukari_job_data: 1 } 
    const jobData = await JobsCL.findOne( where, jobKeys );

    //console.log( jobData );

    if( !jobData ){
        return res.status(402).json({ status: false, message: 'No Job Record Found ' });
    }

    if( jobData?.naukari_job_data?.publish_job_id === '' ){
        return res.status(402).json({ status: false, message: 'No Job Record Found ' });
    }

    var jobId = jobData?.naukari_job_data?.publish_job_id;
    var added_on = jobData?.naukari_job_data?.added_on;
    var today_on = new Date(); 

    const diffTime = Math.abs(today_on - added_on);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));  
    

    const payload = {}
    payload.page = page_no > 0 ? parseInt( page_no ) -1 : 0;

    if( req.body.hasOwnProperty('from_date') && req.body.from_date !== '' && req.body.hasOwnProperty('to_date') && req.body.to_date !== ''){
        payload.fromDate = allDateFormat( new Date( req.body.from_date ), 'YYYY-MM-DD' )+' 00:00:00';
        payload.toDate = allDateFormat( new Date( req.body.to_date ), 'YYYY-MM-DD' )+' 23:59:00';
    }else{
        payload.fromDate = allDateFormat( added_on, 'YYYY-MM-DD' )+' 00:00:00';
        payload.toDate = allDateFormat( today_on , 'YYYY-MM-DD' )+' 23:59:00';
    }

 
    const queryParams = new URLSearchParams(payload).toString();
    const postUrl = `https://api.zwayam.com/amplify/v2/jobs/${jobId}/applies?${queryParams}`; 

    try{
        const apiResponse = await axios.get( postUrl , {
            headers: {
            'Content-Type': 'application/json',
            'api_key': NAUKRI_JOBS_API_KEY 
            }
        }); 

        //console.log( apiResponse?.data );

        if( apiResponse?.data &&  apiResponse?.data?.length > 0 ){
            return res.status(200).json({status: true, data: apiResponse?.data, 'message': 'Data Accessed Successfully'});
        }else{
            return res.status(403).json({status: false, 'message': 'No Record Found'});  
        }

    } catch( error ){
        console.error('Error posting job:', error.response?.data || error.message);
        return res.status(403).json({status: false, 'message': error.response?.data || error.message });
    }
}


var updateJobLinkData = async( jobData  )=>{
    
    const NAUKRI_JOBS_API_KEY = process.env.NAUKRI_JOBS_API_KEY;  

    var job_posted_id = jobData?.naukari_job_data?.publish_job_id;
    var job_doc_id = jobData?._id;
    var getJobDetailUrl = `https://api.zwayam.com/amplify/v2/jobs/${job_posted_id}`;
    var apiIdData = await axios.get( getJobDetailUrl , {
        headers: {
        'Content-Type': 'application/json',
        'api_key': NAUKRI_JOBS_API_KEY 
        }
    });

    console.log( 'details', JSON.stringify( apiIdData?.data ) );

    var saveData = {}
    
    if( apiIdData?.data && ['CREATED','UPDATED'].includes( apiIdData?.data?.jobStatus?.naukri?.status) && apiIdData?.data?.jobStatus?.naukri?.url ){
        saveData.publish_link = apiIdData?.data?.jobStatus?.naukri?.url || ''; 
        saveData.publish_code = apiIdData?.data?.referenceCode;
        saveData.job_board_id = apiIdData?.data?.jobStatus?.naukri?.jobBoardJobId || '';
        saveData.publish_job_id = jobData?.naukari_job_data?.publish_job_id;
        saveData.status = 'CREATED';
        saveData.added_on = typeof jobData?.naukari_job_data?.added_on !== 'undefined' ? jobData?.naukari_job_data?.added_on : dbDateFormat();
        saveData.updated_on = dbDateFormat();

        if( apiIdData?.data?.jobStatus?.naukri?.expiryDate !== '' ){
            saveData.expiry_date = new Date( apiIdData?.data?.jobStatus?.naukri?.expiryDate) || new Date();
        }
        if( apiIdData?.data?.jobStatus?.naukri?.postedDate !== '' ){
            saveData.posted_date = new Date( apiIdData?.data?.jobStatus?.naukri?.postedDate) || new Date();
        }
        if( apiIdData?.data?.jobStatus?.naukri?.refreshedDate !== '' ){
            saveData.refreshed_date = new Date( apiIdData?.data?.jobStatus?.naukri?.refreshedDate) || new Date();
        }
        if( apiIdData?.data?.jobStatus?.naukri?.refreshedCount !== '' ){
            saveData.refreshed_count = apiIdData?.data?.jobStatus?.naukri?.refreshedCount;
        }

        if( jobData?.naukari_job_data?.min_salary >= 0 && jobData?.naukari_job_data?.max_salary >= 0 ){ 
            saveData.min_salary = jobData?.naukari_job_data?.min_salary ;
            saveData.max_salary = jobData?.naukari_job_data?.max_salary ;
            saveData.work_type  = jobData?.naukari_job_data?.work_type || 'In office';
        }else{
            saveData.min_salary = jobData?.naukari_job_data?.min_salary;
            saveData.max_salary = jobData?.naukari_job_data?.max_salary;
            saveData.work_type  = jobData?.naukari_job_data?.work_type || 'In office';
        }

        console.log( saveData )

        await JobsCL.updateOne( {_id: dbObjectId( job_doc_id ) } , { $set: {'naukari_job_data': saveData }});
        return true;
    }
}



/********* Post New Jobs Data **********/
var addApplyJobsFromNaukri = ( appliedItemData, jobDataPrev )=>{ 

    // console.log( appliedItemData )
    // console.log( jobDataPrev )
 
    const resumeFilename = appliedItemData?.applyData?.cv?.FileName; 
 
    const profileDetails = {}
 
    var saveData = {};
    
    if( resumeFilename !== '' && appliedItemData?.applyData?.cv?.FileName !== '' ){
    //saveData.resume_file =  resumeFilename;
    //profileDetails.resume_file = resumeFilename;
    } 
     
    saveData.job_id = jobDataPrev._id ; 
 
    if( typeof appliedItemData?.applyData?.CurrentLocation !== 'undefined' && appliedItemData?.applyData?.CurrentLocation !== '' ){
     profileDetails.location = appliedItemData?.applyData?.CurrentLocation ;
     saveData.location = appliedItemData?.applyData?.CurrentLocation ;
    }
 
    if( typeof appliedItemData?.applyData?.Designation !== 'undefined' && appliedItemData?.applyData?.Designation !== '' ){
     profileDetails.designation = appliedItemData?.applyData?.Designation;
     saveData.designation = appliedItemData?.applyData?.Designation;
    }
 
    if( typeof appliedItemData?.applyData?.TotalExp !== 'undefined' && appliedItemData?.applyData?.TotalExp !== '' ){
     profileDetails.total_experience = parseInt( appliedItemData?.applyData?.TotalExp ) ;
     saveData.total_experience =  parseInt( appliedItemData?.applyData?.TotalExp )+' Year(s)' ;
    }
    
    if( typeof appliedItemData?.applyData?.TotalExp !== 'undefined' && appliedItemData?.applyData?.TotalExp !== '' ){
     profileDetails.relevant_experience = parseInt( appliedItemData?.applyData?.TotalExp ) ;
     saveData.relevant_experience =  parseInt( appliedItemData?.applyData?.TotalExp )+' Year(s)' ;
    } 
 
    profileDetails.applied_from = 'Naukri' ; 
 
    if( typeof appliedItemData?.applyData?.CurrEmployer !== 'undefined' && appliedItemData?.applyData?.CurrEmployer !== '' ){
         saveData.current_employer = appliedItemData?.applyData?.CurrEmployer; 
    } 
 
    var jobLocation =  appliedItemData?.applyData?.CurrentLocation || '';
    var DateOfBirth =  appliedItemData?.applyData?.DateOfBirth || '';
    var Designation =  appliedItemData?.applyData?.Designation || '';
    var full_name = appliedItemData?.applyData?.Salutation+' '+appliedItemData?.applyData?.FirstName+' '+appliedItemData?.applyData?.LastName || '';
    var emailId = appliedItemData?.applyData?.Email || '';
    var HighestEducation = appliedItemData?.applyData?.HighestEducation || '';
    var KeySkills = appliedItemData?.applyData?.KeySkills || '';
    var Mobile = appliedItemData?.applyData?.Mobile || '';
    var Gender = appliedItemData?.applyData?.Gender || '';
    var Salary = appliedItemData?.applyData?.Salary || '';
 
    saveData.name = full_name;
    saveData.email = emailId;
    saveData.mobile_no = Mobile;
    saveData.notice_period = '30 Days';
    saveData.current_ctc = Salary; 
 
    saveData.project_id = jobDataPrev.project_id;
    saveData.project_name = jobDataPrev.project_name;
    saveData.job_title = jobDataPrev.job_title;
    saveData.job_type = jobDataPrev.job_type;

 
    saveData.add_date = dbDateFormat();
    saveData.updated_on =  dbDateFormat();
    saveData.profile_status = 'Active';
    saveData.form_status = 'Applied';
    saveData.profile_avg_rating = 0;
    saveData.interview_shortlist_status = '';
 
    /*Added After Test for Final Discussion on 07-Nov-2024 for last applied form*/
    saveData.assessment_status = 'Pending';
    saveData.assessment_result = '';
    saveData.score = 0; 
    saveData.mcq_final_score = 0; 
    saveData.mcq_score_final_result = ''; 
    saveData.mcq_attempts = 'Available'; 
    saveData.comprehensive_final_score = 0; 
    saveData.comprehensive_score_final_result = ''; 
    saveData.comprehensive_attempts = 'Available'; 
    saveData.assessment_apply_status = 'enable';
    saveData.applied_from = 'Naukri';
 
    const jobDetails = {}
    jobDetails.job_id = jobDataPrev._id;
    jobDetails.job_title = jobDataPrev.job_title;
    jobDetails.job_type = jobDataPrev.job_type;
    jobDetails.project_id = jobDataPrev.project_id;
    jobDetails.project_name = jobDataPrev.project_name;
    jobDetails.department = jobDataPrev.department;
    jobDetails.form_status = 'Applied';
    jobDetails.add_date = dbDateFormat();
    jobDetails.job_location = jobLocation;
    jobDetails.job_designation = Designation;
    jobDetails.profile_details = profileDetails;
    jobDetails.final_job_offer_approval_status = 'No'; 
    jobDetails.naukri_ref_id = appliedItemData?.id || '';
 
    var collectAllEduDetails = []
    if( typeof appliedItemData?.applyData?.Education !== 'undefined' && appliedItemData?.applyData?.Education ){ 
        
     if( appliedItemData?.applyData?.Education?.ug ){
         var eduDetails = {}
         eduDetails.institute = appliedItemData?.applyData?.Education?.ug?.university || '';
         eduDetails.degree = appliedItemData?.applyData?.Education?.ug?.qualification || '';
         if( appliedItemData?.applyData?.Education?.ug?.yearOfPassing !== '' ){
             eduDetails.from_date = new Date( `${appliedItemData?.applyData?.Education?.ug?.yearOfPassing}-07-01`);
             eduDetails.to_date = new Date( `${appliedItemData?.applyData?.Education?.ug?.yearOfPassing}-07-01`);
         } 
         eduDetails.add_date =  dbDateFormat();
         collectAllEduDetails.push( eduDetails );
     }

      
     if( appliedItemData?.applyData?.Education?.pg ){
            var eduDetails = {}
            eduDetails.institute = appliedItemData?.applyData?.Education?.pg?.university || '';
            eduDetails.degree = appliedItemData?.applyData?.Education?.pg?.qualification || '';
            if( appliedItemData?.applyData?.Education?.pg?.yearOfPassing !== '' ){
                eduDetails.from_date = new Date( `${appliedItemData?.applyData?.Education?.pg?.yearOfPassing}-07-01`);
                eduDetails.to_date = new Date( `${appliedItemData?.applyData?.Education?.pg?.yearOfPassing}-07-01`);
            } 
            eduDetails.add_date =  dbDateFormat();
            collectAllEduDetails.push( eduDetails );
     }

     if( appliedItemData?.applyData?.Education?.doctorate ){
            var eduDetails = {}
            eduDetails.institute = appliedItemData?.applyData?.Education?.doctorate?.university || '';
            eduDetails.degree = appliedItemData?.applyData?.Education?.doctorate?.qualification || '';
            if( appliedItemData?.applyData?.Education?.doctorate?.yearOfPassing !== '' ){
                eduDetails.from_date = new Date( `${appliedItemData?.applyData?.Education?.doctorate?.yearOfPassing}-07-01`);
                eduDetails.to_date = new Date( `${appliedItemData?.applyData?.Education?.doctorate?.yearOfPassing}-07-01`);
            } 
            eduDetails.add_date =  dbDateFormat();
            collectAllEduDetails.push( eduDetails );
     }  
    } 

   // console.log( collectAllEduDetails );
 
  
 
    JobsCL.findOne( {_id:  saveData.job_id }, { designation_id: 1, designation: 1, assessment_status : 1, requisition_form_id : 1 })
    .then( (jobData)=>{
        if( jobData ){
            jobDetails.job_designation_id = jobData.designation_id;
            jobDetails.job_designation = jobData.designation;
            saveData.assessment_apply_status = jobData.assessment_status; 
        }
 
        /*define assessment mail enable/disabled status*/
        const is_assessment_enabled = jobData && jobData.assessment_status === 'enable' ? true : false;
 
            RequisitionFormCI.findOne( {_id:  jobData.requisition_form_id }, { type_of_opening: 1, title: 1, fund_type: 1 })
            .then( (MprData)=>{ 
             
 
                        if( MprData ){
                            jobDetails.mpr_job_offer_type = MprData?.type_of_opening;
                            jobDetails.requisition_form_id = MprData?._id;
                            jobDetails.mpr_id = MprData?.title;
                            jobDetails.mpr_fund_type = MprData?.fund_type;
                        }
 
                        JobAppliedCandidateCl.findOne( { email: saveData.email } )
                        .then( (ckData)=>{
                          
                            if( ckData ){
                                if( ckData.profile_status === 'Blocked'){
                                    return  'Unfortunately, your application for the position cannot be accepted because your profile is currently blocked.';
                                }
                                var matchDuplicate = ckData.applied_jobs.find( (item)=> item.job_id.toString() === saveData.job_id.toString() ); 
                                if( matchDuplicate ){
                                    return 'You have already expressed interest in this job.';
                                }  
                                
                                saveData.page_steps = {'step':'1','page':'MCQ','status':'pending'};
                                saveData.complete_profile_status = 60;
                                /***** Update data ******/
                                const PushDataList = {}
                                PushDataList.applied_jobs = jobDetails;
                                if( collectAllEduDetails.length > 0 ){
                                   PushDataList.education = eduDetails;
                                } 
                                
                                JobAppliedCandidateCl.updateOne( {_id: ckData._id }, { $set: saveData, $push : PushDataList } )
                                .then( (data)=>{ 
                                    getResumeFromPathAndSaveInFolder( emailId, appliedItemData?.jobId, appliedItemData?.id, appliedItemData?.resumeFileId );
                                    return  'You have successfully applied for the job.';
                                })
                                .catch( (error)=>{
                                    return ;
                                });         
                            }else {
                                saveData.applied_jobs = [jobDetails];
                                if( collectAllEduDetails.length > 0 ){
                                    saveData.education = [eduDetails];
                                }
                                saveData.page_steps = {'step':'1','page':'MCQ','status':'pending'};
                                const instData = new JobAppliedCandidateCl( saveData );
                                instData.save()
                                .then( (data)=>{  
                                 //console.log( data );
                                   getResumeFromPathAndSaveInFolder( emailId, appliedItemData?.jobId, appliedItemData?.id, appliedItemData?.resumeFileId );
                                    return  'You have successfully applied for the job.';
                                })
                                .catch( (error)=>{
                                 //console.log( error );
                                    return process.env.DEFAULT_ERROR_MESSAGE; 
                                });
                            }
                        }).catch( (error)=>{   console.log( error );
                            return  process.env.DEFAULT_ERROR_MESSAGE ; 
                        });
 
            }).catch( (error)=>{  console.log( error );
                return process.env.DEFAULT_ERROR_MESSAGE ; 
            });
    }).catch( (error)=>{  console.log( error );
        return  process.env.DEFAULT_ERROR_MESSAGE; 
    });
 }


var getAppliedJobDataFrom = async ( jobData , page_no = 0 ) =>{ 

        var job_doc_id = jobData?._id;
        var jobId = jobData?.naukari_job_data?.publish_job_id;
        var expiry_date = jobData?.naukari_job_data?.expiry_date;
        var posted_date = jobData?.naukari_job_data?.posted_date; 
        
        var today_on = new Date();

        const payload = {}
        payload.page = page_no > 0 ? parseInt( page_no ) - 1 : 0;

        if( expiry_date && expiry_date > today_on && posted_date && posted_date < today_on){
            payload.fromDate = allDateFormat( new Date( posted_date ), 'YYYY-MM-DD' )+' 00:00:00';
            payload.toDate = allDateFormat( new Date( today_on ), 'YYYY-MM-DD' )+' 23:59:00';
        }else if( posted_date && expiry_date ){
            payload.fromDate = allDateFormat( new Date( posted_date ), 'YYYY-MM-DD' )+' 00:00:00';
            payload.toDate = allDateFormat( new Date( expiry_date ), 'YYYY-MM-DD' )+' 23:59:00';
        }else{
            payload.fromDate = allDateFormat( new Date( today_on ), 'YYYY-MM-DD' )+' 00:00:00';
            payload.toDate = allDateFormat( new Date( today_on ), 'YYYY-MM-DD' )+' 23:59:00';
        }

        const NAUKRI_JOBS_API_KEY = process.env.NAUKRI_JOBS_API_KEY;

        //console.log( payload );
    
        const queryParams = new URLSearchParams(payload).toString();
        const postUrl = `https://api.zwayam.com/amplify/v2/jobs/${jobId}/applies?${queryParams}`; 

        try{
            const apiResponseData = await axios.get( postUrl , {
                headers: {
                'Content-Type': 'application/json',
                'api_key': NAUKRI_JOBS_API_KEY 
                }
            }); 

            var apiResponse = apiResponseData?.data ;
             //console.log( JSON.stringify( apiResponse?.data ) );

            if( apiResponse?.data && apiResponse?.data?.length > 0 && apiResponse?.totalCount !== 0 ){
                    // console.log( page_no , apiResponse?.data );

                    apiResponse?.data?.forEach( (elm)=>{
                        addApplyJobsFromNaukri( elm, jobData );
                    });

                    //repeat again
                    page_no += 1;
                    getAppliedJobDataFrom( jobData , page_no ); 

            }else if( apiResponse?.data && apiResponse?.data?.length < apiResponse?.pageSize && apiResponse?.totalCount !== 0 ){
                    apiResponse?.data?.forEach( (elm)=>{
                        addApplyJobsFromNaukri( elm, jobData );
                    });
            }

        } catch( error ){
            console.error('Error posting job:', error.response?.data || error.message);
            //return res.status(403).json({status: false, 'message': error.response?.data || error.message });
        }
}


/********* Get Applications Against Naukri Data **********/
controller.getApplicantsFromNaukriForCompany = async( req, res )=>{  

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(402).json({ status: false, message: errors.array()[0].msg });
    }
 
    /************ Fetch Records ************/
    const where = {}
    where.status = 'Published';
    where['naukari_job_data'] = { $exists: true };
    where['naukari_job_data.status'] = 'CREATED';
    const jobKeys = {_id:1, naukari_job_data: 1, project_id:1, job_title:1,job_type:1, project_name:1,department:1,department_id:1,designation:1,designation_id:1,requisition_form_id:1, requisition_form_title :1, ctc_amount:1 }
    const jobDataList = await JobsCL.find( where, jobKeys );

    //console.log( jobDataList );
    
    //return res.status(402).json({ status: false, message: 'No Job Record Found ' }); 
    
    if( !jobDataList ){
        return res.status(402).json({ status: false, message: 'No Job Record Found ' });
    }


    /**************** Get Applications list ****************/ 
    jobDataList.forEach( (item)=>{
        
        /*********** Check url link data first ************/
        if( ( typeof item?.naukari_job_data?.publish_link === 'undefined' || String( item?.naukari_job_data?.publish_link ) === '' )  &&  (  item?.naukari_job_data?.publish_job_id !== 'undefined' || String( item?.naukari_job_data?.publish_job_id ) !== '' ) ){
           updateJobLinkData( item ); 
        }

        /*********** fetch applicant data first ************/
        if( ( typeof item?.naukari_job_data?.publish_link  !== 'undefined' || String( item?.naukari_job_data?.publish_link ) !== '' )  && (  item?.naukari_job_data?.publish_job_id !== 'undefined' || String( item?.naukari_job_data?.publish_job_id ) !== '' ) ){
            getAppliedJobDataFrom( item, 1 );
        }

        /*Update Applied Job Candidates records */
        if( String( item?._id ) !== '' && (  item?.naukari_job_data?.publish_job_id !== 'undefined' || String( item?.naukari_job_data?.publish_job_id ) !== '' ) ){
         updateCandidateJobRecords( item._id.toString() , item.project_id.toString() );
        }

    }); 

    return res.status(402).json({ status: true, message: 'Successful' });  
    
}


var getResumeFromPathAndSaveInFolder = async ( emailId, job_board_id, applied, resumeId ) =>{

    const NAUKRI_JOBS_API_KEY = process.env.NAUKRI_JOBS_API_KEY;

    //console.log( payload ); 
    const postUrl = `https://api.zwayam.com/amplify/v2/jobs/${job_board_id}/applies/${applied}/files/${resumeId}`; 

    try{
        const apiResponseData = await axios.get( postUrl , {
            headers: {
            'Content-Type': 'application/json',
            'api_key': NAUKRI_JOBS_API_KEY 
            }
        });

        var apiResponse = apiResponseData?.data;

        if( apiResponse?.url && apiResponse?.url !=='' ){
            var resumeFileUrl = apiResponse?.url;
          
            var candidateId = `${Date.now()}_${getRandomInt(10000000,99999999)}_${getRandomInt(10000000,99999999)}`;
            try {
                // Parse the file extension from the URL
                const parsedUrl = url.parse(resumeFileUrl);
                const pathname = parsedUrl.pathname;
                const extension = path.extname(pathname);
            
                if (!extension) {
                  //console.log( 'Could not determine file extension from URL.' );
                }
            
               // const outputFolder = path.join(__dirname, 'uploads');
                const fileName = `${candidateId}_resume${extension}`;
                const filePath = path.join( uploadsDir, fileName);
            
                // Ensure the folder exists
                if (!fs.existsSync(uploadsDir)) {
                  fs.mkdirSync(uploadsDir, { recursive: true });
                }
            
                // Download and stream the file to disk
                const response = await axios({
                  method: 'GET',
                  url: resumeFileUrl,
                  responseType: 'stream',
                });
            
                const writer = fs.createWriteStream(filePath);
                response.data.pipe(writer);
            
                writer.on('finish', () => {
                 // console.log('✅ File saved:', filePath);
                      
                 JobAppliedCandidateCl.updateOne( { email: emailId }, {$set:{ resume_file: fileName }} )
                 .then( (upData)=>{
                    //console.log(  upData )
                 })

                });
            
                writer.on('error', (err) => {
                  //console.error('❌ Error saving file:', err);
                  //return  'Failed to save file' ;
                });
            
              } catch (err) {
                //console.error('❌ Error:', err.message);
               //return  'Download failed' ;
              }
             
        } 
        

    } catch( error ){
        console.error('Error posting job:', error.response?.data || error.message);
        //return res.status(403).json({status: false, 'message': error.response?.data || error.message });
    }
}

/********* Get Applications Against Naukri Data **********/
controller.fetchCandidatesFromNaukriByJobId = async( req, res )=>{  

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(402).json({ status: false, message: errors.array()[0].msg });
    }
 
    const { job_doc_id } = req.body;

    /************ Fetch Records ************/
    const where = {}
    where.status = 'Published';
    where._id = dbObjectId( job_doc_id );
    where['naukari_job_data'] = { $exists: true };
    where['naukari_job_data.status'] = 'CREATED';
    const jobKeys = {_id:1, naukari_job_data: 1, project_id: 1, job_type: 1, job_title: 1, project_name: 1, department: 1, department_id: 1, designation: 1, designation_id: 1 }
    const jobDataList = await JobsCL.find( where, jobKeys );
 
    if( !jobDataList ){
        return res.status(402).json({ status: false, message: 'No Job Record Found' });
    } 
    
    /**************** Get Applications list ****************/ 
    jobDataList.forEach( (item)=>{
        
        /*********** Check url link data first ************/
        if( ( typeof item?.naukari_job_data?.publish_link  === 'undefined' || String( item?.naukari_job_data?.publish_link ) === '' )  &&  (  item?.naukari_job_data?.publish_job_id !== 'undefined' || String( item?.naukari_job_data?.publish_job_id ) !== '' ) ){
           updateJobLinkData( item ); 
        }

        /*********** fetch applicant data first ************/
        if( ( typeof item?.naukari_job_data?.publish_link  !== 'undefined' || String( item?.naukari_job_data?.publish_link ) !== '' )  && ( item?.naukari_job_data?.publish_job_id !== 'undefined' || String( item?.naukari_job_data?.publish_job_id ) !== '' ) ){
           getAppliedJobDataFrom( item, 1 );
        }

        /*Update Applied Job Candidates records */
        if( String( item?._id ) !== '' && (  item?.naukari_job_data?.publish_job_id !== 'undefined' && item?.naukari_job_data?.publish_job_id !== '' ) ){
           updateCandidateJobRecords( item._id.toString() , item.project_id.toString() );
        }

    }); 

    return res.status(200).json({ status: true, message: 'Candidate List Refreshed Successfully' });  
    
}



module.exports = controller;
