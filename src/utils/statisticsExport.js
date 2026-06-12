import PDFDocument from 'pdfkit';

const GENDER_LABELS = {
    weiblich: 'Weiblich',
    männlich: 'Männlich',
    divers: 'Divers',
    unbekannt: 'Unbekannt',
};

const GENDER_ICONS = {
    weiblich: 'W',
    männlich: 'M',
    divers: 'D',
    unbekannt: 'U',
};

const formatCurrency = (value) => `${Number(value || 0).toFixed(2).replace('.', ',')} EUR`;
const formatNumber = (value) => Number(value || 0).toLocaleString('de-DE');
const formatDecimal = (value) => Number(value || 0).toFixed(2).replace('.', ',');
const formatPercent = (value) => `${Number(value || 0).toFixed(1).replace('.', ',')}%`;

const escapeHtml = (value) => String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');

const getOverviewMetrics = (statistics, moduleConfig, donationMode) => {
    const topClass = statistics.classStats?.[0] || null;
    const topRoundStudent = statistics.topStudentsByRounds?.[0] || null;
    const topDonationStudent = statistics.topStudentsByMoney?.[0] || null;
    const participationRate = statistics.totalStudents
        ? (statistics.activeStudents / statistics.totalStudents) * 100
        : 0;

    const metrics = [
        {
            title: 'Gesamte Runden',
            value: formatNumber(statistics.totalRounds),
            detail: topClass ? `Stärkste Klasse: ${topClass.klasse}` : 'Noch keine Klassenspitze',
        },
        {
            title: 'Teilnahme',
            value: formatPercent(participationRate),
            detail: `${formatNumber(statistics.activeStudents)} von ${formatNumber(statistics.totalStudents)} Schülern aktiv`,
        },
        {
            title: 'Ø Runden pro aktivem Schüler',
            value: formatDecimal(statistics.averageRounds),
            detail: topRoundStudent ? `${topRoundStudent.vorname} ${topRoundStudent.nachname} führt mit ${topRoundStudent.rounds}` : 'Noch keine Rundenspitze',
        },
    ];

    if (moduleConfig.donations) {
        metrics.push({
            title: `Gesamte ${donationMode === 'expected' ? 'Erwartete' : 'Erhaltene'} Spenden`,
            value: formatCurrency(statistics.totalDonations),
            detail: topDonationStudent ? `${topDonationStudent.vorname} ${topDonationStudent.nachname} führt mit ${formatCurrency(topDonationStudent.spenden)}` : 'Noch keine Spendenwerte',
        });
    }

    return metrics;
};

const getHighlights = (statistics, moduleConfig, donationMode) => {
    const highlights = [];
    const topClass = statistics.classStats?.[0] || null;
    const inactiveStudents = Math.max((statistics.totalStudents || 0) - (statistics.activeStudents || 0), 0);
    const highPerformerCount = statistics.activityDistribution?.highPerformers || 0;
    const lowParticipationClasses = (statistics.classStats || [])
        .filter((item) => item.totalStudents >= 3 && item.participationRate < 50)
        .slice(0, 3);
    const topDonationStudent = statistics.topStudentsByMoney?.[0] || null;

    if (topClass) {
        highlights.push(`Klasse ${topClass.klasse} führt mit ${topClass.totalRounds} Runden bei ${formatPercent(topClass.participationRate)} Teilnahme.`);
    }

    if (inactiveStudents > 0) {
        highlights.push(`${inactiveStudents} Schüler haben bisher noch keine Runde.`);
    }

    if (highPerformerCount > 0) {
        highlights.push(`${highPerformerCount} Schüler haben bereits 10 oder mehr Runden erreicht.`);
    }

    if (lowParticipationClasses.length > 0) {
        highlights.push(`Niedrige Teilnahme in: ${lowParticipationClasses.map((item) => `${item.klasse} (${formatPercent(item.participationRate)})`).join(', ')}.`);
    }

    if (moduleConfig.donations && topDonationStudent) {
        highlights.push(`${topDonationStudent.vorname} ${topDonationStudent.nachname} führt im ${donationMode === 'expected' ? 'Erwartungs' : 'Zahlungs'}modus mit ${formatCurrency(topDonationStudent.spenden)}.`);
    }

    return highlights;
};

