const WebSettingsCI = require('../../../models/WebSettingsCI.js');
const { dbObjectId } = require('../../../models/dbObject.js');
const dotenv = require("dotenv");
dotenv.config({ path: '../src/config.env' });
const { dbDateFormat, removeFile, replaceNullUndefined, writeDataInFile, lettersOnly, commonOnly, getDomainNameFromUrl } = require('../../../middlewares/myFilters.js');

const { validationResult } = require('express-validator');

const controller = {};

/********* Add Web/General Setting Data **********/
controller.addWebSettingData = (req, res) => {

    try {
        if (req.body && typeof req.body === 'object') {
            req.body = JSON.parse(JSON.stringify(req.body));
        }

        const errors = validationResult(req);

        const { logo_file, favicon_file, water_mark_file } = req.files;

        if (!errors.isEmpty()) {

            if (typeof logo_file !== 'undefined' && logo_file.length > 0 && logo_file[0].filename !== '') {
                removeFile(logo_file[0].filename);
            }
            if (typeof favicon_file !== 'undefined' && favicon_file.length > 0 && favicon_file[0].filename !== '') {
                removeFile(favicon_file[0].filename);
            }

            if (typeof water_mark_file !== 'undefined' && water_mark_file.length > 0 && water_mark_file[0].filename !== '') {
                removeFile(water_mark_file[0].filename);
            }
            return res.status(402).json({ status: false, message: errors.array()[0].msg });
        }


        saveData = {};
        saveData = req.body;
        if (typeof saveData.want_hrms !== 'undefined') {
            saveData.want_hrms =
                saveData.want_hrms === true ||
                saveData.want_hrms === 'true' ||
                saveData.want_hrms === 1 ||
                saveData.want_hrms === '1';
        }
        if (typeof logo_file !== 'undefined' && logo_file.length > 0 && logo_file[0].filename !== '') {
            saveData.logo_image = logo_file[0].filename;
        }
        if (typeof favicon_file !== 'undefined' && favicon_file.length > 0 && favicon_file[0].filename !== '') {
            saveData.fav_icon_image = favicon_file[0].filename;
        }
        if (typeof water_mark_file !== 'undefined' && water_mark_file.length > 0 && water_mark_file[0].filename !== '') {
            saveData.water_mark_file = water_mark_file[0].filename;
        }
        saveData.updated_on = dbDateFormat();


        WebSettingsCI.findOne({})
            .then((ckData) => {

                if (ckData) {
                    WebSettingsCI.updateOne({ _id: ckData._id }, { $set: saveData })
                        .then((data) => {
                            if (typeof logo_file !== 'undefined' && logo_file && logo_file[0].filename !== '' && typeof ckData.logo_image !== 'undefined' && ckData.logo_image !== '') {
                                removeFile(ckData.logo_image);
                            }
                            if (typeof favicon_file !== 'undefined' && favicon_file && favicon_file[0].filename !== '' && typeof ckData.fav_icon_image !== 'undefined' && ckData.fav_icon_image !== '') {
                                removeFile(ckData.fav_icon_image);
                            }
                            if (typeof water_mark_file !== 'undefined' && water_mark_file[0].filename !== '' && typeof ckData.water_mark_file !== 'undefined' && ckData.water_mark_file !== '') {
                                removeFile(ckData.water_mark_file);
                            }
                            /******** prepare for file *******/
                            if (typeof logo_file === 'undefined' && logo_file && logo_file[0].filename !== '') {
                                saveData.logo_image = ckData.logo_image;
                            }
                            if (typeof favicon_file === 'undefined' && favicon_file && favicon_file[0].filename !== '') {
                                saveData.fav_icon_image = ckData.fav_icon_image;
                            }

                            if (typeof water_mark_file === 'undefined' && water_mark_file && water_mark_file[0].filename !== '') {
                                saveData.water_mark_file = ckData.water_mark_file;
                            }
                            saveData.hod_hr_signature = ckData?.hod_hr_signature || '';
                            writeDataInFile('general_config_file.txt', JSON.stringify(saveData));
                            return res.status(200).send({ 'status': true, 'message': 'Data Updated Successfully' });
                        })
                        .catch((error) => {
                            console.log(error);
                            return res.status(403).send({ 'status': false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE });
                        });
                } else {
                    saveData.add_date = dbDateFormat();
                    const instData = new WebSettingsCI(saveData);
                    instData.save()
                        .then((data) => {
                            writeDataInFile('general_config_file.txt', JSON.stringify(saveData));
                            return res.status(200).send({ 'status': true, 'message': 'Data Added Successfully' });
                        })
                        .catch((error) => {
                            console.log(error);
                            return res.status(403).send({ 'status': false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE });
                        });
                }
            }).catch((error) => {
                console.log(error);
                return res.status(403).send({ 'status': false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE });
            });

    } catch (error) {
        console.log(error);
        return res.status(403).send({ 'status': false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE });
    }
}


