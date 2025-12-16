const RegionCI = require('../../../models/RegionCI.js');
const { dbObjectId } = require('../../../models/dbObject.js');
const dotenv = require("dotenv");
dotenv.config({path:'../src/config.env'});
const { dbDateFormat, updateDatesInArray,replaceNullUndefined , lettersOnly, commonOnly} = require('../../../middlewares/myFilters.js');
 
const { validationResult } = require('express-validator');


const controller = {};

/********* Add New Region Data **********/
controller.addRegion = ( req, res )=>{

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(406).json({ status: false, message: errors.array()[0].msg });
    }

    saveData = {};
    saveData = req.body;
    saveData.add_date = dbDateFormat();
    saveData.updated_on =  dbDateFormat(); 

    RegionCI.findOne( { name: saveData.name } )
    .then( (ckData)=>{
        if( ckData ){
            return res.status(409).send( {'status':false, 'message': 'Region Already Added'} );
        }
    
        const instData = new RegionCI( saveData );
        instData.save()
        .then( (data)=>{
            return res.status(200).send( {'status':true, 'message': 'Region Added Successfully'} );
        })
        .catch( (error)=>{ 
            return res.status(403).send( {'status':false, 'message': process.env.DEFAULT_ERROR_MESSAGE } ); 
        });
    }).catch( (error)=>{ 
        return res.status(403).send( {'status':false, 'message': process.env.DEFAULT_ERROR_MESSAGE } ); 
    });

}

controller.editRegion = ( req , res ) => {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(406 ).json({ status: false, message: errors.array()[0].msg });
    }   
    
    const { _id } = req.body;

    let saveData = {}
    saveData = req.body;
    saveData.updated_on =  dbDateFormat(); 
   
    RegionCI.updateOne( { _id:  dbObjectId( _id ) }, {$set: saveData} )
    .then( (data)=>{ 

        if( data.modifiedCount === 1 ){
            return res.status(200).send( {'status':true, 'message': 'Region Updated Successfully'} );
        }else if( data.modifiedCount === 0 ){
            return res.status(304).send( {'status':false, 'message': 'No Action Performed'} );
        }else{
            return res.status(403).send( {'status':false, 'message': process.env.DEFAULT_ERROR_MESSAGE } );
        }
    }).catch( (error)=>{ 
        return res.status(403).send( {'status':false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE } ); 
    });
}

controller.deleteRegionById = ( req , res ) => {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(406 ).json({ status: false, message: errors.array()[0].msg });
    }   
    
    const { _id } = req.body; 

    RegionCI.deleteOne( { _id:  dbObjectId( _id ) } )
    .then( (data)=>{  
        if( data.deletedCount === 1 ){
            return res.status(200).send( {'status':true, 'message': 'Region Deleted Successfully'} );
        }else if( data.deletedCount === 0 ){
            return res.status(304).send( {'status':false, 'message': 'No Action Performed'} );
        }else{
            return res.status(403).send( {'status':false, 'message': process.env.DEFAULT_ERROR_MESSAGE } );
        }
    }).catch( (error)=>{ 
        return res.status(403).send( {'status':false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE } ); 
    });
}

controller.getRegionById = ( req , res ) => {

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


    RegionCI.find( { _id:  dbObjectId( _id ) }, fetchKeys )
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

controller.changeRegionStatus = ( req , res ) => {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(406 ).json({ status: false, message: errors.array()[0].msg });
    }   
    
    const { _id } = req.body;

    let saveData = {}
    saveData = req.body;
    saveData.updated_on =  dbDateFormat();

    RegionCI.updateOne( { _id:  dbObjectId( _id ) }, {$set: saveData} )
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

controller.getRegionList = ( req , res ) => {  
   
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

    RegionCI.find( where, fetchKeys )
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

module.exports = controller;
