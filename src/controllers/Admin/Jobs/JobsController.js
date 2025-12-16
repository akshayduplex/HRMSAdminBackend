const JobsCL = require('../../../models/JobsCI.js');
const DesignationCl = require('../../../models/DesignationCl.js');
const ProjectCl = require('../../../models/ProjectCl.js');
const JobAppliedCandidateCl = require('../../../models/JobAppliedCandidateCl.js');

const { dbObjectId } = require('../../../models/dbObject.js');
const dotenv = require("dotenv");
const fs 	  = require('fs');
dotenv.config({path:'../src/config.env'});
const { dbDateFormat, updateDatesInArray,replaceNullUndefined , allDateFormat,createSlug, lettersOnly, removeFile, getHumanReadableDate, convertToDbDate, commonOnly } = require('../../../middlewares/myFilters.js');
 
const { validationResult } = require('express-validator');
const RequisitionFormCI = require('../../../models/RequisitionFormCI.js');

const organizationConfig = JSON.parse( fs.readFileSync('./src/config/organization_config_file.txt', 'utf8' ) );  

const companyName = organizationConfig?.organization_name;


/** Default Scopes for Fetch Data**/
const defaultScopesFields = ["_id", "title", "duration", "location", "logo","extend_date_list","extend_budget_list","start_date","end_date","budget","budget_estimate_list"];
const defaultJobStatus = [{'level':'Total','value':0},{'level':'Applied','value':0},{'level':'Shortlisted','value':0},{'level':'Interview','value':0},{'level':'Offer','value':0},{'level':'Hired','value':0},{'level':'Rejected','value':0}];

const controller = {};

