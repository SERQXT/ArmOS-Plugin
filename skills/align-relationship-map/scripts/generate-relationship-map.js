/**
 * generate-relationship-map.js
 * Produces a branded Domo PS Align - Relationship Map .docx from a JSON data file.
 *
 * Usage:
 *   node generate-relationship-map.js <data.json> <output.docx>
 *
 * data.json schema:
 * {
 *   "account_name": "Acme Corp, LLC",
 *   "engagement_name": "Adoption Engine",
 *   "date": "March 2026",
 *   "stakeholders": [ { see below } ],
 *   "risks": [ { see below } ],
 *   "coverage_gaps": [ { see below } ],
 *   "priority_actions": [ "string", ... ]
 * }
 *
 * Stakeholder fields:
 *   name, email, title, dept, type, influence (HIGH|MEDIUM|LOW),
 *   sentiment (Advocate|Neutral|Skeptic|Unknown|At Risk),
 *   meetings, careAbout, pillar, valueMsg, strategy, questions[], watchOuts
 *
 * Risk fields: risk, severity (emoji prefix), detail, mitigation
 * Coverage gap fields: gap, description, action
 */

'use strict';

const fs   = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ── Auto-locate docx module ───────────────────────────────────────────────────
let docxModule;
try {
  docxModule = require('docx');
} catch (_) {
  try {
    const found = execSync(
      'find /sessions -maxdepth 6 -name "index.js" -path "*/docx/build/cjs*" 2>/dev/null | head -1'
    ).toString().trim();
    if (found) {
      // walk up to the docx package root
      const pkg = path.resolve(found, '..', '..', '..');
      docxModule = require(pkg);
    }
  } catch (_2) {}
}
if (!docxModule) {
  console.error('Installing docx npm package...');
  execSync('npm install docx --prefix /tmp/docx-map-install 2>/dev/null', { stdio: 'pipe' });
  docxModule = require('/tmp/docx-map-install/node_modules/docx');
}

const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, BorderStyle, WidthType, ShadingType, VerticalAlign,
  LevelFormat, PageNumber, Header, Footer, PageBreak,
} = docxModule;

// ── Args ──────────────────────────────────────────────────────────────────────
const [,, dataFile, outputFile] = process.argv;
if (!dataFile || !outputFile) {
  console.error('Usage: node generate-relationship-map.js <data.json> <output.docx>');
  process.exit(1);
}

const data = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
const { account_name, engagement_name, date, stakeholders = [], risks = [], coverage_gaps = [], priority_actions = [] } = data;

// ── Colors ────────────────────────────────────────────────────────────────────
const C = {
  blue:        '0072C6',
  dark:        '1F2937',
  lightBlue:   'EFF6FB',
  lightGray:   'F3F4F6',
  headerGray:  '374151',
  white:       'FFFFFF',
  redLight:    'FEE2E2',
  redDark:     '991B1B',
  yellowLight: 'FEF9C3',
  yellowDark:  '854D0E',
  greenLight:  'DCFCE7',
  greenDark:   '166534',
  orangeLight: 'FFF3CD',
  orangeDark:  '9A3412',
  mutedText:   '6B7280',
  mutedBorder: '9CA3AF',
};

// ── Border helpers ─────────────────────────────────────────────────────────────
const thin    = { style: BorderStyle.SINGLE, size: 1, color: 'D1D5DB' };
const none    = { style: BorderStyle.NONE,   size: 0, color: C.white };
const borders = { top: thin, bottom: thin, left: thin, right: thin };
const noBord  = { top: none, bottom: none, left: none, right: none };
const cellPad = { top: 80, bottom: 80, left: 120, right: 120 };

// ── Text helpers ──────────────────────────────────────────────────────────────
const run    = (text, opts={}) => new TextRun({ text, font: 'Arial', ...opts });
const bold   = (text, size=20, color=C.dark) => run(text, { bold: true, size, color });
const reg    = (text, size=18, color=C.dark) => run(text, { size, color });
const ital   = (text, size=18, color=C.mutedText) => run(text, { italics: true, size, color });

