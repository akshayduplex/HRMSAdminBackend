const CandidateDiscussionHistoryCI = require('../../../models/CandidateDiscussionHistoryCI.js');
const { dbObjectId } = require('../../../models/dbObject.js');
const dotenv = require("dotenv");
dotenv.config({path:'../src/config.env'});
const { dbDateFormat, updateDatesInArray,replaceNullUndefined , lettersOnly, commonOnly } = require('../../../middlewares/myFilters.js');
 
const { validationResult } = require('express-validator');


const controller = {};

/********* Add New Discussion Data **********/
controller.addCandidateDiscussion = ( req, res )=>{

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(406 ).json({ status: false, message: errors.array()[0].msg });
    }

    saveData = {};
    saveData = req.body;
    saveData.add_date = dbDateFormat();  
    
    const instData = new CandidateDiscussionHistoryCI( saveData );
    instData.save()
    .then( (data)=>{
        return res.status(200).send( {'status':true, 'message': 'Discussion Added Successfully'} );
    })
    .catch( (error)=>{ 
        return res.status(403).send( {'status':false, 'message': process.env.DEFAULT_ERROR_MESSAGE } ); 
    });  
}
 

controller.CandidateDiscussionList = ( req , res ) => {  
   
    const { page_no, per_page_record, candidate_id, scope_fields } = req.body;   

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

    where.candidate_id = dbObjectId( candidate_id );
     

    const pageOptions = {
        page: parseInt( ((page_no ? page_no : 1) - 1)) || 0,
        limit: parseInt( per_page_record) || 10
    } 

    CandidateDiscussionHistoryCI.find( where, fetchKeys )
    .skip( pageOptions.page * pageOptions.limit )
    .limit( pageOptions.limit )
    .sort( { '_id': -1 } )
    .then( (data)=>{ 

        if( data.length > 0 ){ 
            const outPutData = updateDatesInArray( replaceNullUndefined( data ), ['add_date'] , 'datetime' );              
            return res.status(200).send( {'status':true, 'data': outPutData, 'message': 'API Accessed Successfully'} );
        }else{
            return res.status(403).send( {'status':false, 'message': 'No record matched'} );
        }
    }).catch( (error)=>{
        return res.status(403).send( {'status':false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE } ); 
    });
}

module.exports = controller;