/********* Post New Jobs Data **********/
controller.AddJobData = async ( req, res )=>{  

    const errors = validationResult(req);

    if (!errors.isEmpty()) { 
        return res.status(402).json({ status: false, message: errors.array()[0].msg });
    } 

    saveData = {};
    saveData = req.body; 
    saveData.company = companyName;

    if( typeof req.body.project_id !== 'undefined' && req.body.project_id !== ''  ){
        saveData.project_id = dbObjectId( req.body.project_id ); 
    }

    if( typeof req.body.requisition_form_id !== 'undefined' && req.body.requisition_form_id !== ''  ){
        saveData.requisition_form_id = dbObjectId( req.body.requisition_form_id ); 
        /****** fetch mpr type*******/
        const fetchMprData = await RequisitionFormCI.findOne( {_id: saveData.requisition_form_id }, { type_of_opening: 1});
        console.log( fetchMprData );
        if( fetchMprData ){
            saveData.requisition_form_opening_type = fetchMprData.type_of_opening ; 
        } 
    }else{
         saveData.requisition_form_opening_type = 'new'; 
    }
 

    if( typeof saveData.location !== 'undefined' && saveData.location.length > 0  ){  
        saveData.location = req.body.location.map((item)=>{
            const pushData = {}
            pushData.loc_id = dbObjectId( item.id );
            pushData.name =  item.name;
            return pushData;
        });
    }
    if( typeof saveData.tags !== 'undefined' && saveData.tags.length > 0  ){
        saveData.tags =  req.body.tags.map((item)=>{
            const pushData = {} 
            pushData.name =  item;
            return pushData;
        });
    }
    if( typeof saveData.benefits !== 'undefined' && saveData.benefits.length > 0  ){
        saveData.benefits =  req.body.benefits.map((item)=>{
            const pushData = {} 
            pushData.name =  item;
            return pushData;
        }); 
    }
    if( typeof saveData.educations !== 'undefined' && saveData.educations.length > 0  ){
        saveData.educations =  req.body.educations .map((item)=>{
            const pushData = {} 
            pushData.name =  item;
            return pushData;
        }); 
    }
    if( typeof saveData.form_personal_data !== 'undefined' && saveData.form_personal_data.length > 0  ){
        saveData.form_personal_data =  req.body.form_personal_data ; 
    }
    if( typeof saveData.form_profile !== 'undefined' && saveData.form_profile.length > 0  ){
        saveData.form_profile =  req.body.form_profile ; 
    }
    if( typeof saveData.form_social_links !== 'undefined' && saveData.form_social_links.length > 0  ){
        saveData.form_social_links =  req.body.form_social_links ; 
    }

    if( typeof req.body.department_id !== 'undefined' && req.body.department_id !== ''  ){
        saveData.department_id = dbObjectId( req.body.department_id ); 
    }
    if( typeof req.body.designation_id !== 'undefined' && req.body.designation_id !== ''  ){
        saveData.designation_id = dbObjectId( req.body.designation_id ); 
    } 

    if( typeof saveData.division !== 'undefined' && saveData.division.length > 0  ){
        saveData.division_list =  req.body.division .map((item)=>{
            const push = {}
            push.div_id = dbObjectId( item.id ); 
            push.name = item.name; 
            return push;
        });
        saveData.division =  saveData.division_list.map(item=>item.name).join(', '); 
    }

    if( typeof saveData.region !== 'undefined' && saveData.region.length > 0  ){
        saveData.region_list =  req.body.region.map((item)=>{
            const push = {}
            push.region_id = dbObjectId( item.id ); 
            push.name = item.name; 
            return push;
        });
        saveData.region =  saveData.region_list.map(item=>item.name).join(', '); 
    }

    /***** Create job Unique Code ********/
    const firstLettersFromJobTitle = saveData.job_title.split(" ").filter(word => /^[a-zA-Z]+$/.test(word)).map(word => word[0].toUpperCase());  
    const jobCode = firstLettersFromJobTitle.join(""); 
    saveData.job_publish_code = `${jobCode}-${allDateFormat(dbDateFormat(),'DDMMYYYY')}`;
    
    /*******  Create job slug ***********/
    const assignSlugValue = saveData.job_title+' '+saveData.job_publish_code;
    saveData.job_title_slug = createSlug( assignSlugValue );


    saveData.deadline = convertToDbDate( req.body.deadline );
    saveData.add_date = dbDateFormat();
    saveData.updated_on =  dbDateFormat();
    saveData.form_candidates =  defaultJobStatus.map((item)=>{
        const pushData = {} 
        pushData.level =  item.level;
        pushData.value =  item.value;
        return pushData;
    });
 

    JobsCL.findOne( { project_name: saveData.project_name, job_title: saveData.job_title, status :'Published' } )
    .then( (ckData)=>{
        if( ckData ){
            return res.status(409).send( {'status':false, 'message': 'Job Already Added'} );
        }
 
        const instData = new JobsCL( saveData );
        instData.save()
        .then( (data)=>{ 
            
            /***********  fetch Project Details Start ************/
            ProjectCl.findOne( { _id:  dbObjectId( req.body.project_id ) }, {'budget_estimate_list':1 })
                .then((oldProData)=>{    

                        if( oldProData ){ 

                          
                            var findDesignation = oldProData.budget_estimate_list.find( (item)=>item.designation_id?.toString() === req.body.designation_id.toString()  );
                            if( !findDesignation ){
                            var findDesignation = oldProData.budget_estimate_list.find( (item)=>item.designation === req.body.designation ); 
                            } 
                            

                            if( findDesignation ){ 
                                
                                var arrayFilters = { 'arrayFilters': [{'one._id': findDesignation._id }] } 
                                
                                let where = {}
                                where['_id'] = dbObjectId( req.body.project_id );
                                where['budget_estimate_list._id'] = findDesignation._id;
                                var saveData = {}
                                saveData['budget_estimate_list.$[one].vacant_date'] = dbDateFormat();
                                if(['On Contract','On-Contract','onContract'].includes( req.body.job_type )){
                                    saveData['budget_estimate_list.$[one].employee_type'] = 'onContract';
                                }
                                else if(['On Role','On-Role','onRole'].includes( req.body.job_type )){
                                    saveData['budget_estimate_list.$[one].employee_type'] = 'onRole';
                                }
                                else if(['Em Panelled','Em-Panelled','emPanelled'].includes( req.body.job_type )){
                                    saveData['budget_estimate_list.$[one].employee_type'] = 'emPanelled';
                                }
                                
                                /****** Check Region Data *****/
                                if( typeof findDesignation.regions !== 'undefined' && findDesignation.regions.length > 0 && typeof req.body.region !== 'undefined' && req.body.region !== '' ){
                                    const regionsList = findDesignation.regions;
                                    if( !findDesignation.regions.includes(req.body.region)){
                                        regionsList.push( req.body.region );
                                    }
                                    saveData['budget_estimate_list.$[one].regions'] = regionsList;
                                }else if( typeof req.body.region !== 'undefined' && req.body.region !== '' ){
                                    saveData['budget_estimate_list.$[one].regions'] = [req.body.region];
                                }

                                if( typeof findDesignation.divisions !== 'undefined' && findDesignation.divisions.length > 0 && typeof req.body.division !== 'undefined' && req.body.division !== '' ){
                                    const divisionsList = findDesignation.divisions;
                                    if( !findDesignation.divisions.includes(req.body.division)){
                                        divisionsList.push( req.body.division );
                                    }
                                    saveData['budget_estimate_list.$[one].divisions'] = divisionsList;
                                }else if( typeof req.body.region !== 'undefined' && req.body.region !== '' ){
                                    saveData['budget_estimate_list.$[one].divisions'] = [req.body.division];
                                } 
                                
                                ProjectCl.updateOne( where , { $set : saveData } , arrayFilters )
                                .then((d)=>{ 
                                    return res.status(200).send( {'status':true, 'message': 'Job Created Successfully'} );
                                })
                                .catch( (error)=>{  
                                    return res.status(403).send( {'status':false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE} ); 
                                }); 
                            }else{
                                return res.status(200).send( {'status':true, 'message': 'Job Created Successfully'} );
                            }
                             
                        }else{
                            return res.status(200).send( {'status':true, 'message': 'Job Created Successfully'} );
                        }
                       
            })
            .catch( (error)=>{  
                return res.status(403).send( {'status':false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE} ); 
            });        
            /***********  fetch Project Details End ************/
        })
        .catch( (error)=>{  
            return res.status(403).send( {'status':false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE} ); 
        });
    }).catch( (error)=>{ 
        return res.status(403).send( {'status':false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE } ); 
    });

}