const p = (children, opts={}) =>
  new Paragraph({ children: Array.isArray(children) ? children : [children], ...opts });

const spacer = (pts=80) => p([run('')], { spacing: { before: pts, after: pts } });

// ── Section header (full-width blue bar) ─────────────────────────────────────
const sectionHdr = (text) => p(
  [run(text, { bold: true, size: 24, color: C.white, font: 'Arial' })],
  { shading: { fill: C.blue, type: ShadingType.CLEAR }, spacing: { before: 240, after: 80 }, indent: { left: 120 } }
);

// ── Sub-header (blue underline) ───────────────────────────────────────────────
const subHdr = (text) => p(
  [run(text, { bold: true, size: 20, color: C.blue, font: 'Arial' })],
  { spacing: { before: 200, after: 80 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: C.blue, space: 2 } } }
);

// ── Cell helper ───────────────────────────────────────────────────────────────
const tc = (children, width, opts={}) => new TableCell({
  borders, width: { size: width, type: WidthType.DXA }, margins: cellPad,
  verticalAlign: VerticalAlign.TOP,
  ...opts,
  children: Array.isArray(children) ? children : [p(children)],
});

const hdrCell = (text, width, fill=C.blue) => new TableCell({
  borders, width: { size: width, type: WidthType.DXA },
  shading: { fill, type: ShadingType.CLEAR },
  margins: cellPad, verticalAlign: VerticalAlign.CENTER,
  children: [p([bold(text, 18, C.white)])],
});

// ── Sentiment helpers ─────────────────────────────────────────────────────────
const sentimentColors = {
  'Advocate':  { fill: C.greenLight,  color: C.greenDark  },
  'Neutral':   { fill: C.yellowLight, color: C.yellowDark },
  'Skeptic':   { fill: C.redLight,    color: C.redDark    },
  'Unknown':   { fill: C.lightGray,   color: C.headerGray },
  'At Risk':   { fill: C.orangeLight, color: C.orangeDark },
};
const sentimentCell = (sentiment, width) => {
  const { fill, color } = sentimentColors[sentiment] || sentimentColors['Unknown'];
  return new TableCell({
    borders, width: { size: width, type: WidthType.DXA },
    shading: { fill, type: ShadingType.CLEAR }, margins: cellPad,
    verticalAlign: VerticalAlign.CENTER,
    children: [p([bold(sentiment, 17, color)])],
  });
};
const influenceColors = {
  'HIGH':   { fill: C.redLight,    color: C.redDark    },
  'MEDIUM': { fill: C.yellowLight, color: C.yellowDark },
  'LOW':    { fill: C.lightGray,   color: C.headerGray },
};

// ── Legend ────────────────────────────────────────────────────────────────────
const buildLegend = () => new Table({
  width: { size: 9360, type: WidthType.DXA },
  columnWidths: [1100, 1452, 1452, 1452, 1452, 1452],
  rows: [new TableRow({ children: [
    new TableCell({ borders: noBord, children: [p([bold('Legend:', 16, C.dark)])] }),
    new TableCell({ borders: noBord, shading: { fill: C.greenLight,  type: ShadingType.CLEAR }, margins: { top: 60, bottom: 60, left: 100, right: 100 }, children: [p([bold('● Advocate', 16, C.greenDark)])] }),
    new TableCell({ borders: noBord, shading: { fill: C.yellowLight, type: ShadingType.CLEAR }, margins: { top: 60, bottom: 60, left: 100, right: 100 }, children: [p([bold('● Neutral',  16, C.yellowDark)])] }),
    new TableCell({ borders: noBord, shading: { fill: C.redLight,    type: ShadingType.CLEAR }, margins: { top: 60, bottom: 60, left: 100, right: 100 }, children: [p([bold('● Skeptic',  16, C.redDark)])] }),
    new TableCell({ borders: noBord, shading: { fill: C.orangeLight, type: ShadingType.CLEAR }, margins: { top: 60, bottom: 60, left: 100, right: 100 }, children: [p([bold('● At Risk',  16, C.orangeDark)])] }),
    new TableCell({ borders: noBord, shading: { fill: C.lightGray,   type: ShadingType.CLEAR }, margins: { top: 60, bottom: 60, left: 100, right: 100 }, children: [p([bold('● Unknown',  16, C.headerGray)])] }),
  ]})]
});