/********* Add Letter head Setting Data **********/
controller.addLetterHeadSettingData = (req, res) => {

    if (req.body && typeof req.body === 'object') {
        req.body = JSON.parse(JSON.stringify(req.body));
    }

    const errors = validationResult(req);

    const filename = req.file?.filename || null;

    if (!errors.isEmpty()) {

        if (typeof filename !== 'undefined' && filename !== '') {
            removeFile(filename);
        }
        return res.status(402).json({ status: false, message: errors.array()[0].msg });
    }


    saveData = {};
    saveData.header_color = req.body?.header_color || '';
    saveData.footer_color = req.body?.footer_color || '';
    if (typeof filename !== 'undefined' && filename !== '') {
        saveData.hod_hr_signature = filename;
    }
    saveData.updated_on = dbDateFormat();



    WebSettingsCI.findOne({})
        .then((ckData) => {

            if (ckData) {
                WebSettingsCI.updateOne({ _id: ckData._id }, { $set: saveData })
                    .then((data) => {
                        if (typeof filename !== 'undefined' && filename !== '' && typeof ckData.hod_hr_signature !== 'undefined' && ckData.hod_hr_signature !== '') {
                            removeFile(ckData.hod_hr_signature);
                        }
                        /******** prepare for file *******/
                        if (ckData?.logo_image && ckData?.logo_image !== '') {
                            saveData.logo_image = ckData?.logo_image || '';
                        }
                        if (ckData?.fav_icon_image && ckData?.fav_icon_image !== '') {
                            saveData.fav_icon_image = ckData?.fav_icon_image || '';
                        }
                        if (ckData?.water_mark_file && ckData?.water_mark_file !== '') {
                            saveData.water_mark_file = ckData?.water_mark_file || '';
                        }
                        if (ckData?.logo_image && ckData?.logo_image !== '') {
                            saveData.logo_image = ckData?.logo_image || '';
                        }

                        if (typeof filename === 'undefined' && filename === '') {
                            saveData.hod_hr_signature = ckData.water_mark_file;
                        }
                        writeDataInFile('general_config_file.txt', JSON.stringify(saveData));
                        return res.status(200).send({ 'status': true, 'message': 'Data Updated Successfully' });
                    })
                    .catch((error) => {
                        return res.status(403).send({ 'status': false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE });
                    });
            } else {
                saveData.add_date = dbDateFormat();
                const instData = new WebSettingsCI(saveData);
                instData.save()
                    .then((data) => {
                        writeDataInFile('general_config_file.txt', JSON.stringify(saveData));
                        return res.status(200).send({ 'status': true, 'message': 'Data Added Successfully' });
                    })
                    .catch((error) => {
                        return res.status(403).send({ 'status': false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE });
                    });
            }
        }).catch((error) => {
            return res.status(403).send({ 'status': false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE });
        });
}

/********* Add SMTP Setting Data **********/
controller.addSmtpDetails = (req, res) => {

    if (req.body && typeof req.body === 'object') {
        req.body = JSON.parse(JSON.stringify(req.body));
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(402).json({ status: false, message: errors.array()[0].msg });
    }


    saveData = {};
    saveData = req.body;
    saveData.updated_on = dbDateFormat();

    writeDataInFile('smtp_config_file.txt', JSON.stringify(saveData));

    WebSettingsCI.findOne({})
        .then((ckData) => {

            if (ckData) {
                WebSettingsCI.updateOne({ _id: ckData._id }, { $set: saveData })
                    .then((data) => {
                        return res.status(200).send({ 'status': true, 'message': 'SMTP Data Updated Successfully' });
                    })
                    .catch((error) => {
                        return res.status(403).send({ 'status': false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE });
                    });
            } else {
                const instData = new WebSettingsCI(saveData);
                instData.save()
                    .then((data) => {
                        return res.status(200).send({ 'status': true, 'message': 'SMTP Data Added Successfully' });
                    })
                    .catch((error) => {
                        return res.status(403).send({ 'status': false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE });
                    });
            }
        }).catch((error) => {
            return res.status(403).send({ 'status': false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE });
        });
}