/********* Clone Jobs Data **********/
controller.cloneJobData = ( req, res )=>{ 

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        if( req.file &&  req.file.filename ){
            removeFile( req.file.filename );
        }
        return res.status(402).json({ status: false, message: errors.array()[0].msg });
    } 

    const { job_id } = req.body; 

    JobsCL.findOne( { _id : dbObjectId( job_id ) } )
    .then( (ckData)=>{

        if( !ckData ){
            return res.status(403).send( {'status':false, 'message': 'Document ID not matched '} );
        }

        const clonedUserData = ckData.toObject();


        const saveData = {}
        /***** Create job Unique Code ********/
        const firstLettersFromJobTitle = clonedUserData.job_title.split(" ").filter(word => /^[a-zA-Z]+$/.test(word)).map(word => word[0].toUpperCase());  
        const jobCode = firstLettersFromJobTitle.join(""); 
        saveData.job_publish_code = `${jobCode}-${allDateFormat(dbDateFormat(),'DDMMYYYY')}`;

        /*******  Create job slug ***********/
        const assignSlugValue = clonedUserData.job_title+' '+saveData.job_publish_code;
        saveData.job_title_slug = createSlug( assignSlugValue );


        JobsCL.findOne( { job_title_slug:saveData.job_title_slug, project_name: clonedUserData.project_name, job_title: clonedUserData.job_title, status :'Published' },{_id: 1} )
        .then( (ckDuplicate)=>{
            if( ckDuplicate ){
                return res.status(409).send( {'status':false, 'message': 'This Job Already Cloned'} );
            }

            
            saveData.project_id = clonedUserData.project_id;
            saveData.project_name = clonedUserData.project_name;
            saveData.department = clonedUserData.department;
            saveData.job_title = clonedUserData.job_title;
            saveData.job_type = clonedUserData.job_type;
            saveData.experience = clonedUserData.experience;
            saveData.salary_range = clonedUserData.salary_range;
            const currentDate = new Date(); 
            const futureDate = new Date(currentDate.getTime() + 15 * 24 * 60 * 60 * 1000); 
            saveData.deadline = futureDate.toISOString();
            saveData.description = clonedUserData.description;
            saveData.company = clonedUserData.company;
            saveData.form_personal_data = clonedUserData.form_personal_data;
            saveData.form_profile = clonedUserData.form_profile;
            saveData.form_social_links = clonedUserData.form_social_links;
            saveData.requisition_form = clonedUserData.requisition_form;
            if( clonedUserData?.requisition_form_id && clonedUserData?.requisition_form_id !== '' ){
                saveData.requisition_form_title = clonedUserData.requisition_form_id;
            }
            saveData.requisition_form_title = clonedUserData.requisition_form_title || '';
            saveData.requisition_form_opening_type = clonedUserData.requisition_form_opening_type || 'new';
            
            saveData.working = clonedUserData.working;
            saveData.status = 'Published';
            saveData.add_date = dbDateFormat();
            saveData.updated_on = dbDateFormat();
            saveData.form_candidates =  defaultJobStatus.map((item)=>{
                const pushData = {} 
                pushData.level =  item.level;
                pushData.value =  item.value;
                return pushData;
            });

            
            if( typeof clonedUserData.location !== 'undefined' && clonedUserData.location.length > 0  ){  
                saveData.location =  clonedUserData.location.map((item)=>{
                    const pushData = {}
                    pushData.loc_id = item.loc_id;
                    pushData.name =  item.name; 
                    return pushData;
                });  
            }

            if( typeof clonedUserData.tags !== 'undefined' && clonedUserData.tags.length > 0  ){
                saveData.tags = clonedUserData.tags.map((item)=>{
                    const pushData = {} 
                    pushData.name =  item.name;
                    return pushData;
                });
            }

            if( typeof clonedUserData.benefits !== 'undefined' && clonedUserData.benefits.length > 0  ){
                saveData.benefits = clonedUserData.benefits.map((item)=>{
                    const pushData = {} 
                    pushData.name =  item.name;
                    return pushData;
                }); 
            }
            if( typeof clonedUserData.educations !== 'undefined' && clonedUserData.educations.length > 0  ){
                saveData.educations = clonedUserData.educations.map((item)=>{
                    const pushData = {}
                    pushData.name =  item.name;
                    return pushData;
                });
            } 


           


            const instData = new JobsCL( saveData );
            instData.save()
            .then( (data)=>{
                return res.status(200).send( {'status':true, 'message': 'Job Cloned Successfully'} );
            })
            .catch( (error)=>{ 
                return res.status(403).send( {'status':false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE} ); 
            });

        })
        .catch( (error)=>{ 
            return res.status(403).send( {'status':false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE} ); 
        });
    }).catch( (error)=>{
        return res.status(403).send( {'status':false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE } ); 
    });
}