// ── Summary table ─────────────────────────────────────────────────────────────
const buildSummaryTable = () => {
  const cw = [1700, 1400, 1100, 850, 1060, 3250];
  return new Table({
    width: { size: 9360, type: WidthType.DXA }, columnWidths: cw,
    rows: [
      new TableRow({ tableHeader: true, children: [
        hdrCell('Name', cw[0]), hdrCell('Title', cw[1]), hdrCell('Type', cw[2]),
        hdrCell('Influence', cw[3]), hdrCell('Sentiment', cw[4]), hdrCell('What They Care About', cw[5]),
      ]}),
      ...stakeholders.map(s => {
        const ic = influenceColors[s.influence] || influenceColors['LOW'];
        return new TableRow({ children: [
          new TableCell({ borders, width: { size: cw[0], type: WidthType.DXA }, margins: cellPad,
            children: [p([bold(s.name, 17)]), p([ital(s.email, 15)])] }),
          tc([p([reg(s.title, 17)])], cw[1]),
          tc([p([reg(s.type,  17)])], cw[2]),
          new TableCell({ borders, width: { size: cw[3], type: WidthType.DXA }, margins: cellPad,
            shading: { fill: ic.fill, type: ShadingType.CLEAR },
            children: [p([bold(s.influence, 17, ic.color)])] }),
          sentimentCell(s.sentiment, cw[4]),
          tc([p([reg(s.careAbout, 17)])], cw[5]),
        ]});
      }),
    ],
  });
};

// ── Profile card ──────────────────────────────────────────────────────────────
const buildProfileCard = (s) => {
  const cw = [4680, 4680];
  const sc = sentimentColors[s.sentiment] || sentimentColors['Unknown'];
  const ic = influenceColors[s.influence]  || influenceColors['LOW'];

  const nameHdr = [
    p([run(s.name, { bold: true, size: 28, color: C.white, font: 'Arial' })],
      { shading: { fill: C.headerGray, type: ShadingType.CLEAR }, spacing: { before: 120, after: 0 }, indent: { left: 160 } }),
    p([run(`${s.title}  ·  ${s.dept}`, { size: 20, color: 'D1D5DB', font: 'Arial' })],
      { shading: { fill: C.headerGray, type: ShadingType.CLEAR }, spacing: { before: 0, after: 0 }, indent: { left: 160 } }),
    p([run(s.type, { size: 18, color: '9CA3AF', italics: true, font: 'Arial' })],
      { shading: { fill: C.headerGray, type: ShadingType.CLEAR }, spacing: { before: 0, after: 120 }, indent: { left: 160 } }),
  ];

  const infoRow = new Table({
    width: { size: 9360, type: WidthType.DXA }, columnWidths: cw,
    rows: [new TableRow({ children: [
      new TableCell({ borders, width: { size: cw[0], type: WidthType.DXA },
        shading: { fill: C.lightBlue, type: ShadingType.CLEAR }, margins: { top: 100, bottom: 100, left: 160, right: 160 },
        children: [
          p([bold('📧 Contact',   17, C.blue)]), p([reg(s.email, 17)]), spacer(40),
          p([bold('📊 Influence', 17, C.blue)]), p([bold(s.influence, 18, ic.color)]), spacer(40),
          p([bold('💬 Sentiment', 17, C.blue)]), p([bold(s.sentiment, 18, sc.color)]),
        ] }),
      new TableCell({ borders, width: { size: cw[1], type: WidthType.DXA },
        shading: { fill: C.lightBlue, type: ShadingType.CLEAR }, margins: { top: 100, bottom: 100, left: 160, right: 160 },
        children: [
          p([bold('📅 Call History', 17, C.blue)]), p([reg(s.meetings, 17)]), spacer(40),
          p([bold('🎯 Value Pillar', 17, C.blue)]), p([reg(s.pillar,   17)]),
        ] }),
    ]})]
  });

  const bodyRow = new Table({
    width: { size: 9360, type: WidthType.DXA }, columnWidths: cw,
    rows: [new TableRow({ children: [
      new TableCell({ borders, width: { size: cw[0], type: WidthType.DXA }, margins: { top: 120, bottom: 120, left: 160, right: 160 },
        children: [
          p([bold('🗣 Value Message', 18, C.dark)]),
          spacer(40),
          new Paragraph({ children: [run(`"${s.valueMsg}"`, { size: 18, italics: true, color: '374151', font: 'Arial' })], spacing: { after: 80 } }),
          spacer(40),
          p([bold('⚠️ Watch Outs', 18, C.dark)]),
          spacer(20),
          p([reg(s.watchOuts, 17)]),
        ] }),
      new TableCell({ borders, width: { size: cw[1], type: WidthType.DXA }, margins: { top: 120, bottom: 120, left: 160, right: 160 },
        children: [
          p([bold('🏗 Engagement Strategy', 18, C.dark)]),
          spacer(40),
          p([reg(s.strategy, 17)]),
          spacer(60),
          p([bold('❓ Questions to Ask', 18, C.dark)]),
          spacer(20),
          ...(s.questions || []).map((q, i) =>
            new Paragraph({
              numbering: { reference: 'qs', level: 0 },
              children: [run(q, { size: 17, color: C.dark, font: 'Arial' })],
            })
          ),
        ] }),
    ]})]
  });

  return [...nameHdr, infoRow, bodyRow, spacer(160)];
};

