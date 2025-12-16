const JobAppliedCandidateCl = require('../../../models/JobAppliedCandidateCl.js');
const EmployeeCI = require('../../../models/EmployeeCI.js');
const JobsCL = require('../../../models/JobsCI.js'); 
const CandidateDiscussionHistoryCI = require('../../../models/CandidateDiscussionHistoryCI.js');
const RequisitionFormCI = require('../../../models/RequisitionFormCI.js');
const ApprovalNoteCI = require('../../../models/ApprovalNoteCI.js');

const { dbObjectId } = require('../../../models/dbObject.js');
const dotenv = require("dotenv");
dotenv.config({path:'../src/config.env'});

const path = require('path');
const fs = require('fs');
const axios = require('axios'); 
const { EJSON } = require('bson');

const exportFolder = "./exports";
if (!fs.existsSync(exportFolder)) fs.mkdirSync(exportFolder);

const mongoose = require("mongoose");

const controller = {};


async function exportCollection(name, model) {
    const data = await model.find({}).lean();
    const filePath = path.join(exportFolder, `${name}.json`);
    fs.writeFileSync(filePath, EJSON.stringify(data, null, 2));
    console.log(`Exported ${name} to ${filePath}`);
  }


controller.exportCollectionData = async ( req, res )=>{

    const collections = [
        { name: "dt_candidates", model: JobAppliedCandidateCl },
        { name: "dt_employee_lists", model: EmployeeCI },
        { name: "dt_approval_notes", model: ApprovalNoteCI },
        { name: "dt_requisition_forms", model: RequisitionFormCI },
        { name: "dt_post_jobs", model: JobsCL },
      ];


        try {
            for (const col of collections) {
            await exportCollection(col.name, col.model);
            }
            mongoose.connection.close();
        } catch (err) {
            console.error("Export failed:", err);
            mongoose.connection.close();
        }

        return res.status(403).send( {'status':true, 'message':  process.env.DEFAULT_ERROR_MESSAGE } ); 
}

module.exports = controller;