controller.editJobData = ( req , res ) => { 
    
    const errors = validationResult(req);

    if (!errors.isEmpty()) { 
        return res.status(402).json({ status: false, message: errors.array()[0].msg });
    }   
    
    const { _id } = req.body;


    let saveData = {}
    saveData = req.body;
    saveData.company = companyName;
    saveData.updated_on =  dbDateFormat(); 

    if( typeof req.body.project_id !== 'undefined' && req.body.project_id !== ''  ){
        saveData.project_id = dbObjectId( req.body.project_id ); 
    }

    if( typeof req.body.requisition_form_id !== 'undefined' && req.body.requisition_form_id !== ''  ){
        saveData.requisition_form_id = dbObjectId( req.body.requisition_form_id ); 
    }


    if( typeof saveData.location !== 'undefined' && saveData.location.length > 0  ){ 
        saveData.location =  req.body.location .map((item)=>{
            const pushData = {}
            pushData.loc_id = dbObjectId( item.id );
            pushData.name =  item.name;
            return pushData;
        });
    }
    if( typeof saveData.tags !== 'undefined' && saveData.tags.length > 0  ){
        saveData.tags = req.body.tags.map((item)=>{
            const pushData = {} 
            pushData.name =  item;
            return pushData;
        });
    }
    if( typeof saveData.benefits !== 'undefined' && saveData.benefits.length > 0  ){
        saveData.benefits = req.body.benefits.map((item)=>{
            const pushData = {} 
            pushData.name =  item;
            return pushData;
        }); 
    }
    if( typeof saveData.educations !== 'undefined' && saveData.educations.length > 0  ){
        saveData.educations =  req.body.educations.map((item)=>{
            const pushData = {} 
            pushData.name =  item;
            return pushData;
        }); 
    }
    if( typeof saveData.form_personal_data !== 'undefined' && saveData.form_personal_data.length > 0  ){
        saveData.form_personal_data =  req.body.form_personal_data ; 
    }
    if( typeof saveData.form_profile !== 'undefined' && saveData.form_profile.length > 0  ){
        saveData.form_profile =  req.body.form_profile ; 
    }
    if( typeof saveData.form_social_links !== 'undefined' && saveData.form_social_links.length > 0  ){
        saveData.form_social_links =  req.body.form_social_links ; 
    }

    if( typeof req.body.department_id !== 'undefined' && req.body.department_id !== ''  ){
        saveData.department_id = dbObjectId( req.body.department_id ); 
    }
    if( typeof req.body.designation_id !== 'undefined' && req.body.designation_id !== ''  ){
        saveData.designation_id = dbObjectId( req.body.designation_id ); 
    }

    
    if( typeof req.body.division !== 'undefined' && req.body.division.length > 0  ){
        saveData.division_list =  req.body.division.map((item)=>{
            const push = {}
            push.div_id = dbObjectId( item.id ); 
            push.name = item.name; 
            return push;
        });
        saveData.division =  saveData.division_list.map(item=>item.name).join(', '); 
    }

    if( typeof req.body.region !== 'undefined' && req.body.region.length > 0  ){
        saveData.region_list =  req.body.region.map((item)=>{
            const push = {}
            push.region_id = dbObjectId( item.id ); 
            push.name = item.name; 
            return push;
        });
        saveData.region =  saveData.region_list.map(item=>item.name).join(', '); 
    }
 

     /***** Create job Unique Code ********/
     const firstLettersFromJobTitle = saveData.job_title.split(" ").filter(word => /^[a-zA-Z]+$/.test(word)).map(word => word[0].toUpperCase());  
     const jobCode = firstLettersFromJobTitle.join(""); 
     saveData.job_publish_code = `${jobCode}-${allDateFormat(dbDateFormat(),'DDMMYYYY')}`;

     /*******  Create job slug ***********/
     const assignSlugValue = saveData.job_title+' '+saveData.job_publish_code;
     saveData.job_title_slug = createSlug( assignSlugValue );


    JobsCL.updateOne( { _id:  dbObjectId( _id ) }, {$set: saveData} )
    .then( (data)=>{ 

        if( data.modifiedCount === 1 ){
            return res.status(200).send( {'status':true, 'message': 'Job Updated Successfully'} );
        }else if( data.modifiedCount === 0 ){
            return res.status(304).send( {'status':false, 'message': 'No Action Performed'} );
        }else{
            return res.status(403).send( {'status':false, 'message': process.env.DEFAULT_ERROR_MESSAGE } );
        }
    }).catch( (error)=>{ 
        return res.status(403).send( {'status':false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE } ); 
    });
}

controller.deleteJobById = ( req , res ) => {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(409).json({ status: false, message: errors.array()[0].msg });
    }   
    
    const { _id } = req.body;

    JobsCL.deleteOne( { _id:  dbObjectId( _id ) } )
    .then( (data)=>{  
        if( data.deletedCount === 1 ){
            if( typeof req.body.filename !== 'undefined' &&  req.body.filename !== '' ){
                removeFile( req.body.filename );
            }

            return res.status(200).send( {'status':true, 'message': 'Job Deleted Successfully'} );
        }else if( data.deletedCount === 0 ){
            return res.status(304).send( {'status':false, 'message': 'No Action Performed'} );
        }else{
            return res.status(403).send( {'status':false, 'message': process.env.DEFAULT_ERROR_MESSAGE } );
        }
    }).catch( (error)=>{ 
        return res.status(403).send( {'status':false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE } ); 
    });
}