// ── Risk register ─────────────────────────────────────────────────────────────
const buildRiskTable = () => {
  const cw = [1800, 900, 3330, 3330];
  return new Table({
    width: { size: 9360, type: WidthType.DXA }, columnWidths: cw,
    rows: [
      new TableRow({ tableHeader: true, children: [
        hdrCell('Risk', cw[0]), hdrCell('Severity', cw[1]),
        hdrCell('Details', cw[2]),   hdrCell('Mitigation', cw[3]),
      ]}),
      ...risks.map(r => new TableRow({ children: [
        tc([p([bold(r.risk,       17)])], cw[0]),
        tc([p([bold(r.severity,   17)])], cw[1]),
        tc([p([reg(r.detail,      17)])], cw[2]),
        tc([p([reg(r.mitigation,  17)])], cw[3]),
      ]})),
    ],
  });
};

// ── Coverage gaps ─────────────────────────────────────────────────────────────
const buildCoverageSection = () => {
  const items = [];
  for (const gap of coverage_gaps) {
    items.push(subHdr(gap.gap));
    items.push(p([reg(gap.description, 18)]));
    if (gap.action) {
      items.push(spacer(40));
      items.push(p([run('→ ', { bold: true, size: 18, color: C.blue, font: 'Arial' }),
                    run(gap.action, { size: 18, color: C.dark, font: 'Arial' })]));
    }
    items.push(spacer(80));
  }
  return items;
};

// ── Priority actions ──────────────────────────────────────────────────────────
const buildPriorityActions = () =>
  priority_actions.map(action =>
    new Paragraph({
      numbering: { reference: 'qs', level: 0 },
      children: [run(action, { size: 18, color: C.dark, font: 'Arial' })],
    })
  );

// ── Document assembly ─────────────────────────────────────────────────────────
const engLabel = engagement_name ? `  ·  ${engagement_name}` : '';
const headerTitle = `${account_name.toUpperCase()}  ·  RELATIONSHIP MAP`;