const renderHtmlTable = (title, headers, rows) => {
    if (!rows.length) {
        return `
            <section class="report-section">
                <h2>${escapeHtml(title)}</h2>
                <div class="empty-note">Keine Daten vorhanden.</div>
            </section>
        `;
    }

    return `
        <section class="report-section">
            <h2>${escapeHtml(title)}</h2>
            <div class="table-wrap">
                <table>
                    <thead>
                        <tr>${headers.map((header) => `<th>${escapeHtml(header)}</th>`).join('')}</tr>
                    </thead>
                    <tbody>
                        ${rows.map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join('')}</tr>`).join('')}
                    </tbody>
                </table>
            </div>
        </section>
    `;
};

export const renderStatisticsHtmlReport = ({ statistics, donationMode, moduleConfig }) => {
    const generatedAt = new Date().toLocaleString('de-DE');
    const overviewMetrics = getOverviewMetrics(statistics, moduleConfig, donationMode);
    const highlights = getHighlights(statistics, moduleConfig, donationMode);
    const genderCards = statistics.genderBreakdown || [];
    const topClasses = (statistics.classStats || []).slice(0, 10);
    const topStudentsByRounds = (statistics.topStudentsByRounds || []).slice(0, 10);
    const topStudentsByMoney = (statistics.topStudentsByMoney || []).slice(0, 10);

    const classRows = topClasses.map((item) => [
        item.klasse,
        formatNumber(item.totalRounds),
        formatDecimal(item.averageRounds),
        `${formatNumber(item.activeStudents)}/${formatNumber(item.totalStudents)}`,
        formatPercent(item.participationRate),
        ...(moduleConfig.donations ? [formatCurrency(item.totalMoney), formatCurrency(item.averageMoney)] : []),
    ]);

    const roundRows = topStudentsByRounds.map((student) => [
        `${student.vorname} ${student.nachname}`,
        student.klasse,
        GENDER_LABELS[student.geschlechtNormalized] || student.geschlechtNormalized || 'Unbekannt',
        formatNumber(student.rounds),
    ]);

    const moneyRows = topStudentsByMoney.map((student) => [
        `${student.vorname} ${student.nachname}`,
        student.klasse,
        GENDER_LABELS[student.geschlechtNormalized] || student.geschlechtNormalized || 'Unbekannt',
        formatCurrency(student.spenden),
    ]);

    return `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Sponsorenlauf Statistikexport</title>
  <style>
    :root { color-scheme: light; }
    * { box-sizing: border-box; }
    body { margin: 0; font-family: Arial, sans-serif; background: #f4f7fb; color: #1f2937; }
    .page { max-width: 1200px; margin: 0 auto; padding: 32px 20px 48px; }
    .hero, .card, .report-section { background: #fff; border: 1px solid #dbe3ef; border-radius: 18px; box-shadow: 0 10px 30px rgba(15, 23, 42, 0.06); }
    .hero { padding: 24px; display: flex; justify-content: space-between; gap: 24px; align-items: flex-start; }
    h1, h2, h3 { margin: 0; }
    h1 { color: #2563eb; font-size: 30px; }
    h2 { color: #1f2937; font-size: 24px; margin-bottom: 16px; }
    p { margin: 0; line-height: 1.6; }
    .hero p { margin-top: 10px; max-width: 66ch; color: #4b5563; }
    .hero-meta { display: grid; gap: 8px; justify-items: end; color: #4b5563; font-size: 14px; }
    .metric-grid, .insights-grid, .gender-grid, .grade-grid { display: grid; gap: 16px; margin-top: 24px; }
    .metric-grid { grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); }
    .insights-grid, .gender-grid, .grade-grid { grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); }
    .card { padding: 18px; }
    .card small { display: block; color: #6b7280; margin-bottom: 8px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; }
    .card strong { display: block; font-size: 26px; color: #111827; margin-bottom: 8px; }
    .card p { color: #4b5563; }
    .report-section { margin-top: 24px; padding: 24px; }
    .insight-list { display: grid; gap: 12px; margin-top: 12px; }
    .insight-item { padding: 14px 16px; background: #f8fafc; border-radius: 14px; border-left: 4px solid #2563eb; color: #334155; }
    .gender-card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
    .gender-card-header span { color: #6b7280; font-weight: 700; }
    .gender-metrics { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; margin-top: 12px; }
    .gender-metrics div { background: #f8fafc; border-radius: 12px; padding: 10px; }
    .gender-metrics small { margin-bottom: 4px; }
    .gender-metrics strong { font-size: 18px; margin: 0; }
    .table-wrap { overflow-x: auto; }
    table { width: 100%; border-collapse: collapse; min-width: 620px; }
    th, td { padding: 12px 14px; border-bottom: 1px solid #e5e7eb; text-align: left; }
    th { background: #f8fafc; color: #111827; font-size: 14px; }
    td { color: #374151; }
    .grade-card { padding: 18px; }
    .grade-card strong { font-size: 22px; margin-top: 8px; }
    .empty-note { color: #6b7280; padding: 14px; background: #f8fafc; border-radius: 12px; }
    @media print { body { background: #fff; } .page { max-width: none; padding: 0; } .hero, .card, .report-section { box-shadow: none; } }
    @media (max-width: 768px) { .hero { flex-direction: column; } .hero-meta { justify-items: start; } .gender-metrics { grid-template-columns: 1fr; } }
  </style>
</head>
<body>
  <div class="page">
    <section class="hero">
      <div>
        <h1>Sponsorenlauf Statistikexport</h1>
      </div>
      <div class="hero-meta">
        <div><strong>Erstellt:</strong> ${escapeHtml(generatedAt)}</div>
        <div><strong>Spendenmodus:</strong> ${moduleConfig.donations ? escapeHtml(donationMode === 'expected' ? 'Erwartete Spenden' : 'Erhaltene Spenden') : 'Spendenmodul deaktiviert'}</div>
      </div>
    </section>

    <section class="metric-grid">
      ${overviewMetrics.map((metric) => `
        <article class="card">
          <small>${escapeHtml(metric.title)}</small>
          <strong>${escapeHtml(metric.value)}</strong>
          <p>${escapeHtml(metric.detail)}</p>
        </article>
      `).join('')}
    </section>

    <section class="report-section">
      <h2>Auffälligkeiten</h2>
      <div class="insight-list">
        ${highlights.length > 0 ? highlights.map((item) => `<div class="insight-item">${escapeHtml(item)}</div>`).join('') : '<div class="empty-note">Keine Auffälligkeiten vorhanden.</div>'}
      </div>
    </section>

    <section class="report-section">
      <h2>Geschlechter-Überblick</h2>
      <div class="gender-grid">
        ${genderCards.map((item) => `
          <article class="card">
            <div class="gender-card-header">
              <h3>${escapeHtml(GENDER_LABELS[item.gender] || item.gender)}</h3>
              <span>${escapeHtml(GENDER_ICONS[item.gender] || '•')}</span>
            </div>
            <div class="gender-metrics">
              <div><small>Teilnahme</small><strong>${escapeHtml(formatPercent(item.participationRate))}</strong></div>
              <div><small>Aktiv</small><strong>${escapeHtml(formatNumber(item.activeCount))}/${escapeHtml(formatNumber(item.count))}</strong></div>
              <div><small>Ø Runden</small><strong>${escapeHtml(formatDecimal(item.averageRoundsActive))}</strong></div>
              ${moduleConfig.donations ? `<div><small>Ø Spenden</small><strong>${escapeHtml(formatCurrency(item.averageMoney))}</strong></div>` : ''}
            </div>
            <p>${item.topRoundStudent ? escapeHtml(`${item.topRoundStudent.vorname} ${item.topRoundStudent.nachname} führt mit ${item.topRoundStudent.rounds} Runden.`) : 'Noch keine Rundenspitze vorhanden.'}</p>
          </article>
        `).join('')}
      </div>
    </section>

    ${renderHtmlTable(
        'Klassenvergleich',
        ['Klasse', 'Gesamt Runden', 'Ø Runden', 'Aktiv', 'Teilnahme', ...(moduleConfig.donations ? ['Gesamt Spenden', 'Ø Spenden'] : [])],
        classRows
    )}

    ${renderHtmlTable('Top Schüler nach Runden', ['Name', 'Klasse', 'Geschlecht', 'Runden'], roundRows)}

    ${moduleConfig.donations ? renderHtmlTable(
        `Top Schüler nach ${donationMode === 'expected' ? 'Erwarteten' : 'Erhaltenen'} Spenden`,
        ['Name', 'Klasse', 'Geschlecht', 'Spenden'],
        moneyRows
    ) : ''}

    ${statistics.gradeLeaders?.length ? '' : ''}

    <section class="report-section">
      <h2>Stufen-Sieger</h2>
      <div class="grade-grid">
        ${Object.entries(statistics.topClassesOfGrades || {}).map(([grade, classes]) => {
            const leader = classes?.[0];
            if (!leader) return '';
            return `
              <article class="grade-card card">
                <small>Stufe ${escapeHtml(grade)}</small>
                <strong>${escapeHtml(leader.klasse)}</strong>
                <p>${escapeHtml(`${formatNumber(leader.totalRounds)} Runden · ${formatNumber(leader.activeStudents)}/${formatNumber(leader.totalStudents)} aktive Schüler`)}</p>
              </article>
            `;
        }).join('') || '<div class="empty-note">Keine Stufendaten vorhanden.</div>'}
      </div>
    </section>
  </div>
</body>
</html>`;
};

const createPdfBuffer = (doc) => new Promise((resolve, reject) => {
    const buffers = [];
    doc.on('data', (chunk) => buffers.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);
});

const ensureSpace = (doc, currentY, neededHeight) => {
    if (currentY + neededHeight > doc.page.height - doc.page.margins.bottom) {
        doc.addPage();
        return doc.page.margins.top;
    }

    return currentY;
};

const drawSectionTitle = (doc, title, y) => {
    doc.font('Helvetica-Bold').fontSize(16).fillColor('#1f2937').text(title, 50, y);
    return doc.y + 8;
};

const drawKeyValueRow = (doc, label, value, y, width = 240) => {
    doc.font('Helvetica').fontSize(10).fillColor('#6b7280').text(label, 50, y, { width });
    doc.font('Helvetica-Bold').fontSize(12).fillColor('#111827').text(value, 50, y + 12, { width });
    return y + 40;
};

const drawSimpleTable = (doc, title, headers, rows, y) => {
    y = ensureSpace(doc, y, 80);
    y = drawSectionTitle(doc, title, y);

    const columnWidth = Math.floor((doc.page.width - 100) / headers.length);
    let currentX = 50;

    doc.font('Helvetica-Bold').fontSize(10).fillColor('#111827');
    headers.forEach((header) => {
        doc.text(header, currentX, y, { width: columnWidth - 8 });
        currentX += columnWidth;
    });

    y += 18;
    doc.moveTo(50, y).lineTo(doc.page.width - 50, y).strokeColor('#dbe3ef').stroke();
    y += 8;

    rows.forEach((row) => {
        y = ensureSpace(doc, y, 24);
        currentX = 50;
        doc.font('Helvetica').fontSize(10).fillColor('#374151');
        row.forEach((cell) => {
            doc.text(String(cell), currentX, y, { width: columnWidth - 8 });
            currentX += columnWidth;
        });
        y += 18;
    });

    return y + 10;
};

export const renderStatisticsPdfReport = async ({ statistics, donationMode, moduleConfig }) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const bufferPromise = createPdfBuffer(doc);
    const overviewMetrics = getOverviewMetrics(statistics, moduleConfig, donationMode);
    const highlights = getHighlights(statistics, moduleConfig, donationMode);
    const classRows = (statistics.classStats || []).slice(0, 10).map((item) => ([
        item.klasse,
        formatNumber(item.totalRounds),
        formatDecimal(item.averageRounds),
        `${formatNumber(item.activeStudents)}/${formatNumber(item.totalStudents)}`,
        formatPercent(item.participationRate),
    ]));
    const genderRows = (statistics.genderBreakdown || []).map((item) => ([
        GENDER_LABELS[item.gender] || item.gender,
        `${formatNumber(item.activeCount)}/${formatNumber(item.count)}`,
        formatPercent(item.participationRate),
        formatDecimal(item.averageRoundsActive),
        ...(moduleConfig.donations ? [formatCurrency(item.averageMoney)] : []),
    ]));
    const topRoundRows = (statistics.topStudentsByRounds || []).slice(0, 10).map((student) => ([
        `${student.vorname} ${student.nachname}`,
        student.klasse,
        GENDER_LABELS[student.geschlechtNormalized] || student.geschlechtNormalized || 'Unbekannt',
        formatNumber(student.rounds),
    ]));
    const topMoneyRows = (statistics.topStudentsByMoney || []).slice(0, 10).map((student) => ([
        `${student.vorname} ${student.nachname}`,
        student.klasse,
        GENDER_LABELS[student.geschlechtNormalized] || student.geschlechtNormalized || 'Unbekannt',
        formatCurrency(student.spenden),
    ]));

    doc.info.Title = 'Sponsorenlauf Statistikexport';
    doc.font('Helvetica-Bold').fontSize(22).fillColor('#2563eb').text('Sponsorenlauf Statistikexport');
    doc.moveDown(0.4);
    doc.font('Helvetica').fontSize(11).fillColor('#4b5563').text(`Erstellt am ${new Date().toLocaleString('de-DE')}`);
    doc.text(`Spendenmodus: ${moduleConfig.donations ? (donationMode === 'expected' ? 'Erwartete Spenden' : 'Erhaltene Spenden') : 'Spendenmodul deaktiviert'}`);

    let y = doc.y + 18;
    y = drawSectionTitle(doc, 'Überblick', y);

    overviewMetrics.forEach((metric, index) => {
        const row = Math.floor(index / 2);
        const col = index % 2;
        const x = 50 + (col * 250);
        const cardY = y + (row * 64);
        doc.roundedRect(x, cardY, 220, 52, 10).fillAndStroke('#f8fafc', '#dbe3ef');
        doc.font('Helvetica').fontSize(9).fillColor('#6b7280').text(metric.title, x + 12, cardY + 8, { width: 196 });
        doc.font('Helvetica-Bold').fontSize(15).fillColor('#111827').text(metric.value, x + 12, cardY + 22, { width: 196 });
    });

    y += Math.ceil(overviewMetrics.length / 2) * 64 + 8;
    y = ensureSpace(doc, y, 80);
    y = drawSectionTitle(doc, 'Auffälligkeiten', y);
    highlights.forEach((highlight) => {
        y = ensureSpace(doc, y, 24);
        doc.font('Helvetica').fontSize(11).fillColor('#374151').text(`• ${highlight}`, 56, y, { width: doc.page.width - 106 });
        y = doc.y + 4;
    });

    y += 6;
    y = drawSimpleTable(doc, 'Klassenvergleich', ['Klasse', 'Runden', 'Ø', 'Aktiv', 'Teilnahme'], classRows, y);
    y = drawSimpleTable(doc, 'Geschlechter-Überblick', ['Geschlecht', 'Aktiv', 'Teilnahme', 'Ø Runden', ...(moduleConfig.donations ? ['Ø Spenden'] : [])], genderRows, y);
    y = drawSimpleTable(doc, 'Top Schüler nach Runden', ['Name', 'Klasse', 'Geschlecht', 'Runden'], topRoundRows, y);

    if (moduleConfig.donations) {
        y = drawSimpleTable(doc, `Top Schüler nach ${donationMode === 'expected' ? 'Erwarteten' : 'Erhaltenen'} Spenden`, ['Name', 'Klasse', 'Geschlecht', 'Spenden'], topMoneyRows, y);
    }

    y = ensureSpace(doc, y, 60);
    y = drawSectionTitle(doc, 'Stufen-Sieger', y);
    Object.entries(statistics.topClassesOfGrades || {}).forEach(([grade, classes]) => {
        const leader = classes?.[0];
        if (!leader) return;
        y = ensureSpace(doc, y, 32);
        doc.font('Helvetica-Bold').fontSize(11).fillColor('#111827').text(`Stufe ${grade}: ${leader.klasse}`, 50, y);
        doc.font('Helvetica').fontSize(10).fillColor('#4b5563').text(`${formatNumber(leader.totalRounds)} Runden · ${formatNumber(leader.activeStudents)}/${formatNumber(leader.totalStudents)} aktive Schüler`, 50, y + 14);
        y += 34;
    });

    doc.end();
    return bufferPromise;
};
