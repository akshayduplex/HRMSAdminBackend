const DesignationCl = require('../../../models/DesignationCl.js') ;
const { dbObjectId } = require('../../../models/dbObject.js');
const dotenv = require("dotenv");
dotenv.config({path:'../src/config.env'});
const { dbDateFormat, updateDatesInArray,replaceNullUndefined , lettersOnly, commonOnly } = require('../../../middlewares/myFilters.js');
 
const { validationResult } = require('express-validator');


const controller = {};

/********* Add New Designation Data **********/
controller.addDesignationData = ( req, res )=>{

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(406).json({ status: false, message: errors.array()[0].msg });
    }

    saveData = {};
    saveData = req.body;
    saveData.add_date = dbDateFormat();
    saveData.updated_on =  dbDateFormat();

    if( req.body.hasOwnProperty('assigned_menu_list') && req.body.assigned_menu_list.length > 0 ){
        saveData.assigned_menu_list =  req.body.assigned_menu_list;
    }

    DesignationCl.findOne( { name: saveData.name } )
    .then( (ckData)=>{
        if( ckData ){
            return res.status(409).send( {'status':false, 'message': 'Designation Already Added'} );
        }
    
        const instData = new DesignationCl( saveData );
        instData.save()
        .then( (data)=>{
            return res.status(200).send( {'status':true, 'message': 'Designation Added Successfully'} );
        })
        .catch( (error)=>{ 
            return res.status(403).send( {'status':false, 'message': error ||  process.env.DEFAULT_ERROR_MESSAGE} ); 
        });
    }).catch( (error)=>{ 
        return res.status(403).send( {'status':false, 'message': error ||  process.env.DEFAULT_ERROR_MESSAGE } ); 
    });

}

controller.editDesignation = ( req , res ) => {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(406).json({ status: false, message: errors.array()[0].msg });
    }   
    
    const { _id } = req.body;

    let saveData = {}
    saveData = req.body;
    saveData.updated_on =  dbDateFormat();
    
    if( req.body.hasOwnProperty('assigned_menu_list') && req.body.assigned_menu_list.length > 0 ){
        saveData.assigned_menu_list =  req.body.assigned_menu_list;
    }

    DesignationCl.updateOne( { _id:  dbObjectId( _id ) }, {$set: saveData} )
    .then( (data)=>{ 

        if( data.modifiedCount === 1 ){
            return res.status(200).send( {'status':true, 'message': 'Designation Updated Successfully'} );
        }else if( data.modifiedCount === 0 ){
            return res.status(304).send( {'status':false, 'message': 'No Action Performed'} );
        }else{
            return res.status(403).send( {'status':false, 'message': process.env.DEFAULT_ERROR_MESSAGE } );
        }
    }).catch( (error)=>{ 
        return res.status(403).send( {'status':false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE } ); 
    });
}

controller.deleteDesignation = ( req , res ) => {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(406).json({ status: false, message: errors.array()[0].msg });
    }   
    
    const { _id } = req.body; 

    DesignationCl.deleteOne( { _id:  dbObjectId( _id ) } )
    .then( (data)=>{  
        if( data.deletedCount === 1 ){
            return res.status(200).send( {'status':true, 'message': 'Designation Deleted Successfully'} );
        }else if( data.deletedCount === 0 ){
            return res.status(304).send( {'status':true, 'message': 'No Action Performed'} );
        }else{
            return res.status(403).send( {'status':false, 'message': process.env.DEFAULT_ERROR_MESSAGE } );
        }
    }).catch( (error)=>{ 
        return res.status(403).send( {'status':false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE } ); 
    });
}

controller.getDesignationById = ( req , res ) => {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(406).json({ status: false, message: errors.array()[0].msg });
    }   
    
    const { _id } = req.body; 

    DesignationCl.find( { _id:  dbObjectId( _id ) } )
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

controller.changeDesignationStatus = ( req , res ) => {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(406).json({ status: false, message: errors.array()[0].msg });
    }   
    
    const { _id } = req.body;

    let saveData = {}
    saveData = req.body;
    saveData.updated_on =  dbDateFormat();

    DesignationCl.updateOne( { _id:  dbObjectId( _id ) }, {$set: saveData} )
    .then( (data)=>{ 

        if( data.modifiedCount === 1 ){
            return res.status(200).send( {'status':true, 'message': 'Status Updated Successfully'} );
        }else if( data.modifiedCount === 0 ){
            return res.status(304).send( {'status':true, 'message': 'No Action Performed'} );
        }else{
            return res.status(403).send( {'status':false, 'message': process.env.DEFAULT_ERROR_MESSAGE } );
        }
    }).catch( (error)=>{ 
        return res.status(403).send( {'status':false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE } ); 
    });
}

