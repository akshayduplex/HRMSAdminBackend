const LocationCl = require('../../../models/LocationCl.js') ;
const { dbObjectId } = require('../../../models/dbObject.js');
const dotenv = require("dotenv");
dotenv.config({path:'../src/config.env'});
const { dbDateFormat, updateDatesInArray,replaceNullUndefined , lettersOnly} = require('../../../middlewares/myFilters.js');
 
const { validationResult } = require('express-validator');
const StateCI = require('../../../models/StateCI.js');


const controller = {};

/********* Add New Location Data **********/
controller.addLocationData = ( req, res )=>{

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(200).json({ status: false, message: errors.array()[0].msg });
    }

    saveData = {};
    saveData = req.body; 

    if( typeof saveData.state_id !== 'undefined' && saveData.state_id !== '' ){
        saveData.state_id = dbObjectId( saveData.state_id )
    }

    LocationCl.findOne( saveData )
    .then( (ckData)=>{
        if( ckData ){
            return res.status(200).send( {'status':false, 'message': 'Location Already Added'} );
        }
    
        saveData.add_date = dbDateFormat();
        saveData.updated_on =  dbDateFormat();

        const instData = new LocationCl( saveData );
        instData.save()
        .then( (data)=>{
            return res.status(200).send( {'status':true, 'message': 'Location Added Successfully'} );
        })
        .catch( (error)=>{ 
            return res.status(200).send( {'status':false, 'message': error || 'Invalid Login Details'} ); 
        });
    }).catch( (error)=>{ 
        return res.status(200).send( {'status':false, 'message': error || 'Invalid Login Details'} ); 
    });
}

controller.editLocation = ( req , res ) => {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(200).json({ status: false, message: errors.array()[0].msg });
    }   
    
    const { _id } = req.body;

    let saveData = {}
    saveData = req.body;
    saveData.updated_on =  dbDateFormat();

    if( typeof saveData.state_id !== 'undefined' && saveData.state_id !== '' ){
        saveData.state_id = dbObjectId( saveData.state_id )
    }


    LocationCl.updateOne( { _id:  dbObjectId( _id ) }, {$set: saveData} )
    .then( (data)=>{ 

        if( data.modifiedCount === 1 ){
            return res.status(200).send( {'status':true, 'message': 'Location Updated Successfully'} );
        }else if( data.modifiedCount === 0 ){
            return res.status(200).send( {'status':true, 'message': 'No Location Updated'} );
        }else{
            return res.status(200).send( {'status':false, 'message': process.env.DEFAULT_ERROR_MESSAGE } );
        }
    }).catch( (error)=>{
        return res.status(200).send( {'status':false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE } ); 
    });
}

controller.deleteLocation = ( req , res ) => {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(200).json({ status: false, message: errors.array()[0].msg });
    }   
    
    const { _id } = req.body; 

    LocationCl.deleteOne( { _id:  dbObjectId( _id ) } )
    .then( (data)=>{  
        if( data.deletedCount === 1 ){
            return res.status(200).send( {'status':true, 'message': 'Location Deleted Successfully'} );
        }else if( data.deletedCount === 0 ){
            return res.status(200).send( {'status':true, 'message': 'No Action Performed'} );
        }else{
            return res.status(200).send( {'status':false, 'message': process.env.DEFAULT_ERROR_MESSAGE } );
        }
    }).catch( (error)=>{ 
        return res.status(200).send( {'status':false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE } ); 
    });
}

controller.getLocationById = ( req , res ) => {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(200).json({ status: false, message: errors.array()[0].msg });
    }   
    
    const { _id } = req.body; 

    LocationCl.find( { _id:  dbObjectId( _id ) } )
    .then( (data)=>{   
        if( data.length > 0 ){ 
            const outPutData = updateDatesInArray( replaceNullUndefined( data ), ['add_date', 'updated_on'] , 'datetime' );              
            return res.status(200).send( {'status':true, 'data': outPutData[0], 'message': 'API Accessed Successfully'} );
        }else{
            return res.status(200).send( {'status':false, 'message': 'No record matched'} );
        }
    }).catch( (error)=>{ 
        return res.status(200).send( {'status':false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE } ); 
    });
}