controller.getJobById = ( req , res ) => {

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
    

    JobsCL.find( { _id:  dbObjectId( _id ) }, fetchKeys )
    .then( (data)=>{   
        if( data.length > 0 ){ 
            const outPutData = updateDatesInArray( replaceNullUndefined( data ), ['add_date', 'updated_on'] , 'datetime' );              
            return res.status(200).send( {'status':true, 'data': outPutData[0], 'message': 'API Accessed Successfully'} );
        }else{
            return res.status(204).send( {'status':false, 'message': 'No record matched'} );
        }
    }).catch( (error)=>{ 
        return res.status(403).send( {'status':false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE } ); 
    });
}

controller.getJobBySlug = ( req , res ) => {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(402).json({ status: false, message: errors.array()[0].msg });
    }   
    
    const { slug } = req.body;  

    const fetchKeys = {}
    if( req.body.hasOwnProperty('scope_fields') && req.body.scope_fields.length > 0 ){
        req.body.scope_fields.forEach(field => {
            fetchKeys[field] = 1;  
        }); 
    }else{
        fetchKeys.__v = 0;
    }
    

    JobsCL.find( { job_title_slug:  slug }, fetchKeys )
    .then( (data)=>{   
        if( data.length > 0 ){ 
            const outPutData = updateDatesInArray( replaceNullUndefined( data ), ['add_date', 'updated_on'] , 'datetime' );              
            return res.status(200).send( {'status':true, 'data': outPutData[0], 'message': 'API Accessed Successfully'} );
        }else{
            return res.status(204).send( {'status':false, 'message': 'No record matched'} );
        }
    }).catch( (error)=>{ 
        return res.status(403).send( {'status':false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE } ); 
    });
}

var changeNaukariJobStatus = async( _id )=>{
    
        const where = {} 
        where['_id'] = dbObjectId( _id );
        where['naukari_job_data'] = { $exists: true };
        where['naukari_job_data.status'] = 'CREATED';
        const jobKeys = {_id:1, naukari_job_data: 1 }
        const jobDataList = await JobsCL.findOne( where, jobKeys );
        
        const NAUKRI_JOBS_API_KEY = process.env.NAUKRI_JOBS_API_KEY;

        if( jobDataList && jobDataList?.naukari_job_data?.publish_job_id !== 'undefined' || String( jobDataList?.naukari_job_data?.publish_job_id ) !== ''){
            var jobId = jobDataList?.naukari_job_data?.publish_job_id;
            var postUrl = `https://api.zwayam.com/amplify/v2/jobs/${jobId}/unpublish`;
             await axios.post( postUrl , {jobBoards:['naukri']}, {
                headers: {
                'Content-Type': 'application/json',
                'api_key': NAUKRI_JOBS_API_KEY 
                }
            });  

           await JobsCL.updateOne( { _id: dbObjectId( _id ) }, { $set:{'naukari_job_data.status':'DELETED'}} );
        }
               
       return true;
}