/********* Add Google Places Data **********/
controller.addGooglePlacesApi = (req, res) => {

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(402).json({ status: false, message: errors.array()[0].msg });
    }

    saveData = {};
    saveData = req.body;
    saveData.updated_on = dbDateFormat();

    writeDataInFile('google_api_config_file.txt', JSON.stringify(saveData));

    WebSettingsCI.findOne({})
        .then((ckData) => {

            if (ckData) {
                WebSettingsCI.updateOne({ _id: ckData._id }, { $set: saveData })
                    .then((data) => {
                        return res.status(200).send({ 'status': true, 'message': 'Google Places API Updated Successfully' });
                    })
                    .catch((error) => {
                        return res.status(403).send({ 'status': false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE });
                    });
            } else {
                const instData = new WebSettingsCI(saveData);
                instData.save()
                    .then((data) => {
                        return res.status(200).send({ 'status': true, 'message': 'Google Places API Added Successfully' });
                    })
                    .catch((error) => {
                        return res.status(403).send({ 'status': false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE });
                    });
            }
        }).catch((error) => {
            return res.status(403).send({ 'status': false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE });
        });
}

/********* Add SMTP Setting Data **********/
controller.addSmsApiDetails = (req, res) => {

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(402).json({ status: false, message: errors.array()[0].msg });
    }

    saveData = {};
    saveData = req.body;
    saveData.updated_on = dbDateFormat();

    writeDataInFile('sms_config_file.txt', JSON.stringify(saveData));

    WebSettingsCI.findOne({})
        .then((ckData) => {

            if (ckData) {
                WebSettingsCI.updateOne({ _id: ckData._id }, { $set: saveData })
                    .then((data) => {
                        return res.status(200).send({ 'status': true, 'message': 'SMS API Details Updated Successfully' });
                    })
                    .catch((error) => {
                        return res.status(403).send({ 'status': false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE });
                    });
            } else {
                const instData = new WebSettingsCI(saveData);
                instData.save()
                    .then((data) => {
                        return res.status(200).send({ 'status': true, 'message': 'SMS API Details Added Successfully' });
                    })
                    .catch((error) => {
                        return res.status(403).send({ 'status': false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE });
                    });
            }
        }).catch((error) => {
            return res.status(403).send({ 'status': false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE });
        });
}


/********* Add Organization Details Data **********/
controller.addOrganizationDetails = (req, res) => {

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(402).json({ status: false, message: errors.array()[0].msg });
    }

    saveData = {};
    saveData = req.body;
    saveData.updated_on = dbDateFormat();

    writeDataInFile('organization_config_file.txt', JSON.stringify(saveData));

    WebSettingsCI.findOne({})
        .then((ckData) => {

            if (ckData) {
                WebSettingsCI.updateOne({ _id: ckData._id }, { $set: saveData })
                    .then((data) => {
                        return res.status(200).send({ 'status': true, 'message': 'Organization Details Updated Successfully' });
                    })
                    .catch((error) => {
                        return res.status(403).send({ 'status': false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE });
                    });
            } else {
                const instData = new WebSettingsCI(saveData);
                instData.save()
                    .then((data) => {
                        return res.status(200).send({ 'status': true, 'message': 'Organization Details Added Successfully' });
                    })
                    .catch((error) => {
                        return res.status(403).send({ 'status': false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE });
                    });
            }
        }).catch((error) => {
            return res.status(403).send({ 'status': false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE });
        });
}

