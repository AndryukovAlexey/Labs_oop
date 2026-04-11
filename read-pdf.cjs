const fs = require('fs');
const pdf = require('pdf-parse');

const pdfFile = process.argv[2] || '../LAB_04.pdf';
const dataBuffer = fs.readFileSync(pdfFile);
pdf(dataBuffer).then(function(data) {
    console.log(data.text);
}).catch(err => console.error(err));