controller.changeJobStatus = ( req , res ) => {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(409).json({ status: false, message: errors.array()[0].msg });
    }   
    
    const { _id } = req.body;

    let saveData = {}
    saveData = req.body;
    saveData.updated_on =  dbDateFormat();

    JobsCL.updateOne( { _id:  dbObjectId( _id ) }, {$set: saveData} )
    .then( (data)=>{ 

        if( data.modifiedCount === 1 ){
            if(  req.body.hasOwnProperty('status') && req.body.status === 'Unpublished' ){
                changeNaukariJobStatus( _id );
            }
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

controller.getJobList = ( req , res ) => {  
   
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
       let searchKeyWord = new RegExp( commonOnly( req.body.keyword ) ); 
        where['$or'] = [
            { department: { $regex: searchKeyWord, $options: 'i' } },
            { job_title: { $regex: searchKeyWord, $options: 'i' } },
            { 'educations.name': { $regex: searchKeyWord, $options: 'i' } } ,
            { 'location.name': { $regex: searchKeyWord, $options: 'i' } },
            { 'tags.name': { $regex: searchKeyWord, $options: 'i' } } ,
            { 'benefits.name': { $regex: searchKeyWord, $options: 'i' } } ,
        ]
    }

    if( req.body.hasOwnProperty('status') && req.body.status !== '' ){
        if( req.body.status === 'Expired'){
            where['deadline'] = {$lt: new Date()};
        }
        else if( req.body.status === 'Published'){
            where['deadline'] = {$gte: new Date()};
            where['status'] = 'Published';
        }   
        else{
            where['status'] = req.body.status;
        }
        /*Validate Active Jobs Only*/
        if( req.body.status === 'Active'){
            where['deadline'] = {$gt: new Date()};
        }
    }

    if( req.body.hasOwnProperty('department') && req.body.department !== '' ){
         where['department'] = req.body.department;
    }

    if( req.body.hasOwnProperty('job_title') && req.body.job_title !== '' ){
        where['job_title'] = req.body.job_title;
    }
    if( req.body.hasOwnProperty('job_type') && req.body.job_type !== '' ){
        where['job_type'] = req.body.job_type;
    }
    if( req.body.hasOwnProperty('salary_range') && req.body.salary_range !== '' ){
        where['salary_range'] = req.body.salary_range;
    }
    
    if( req.body.hasOwnProperty('location') && req.body.location !== '' ){ 
        let searchLocation =  new RegExp( commonOnly( req.body.location ) );  
        where['location.name'] = { $regex: searchLocation, $options: 'i' } ;
    }

    if( req.body.hasOwnProperty('project_id') && req.body.project_id !== '' ){
        where['project_id'] = dbObjectId( req.body.project_id );
    }

    /******** Add Total Count Records Logic *************/
    if( req.body.hasOwnProperty('is_count') && req.body.is_count !== '' ){
        JobsCL.countDocuments( where ) 
        .then( (data)=>{  
            return res.status(200).send( {'status':true, 'data': data, 'message': 'API Accessed Successfully'} ); 
        }).catch( (error)=>{ 
            return res.status(403).send( {'status':false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE } ); 
        }); 
    } /******End Of Total Count Records Logic*******/
    else{  /******Add Fetch Records Logic*******/

            const pageOptions = {
                page: parseInt( ((page_no ? page_no : 1) - 1)) || 0,
                limit: parseInt( per_page_record) || 10
            }

            JobsCL.find( where, fetchKeys )
            .skip( pageOptions.page * pageOptions.limit )
            .limit( pageOptions.limit )
            .sort( { _id : -1 } )
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
}
 

controller.getJobListPostedOnNaukri = ( req , res ) => {  
   
    const { page_no, per_page_record, scope_fields } = req.body; 

    const where = {}  
    const fetchKeys = {}
    
    if( req.body.hasOwnProperty('scope_fields') && scope_fields.length > 0 ){
        scope_fields.forEach(field => {
            fetchKeys[field] = 1;  
        }); 
    }else{
        fetchKeys.__v = 0;
        fetchKeys.description = 0;
    }

    where['naukari_job_data'] =  { $exists: true } 
    where['naukari_job_data.publish_code'] =  { $exists: true } 

    if( req.body.hasOwnProperty('keyword') && req.body.keyword !== '' ){
       let searchKeyWord = new RegExp( commonOnly( req.body.keyword ) ); 
        where['$or'] = [
            { project_name: { $regex: searchKeyWord, $options: 'i' } },
            { department: { $regex: searchKeyWord, $options: 'i' } },
            { job_title: { $regex: searchKeyWord, $options: 'i' } },
            { 'educations.name': { $regex: searchKeyWord, $options: 'i' } } ,
            { 'location.name': { $regex: searchKeyWord, $options: 'i' } }
        ]
    }

    if( req.body.hasOwnProperty('status') && req.body.status !== '' ){ 
           // where['naukari_job_data.status'] = req.body.status; 
    }

    if( req.body.hasOwnProperty('department') && req.body.department !== '' ){
         where['department'] = req.body.department;
    }

    if( req.body.hasOwnProperty('job_title') && req.body.job_title !== '' ){
        where['job_title'] = req.body.job_title;
    }
    if( req.body.hasOwnProperty('job_type') && req.body.job_type !== '' ){
        where['job_type'] = req.body.job_type;
    } 
    
    if( req.body.hasOwnProperty('location') && req.body.location !== '' ){ 
        let searchLocation =  new RegExp( commonOnly( req.body.location ) );  
        where['location.name'] = { $regex: searchLocation, $options: 'i' } ;
    }

    if( req.body.hasOwnProperty('project_id') && req.body.project_id !== '' ){
        where['project_id'] = dbObjectId( req.body.project_id );
    }

    if( req.body.hasOwnProperty('from_date') && req.body.from_date !== '' &&  req.body.hasOwnProperty('to_date') && req.body.to_date !== '' ){
        const fromDate = new Date(req.body.from_date);
        fromDate.setHours(0, 0, 0, 0);   // 00:00:00.000

        const toDate = new Date(req.body.to_date);
        toDate.setHours(23, 59, 59, 999); // 23:59:59.999
         where['naukari_job_data.added_on'] = {$gte : fromDate , $lte : toDate }
    }
  
 

    /******** Add Total Count Records Logic *************/
    if( req.body.hasOwnProperty('is_count') && ['yes','Yes','YES'].includes( req.body.is_count ) ){
        JobsCL.countDocuments( where ) 
        .then( (data)=>{  
            return res.status(200).send( {'status':true, 'data': data, 'message': 'API Accessed Successfully'} ); 
        }).catch( (error)=>{ 
            return res.status(403).send( {'status':false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE } ); 
        }); 
    } /******End Of Total Count Records Logic*******/
    else{  /******Add Fetch Records Logic*******/

            const pageOptions = {
                page: parseInt( ((page_no ? page_no : 1) - 1)) || 0,
                limit: parseInt( per_page_record) || 10
            }

            JobsCL.find( where, fetchKeys )
            .skip( pageOptions.page * pageOptions.limit )
            .limit( pageOptions.limit )
            .sort( { _id : -1 } )
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
}

controller.getJobDropDownList = ( req , res ) => {  
   
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
       let searchKeyWord = new RegExp( commonOnly( req.body.keyword ) ); 
        where['$or'] = [
            { department: { $regex: searchKeyWord, $options: 'i' } },
            { job_title: { $regex: searchKeyWord, $options: 'i' } },
            { 'location.name': { $regex: searchKeyWord, $options: 'i' } },
            { 'tags.name': { $regex: searchKeyWord, $options: 'i' } } ,
            { 'benefits.name': { $regex: searchKeyWord, $options: 'i' } } ,
            { 'educations.name': { $regex: searchKeyWord, $options: 'i' } } ,
        ]
    }

    if( req.body.hasOwnProperty('status') && req.body.status !== '' ){
        if( req.body.status === 'Expired'){
            where['deadline'] = {$lt: new Date()};
        }
        else{
            where['status'] = req.body.status;
        }
        /*Validate Active Jobs Only*/
        if( req.body.status === 'Active'){
            where['deadline'] = {$gt: new Date()};
        }
    }

    if( req.body.hasOwnProperty('department') && req.body.department !== '' ){
        where['department'] = req.body.department;
    }

    if( req.body.hasOwnProperty('designation_id') && req.body.designation_id !== '' ){
        where['designation_id'] = dbObjectId( req.body.designation_id );
    }

    if( req.body.hasOwnProperty('job_title') && req.body.job_title !== '' ){
        where['job_title'] = req.body.job_title;
    }
    if( req.body.hasOwnProperty('job_type') && req.body.job_type !== '' ){
        where['job_type'] = req.body.job_type;
    }
    if( req.body.hasOwnProperty('salary_range') && req.body.salary_range !== '' ){
        where['salary_range'] = req.body.salary_range;
    }
    
    if( req.body.hasOwnProperty('location') && req.body.location !== '' ){ 
        let searchLocation =  new RegExp( commonOnly( req.body.location ) );  
        where['location.name'] = { $regex: searchLocation, $options: 'i' } ;
    }

    if( req.body.hasOwnProperty('project_id') && req.body.project_id !== '' ){
        where['project_id'] = dbObjectId( req.body.project_id );
    }

    /******** Add Total Count Records Logic *************/
    if( req.body.hasOwnProperty('is_count') && req.body.is_count !== '' ){
        JobsCL.countDocuments( where ) 
        .then( (data)=>{  
            return res.status(200).send( {'status':true, 'data': data, 'message': 'API Accessed Successfully'} ); 
        }).catch( (error)=>{ 
            return res.status(403).send( {'status':false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE } ); 
        }); 
    } /******End Of Total Count Records Logic*******/
    else{  /******Add Fetch Records Logic*******/

            const pageOptions = {
                page: parseInt( ((page_no ? page_no : 1) - 1)) || 0,
                limit: parseInt( per_page_record) || 10
            }

            JobsCL.find( where, fetchKeys )
            .skip( pageOptions.page * pageOptions.limit )
            .limit( pageOptions.limit )
            .sort( { _id : -1 } )
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
}



/* Hr Hiring Process */
controller.getHrHiringJobListChart = ( req , res ) => {  

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

                    const whereProject = {}
                    whereProject.status = 'Active';

                    ProjectCl.find( whereProject , {'_id':1} )
                    .sort({'priority':1})
                    .then((projectData)=>{ 
                        if( projectData.length === 0 ){
                            return res.status(200).send( {'status':false, 'message': 'No record matched'} );
                        }else{

                                    const where = {}  
                                    where['project_id'] = {$in : projectData.map((item)=>item._id) }
                                    //console.log( where );
                        
                                    JobsCL.aggregate([
                                        {
                                            $match: where
                                        },
                                        {
                                            $group: {
                                                _id: "$designation",
                                            }
                                        }, 
                                        {
                                            $project: {
                                                _id: 0,
                                                designation: "$_id"
                                            }
                                        },
                                        {
                                            $sort: { 
                                                designation: 1 
                                            }
                                        }
                                    ]).then( (data)=>{
                                        
                                                const outPutData = replaceNullUndefined( data );  
                                                const ResultDesignation = [];
                                                for( var i = 0; i < designationData.length; i++ ){
                                                    const pushData = {}
                                                    const findData = outPutData.find((item)=> item.designation === designationData[i].name );
                                                    if( findData && designationData[i].priority > 0 ){
                                                        pushData.designation = designationData[i].name; 
                                                        ResultDesignation.push( pushData );
                                                    } 
                                                } 

                                                //find the related candidates list
                                                JobAppliedCandidateCl.aggregate([
                                                    {
                                                        $match: where
                                                    },
                                                    {
                                                      $group: {
                                                        _id: "$designation",
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
                                                        }
                                                      }
                                                    },
                                                    {
                                                        $project: {
                                                            _id: 0,
                                                            designation: "$_id",
                                                            shortlisted: "$shortlistCount",
                                                            interviewed: "$interviewedCount",
                                                            offered: "$offeredCount",
                                                        }
                                                    }
                                                  ]
                                                )
                                                .then((appliedData)=>{

                                                    const ResultCandidates = [];
                                                    for( var i = 0; i < ResultDesignation.length; i++ ){
                                                        const pushData = {}
                                                        const matchData = appliedData.find((item)=> item.designation === ResultDesignation[i].designation );
                                                         
                                                        if( typeof matchData !== 'undefined' ){
                                                            pushData.designation = ResultDesignation[i].designation; 
                                                            pushData.shortlisted = matchData.shortlisted; 
                                                            pushData.interviewed = matchData.interviewed; 
                                                            pushData.offered = matchData.offered;  
                                                        }else{
                                                            pushData.designation = ResultDesignation[i].designation; 
                                                            pushData.shortlisted = 0; 
                                                            pushData.interviewed = 0; 
                                                            pushData.offered = 0;
                                                        }
                                                        ResultCandidates.push( pushData );
                                                    }
                                                   
                                                    return res.status(200).send( {'status':true, 'data': ResultCandidates, 'message': 'API Accessed Successfully'} );
                                                })
                                                .catch( (error)=>{  
                                                    return res.status(200).send( {'status':false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE } ); 
                                                }); 
                                             
                                        
                                    }).catch( (error)=>{  
                                        return res.status(200).send( {'status':false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE } ); 
                                    }); 
                        }    
                    }).catch( (error)=>{ 
                        return res.status(200).send( {'status':false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE } ); 
                    });

        }).catch( (error)=>{ 
            return res.status(200).send( {'status':false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE } ); 
        });
    }else{
        DesignationCl.find( {'status':'Active'}, {'_id':0,'name':1,'priority':1} )
        .sort({'priority':1})
        .then((designationData)=>{ 

                    const whereProject = {}
                    whereProject.status = 'Active';

                    ProjectCl.find( whereProject , {'_id':1} )
                    .sort({'priority':1})
                    .then((projectData)=>{ 
                        if( projectData.length === 0 ){
                            return res.status(200).send( {'status':false, 'message': 'No record matched'} );
                        }else{

                                    const where = {}  
                                    where['project_id'] = {$in : projectData.map((item)=>item._id) }
                                    //console.log( where );
                        
                                    JobsCL.aggregate([
                                        {
                                            $match: where
                                        },
                                        {
                                            $group: {
                                                _id: "$designation",
                                            }
                                        }, 
                                        {
                                            $project: {
                                                _id: 0,
                                                designation: "$_id"
                                            }
                                        },
                                        {
                                            $sort: { 
                                                designation: 1 
                                            }
                                        }
                                    ]).then( (data)=>{
                                        
                                                const outPutData = replaceNullUndefined( data );  
                                                const ResultDesignation = [];
                                                for( var i = 0; i < designationData.length; i++ ){
                                                    const pushData = {}
                                                    const findData = outPutData.find((item)=> item.designation === designationData[i].name );
                                                    if( findData ){
                                                        pushData.designation = designationData[i].name; 
                                                        ResultDesignation.push( pushData );
                                                    } 
                                                } 

                                                //find the related candidates list
                                                JobAppliedCandidateCl.aggregate([
                                                    {
                                                        $match: where
                                                    },
                                                    {
                                                      $group: {
                                                        _id: "$designation",
                                                        shortlistCount: {
                                                          $sum: {
                                                            $cond: [{ $eq: ["$form_status", "Shortlisted"] }, 1, 0]
                                                          }
                                                        },
                                                        interviewedCount: {
                                                          $sum: {
                                                            $cond: [{ $eq: ["$form_status", "Interview"] }, 1, 0]
                                                          }
                                                        },
                                                        offeredCount: {
                                                          $sum: {
                                                            $cond: [{ $eq: ["$form_status", "Offer"] }, 1, 0]
                                                          }
                                                        }
                                                      }
                                                    },
                                                    {
                                                        $project: {
                                                            _id: 0,
                                                            designation: "$_id",
                                                            shortlisted: "$shortlistCount",
                                                            interviewed: "$interviewedCount",
                                                            offered: "$offeredCount",
                                                        }
                                                    }
                                                  ]
                                                )
                                                .then((appliedData)=>{

                                                    const ResultCandidates = [];
                                                    for( var i = 0; i < ResultDesignation.length; i++ ){
                                                        const pushData = {}
                                                        const matchData = appliedData.find((item)=> item.designation === ResultDesignation[i].designation );
                                                        //console.log(matchData)
                                                        if( typeof matchData !== 'undefined' ){
                                                            pushData.designation = ResultDesignation[i].designation; 
                                                            pushData.shortlisted = matchData.shortlisted; 
                                                            pushData.interviewed = matchData.interviewed; 
                                                            pushData.offered = matchData.offered;  
                                                        }else{
                                                            pushData.designation = ResultDesignation[i].designation; 
                                                            pushData.shortlisted = 0; 
                                                            pushData.interviewed = 0; 
                                                            pushData.offered = 0;
                                                        }
                                                        ResultCandidates.push( pushData );
                                                    }
                                                   
                                                    return res.status(200).send( {'status':true, 'data': ResultCandidates, 'message': 'API Accessed Successfully'} );
                                                })
                                                .catch( (error)=>{  
                                                    return res.status(200).send( {'status':false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE } ); 
                                                }); 
                                             
                                        
                                    }).catch( (error)=>{  
                                        return res.status(200).send( {'status':false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE } ); 
                                    }); 
                        }    
                    }).catch( (error)=>{ 
                        return res.status(200).send( {'status':false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE } ); 
                    });

        }).catch( (error)=>{ 
            return res.status(200).send( {'status':false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE } ); 
        });
    }
}

module.exports = controller;
