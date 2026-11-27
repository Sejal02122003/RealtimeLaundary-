const fs = require('node:fs/promises');
const path = require('node:path');
const mongoose = require('mongoose');
const { UPLOAD_ROOT } = require('../../utils/files');
const { daysAgo, atTime } = require('./common');

// month/onTime are the targets for the drivers table.
const APPROVED = [
  { key: 'ravi', name: 'Ravi Kumar', phone: '9988776655', plate: 'MP09 AB 4521', online: true, month: 142, onTime: 96 },
  { key: 'sameer', name: 'Sameer Khan', phone: '9988776657', online: true, month: 128, onTime: 94 },
  { key: 'vikas', name: 'Vikas Yadav', phone: '9988776658', online: true, month: 117, onTime: 91 },
  { key: 'deepak', name: 'Deepak Rathore', phone: '9988776659', online: false, month: 86, onTime: 89 },
  ...[
    'Ajay Meena', 'Suresh Patil', 'Nitin Chouhan', 'Salman Qureshi', 'Mahesh Rathod',
    'Pankaj Jain', 'Kunal Sharma', 'Rakesh Solanki', 'Dinesh Parmar', 'Irfan Sheikh',
  ].map((name, i) => ({
    key: `extra${i}`,
    name,
    phone: `99000000${10 + i}`,
    online: i < 6,
    month: 70 - i * 4,
    onTime: 95 - i,
  })),
];

const APPLICANTS = [
  { name: 'Amit Solanki', phone: '9988776660', type: 'two_wheeler', plate: 'MP09 CD 1180', applied: 1 },
  { name: 'Gopal Verma', phone: '9988776661', type: 'van', plate: 'MP09 EF 7734', applied: 0 },
];

// Used to try the "one document left" screen in the driver app.
const INCOMPLETE = { name: 'Mohit Sharma', phone: '9988776656', type: 'two_wheeler', plate: 'MP09 CD 7788', applied: 2 };

const PHONES = [...APPROVED, ...APPLICANTS, INCOMPLETE].map((d) => d.phone);

/** A one-page PDF, so "View licence" has something to open. */
function placeholderPdf(label) {
  const content = `BT /F1 22 Tf 60 740 Td (Demo document: ${label}) Tj ET`;
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>',
    `<< /Length ${content.length} >>\nstream\n${content}\nendstream`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  ];
  let pdf = '%PDF-1.4\n';
  const offsets = objects.map((object, i) => {
    const offset = pdf.length;
    pdf += `${i + 1} 0 obj\n${object}\nendobj\n`;
    return offset;
  });
  const xref = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  pdf += offsets.map((o) => `${String(o).padStart(10, '0')} 00000 n \n`).join('');
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return pdf;
}

async function writeDocuments() {
  await fs.mkdir(path.join(UPLOAD_ROOT, 'demo'), { recursive: true });
  await Promise.all(
    ['licence', 'identity', 'registration'].map((type) =>
      fs.writeFile(path.join(UPLOAD_ROOT, 'demo', `${type}.pdf`), placeholderPdf(type)),
    ),
  );
}

const documents = (types, status, daysOld) =>
  Object.fromEntries(
    types.map((type) => [
      type,
      {
        file: `demo/${type}.pdf`,
        originalName: `${type}.pdf`,
        uploadedAt: atTime(daysAgo(daysOld), '11:00'),
        status,
      },
    ]),
  );

const ALL_TYPES = ['licence', 'identity', 'registration'];

function buildDrivers() {
  const byKey = new Map();

  const approved = APPROVED.map((d, i) => {
    const driver = {
      _id: new mongoose.Types.ObjectId(),
      name: d.name,
      phone: d.phone,
      status: 'approved',
      online: d.online,
      vehicle: { type: 'two_wheeler', plate: d.plate ?? `MP09 GH ${2000 + i}` },
      documents: documents(ALL_TYPES, 'verified', 40),
      createdAt: atTime(daysAgo(200 - i), '10:00'),
    };
    byKey.set(d.key, { ...d, _id: driver._id });
    return driver;
  });

  const pending = [
    ...APPLICANTS.map((a) => ({ ...a, documents: documents(ALL_TYPES, 'pending', a.applied) })),
    { ...INCOMPLETE, documents: documents(['licence', 'identity'], 'verified', INCOMPLETE.applied) },
  ].map((a) => ({
    _id: new mongoose.Types.ObjectId(),
    name: a.name,
    phone: a.phone,
    status: 'pending',
    online: false,
    vehicle: { type: a.type, plate: a.plate },
    documents: a.documents,
    createdAt: atTime(daysAgo(a.applied), '09:00'),
  }));

  return { drivers: [...approved, ...pending], byKey };
}

module.exports = { buildDrivers, writeDocuments, PHONES };