controller.changeLocationStatus = ( req , res ) => {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(200).json({ status: false, message: errors.array()[0].msg });
    }   
    
    const { _id } = req.body;

    let saveData = {}
    saveData = req.body;
    saveData.updated_on =  dbDateFormat();

    LocationCl.updateOne( { _id:  dbObjectId( _id ) }, {$set: saveData} )
    .then( (data)=>{ 

        if( data.modifiedCount === 1 ){
            return res.status(200).send( {'status':true, 'message': 'Status Updated Successfully'} );
        }else if( data.modifiedCount === 0 ){
            return res.status(200).send( {'status':true, 'message': 'No Action Performed'} );
        }else{
            return res.status(200).send( {'status':false, 'message': process.env.DEFAULT_ERROR_MESSAGE } );
        }
    }).catch( (error)=>{ 
        return res.status(200).send( {'status':false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE } ); 
    });
}

controller.getLocationList = ( req , res ) => {  
   
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
        where['status'] = req.body.status;
    }

    /****** Apply Manual Filter Start Script **********/
    if( req.body.hasOwnProperty('filter_keyword') && req.body.filter_keyword !== '' ){
        let searchKeyFilter = new RegExp( req.body.filter_keyword );
        where['$or'] = [
            { name: { $regex: searchKeyFilter, $options: 'i' } },
            { state: { $regex: searchKeyFilter, $options: 'i' } },
            { status: { $regex: searchKeyFilter, $options: 'i' } }
        ];
    }
    /********* Apply Manual Filter End Script ********/


    const pageOptions = {
        page: parseInt( ((page_no ? page_no : 1) - 1)) || 0,
        limit: parseInt( per_page_record) || 10
    } 
 

    LocationCl.find( where, fetchKeys )
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

controller.getLocationWithStateList = ( req , res ) => {  
   
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
        where['status'] = req.body.status;
    }


    const pageOptions = {
        page: parseInt( ((page_no ? page_no : 1) - 1)) || 0,
        limit: parseInt( per_page_record) || 10
    } 
 

    LocationCl.find( where, fetchKeys )
    .skip( pageOptions.page * pageOptions.limit )
    .limit( pageOptions.limit )
    .sort( { 'name': 1 } )
    .then( (data)=>{ 

        

        if( data.length > 0 ){ 
            const outPutData = updateDatesInArray( replaceNullUndefined( data ), ['add_date', 'updated_on'] , 'datetime' );              
            return res.status(200).send( {'status':true, 'data': outPutData, 'message': 'API Accessed Successfully'} );
        }else{

               StateCI.find( where, {'name':1,'_id':1} )
                      .skip( pageOptions.page * pageOptions.limit )
                      .limit( pageOptions.limit )
                      .sort( { 'name': 1 } )
                      .then( (stateData)=>{ 
                        if( stateData.length > 0 ){ 
                            const resultData = stateData.map((item)=>{
                                const push = {}
                                push._id = item._id;
                                push.name = item.name;
                                push.state_id = item._id;
                                push.state = item.name;
                                push.latitude = 0;
                                push.longitude = 0;
                                return push;
                            });
                            const outPutData = updateDatesInArray( replaceNullUndefined( resultData ), ['add_date', 'updated_on'] , 'datetime' );              
                            return res.status(200).send( {'status':true, 'data': outPutData, 'message': 'API Accessed Successfully'} );
                        }else{ 
                            return res.status(204).send( {'status':false, 'message': 'No record matched'} );
                        }
            }).catch( (error)=>{ 
                return res.status(403).send( {'status':false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE } ); 
            });
        }
    }).catch( (error)=>{ 
        return res.status(403).send( {'status':false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE } ); 
    });
}

module.exports = controller;
