const logger = require('./src/utils/logger.js');
const fs = require('fs');
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const http = require('http');
const https = require('https');
const momentTimezone = require('moment-timezone');
const cron = require('node-cron');


dotenv.config({ path: './src/config.env' });
const HOST_PORT = process.env.HOST_PORT || 8080;
const HOST_IP = process.env.HOST_IP;
const HOST_NAME = process.env.HOST_NAME;
//console.log( HOST_PORT );

/*********** Create APP ***********/
const app = express();

//Load mongo db Connection String
const { connectDB } = require('./src/database/db.js');
//const { log } = require('console');
//console.log( JSON.stringify( log ) );

/******* parse requests ***********/
app.use(cors({ origin: process.env.CORS_ORIGIN, credentials: true }));
// app.options('*', cors({ origin: '*', credentials: true }));
app.use(express.json({ limit: '6mb' }));
app.use(express.urlencoded({ extended: true }));
app.use((req, res, next) => { res.locals.moment = momentTimezone.tz.setDefault("Asia/Kolkata"); next(); });

/***** connect to database *****/
connectDB();

/****  Set static file path  ***/
app.use('/public/assets/', express.static('assets'));

/****  Set dynamic file path  ***/
app.use('/public/uploads/', express.static('uploads'));

/****  Set Dynamic file path for employee ***/
app.use('/public/emp_uploads/', express.static('employee_uploads'));

/****** Load Admin Web API ******/
app.use('/v1/admin/', require('./src/routers/Admin/router.js'));

/****** Load Global API ******/
app.use('/v1/global/', require('./src/routers/Global/router.js'));

/****** Load Front Website API ******/
app.use('/v1/front/', require('./src/routers/Front/router.js'));

/****** Load Candidate API ******/
app.use('/v1/candidate/', require('./src/routers/Candidate/router.js'));

/****** Load Employee API ******/
app.use('/v1/employee/', require('./src/routers/Employee/router.js'));


/****** Load DMS API ******/
app.use('/v1/dms/', require('./src/routers/Dms/router.js'));


app.use((err, req, res, next) => {
    logger.error(`Unhandled error: ${err.message}\nStack: ${err.stack}`);
    if (err.code && err.code === 11000) {

        const field = Object.keys(err.keyPattern)[0];
        const value = err.keyValue[field];
        const message = `Duplicate key error: The ${field} '${value}' already exists.`;

        return res.status(400).json({
            status: false,
            message: message,
            errorResponse: {
                index: 0,
                code: err.code,
                errmsg: err.message,
                keyPattern: err.keyPattern,
                keyValue: err.keyValue
            }
        });
    } else {

        return res.status(err.status || 500).send({
            error: {
                message: err.message,
                statusCode: err.status || 500,
                status: false
            }
        });
    }
});

/******** Invalid Access **********/
app.all('*', function (req, res) {
    return res.status(404).send('Invalid Access');
});

/******** Job Scheduler System Start Script **********/
const { getNearDeadLineJobs, getBirthDayWishEmployeeList, getWorkAnniversaryWishEmployeeList, getPendingReviewCandidatesList } = require('./src/controllers/Admin/CronJobs/JobSchedulerController.js');
/***************************************************************/
/**---------------- Start Job Deadline the Task / once a day at 1:00 AM --------------**/
//for per 10 seconds '*/10 * * * * *'; 
const taskDeadlineJobs = cron.schedule('0 1 * * *', () => {
    //getNearDeadLineJobs();  
});

//taskDeadlineJobs.start(); 
//taskDeadlineJobs.stop();

/***************************************************************/
/**---------------- Run Birthday wish Cron Job / once a day at 2:00 AM --------------**/
const taskBirthDayWishJob = cron.schedule('0 2 * * *', () => {
    //getBirthDayWishEmployeeList();
});

// Start the task
//taskBirthDayWishJob.start(); 
//taskBirthDayWishJob.stop();

/***************************************************************/
/**---------------- Run Work Anniversary wish Cron Job / once a day at 3:00 AM  --------------**/
const taskWorkAnniversaryWishJob = cron.schedule('0 3 * * *', () => {
    //getWorkAnniversaryWishEmployeeList();
});

// Start the task
//taskWorkAnniversaryWishJob.start(); 
//taskWorkAnniversaryWishJob.stop();

/***************************************************************/
/**---------------- Run for pending rating Cron Job / once a day at 4:00 AM  --------------**/
const taskPendingReviewInterviewCandidateJob = cron.schedule('0 4 * * *', () => {
    //getPendingReviewCandidatesList();
});

//getPendingReviewCandidatesList(); //for testing

// Start the task
//taskPendingReviewInterviewCandidateJob.start(); 
//taskPendingReviewInterviewCandidateJob.stop();

/******** Job Scheduler System End Script **********/


// var options = {
//     hostname: 'localhost',
//     //key: fs.readFileSync('certificates/privkey.pem', 'utf8' ),
//     //cert: fs.readFileSync('certificates/fullchain.pem', 'utf8' ), 
//     requestCert: false,
//     agent: false,
//     rejectUnauthorized: false,
//     ca: [
//         fs.readFileSync('certificates/fullchain.pem', 'utf8')
//     ]
// }


const server = process.env.SSL_ENABLED === 'YES' ? https.createServer(options, app) : http.createServer(app);
server.listen(HOST_PORT, () => {
    const msg = `Server is listening on ${process.env.SSL_ENABLED === 'YES' ? 'https' : 'http'}://${HOST_NAME}:${HOST_PORT}`;
    console.warn(msg);
    logger.info(msg);
});