/********* Add Organization Address Data **********/
controller.addOrganizationAddressDetails = (req, res) => {

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(402).json({ status: false, message: errors.array()[0].msg });
    }

    saveData = {};
    saveData = req.body;
    saveData.updated_on = dbDateFormat();

    writeDataInFile('address_config_file.txt', JSON.stringify(saveData));

    WebSettingsCI.findOne({})
        .then((ckData) => {

            if (ckData) {
                WebSettingsCI.updateOne({ _id: ckData._id }, { $set: saveData })
                    .then((data) => {
                        return res.status(200).send({ 'status': true, 'message': 'Address Updated Successfully' });
                    })
                    .catch((error) => {
                        return res.status(403).send({ 'status': false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE });
                    });
            } else {
                const instData = new WebSettingsCI(saveData);
                instData.save()
                    .then((data) => {
                        return res.status(200).send({ 'status': true, 'message': 'Address Added Successfully' });
                    })
                    .catch((error) => {
                        return res.status(403).send({ 'status': false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE });
                    });
            }
        }).catch((error) => {
            return res.status(403).send({ 'status': false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE });
        });
}

/********* Get All Setting Data **********/
controller.getAllSettingData = (req, res) => {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(406).json({ status: false, message: errors.array()[0].msg });
    }

    const fetchKeys = {}

    WebSettingsCI.findOne({}, fetchKeys)
        .then((data) => {
            if (data) {
                return res.status(200).send({ 'status': true, 'data': data, 'message': 'API Accessed Successfully' });
            } else {
                return res.status(204).send({ 'status': false, 'message': 'No record matched' });
            }
        }).catch((error) => {
            return res.status(403).send({ 'status': false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE });
        });
}

/********* Get All Setting Data for merge into request  **********/
controller.mergeConfigData = (req, res, next) => {
    WebSettingsCI.findOne({})
        .then((data) => {
            req.web_config = data;
            next();
        })
        .catch((error) => {
            req.web_config = {}
            next();
        });
}


/********* Get All Web Config Setting Data **********/
controller.getWebConfigData = (req, res) => {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(406).json({ status: false, message: errors.array()[0].msg });
    }


    if (!req.body.hasOwnProperty('domain')) {
        return res.status(406).json({ status: false, message: 'Invalid Access' });
    }
    else if (req.body.domain === '') {
        return res.status(406).json({ status: false, message: 'Invalid Access' });
    }

    const whiteListDomains = process.env.WHITELISTED_DOMAINS.split(",");
    //console.log( whiteListDomains );

    if (process.env.WHITELISTED_DOMAINS && !whiteListDomains.includes(getDomainNameFromUrl(req.body.domain))) {
        return res.status(406).json({ status: false, message: 'Invalid Access' });
    }



    const fetchKeys = {}
    fetchKeys._id = 0;
    fetchKeys.site_title = 1;
    fetchKeys.meta_title = 1;
    fetchKeys.meta_description = 1;
    fetchKeys.logo_image = 1;
    fetchKeys.fav_icon_image = 1;
    fetchKeys.google_places_api = 1;
    fetchKeys.organization_email_id = 1;
    fetchKeys.organization_mobile_no = 1;
    fetchKeys.organization_name = 1;
    fetchKeys.organization_whatsapp_no = 1;
    fetchKeys.office_address = 1;
    fetchKeys.office_city = 1;
    fetchKeys.office_latitude = 1;
    fetchKeys.office_longitude = 1;
    fetchKeys.office_map_iframe = 1;
    fetchKeys.social_media_links = 1;


    WebSettingsCI.findOne({}, fetchKeys)
        .then((data) => {
            if (data) {
                return res.status(200).send({ 'status': true, 'data': data, 'message': 'API Accessed Successfully' });
            } else {
                return res.status(204).send({ 'status': false, 'message': 'No record matched' });
            }
        }).catch((error) => {
            return res.status(403).send({ 'status': false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE });
        });
}