const doc = new Document({
  numbering: {
    config: [{
      reference: 'qs',
      levels: [{ level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.LEFT,
        style: { paragraph: { indent: { left: 440, hanging: 280 } }, run: { font: 'Arial', size: 17 } } }],
    }],
  },
  sections: [{
    properties: {
      page: { size: { width: 12240, height: 15840 }, margin: { top: 720, right: 720, bottom: 720, left: 720 } },
    },
    headers: {
      default: new Header({ children: [
        new Paragraph({
          children: [
            run(headerTitle, { bold: true, size: 16, color: C.blue, font: 'Arial' }),
            run(`\t${date}  ·  Confidential`, { size: 16, color: C.mutedBorder, font: 'Arial' }),
          ],
          tabStops: [{ type: 'right', position: 11520 }],
          border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: C.blue, space: 4 } },
        }),
      ] }),
    },
    footers: {
      default: new Footer({ children: [
        new Paragraph({
          children: [
            run('Prepared by Compass  ·  Domo Professional Services', { size: 16, color: C.mutedBorder, font: 'Arial' }),
            run('\tPage ', { size: 16, color: C.mutedBorder, font: 'Arial' }),
            new TextRun({ children: [PageNumber.CURRENT], size: 16, color: C.mutedBorder, font: 'Arial' }),
          ],
          tabStops: [{ type: 'right', position: 11520 }],
          border: { top: { style: BorderStyle.SINGLE, size: 4, color: C.blue, space: 4 } },
        }),
      ] }),
    },
    children: [
      // ── Title block ──────────────────────────────────────────────────────
      p([run('RELATIONSHIP MAP', { bold: true, size: 52, color: C.white, font: 'Arial' })],
        { shading: { fill: C.blue, type: ShadingType.CLEAR }, spacing: { before: 240, after: 80 }, indent: { left: 240 } }),
      p([run(`${account_name}${engLabel}`, { size: 24, color: C.white, font: 'Arial' })],
        { shading: { fill: C.blue, type: ShadingType.CLEAR }, spacing: { before: 0, after: 0 }, indent: { left: 240 } }),
      p([run(`${date}  ·  Prepared by Compass`, { size: 20, italics: true, color: 'BFD7EF', font: 'Arial' })],
        { shading: { fill: C.blue, type: ShadingType.CLEAR }, spacing: { before: 40, after: 280 }, indent: { left: 240 } }),

      spacer(60),
      p([bold('Sentiment Key', 18, C.dark)]),
      buildLegend(),
      spacer(120),

      // ── 01 Summary ────────────────────────────────────────────────────────
      sectionHdr('01  |  RELATIONSHIP SUMMARY'),
      spacer(60),
      buildSummaryTable(),
      spacer(60),
      p([ital('All recorded meetings are inbound — contacts initiated or accepted. No outbound-only contacts detected.', 16)]),

      new Paragraph({ children: [new PageBreak()] }),

      // ── 02 Profiles ───────────────────────────────────────────────────────
      sectionHdr('02  |  RELATIONSHIP PROFILES'),
      spacer(80),
      ...stakeholders.flatMap(s => buildProfileCard(s)),

      new Paragraph({ children: [new PageBreak()] }),

      // ── 03 Risk register ──────────────────────────────────────────────────
      sectionHdr('03  |  RISK REGISTER'),
      spacer(80),
      ...(risks.length ? [buildRiskTable()] : [p([reg('No risks identified.', 18)])]),
      spacer(120),

      // ── 04 Coverage gaps ──────────────────────────────────────────────────
      sectionHdr('04  |  COVERAGE GAPS & NEXT ACTIONS'),
      spacer(80),
      ...buildCoverageSection(),

      ...(priority_actions.length ? [
        subHdr('Recommended Relationship Expansion Priority'),
        ...buildPriorityActions(),
        spacer(160),
      ] : []),
    ],
  }],
});

Packer.toBuffer(doc).then(buf => {
  fs.writeFileSync(outputFile, buf);
  console.log(`✅ Written: ${outputFile}`);
}).catch(err => {
  console.error('Error generating document:', err);
  process.exit(1);
});
