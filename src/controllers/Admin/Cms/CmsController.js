const CmsCl = require('../../../models/CmsCl.js') ;
const { dbObjectId } = require('../../../models/dbObject.js');
const dotenv = require("dotenv");
dotenv.config({path:'../src/config.env'});
const { dbDateFormat, createSlug, updateDatesInArray,replaceNullUndefined } = require('../../../middlewares/myFilters.js');
 
const { validationResult } = require('express-validator');


const controller = {};

/********* Add New CMS Data **********/
controller.addCmsData = ( req, res )=>{

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(200).json({ status: false, message: errors.array()[0].msg });
    }

    saveData = {};
    saveData = req.body;
    saveData.status = 'Active';
    saveData.page_slug = createSlug( saveData.page_slug );
    saveData.add_date = dbDateFormat();
    saveData.updated_on =  dbDateFormat();

    CmsCl.findOne( { page_slug:saveData.page_slug } )
    .then( (ckData)=>{
        if( ckData ){
            return res.status(200).send( {'status':false, 'message': 'Page Slug Already Added'} );
        }
    
        const instData = new CmsCl( saveData );
        instData.save()
        .then( (data)=>{
            return res.status(200).send( {'status':true, 'message': 'CMS Data Added Successfully'} );
        })
        .catch( (error)=>{ 
            return res.status(200).send( {'status':false, 'message': error || 'Invalid Login Details'} ); 
        });
    }).catch( (error)=>{ 
        return res.status(200).send( {'status':false, 'message': error || 'Invalid Login Details'} ); 
    });

}

controller.editCmsData = ( req , res ) => {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(200).json({ status: false, message: errors.array()[0].msg });
    }   
    
    const { _id } = req.body;

    let saveData = {}
    saveData = req.body;
    if( typeof req.body.page_slug !== 'undefined' && req.body.page_slug !== '' ){
    saveData.page_slug = createSlug( saveData.page_slug );
    }
    saveData.updated_on =  dbDateFormat();

    CmsCl.updateOne( { _id:  dbObjectId( _id ) }, {$set: saveData} )
    .then( (data)=>{ 

        if( data.modifiedCount === 1 ){
            return res.status(200).send( {'status':true, 'message': 'Cms Data Updated Successfully'} );
        }else if( data.modifiedCount === 0 ){
            return res.status(200).send( {'status':true, 'message': 'No CMS Data Updated'} );
        }else{
            return res.status(200).send( {'status':false, 'message': process.env.DEFAULT_ERROR_MESSAGE } );
        }
    }).catch( (error)=>{ 
        return res.status(200).send( {'status':false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE } ); 
    });
}


controller.deleteCmsData = ( req , res ) => {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(200).json({ status: false, message: errors.array()[0].msg });
    }   
    
    const { _id } = req.body; 

    CmsCl.deleteOne( { _id:  dbObjectId( _id ) } )
    .then( (data)=>{  
        if( data.deletedCount === 1 ){
            return res.status(200).send( {'status':true, 'message': 'Cms Data Deleted Successfully'} );
        }else if( data.deletedCount === 0 ){
            return res.status(200).send( {'status':true, 'message': 'No CMS Data Deleted'} );
        }else{
            return res.status(200).send( {'status':false, 'message': process.env.DEFAULT_ERROR_MESSAGE } );
        }
    }).catch( (error)=>{ 
        return res.status(200).send( {'status':false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE } ); 
    });
}

controller.getCmsDataBySlug = ( req , res ) => {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(200).json({ status: false, message: errors.array()[0].msg });
    }   
    
    const { page_slug } = req.body; 

    CmsCl.find( { page_slug: page_slug },{ _id: 0, __v: 0 } )
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

controller.changeCmsStatus = ( req , res ) => {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(200).json({ status: false, message: errors.array()[0].msg });
    }   
    
    const { _id } = req.body;

    let saveData = {}
    saveData = req.body;
    saveData.updated_on =  dbDateFormat();

    CmsCl.updateOne( { _id:  dbObjectId( _id ) }, {$set: saveData} )
    .then( (data)=>{ 

        if( data.modifiedCount === 1 ){
            return res.status(200).send( {'status':true, 'message': 'Status Updated Successfully'} );
        }else if( data.modifiedCount === 0 ){
            return res.status(200).send( {'status':true, 'message': 'No CMS Data Updated'} );
        }else{
            return res.status(200).send( {'status':false, 'message': process.env.DEFAULT_ERROR_MESSAGE } );
        }
    }).catch( (error)=>{ 
        return res.status(200).send( {'status':false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE } ); 
    });
}

controller.getAllCmsList = ( req , res ) => { 
  
    if (Object.keys(req.body).length === 0) { 
        return res.status(200).send( {status:false, message:'Bad Request'} ); 
    }

    if ( !req.body.hasOwnProperty('page_slug')) {
        return res.status(200).json({ status: false, message: 'Page Slug Key is Missing'});
    }  
    else if ( !req.body.hasOwnProperty('scope_fields')) {
        return res.status(200).json({ status: false, message: 'Scope Fields Key is Missing'});
    }   
    
    const { page_slug, scope_fields } = req.body;  

    const where = {}
    if( !['','all'].includes( page_slug) ){
     where.page_slug = page_slug;
    }

    const fetchKeys = {} 
    
    if( scope_fields.length > 0 ){
        scope_fields.forEach(field => {
            fetchKeys[field]=1;  
        }); 
    }else{
        fetchKeys._id = 0;
        fetchKeys.__v = 0; 
    } 

    CmsCl.find( where, fetchKeys )
    .then( (data)=>{

        //console.log( data );

        if( data.length > 0 ){ 
            const outPutData = updateDatesInArray( replaceNullUndefined( data ), ['add_date', 'updated_on'] , 'datetime' );              
            return res.status(200).send( {'status':true, 'data': outPutData, 'message': 'API Accessed Successfully'} );
        }else{
            return res.status(200).send( {'status':false, 'message': 'No record matched'} );
        }
    }).catch( (error)=>{ 
        return res.status(200).send( {'status':false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE } ); 
    });
}

module.exports = controller;