/********* Add Google Places Data **********/
controller.addHrWebSettingData = (req, res) => {

    if (req.body && typeof req.body === 'object') {
        req.body = JSON.parse(JSON.stringify(req.body));
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        if (req.file && req.file.filename) {
            removeFile(req.file.filename);
        }
        return res.status(402).json({ status: false, message: errors.array()[0].msg });
    }


    saveData = {};
    var hrData = {}
    hrData.name = typeof req.body.default_hr_name !== 'undefined' && req.body.default_hr_name !== '' ? req.body.default_hr_name : '';
    hrData.mobile_no = typeof req.body.default_hr_mobile_no !== 'undefined' && req.body.default_hr_mobile_no !== '' ? req.body.default_hr_mobile_no : '';
    hrData.designation = typeof req.body.default_hr_designation !== 'undefined' && req.body.default_hr_designation !== '' ? req.body.default_hr_designation : '';
    hrData.email_id = typeof req.body.default_hr_email_id !== 'undefined' && req.body.default_hr_email_id !== '' ? req.body.default_hr_email_id : '';

    saveData.default_hr_details = hrData;
    saveData.ceo_email_id = typeof req.body.ceo_email_id !== 'undefined' && req.body.ceo_email_id !== '' ? req.body.ceo_email_id : '';
    saveData.ceo_name = typeof req.body.ceo_name !== 'undefined' && req.body.ceo_name !== '' ? req.body.ceo_name : '';
    saveData.updated_on = dbDateFormat();

    if (req.file && req.file.filename) {
        saveData.ceo_digital_signature = req.file.filename;
        //delete old file 
        if (typeof req.body.old_ceo_digital_signature !== 'undefined' && req.body.old_ceo_digital_signature !== '') {
            //removeFile( req.body.old_ceo_digital_signature ); 
        }
    }

    if (req.body.hasOwnProperty('hiring_approval_hr_email_id') && req.body.hiring_approval_hr_email_id !== '') {
        saveData.hiring_approval_hr_email_id = req.body.hiring_approval_hr_email_id;
    }



    WebSettingsCI.findOne({})
        .then((ckData) => {

            if (ckData) {
                if (typeof ckData.ceo_digital_signature !== 'undefined' && ckData.ceo_digital_signature !== '') {
                    saveData.ceo_digital_signature = ckData.ceo_digital_signature;
                }

                writeDataInFile('hr_config_file.txt', JSON.stringify(saveData));

                WebSettingsCI.updateOne({ _id: ckData._id }, { $set: saveData })
                    .then((data) => {
                        return res.status(200).send({ 'status': true, 'message': 'Data Updated Successfully' });
                    })
                    .catch((error) => {
                        return res.status(403).send({ 'status': false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE });
                    });
            } else {
                const instData = new WebSettingsCI(saveData);
                instData.save()
                    .then((data) => {
                        writeDataInFile('hr_config_file.txt', JSON.stringify(saveData));

                        return res.status(200).send({ 'status': true, 'message': 'Data Added Successfully' });
                    })
                    .catch((error) => {
                        return res.status(403).send({ 'status': false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE });
                    });
            }
        }).catch((error) => {
            return res.status(403).send({ 'status': false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE });
        });
}

/********* Add Social Media Links Data **********/
controller.addSocialMediaLinks = (req, res) => {

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(402).json({ status: false, message: errors.array()[0].msg });
    }
    console.log("websetting", req.body)
    saveData = {};
    var socialMediaLinks = {}
    socialMediaLinks.facebook_link = typeof req.body.facebook_link !== 'undefined' && req.body.facebook_link !== '' ? req.body.facebook_link : '';
    socialMediaLinks.instagram_link = typeof req.body.instagram_link !== 'undefined' && req.body.instagram_link !== '' ? req.body.instagram_link : '';
    socialMediaLinks.linkedin_link = typeof req.body.linkedin_link !== 'undefined' && req.body.linkedin_link !== '' ? req.body.linkedin_link : '';
    socialMediaLinks.twitter_link = typeof req.body.twitter_link !== 'undefined' && req.body.twitter_link !== '' ? req.body.twitter_link : '';
    socialMediaLinks.youtube_link = typeof req.body.youtube_link !== 'undefined' && req.body.youtube_link !== '' ? req.body.youtube_link : '';

    saveData.social_media_links = socialMediaLinks;
    saveData.updated_on = dbDateFormat();

    writeDataInFile('social_media_config_file.txt', JSON.stringify(saveData));

    WebSettingsCI.findOne({})
        .then((ckData) => {

            if (ckData) {
                WebSettingsCI.updateOne({ _id: ckData._id }, { $set: saveData })
                    .then((data) => {
                        return res.status(200).send({ 'status': true, 'message': 'Data Updated Successfully' });
                    })
                    .catch((error) => {
                        return res.status(403).send({ 'status': false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE });
                    });
            } else {
                const instData = new WebSettingsCI(saveData);
                instData.save()
                    .then((data) => {
                        return res.status(200).send({ 'status': true, 'message': 'Data Added Successfully' });
                    })
                    .catch((error) => {
                        return res.status(403).send({ 'status': false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE });
                    });
            }
        }).catch((error) => {
            return res.status(403).send({ 'status': false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE });
        });
}

module.exports = controller;
