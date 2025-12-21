const express = require('express');
const multer = require('multer');
const PDFDocument = require('pdfkit');
const pdfParse = require('pdf-parse');
const { Document, Packer, Paragraph } = require('docx');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.static('./')); // serve frontend files

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }
});

app.post('/convert', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).send('No file uploaded');
  const file = req.file;
  const { conversion } = req.body;

  try {
    const [sourceExt, targetExt] = conversion.split('-to-');
    let outputBuffer;

    if (sourceExt === 'pdf') {
      const data = await pdfParse(file.buffer);
      if (targetExt === 'txt') {
        outputBuffer = Buffer.from(data.text, 'utf-8');
        res.set({ 'Content-Disposition': `attachment; filename="converted.txt"`, 'Content-Type': 'text/plain' });
        return res.send(outputBuffer);
      }
      if (targetExt === 'docx') {
        const doc = new Document({ sections: [{ children: [new Paragraph(data.text)] }] });
        outputBuffer = await Packer.toBuffer(doc);
        res.set({ 'Content-Disposition': `attachment; filename="converted.docx"`, 'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
        return res.send(outputBuffer);
      }
    }

    if (sourceExt === 'txt') {
      const text = file.buffer.toString('utf-8');
      if (targetExt === 'pdf') {
        const doc = new PDFDocument();
        let chunks = [];
        doc.on('data', chunk => chunks.push(chunk));
        doc.on('end', () => {
          res.set({ 'Content-Disposition': `attachment; filename="converted.pdf"`, 'Content-Type': 'application/pdf' });
          res.send(Buffer.concat(chunks));
        });
        doc.text(text);
        doc.end();
        return;
      }
      if (targetExt === 'docx') {
        const doc = new Document({ sections: [{ children: [new Paragraph(text)] }] });
        outputBuffer = await Packer.toBuffer(doc);
        res.set({ 'Content-Disposition': `attachment; filename="converted.docx"`, 'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
        return res.send(outputBuffer);
      }
    }

    if (sourceExt === 'docx') {
      const text = file.buffer.toString('utf-8');
      if (targetExt === 'txt') {
        outputBuffer = Buffer.from(text, 'utf-8');
        res.set({ 'Content-Disposition': `attachment; filename="converted.txt"`, 'Content-Type': 'text/plain' });
        return res.send(outputBuffer);
      }
      if (targetExt === 'pdf') {
        const doc = new PDFDocument();
        let chunks = [];
        doc.on('data', chunk => chunks.push(chunk));
        doc.on('end', () => {
          res.set({ 'Content-Disposition': `attachment; filename="converted.pdf"`, 'Content-Type': 'application/pdf' });
          res.send(Buffer.concat(chunks));
        });
        doc.text(text);
        doc.end();
        return;
      }
    }

    res.status(400).send('Unsupported conversion');
  } catch (err) {
    console.error(err);
    res.status(500).send('Conversion failed');
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
