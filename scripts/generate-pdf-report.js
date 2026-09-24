const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const PDFDocument = require('pdfkit');

const projectRoot = path.resolve(__dirname, '..');
const resultsDirectory = path.join(projectRoot, 'test-results');
const jsonPath = path.join(resultsDirectory, 'playwright-results.json');
const pdfPath = path.join(resultsDirectory, 'automation-report.pdf');
const packageJson = JSON.parse(fs.readFileSync(path.join(projectRoot, 'package.json'), 'utf8'));

const colors = {
  ink: '#132238',
  muted: '#667085',
  line: '#E4E7EC',
  paper: '#F8FAFC',
  white: '#FFFFFF',
  teal: '#087F8C',
  green: '#16794B',
  greenLight: '#EAF7F0',
  amber: '#A15C00',
  amberLight: '#FFF4E5',
  red: '#B42318',
  redLight: '#FEECEB',
};

const portfolioMetrics = {
  projects: 6,
  publications: 3,
  skills: 15,
};

function runTests() {
  fs.mkdirSync(resultsDirectory, { recursive: true });
  const playwrightCli = path.join(projectRoot, 'node_modules', '@playwright', 'test', 'cli.js');
  const result = spawnSync(process.execPath, [playwrightCli, 'test', '--reporter=json'], {
    cwd: projectRoot,
    encoding: 'utf8',
    maxBuffer: 20 * 1024 * 1024,
    shell: false,
  });

  const output = `${result.stdout || ''}\n${result.stderr || ''}`.trim();
  const jsonStart = output.indexOf('{');
  const jsonEnd = output.lastIndexOf('}');
  if (jsonStart === -1 || jsonEnd === -1) {
    throw new Error(`Playwright did not produce JSON output.\n${result.stderr || output}`);
  }

  const report = JSON.parse(output.slice(jsonStart, jsonEnd + 1));
  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2));
  return { report, exitCode: result.status };
}

function collectSpecs(suites, parentTitles = []) {
  const specs = [];
  for (const suite of suites || []) {
    const titles = suite.title ? [...parentTitles, suite.title] : parentTitles;
    for (const spec of suite.specs || []) {
      for (const test of spec.tests || []) {
        const results = test.results || [];
        const lastResult = results[results.length - 1] || {};
        specs.push({
          title: [...titles, spec.title].filter(Boolean).join(' / '),
          file: spec.file || 'Unknown test file',
          project: test.projectName || 'Default',
          status: lastResult.status || test.status || 'unknown',
          duration: results.reduce((sum, item) => sum + (item.duration || 0), 0),
          error: lastResult.error?.message || lastResult.errors?.[0]?.message || '',
          retries: Math.max(0, results.length - 1),
        });
      }
    }
    specs.push(...collectSpecs(suite.suites, titles));
  }
  return specs;
}

function formatDuration(milliseconds) {
  if (!milliseconds) return '0 ms';
  if (milliseconds < 1000) return `${milliseconds} ms`;
  return `${(milliseconds / 1000).toFixed(1)} s`;
}

function formatDate(value) {
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'long',
    timeStyle: 'short',
  }).format(value);
}

function statusLabel(status) {
  return {
    passed: 'PASSED',
    failed: 'FAILED',
    timedOut: 'TIMED OUT',
    skipped: 'SKIPPED',
    interrupted: 'INTERRUPTED',
  }[status] || status.toUpperCase();
}

function statusTheme(status) {
  if (status === 'passed') return { text: colors.green, fill: colors.greenLight };
  if (status === 'skipped') return { text: colors.amber, fill: colors.amberLight };
  return { text: colors.red, fill: colors.redLight };
}

function drawHeader(doc, section, pageNumber) {
  doc.rect(0, 0, doc.page.width, 14).fill(colors.teal);
  doc.fillColor(colors.ink).font('Helvetica-Bold').fontSize(9).text('PERSONAL PROFILE', 48, 34, {
    characterSpacing: 1.4,
  });
  doc.fillColor(colors.muted).font('Helvetica').fontSize(8).text(section.toUpperCase(), 48, 50, {
    characterSpacing: 1,
  });
  doc.fillColor(colors.muted).text(String(pageNumber).padStart(2, '0'), doc.page.width - 72, 42, {
    width: 24,
    align: 'right',
  });
  doc.moveTo(48, 70).lineTo(doc.page.width - 48, 70).strokeColor(colors.line).lineWidth(1).stroke();
}