controller.getDesignationList = ( req , res ) => {  
   
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
    let searchKeyWord = new RegExp( lettersOnly( req.body.keyword ) );
        where['name'] = { $regex: searchKeyWord, $options: 'i' } 
    }

    if( req.body.hasOwnProperty('status') && req.body.status !== '' ){
        where['status'] =  commonOnly( req.body.status ); 
    }

    /****** Apply Manual Filter Start Script **********/
     if( req.body.hasOwnProperty('filter_keyword') && req.body.filter_keyword !== '' ){
        let searchKeyFilter = new RegExp( req.body.filter_keyword );
        where['$or'] = [
            { name: { $regex: searchKeyFilter, $options: 'i' } }, 
            { status: { $regex: searchKeyFilter, $options: 'i' } }
        ];
    }
    /********* Apply Manual Filter End Script ********/


    const pageOptions = {
        page: parseInt( ((page_no ? page_no : 1) - 1)) || 0,
        limit: parseInt( per_page_record) || 10
    } 

    DesignationCl.find( where, fetchKeys )
    .skip( pageOptions.page * pageOptions.limit )
    .limit( pageOptions.limit )
    .sort( { 'name': 1 } )
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


controller.getProjectWiseDesignationList = ( req , res ) => {   

    const { project_id } = req.body;   

    const where = {}  
    const fetchKeys = { _id:1, name:1, priority_list:1 }
    where.status = 'Active'; 

    const page_no = 1;
    const per_page_record = 100;

    if( req.body.hasOwnProperty('keyword') && req.body.keyword !== '' ){
        let searchKeyWord = new RegExp( lettersOnly( req.body.keyword ) );
        where['name'] = { $regex: searchKeyWord, $options: 'i' } 
    }

    const pageOptions = {
        page: parseInt( ((page_no ? page_no : 1) - 1)) || 0,
        limit: parseInt( per_page_record) || 10
    }

    DesignationCl.find( where, fetchKeys )
    .skip( pageOptions.page * pageOptions.limit )
    .limit( pageOptions.limit )
    .sort( { priority: 1 } )
    .then( (data)=>{ 

        if( data.length > 0 ){  

            const outPutData = replaceNullUndefined( data ) ;    
            const resultOutPut = [];
            for( var i= 0; i < outPutData.length; i++ ){
                const push = {}
                push._id = outPutData[i]._id;
                push.name = outPutData[i].name;
                const findItemIn = outPutData[i].priority_list.find( (item) => item.project_id.toString() ===  project_id );
                if( findItemIn ){
                    push.priority = findItemIn.priority;
                }else{
                    push.priority = 0;
                }
                push.project_id = project_id;
                resultOutPut.push( push ); 
            }

            return res.status(200).send( {'status':true, 'data': resultOutPut, 'message': 'API Accessed Successfully'} );
        }else{
            return res.status(204).send( {'status':false, 'message': 'No record matched'} );
        }
    }).catch( (error)=>{
        return res.status(403).send( {'status':false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE } ); 
    });
}


controller.saveProjectWiseDesignationPriority =  ( req , res ) =>{
   
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(406).json({ status: false, message: errors.array()[0].msg });
    }    

    const { _id, project_id, priority } = req.body;

    DesignationCl.findOne( { _id:  dbObjectId( _id ) }, { priority_list : 1} )
    .then( (data)=>{  
        
        const findItem = data.priority_list.find((item)=>item.project_id.toString() === project_id ); 

        if( findItem ){

                let arrayFilters = { 'arrayFilters': [{'one._id': findItem._id }] }

                let where = {}
                where['_id'] = dbObjectId( _id );
                where['priority_list._id'] = findItem._id
                var saveData = {} 
                saveData.updated_on = dbDateFormat(); 
                saveData['priority_list.$[one].project_id'] = dbObjectId( project_id );
                saveData['priority_list.$[one].priority']  = parseInt( priority );

                DesignationCl.updateOne( { _id:  dbObjectId( _id ) }, {$set: saveData}, arrayFilters  )
                .then( (upData)=>{ 
                        return res.status(200).send( {'status':true, 'message': 'Status Updated Successfully'} ); 
                }).catch( (error)=>{
                    return res.status(403).send( {'status':false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE } ); 
                });
        }else{

                let saveData = {}
                saveData.updated_on = dbDateFormat(); 

                const savePriorityData = {}
                savePriorityData.priority = parseInt( priority );
                savePriorityData.project_id = dbObjectId( project_id ); 

                DesignationCl.updateOne( { _id:  dbObjectId( _id ) }, {$set: saveData, $push : {'priority_list': savePriorityData }} )
                .then( (upData)=>{ 
                        return res.status(200).send( {'status':true, 'message': 'Status Updated Successfully'} ); 
                }).catch( (error )=>{ 
                    return res.status(403).send( {'status':false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE } ); 
                });
        }   

    }).catch( (error)=>{  
        return res.status(403).send( {'status':false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE } ); 
    });

}


module.exports = controller;
