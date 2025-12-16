const express   = require("express"); 
const router    = express.Router();
const fs = require('fs');
const ExcelJS = require('exceljs');
const { parse } = require('csv-parse');

router.readExcelFile = async (filePath) => {
    // Create a new workbook instance
    const workbook = new ExcelJS.Workbook();

    // Read the Excel file
    await workbook.xlsx.readFile(filePath);

    // Get the first worksheet
    const worksheet = workbook.getWorksheet(1);

    // Parse the worksheet rows
    const jsonData = [];
    worksheet.eachRow((row, rowNumber) => {
        const rowValues = row.values.slice(1);
        jsonData.push(rowValues);
    });

    return jsonData;
};



router.readCSVFileData = async( filePath )=> {
    return new Promise((resolve, reject) => {
        const data = [];
        fs.createReadStream(filePath)
            .pipe(parse({
                columns: true, // Use first line as headers
                skip_empty_lines: true,
                trim: true // Trim white spaces around each field
            }))
            .on('data', (row) => {
                // Handle data for each row
                data.push(row);
            })
            .on('end', () => {
                resolve(data);
            })
            .on('error', (error) => {
                reject(error);
            });
    });
}


module.exports = router;