function drawMetric(doc, x, y, width, value, label, accent) {
  doc.roundedRect(x, y, width, 76, 8).fillAndStroke(colors.white, colors.line);
  doc.rect(x, y, 4, 76).fill(accent);
  doc.fillColor(colors.ink).font('Helvetica-Bold').fontSize(24).text(String(value), x + 18, y + 16);
  doc.fillColor(colors.muted).font('Helvetica').fontSize(9).text(label.toUpperCase(), x + 18, y + 50, {
    characterSpacing: 0.7,
  });
}

function drawStatusPill(doc, x, y, status) {
  const theme = statusTheme(status);
  const label = statusLabel(status);
  doc.font('Helvetica-Bold').fontSize(7);
  const width = doc.widthOfString(label) + 16;
  doc.roundedRect(x, y, width, 16, 8).fill(theme.fill);
  doc.fillColor(theme.text).text(label, x + 8, y + 5, { lineBreak: false });
  return width;
}

function drawReport(report, exitCode) {
  const specs = collectSpecs(report.suites);
  const counts = specs.reduce((summary, item) => {
    summary[item.status] = (summary[item.status] || 0) + 1;
    return summary;
  }, {});
  const total = specs.length;
  const passed = counts.passed || 0;
  const failed = (counts.failed || 0) + (counts.timedOut || 0) + (counts.interrupted || 0);
  const skipped = counts.skipped || 0;
  const duration = report.stats?.duration || specs.reduce((sum, item) => sum + item.duration, 0);
  const browserCounts = specs.reduce((summary, item) => {
    summary[item.project] = (summary[item.project] || 0) + 1;
    return summary;
  }, {});
  const testGroups = [...new Set(specs.map((item) => item.title))].map((title) => {
    const matching = specs.filter((item) => item.title === title);
    return {
      title: title.replace(/^Personal Profile Website Tests \/ /, ''),
      passed: matching.filter((item) => item.status === 'passed').length,
      total: matching.length,
    };
  });
  const generatedAt = new Date();
  const doc = new PDFDocument({ size: 'A4', margin: 36, info: {
    Title: 'Personal Profile Automation Dashboard',
    Author: packageJson.author,
    Subject: 'Playwright test execution dashboard',
  } });

  doc.pipe(fs.createWriteStream(pdfPath));
  doc.rect(0, 0, doc.page.width, doc.page.height).fill(colors.paper);
  doc.rect(0, 0, doc.page.width, 154).fill(colors.ink);
  doc.rect(36, 43, 38, 4).fill(colors.teal);
  doc.fillColor(colors.white).font('Helvetica-Bold').fontSize(25).text('Quality dashboard', 36, 66);
  doc.fillColor('#B7C7D9').font('Helvetica').fontSize(9).text('PERSONAL PROFILE  /  PLAYWRIGHT AUTOMATION', 36, 108, { characterSpacing: 1 });
  doc.fillColor('#B7C7D9').fontSize(8).text(formatDate(generatedAt), 36, 125);
  doc.fillColor(colors.teal).font('Helvetica-Bold').fontSize(8).text(
    failed === 0 && total > 0 ? 'RELEASE READY' : 'REVIEW REQUIRED',
    doc.page.width - 150, 70, { width: 114, align: 'right', characterSpacing: 1 }
  );

  doc.fillColor(colors.ink).font('Helvetica-Bold').fontSize(13).text('At a glance', 36, 180);
  const cardWidth = (doc.page.width - 72 - 24) / 3;
  const metrics = [
    [total, 'test runs', colors.teal],
    [passed, 'successful', colors.green],
    [`${total ? Math.round((passed / total) * 100) : 0}%`, 'success rate', colors.green],
  ];
  metrics.forEach(([value, label, accent], index) => drawMetric(doc, 36 + index * (cardWidth + 12), 208, cardWidth, value, label, accent));

  doc.fillColor(colors.ink).font('Helvetica-Bold').fontSize(13).text('Portfolio profile', 36, 314);
  const profileCards = [
    [portfolioMetrics.projects, 'projects', colors.teal],
    [portfolioMetrics.publications, 'publications', colors.teal],
    [portfolioMetrics.skills, 'skills', colors.teal],
  ];
  profileCards.forEach(([value, label, accent], index) => drawMetric(doc, 36 + index * (cardWidth + 12), 342, cardWidth, value, label, accent));

  doc.fillColor(colors.ink).font('Helvetica-Bold').fontSize(13).text('Test outcome distribution', 36, 450);
  const chartX = 36;
  const chartY = 478;
  const chartWidth = 250;
  const chartHeight = 18;
  const segments = [[passed, colors.green], [failed, colors.red], [skipped, colors.amber]];
  let segmentX = chartX;
  segments.forEach(([value, color]) => {
    const width = total ? chartWidth * (value / total) : 0;
    if (width > 0) doc.rect(segmentX, chartY, width, chartHeight).fill(color);
    segmentX += width;
  });
  doc.rect(chartX, chartY, chartWidth, chartHeight).lineWidth(0.6).strokeColor(colors.line).stroke();
  [['Passed', passed, colors.green], ['Failed', failed, colors.red], ['Skipped', skipped, colors.amber]].forEach(([label, value, color], index) => {
    const x = chartX + index * 82;
    doc.circle(x + 4, 522, 4).fill(color);
    doc.fillColor(colors.ink).font('Helvetica-Bold').fontSize(8).text(String(value), x + 13, 517);
    doc.fillColor(colors.muted).font('Helvetica').text(label, x + 13, 529);
  });
  doc.fillColor(colors.muted).font('Helvetica').fontSize(8).text(`Runtime ${formatDuration(duration)}  |  Exit code ${exitCode ?? 0}`, chartX, 552);

  doc.fillColor(colors.ink).font('Helvetica-Bold').fontSize(13).text('Browser coverage', 330, 450);
  let browserY = 480;
  for (const [browser, count] of Object.entries(browserCounts)) {
    doc.fillColor(colors.ink).font('Helvetica').fontSize(8).text(browser, 330, browserY);
    doc.roundedRect(395, browserY + 1, 125, 9, 4).fill('#E8EEF4');
    doc.roundedRect(395, browserY + 1, total ? 125 * (count / total) : 0, 9, 4).fill(colors.teal);
    doc.fillColor(colors.muted).text(`${count}/${total}`, 530, browserY, { width: 28, align: 'right' });
    browserY += 26;
  }

  doc.fillColor(colors.ink).font('Helvetica-Bold').fontSize(13).text('Test case success matrix', 36, 600);
  doc.fillColor(colors.muted).font('Helvetica').fontSize(8).text('Successful runs across the configured browser projects', 36, 619);
  const tableY = 644;
  doc.rect(36, tableY, doc.page.width - 72, 22).fill(colors.ink);
  doc.fillColor(colors.white).font('Helvetica-Bold').fontSize(7).text('TEST CASE', 48, tableY + 7, { characterSpacing: 0.6 });
  doc.text('SUCCESSFUL', 380, tableY + 7, { characterSpacing: 0.6 });
  doc.text('RUN TIME', 494, tableY + 7, { characterSpacing: 0.6 });
  testGroups.forEach((group, index) => {
    const y = tableY + 31 + index * 27;
    const matching = specs.filter((item) => item.title.endsWith(group.title));
    doc.fillColor(colors.ink).font('Helvetica').fontSize(8).text(group.title, 48, y, { width: 315, ellipsis: true });
    doc.fillColor(group.passed === group.total ? colors.green : colors.red).font('Helvetica-Bold').text(`${group.passed}/${group.total}`, 380, y);
    doc.fillColor(colors.muted).font('Helvetica').text(formatDuration(matching.reduce((sum, item) => sum + item.duration, 0)), 494, y);
    doc.moveTo(36, y + 17).lineTo(doc.page.width - 36, y + 17).strokeColor(colors.line).stroke();
  });

  doc.roundedRect(36, 758, doc.page.width - 72, 28, 6).fill(failed === 0 ? colors.greenLight : colors.redLight);
  doc.fillColor(failed === 0 ? colors.green : colors.red).font('Helvetica-Bold').fontSize(9).text(
    failed === 0 ? 'ALL CONFIGURED TESTS SUCCESSFUL' : `${failed} TEST RUNS REQUIRE ATTENTION`, 48, 768, { characterSpacing: 0.4 }
  );
  doc.fillColor(colors.muted).font('Helvetica').fontSize(7).text('Source: live portfolio profile metrics and the current Playwright JSON execution.', 36, 798);
  doc.end();
  return { total, passed, failed, skipped, pdfPath, jsonPath };
}

try {
  const { report, exitCode } = runTests();
  const summary = drawReport(report, exitCode);
  console.log(`PDF report created: ${summary.pdfPath}`);
  console.log(`Raw JSON retained: ${summary.jsonPath}`);
  console.log(`Results: ${summary.passed} passed, ${summary.failed} failed, ${summary.skipped} skipped, ${summary.total} total`);
  process.exitCode = summary.failed > 0 ? 1 : 0;
} catch (error) {
  console.error(`Unable to create PDF report: ${error.message}`);
  process.exitCode = 1;
}