import { dbAll } from '../../utils/database.js';
import { handleMethodNotAllowed, handleError } from '../../utils/apiHelpers.js';
import { getSetting, getLegacyConfig } from '../../utils/settingsService.js';

/**
 * Lädt alle Statistikdaten für den HTML-Export
 */
const loadDataForHtml = async () => {
    const query = `
    SELECT 
      s.*,
      COUNT(r.id) as rounds,
      COALESCE(ed.total_expected, 0) as expected_donations,
      COALESCE(rd.total_received, 0) as received_donations
    FROM students s
    LEFT JOIN rounds r ON s.id = r.student_id
    LEFT JOIN (
      SELECT student_id, SUM(amount) as total_expected 
      FROM expected_donations 
      GROUP BY student_id
    ) ed ON s.id = ed.student_id
    LEFT JOIN (
      SELECT student_id, SUM(amount) as total_received 
      FROM received_donations 
      GROUP BY student_id
    ) rd ON s.id = rd.student_id
    GROUP BY s.id
    ORDER BY s.klasse, s.nachname
  `;

    return await dbAll(query);
};

// Helper-Funktionen für erweiterte Statistiken
const calculateMedian = (arr) => {
    if (arr.length === 0) return 0;
    const sorted = [...arr].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
};

const extractGradeFromClass = (className) => {
    const match = className.match(/(\d+)/);
    return match ? parseInt(match[1]) : 0;
};

const calculateDetailedGenderStats = (students) => {
    const genderStats = {};

    students.forEach(student => {
        const gender = student.geschlecht || 'unknown';
        if (!genderStats[gender]) {
            genderStats[gender] = {
                count: 0,
                totalRounds: 0,
                totalDonations: 0,
                activeStudents: 0
            };
        }

        genderStats[gender].count++;
        genderStats[gender].totalRounds += student.rounds;
        genderStats[gender].totalDonations += student.expected_donations + student.received_donations;

        if (student.rounds > 0) {
            genderStats[gender].activeStudents++;
        }
    });

    return genderStats;
};

const calculateGradeStats = (classStats) => {
    const gradeStats = {};

    Object.entries(classStats).forEach(([klasse, stats]) => {
        const grade = stats.grade;
        if (!gradeStats[grade]) {
            gradeStats[grade] = {
                classes: [],
                totalStudents: 0,
                totalRounds: 0,
                totalDonations: 0,
                totalKilometers: 0
            };
        }

        gradeStats[grade].classes.push(klasse);
        gradeStats[grade].totalStudents += stats.studentCount;
        gradeStats[grade].totalRounds += stats.totalRounds;
        gradeStats[grade].totalDonations += stats.expectedDonations + stats.receivedDonations;
        gradeStats[grade].totalKilometers += stats.totalKilometers;
    });

    return gradeStats;
};

const calculateDistanceComparisons = (totalKm) => {
    return {
        berlinToRome: {
            distance: 1504,
            percentage: (totalKm / 1504 * 100).toFixed(1),
            times: (totalKm / 1504).toFixed(2)
        },
        berlinToMunich: {
            distance: 584,
            percentage: (totalKm / 584 * 100).toFixed(1),
            times: (totalKm / 584).toFixed(2)
        },
        marathons: {
            distance: 42.195,
            count: Math.floor(totalKm / 42.195)
        },
        equator: {
            distance: 40075,
            percentage: (totalKm / 40075 * 100).toFixed(3)
        }
    };
};

const findHeroes = (students) => {
    const runnerHero = students.reduce((max, student) =>
        student.rounds > (max?.rounds || 0) ? student : max, null);

    const donationHero = students.reduce((max, student) => {
        const total = student.expected_donations + student.received_donations;
        const maxTotal = (max?.expected_donations || 0) + (max?.received_donations || 0);
        return total > maxTotal ? student : max;
    }, null);

    const efficiencyHero = students
        .filter(s => s.rounds > 0)
        .reduce((max, student) => {
            const efficiency = (student.expected_donations + student.received_donations) / student.rounds;
            const maxEfficiency = max ? ((max.expected_donations + max.received_donations) / max.rounds) : 0;
            return efficiency > maxEfficiency ? student : max;
        }, null);

    return {
        runner: runnerHero,
        donation: donationHero,
        efficiency: efficiencyHero
    };
};

const calculateTopRunnersByGender = (students) => {
    const genderGroups = {};

    students.forEach(student => {
        const gender = student.geschlecht || 'unknown';
        if (!genderGroups[gender]) {
            genderGroups[gender] = [];
        }
        genderGroups[gender].push(student);
    });

    const result = {};
    Object.entries(genderGroups).forEach(([gender, studentList]) => {
        result[gender] = studentList
            .filter(s => s.rounds > 0)
            .sort((a, b) => b.rounds - a.rounds)
            .slice(0, 10);
    });

    return result;
};

/**
 * Berechnet umfassende Statistiken für den HTML-Export
 */
const calculateStatsForHtml = (students) => {
    const classStats = {};
    let totalRounds = 0;
    let totalActiveStudents = 0;
    let totalStudents = students.length;
    let totalExpectedDonations = 0;
    let totalReceivedDonations = 0;

    // Annahme: Eine Runde = 400m (sollte aus der Konfiguration kommen)
    const METERS_PER_ROUND = 400;
    const totalMeters = students.reduce((sum, s) => sum + (s.rounds * METERS_PER_ROUND), 0);
    const totalKilometers = totalMeters / 1000;

    // Basis-Statistiken pro Klasse
    students.forEach(student => {
        if (!classStats[student.klasse]) {
            classStats[student.klasse] = {
                totalRounds: 0,
                studentCount: 0,
                activeStudents: 0,
                expectedDonations: 0,
                receivedDonations: 0,
                students: [],
                totalKilometers: 0,
                grade: extractGradeFromClass(student.klasse)
            };
        }

        const classData = classStats[student.klasse];
        classData.studentCount += 1;
        classData.students.push(student);
        classData.totalKilometers += (student.rounds * METERS_PER_ROUND) / 1000;

        if (student.rounds > 0) {
            classData.totalRounds += student.rounds;
            classData.activeStudents += 1;
            totalRounds += student.rounds;
            totalActiveStudents += 1;
        }

        classData.expectedDonations += student.expected_donations;
        classData.receivedDonations += student.received_donations;
        totalExpectedDonations += student.expected_donations;
        totalReceivedDonations += student.received_donations;
    });

    // Statistiken erweitern
    const rounds = students.map(s => s.rounds).sort((a, b) => a - b);
    const medianRounds = calculateMedian(rounds);
    const minRounds = Math.min(...rounds);
    const maxRounds = Math.max(...rounds);

    // Häufigkeitsverteilung
    const roundsDistribution = {
        '0': students.filter(s => s.rounds === 0).length,
        '1-5': students.filter(s => s.rounds >= 1 && s.rounds <= 5).length,
        '6-10': students.filter(s => s.rounds >= 6 && s.rounds <= 10).length,
        '11-15': students.filter(s => s.rounds >= 11 && s.rounds <= 15).length,
        '16-20': students.filter(s => s.rounds >= 16 && s.rounds <= 20).length,
        '21-25': students.filter(s => s.rounds >= 21 && s.rounds <= 25).length,
        '26-30': students.filter(s => s.rounds >= 26 && s.rounds <= 30).length,
        '31+': students.filter(s => s.rounds > 30).length
    };

    // Geschlechterstatistiken erweitert
    const genderStats = calculateDetailedGenderStats(students);

    // Klassenstufen-Analyse
    const gradeStats = calculateGradeStats(classStats);

    // Klassen-Rankings
    const classRankingByRounds = Object.entries(classStats)
        .map(([klasse, stats]) => ({
            klasse,
            ...stats,
            averageRounds: stats.activeStudents > 0 ? stats.totalRounds / stats.activeStudents : 0,
            averageRoundsPerStudent: stats.studentCount > 0 ? stats.totalRounds / stats.studentCount : 0,
            participationRate: (stats.activeStudents / stats.studentCount) * 100,
            totalDonations: stats.expectedDonations + stats.receivedDonations,
            averageDonationsPerStudent: stats.studentCount > 0 ? (stats.expectedDonations + stats.receivedDonations) / stats.studentCount : 0,
            averageDonationsPerRound: stats.totalRounds > 0 ? (stats.expectedDonations + stats.receivedDonations) / stats.totalRounds : 0
        }))
        .sort((a, b) => b.totalRounds - a.totalRounds);

    const classRankingByAverage = [...classRankingByRounds]
        .sort((a, b) => b.averageRoundsPerStudent - a.averageRoundsPerStudent);

    const classRankingByDonations = [...classRankingByRounds]
        .sort((a, b) => b.totalDonations - a.totalDonations);

    // Spezielle Auszeichnungen
    const heroes = findHeroes(students);

    // Distanz-Vergleiche
    const distanceComparisons = calculateDistanceComparisons(totalKilometers);

    // Top-Performer
    const topRunners = students
        .filter(s => s.rounds > 0)
        .sort((a, b) => b.rounds - a.rounds)
        .slice(0, 20);

    const topFundraisers = students
        .filter(s => (s.expected_donations + s.received_donations) > 0)
        .sort((a, b) => (b.expected_donations + b.received_donations) - (a.expected_donations + a.received_donations))
        .slice(0, 20);

    // Top-Läufer nach Geschlecht
    const topRunnersByGender = calculateTopRunnersByGender(students);

    const totalDonations = totalExpectedDonations + totalReceivedDonations;
    const participationRate = totalStudents > 0 ? (totalActiveStudents / totalStudents) * 100 : 0;
    const averageRounds = totalActiveStudents > 0 ? totalRounds / totalActiveStudents : 0;
    const averageDonationPerRound = totalRounds > 0 ? totalDonations / totalRounds : 0;
    const averageDonationPerPerson = totalStudents > 0 ? totalDonations / totalStudents : 0;
    const averageDistancePerPerson = totalStudents > 0 ? totalKilometers / totalStudents : 0;

    // Performance-Verteilung für Charts
    const performanceDistribution = {
        noRounds: students.filter(s => s.rounds === 0).length,
        lowPerformance: students.filter(s => s.rounds >= 1 && s.rounds <= 5).length,
        mediumPerformance: students.filter(s => s.rounds >= 6 && s.rounds <= 15).length,
        highPerformance: students.filter(s => s.rounds >= 16 && s.rounds <= 30).length,
        veryHighPerformance: students.filter(s => s.rounds > 30).length
    };

    return {
        // Basis-Statistiken
        totalStudents,
        totalActiveStudents,
        totalRounds,
        totalDistance: totalKilometers,
        totalDonations,
        participationRate,
        averageRounds,
        averageDonationPerRound,
        averageDonationPerPerson,
        averageDistancePerPerson,
        totalClasses: Object.keys(classStats).length,
        averageDonationPerClass: Object.keys(classStats).length > 0 ? totalDonations / Object.keys(classStats).length : 0,

        // Erweiterte Statistiken
        medianRounds,
        minRounds,
        maxRounds,
        roundsDistribution,
        genderStats,
        gradeStats,
        distanceComparisons,
        heroes,

        // Rankings
        classRankingByRounds,
        classRankingByAverage,
        classRankingByDonations,
        topRunners,
        topFundraisers,
        topRunnersByGender,

        // Chart-Daten
        performanceDistribution,
        classStats
    };
};

// Hilfsfunktionen für die HTML-Generierung
const formatCurrency = (amount) => {
    return `${amount.toFixed(2).replace('.', ',')} €`;
};

const formatDate = () => {
    return new Date().toLocaleDateString('de-DE', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
};

// Tab-Generator-Funktionen
const generateGeneralTab = (stats) => {
    return `
        <div id="general" class="tab-content active">
            <div class="stats-grid">
                <div class="stat-card">
                    <span class="icon">👥</span>
                    <div class="title">Gesamte Teilnehmer</div>
                    <div class="value">${stats.totalStudents}</div>
                    <div class="subtitle">${stats.totalActiveStudents} aktive Läufer (${stats.participationRate.toFixed(1)}%)</div>
                </div>
                
                <div class="stat-card">
                    <span class="icon">🏃‍♂️</span>
                    <div class="title">Gesamte Distanz</div>
                    <div class="value">${stats.totalDistance.toFixed(1)} km</div>
                    <div class="subtitle">∅ ${stats.averageDistancePerPerson.toFixed(2)} km pro Person</div>
                </div>
                
                <div class="stat-card">
                    <span class="icon">🔢</span>
                    <div class="title">Gesamte Runden</div>
                    <div class="value">${stats.totalRounds}</div>
                    <div class="subtitle">∅ ${stats.averageRounds.toFixed(2)} pro Läufer</div>
                </div>
                
                <div class="stat-card">
                    <span class="icon">💰</span>
                    <div class="title">Gesamt Spenden</div>
                    <div class="value">${formatCurrency(stats.totalDonations)}</div>
                    <div class="subtitle">∅ ${formatCurrency(stats.averageDonationPerPerson)} pro Person</div>
                </div>
                
                <div class="stat-card">
                    <span class="icon">📊</span>
                    <div class="title">∅ Spende pro Runde</div>
                    <div class="value">${formatCurrency(stats.averageDonationPerRound)}</div>
                    <div class="subtitle">Spenden-Effizienz</div>
                </div>
                
                <div class="stat-card">
                    <span class="icon">🏫</span>
                    <div class="title">Klassen gesamt</div>
                    <div class="value">${stats.totalClasses}</div>
                    <div class="subtitle">∅ ${formatCurrency(stats.averageDonationPerClass)} Spenden pro Klasse</div>
                </div>
            </div>
            
            ${generateDistanceComparisons(stats)}
            ${generateRoundDistribution(stats)}
        </div>
    `;
};

const generateDistanceComparisons = (stats) => {
    const comparisons = stats.distanceComparisons;
    return `
        <div class="section">
            <div class="section-title">🌍 Distanz-Vergleiche</div>
            <div class="comparison-list">
                <div class="comparison-item">
                    🏛️ <strong>Berlin nach Rom:</strong> ${comparisons.berlinToRome.times}x die Strecke (${comparisons.berlinToRome.percentage}%)
                </div>
                <div class="comparison-item">
                    🏔️ <strong>Berlin nach München:</strong> ${comparisons.berlinToMunich.times}x die Strecke (${comparisons.berlinToMunich.percentage}%)
                </div>
                <div class="comparison-item">
                    🏃‍♂️ <strong>Marathon-Äquivalent:</strong> ${comparisons.marathons.count} vollständige Marathons
                </div>
                <div class="comparison-item">
                    🌍 <strong>Erdumfang:</strong> ${comparisons.equator.percentage}% des Äquators
                </div>
            </div>
        </div>
    `;
};

const generateRoundDistribution = (stats) => {
    const dist = stats.roundsDistribution;
    return `
        <div class="section">
            <div class="section-title">📊 Rundenhäufigkeit</div>
            <div class="insights-grid">
                <div class="insight-item">
                    <strong>Keine Runden:</strong> ${dist['0']} Schüler
                </div>
                <div class="insight-item">
                    <strong>1-5 Runden:</strong> ${dist['1-5']} Schüler
                </div>
                <div class="insight-item">
                    <strong>6-10 Runden:</strong> ${dist['6-10']} Schüler
                </div>
                <div class="insight-item">
                    <strong>11-15 Runden:</strong> ${dist['11-15']} Schüler
                </div>
                <div class="insight-item">
                    <strong>16-20 Runden:</strong> ${dist['16-20']} Schüler
                </div>
                <div class="insight-item">
                    <strong>21-25 Runden:</strong> ${dist['21-25']} Schüler
                </div>
                <div class="insight-item">
                    <strong>26-30 Runden:</strong> ${dist['26-30']} Schüler
                </div>
                <div class="insight-item">
                    <strong>Über 30 Runden:</strong> ${dist['31+']} Schüler
                </div>
            </div>
        </div>
    `;
};

const generateGenderTab = (stats) => {
    const genderEntries = Object.entries(stats.genderStats);
    if (genderEntries.length === 0) {
        return `
            <div id="gender" class="tab-content">
                <div class="section">
                    <div class="section-title">👫 Geschlechterauswertung</div>
                    <p>Keine Geschlechterdaten verfügbar.</p>
                </div>
            </div>
        `;
    }

    return `
        <div id="gender" class="tab-content">
            <div class="section">
                <div class="section-title">👫 Geschlechterauswertung</div>
                
                <div class="stats-grid">
                    ${genderEntries.map(([gender, data]) => {
        const displayGender = gender === 'm' ? '👦 Männlich' :
            gender === 'w' ? '👧 Weiblich' :
                gender === 'd' ? '🌈 Divers' :
                    '❓ Nicht angegeben';
        const avgRounds = data.count > 0 ? (data.totalRounds / data.count).toFixed(1) : '0.0';
        const percentage = stats.totalStudents > 0 ? ((data.count / stats.totalStudents) * 100).toFixed(1) : '0.0';

        return `
                            <div class="stat-card">
                                <span class="icon">${gender === 'm' ? '👦' : gender === 'w' ? '👧' : gender === 'd' ? '🌈' : '❓'}</span>
                                <div class="title">${displayGender}</div>
                                <div class="value">${data.count}</div>
                                <div class="subtitle">${percentage}% aller Teilnehmer</div>
                            </div>
                            
                            <div class="stat-card">
                                <span class="icon">🏃‍♂️</span>
                                <div class="title">${displayGender} - Runden</div>
                                <div class="value">${data.totalRounds}</div>
                                <div class="subtitle">∅ ${avgRounds} pro Person</div>
                            </div>
                        `;
    }).join('')}
                </div>
                
                ${generateTopRunnersByGender(stats)}
            </div>
        </div>
    `;
};

const generateTopRunnersByGender = (stats) => {
    if (!stats.topRunnersByGender) return '';

    return `
        <div class="subsection">
            <div class="subsection-title">🏆 Bestenliste nach Geschlecht</div>
            <div class="stats-grid">
                ${Object.entries(stats.topRunnersByGender).map(([gender, runners]) => {
        if (runners.length === 0) return '';
        const displayGender = gender === 'm' ? '👦 Männlich' :
            gender === 'w' ? '👧 Weiblich' :
                gender === 'd' ? '🌈 Divers' :
                    '❓ Nicht angegeben';
        return `
                        <div class="table-container">
                            <div class="table-header">🏃‍♂️ Top 10 - ${displayGender}</div>
                            <table class="table">
                                <thead>
                                    <tr>
                                        <th>Rang</th>
                                        <th>Name</th>
                                        <th>Klasse</th>
                                        <th>Runden</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${runners.slice(0, 10).map((runner, index) => {
            const isTopThree = index < 3;
            const trophyIcon = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '';
            return `
                                            <tr ${isTopThree ? 'class="highlight"' : ''}>
                                                <td class="rank">
                                                    ${trophyIcon ? `<span class="trophy-icon">${trophyIcon}</span>` : (index + 1) + '.'}
                                                </td>
                                                <td><strong>${runner.vorname} ${runner.nachname}</strong></td>
                                                <td>${runner.klasse}</td>
                                                <td><strong>${runner.rounds}</strong></td>
                                            </tr>
                                        `;
        }).join('')}
                                </tbody>
                            </table>
                        </div>
                    `;
    }).join('')}
            </div>
        </div>
    `;
};

const generateClassesTab = (stats) => {
    return `
        <div id="classes" class="tab-content">
            <div class="section">
                <div class="section-title">🏫 Klassen & Jahrgänge</div>
                
                ${generateGradeStats(stats)}
                ${generateClassRankings(stats)}
            </div>
        </div>
    `;
};

const generateGradeStats = (stats) => {
    const gradeEntries = Object.entries(stats.gradeStats);
    if (gradeEntries.length === 0) return '';

    return `
        <div class="subsection">
            <div class="subsection-title">📚 Jahrgangsstufen-Übersicht</div>
            <div class="table-container">
                <table class="table">
                    <thead>
                        <tr>
                            <th>Jahrgang</th>
                            <th>Klassen</th>
                            <th>Schüler</th>
                            <th>Runden</th>
                            <th>Distanz</th>
                            <th>Spenden</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${gradeEntries.sort((a, b) => a[0] - b[0]).map(([grade, data]) => `
                            <tr>
                                <td><strong>${grade}. Klasse</strong></td>
                                <td>${data.classes.length}</td>
                                <td>${data.totalStudents}</td>
                                <td>${data.totalRounds}</td>
                                <td>${data.totalKilometers.toFixed(1)} km</td>
                                <td>${formatCurrency(data.totalDonations)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
};

const generateClassRankings = (stats) => {
    return `
        <div class="subsection">
            <div class="subsection-title">🏆 Klassen-Rankings</div>
            <div class="table-container">
                <div class="table-header">Ranking nach durchschnittlichen Runden pro Schüler</div>
                <table class="table">
                    <thead>
                        <tr>
                            <th>Rang</th>
                            <th>Klasse</th>
                            <th>Schüler</th>
                            <th>Aktive</th>
                            <th>Runden</th>
                            <th>∅ Runden/Schüler</th>
                            <th>Teilnahme</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${stats.classRankingByAverage.slice(0, 15).map((classData, index) => {
        const isTopThree = index < 3;
        const trophyIcon = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '';
        return `
                                <tr ${isTopThree ? 'class="highlight"' : ''}>
                                    <td class="rank">
                                        ${trophyIcon ? `<span class="trophy-icon">${trophyIcon}</span>` : (index + 1) + '.'}
                                    </td>
                                    <td><strong>${classData.klasse}</strong></td>
                                    <td>${classData.studentCount}</td>
                                    <td>${classData.activeStudents}</td>
                                    <td><strong>${classData.totalRounds}</strong></td>
                                    <td><strong>${classData.averageRoundsPerStudent.toFixed(1)}</strong></td>
                                    <td>${classData.participationRate.toFixed(1)}%</td>
                                </tr>
                            `;
    }).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
};

const generateHeroesTab = (stats) => {
    return `
        <div id="heroes" class="tab-content">
            <div class="section">
                <div class="section-title">🎯 Held:innen des Laufs</div>
                
                ${generateHeroCards(stats)}
            </div>
        </div>
    `;
};

const generateHeroCards = (stats) => {
    const heroes = stats.heroes;
    let heroCards = '';

    if (heroes.runner) {
        heroCards += `
            <div class="hero-card">
                <div class="hero-title">🏃‍♂️ Lauf-Held:in</div>
                <div class="hero-name">${heroes.runner.vorname} ${heroes.runner.nachname}</div>
                <div class="hero-details">
                    ${heroes.runner.klasse} • ${heroes.runner.rounds} Runden • ${(heroes.runner.rounds * 0.4).toFixed(1)} km
                </div>
            </div>
        `;
    }

    if (heroes.donation) {
        const totalDonations = heroes.donation.expected_donations + heroes.donation.received_donations;
        heroCards += `
            <div class="hero-card">
                <div class="hero-title">💰 Spenden-König:in</div>
                <div class="hero-name">${heroes.donation.vorname} ${heroes.donation.nachname}</div>
                <div class="hero-details">
                    ${heroes.donation.klasse} • ${formatCurrency(totalDonations)} gesammelt
                </div>
            </div>
        `;
    }

    if (heroes.efficiency) {
        const efficiency = (heroes.efficiency.expected_donations + heroes.efficiency.received_donations) / heroes.efficiency.rounds;
        heroCards += `
            <div class="hero-card">
                <div class="hero-title">⚡ Effizienz-Champion</div>
                <div class="hero-name">${heroes.efficiency.vorname} ${heroes.efficiency.nachname}</div>
                <div class="hero-details">
                    ${heroes.efficiency.klasse} • ${formatCurrency(efficiency)} pro Runde
                </div>
            </div>
        `;
    }

    return heroCards;
};

const generateRankingsTab = (stats) => {
    return `
        <div id="rankings" class="tab-content">
            <div class="section">
                <div class="section-title">🏆 Rankings</div>
                
                <div class="subsection">
                    <div class="subsection-title">🥇 Top 20 Läufer</div>
                    <div class="table-container">
                        <table class="table">
                            <thead>
                                <tr>
                                    <th>Rang</th>
                                    <th>Name</th>
                                    <th>Klasse</th>
                                    <th>Runden</th>
                                    <th>Distanz</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${stats.topRunners.map((runner, index) => {
        const isTopThree = index < 3;
        const trophyIcon = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '';
        const distance = (runner.rounds * 0.4).toFixed(1);

        return `
                                        <tr ${isTopThree ? 'class="highlight"' : ''}>
                                            <td class="rank">
                                                ${trophyIcon ? `<span class="trophy-icon">${trophyIcon}</span>` : (index + 1) + '.'}
                                            </td>
                                            <td><strong>${runner.vorname} ${runner.nachname}</strong></td>
                                            <td>${runner.klasse}</td>
                                            <td><strong>${runner.rounds}</strong></td>
                                            <td>${distance} km</td>
                                        </tr>
                                    `;
    }).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
                
                <div class="subsection">
                    <div class="subsection-title">💰 Top 20 Spendensammler</div>
                    <div class="table-container">
                        <table class="table">
                            <thead>
                                <tr>
                                    <th>Rang</th>
                                    <th>Name</th>
                                    <th>Klasse</th>
                                    <th>Spenden</th>
                                    <th>Runden</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${stats.topFundraisers.map((fundraiser, index) => {
        const totalDonations = fundraiser.expected_donations + fundraiser.received_donations;
        const isTopThree = index < 3;
        const trophyIcon = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '';

        return `
                                        <tr ${isTopThree ? 'class="highlight"' : ''}>
                                            <td class="rank">
                                                ${trophyIcon ? `<span class="trophy-icon">${trophyIcon}</span>` : (index + 1) + '.'}
                                            </td>
                                            <td><strong>${fundraiser.vorname} ${fundraiser.nachname}</strong></td>
                                            <td>${fundraiser.klasse}</td>
                                            <td><strong>${formatCurrency(totalDonations)}</strong></td>
                                            <td>${fundraiser.rounds || 0}</td>
                                        </tr>
                                    `;
    }).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    `;
};

const generateChartsTab = (stats) => {
    return `
        <div id="charts" class="tab-content">
            <div class="section">
                <div class="section-title">📈 Diagramme</div>
                
                <div class="charts-grid">
                    <div class="chart-container" style="grid-column: 1 / -1;">
                        <div class="chart-title">📊 Leistungsverteilung aller Schüler</div>
                        <canvas id="performanceChart" style="height: 400px; max-height: 400px"></canvas>
                    </div>
                    
                    <div class="chart-container" style="grid-column: 1 / -1;">
                        <div class="chart-title">🏆 Alle Klassen nach Gesamtrunden</div>
                        <div style="height: 450px; overflow-x: auto; overflow-y: hidden;">
                            <canvas id="classChart" style="width: ${Math.max(800, stats.classRankingByRounds.length * 60)}px; height: 400px;"></canvas>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
};

const generateChartsScript = (stats) => {
    return `
        // Leistungsverteilung Chart
        const performanceCtx = document.getElementById('performanceChart');
        if (performanceCtx) {
            new Chart(performanceCtx, {
                type: 'bar',
                data: {
                    labels: ['Keine Runden', '1-5 Runden', '6-15 Runden', '16-30 Runden', '>30 Runden'],
                    datasets: [{
                        label: 'Anzahl Schüler',
                        data: [
                            ${stats.performanceDistribution.noRounds},
                            ${stats.performanceDistribution.lowPerformance},
                            ${stats.performanceDistribution.mediumPerformance},
                            ${stats.performanceDistribution.highPerformance},
                            ${stats.performanceDistribution.veryHighPerformance}
                        ],
                        backgroundColor: [
                            '#e74c3c',
                            '#f39c12',
                            '#f1c40f',
                            '#2ecc71',
                            '#27ae60'
                        ],
                        borderColor: '#2c3e50',
                        borderWidth: 2
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                stepSize: 1
                            }
                        }
                    }
                }
            });
        }
        
        // Klassen Chart
        const classCtx = document.getElementById('classChart');
        if (classCtx) {
            const allClasses = ${JSON.stringify(stats.classRankingByRounds)};
            
            new Chart(classCtx, {
                type: 'bar',
                data: {
                    labels: allClasses.map(c => c.klasse),
                    datasets: [{
                        label: 'Gesamte Runden',
                        data: allClasses.map(c => c.totalRounds),
                        backgroundColor: allClasses.map((_, index) => 
                            index < 3 ? '#27ae60' : '#4a90e2'
                        ),
                        borderColor: '#357abd',
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    }
                }
            });
        }
    `;
};

/**
 * Erstellt eine moderne, umfassende HTML-Auswertung der Statistiken
 */
const createStatisticsHTML = (stats) => {
    return `<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>📊 Sponsorenlauf Statistiken - Detaillierte Auswertung</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, 'Roboto', sans-serif;
            line-height: 1.6;
            color: #2c3e50;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
        }
        
        .container {
            max-width: 1600px;
            margin: 0 auto;
            background: white;
            min-height: 100vh;
            box-shadow: 0 0 50px rgba(0,0,0,0.2);
        }
        
        .header {
            background: linear-gradient(135deg, #4a90e2 0%, #357abd 100%);
            color: white;
            padding: 3rem 2rem;
            text-align: center;
            position: relative;
            overflow: hidden;
        }
        
        .header::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="20" cy="20" r="2" fill="rgba(255,255,255,0.1)"/><circle cx="80" cy="20" r="2" fill="rgba(255,255,255,0.1)"/><circle cx="50" cy="50" r="3" fill="rgba(255,255,255,0.1)"/><circle cx="20" cy="80" r="2" fill="rgba(255,255,255,0.1)"/><circle cx="80" cy="80" r="2" fill="rgba(255,255,255,0.1)"/></svg>');
            opacity: 0.3;
        }
        
        .header-content {
            position: relative;
            z-index: 1;
        }
        
        .header h1 {
            font-size: 3.5rem;
            margin-bottom: 0.5rem;
            font-weight: 700;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }
        
        .header .subtitle {
            font-size: 1.4rem;
            opacity: 0.9;
            margin-bottom: 1rem;
        }
        
        .header .date {
            font-size: 1.1rem;
            opacity: 0.8;
            background: rgba(255,255,255,0.1);
            padding: 0.5rem 1rem;
            border-radius: 25px;
            display: inline-block;
            backdrop-filter: blur(10px);
        }
        
        .content {
            padding: 2rem;
        }
        
        .nav-tabs {
            display: flex;
            background: #f8f9fa;
            border-radius: 10px;
            margin-bottom: 2rem;
            padding: 0.5rem;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            flex-wrap: wrap;
        }
        
        .nav-tab {
            flex: 1;
            min-width: 140px;
            padding: 1rem;
            text-align: center;
            background: transparent;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-size: 0.9rem;
            font-weight: 600;
            color: #6c757d;
            transition: all 0.3s ease;
            margin: 0.25rem;
        }
        
        .nav-tab.active {
            background: linear-gradient(135deg, #4a90e2 0%, #357abd 100%);
            color: white;
            box-shadow: 0 4px 15px rgba(74, 144, 226, 0.3);
        }
        
        .nav-tab:hover:not(.active) {
            background: #e9ecef;
            color: #495057;
        }
        
        .tab-content {
            display: none;
        }
        
        .tab-content.active {
            display: block;
            animation: fadeIn 0.5s ease;
        }
        
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            gap: 2rem;
            margin-bottom: 3rem;
        }
        
        .stat-card {
            background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
            border: 2px solid #dee2e6;
            border-radius: 20px;
            padding: 2rem;
            text-align: center;
            transition: all 0.3s ease;
            position: relative;
            overflow: hidden;
        }
        
        .stat-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(74, 144, 226, 0.1), transparent);
            transition: left 0.5s ease;
        }
        
        .stat-card:hover::before {
            left: 100%;
        }
        
        .stat-card:hover {
            transform: translateY(-10px);
            box-shadow: 0 20px 40px rgba(0,0,0,0.15);
            border-color: #4a90e2;
        }
        
        .stat-card .icon {
            font-size: 3.5rem;
            margin-bottom: 1rem;
            display: block;
        }
        
        .stat-card .title {
            font-size: 1.2rem;
            color: #6c757d;
            margin-bottom: 0.5rem;
            font-weight: 500;
        }
        
        .stat-card .value {
            font-size: 2.5rem;
            font-weight: 700;
            color: #4a90e2;
            margin-bottom: 0.5rem;
        }
        
        .stat-card .subtitle {
            font-size: 1rem;
            color: #6c757d;
        }
        
        .insights-box {
            background: linear-gradient(135deg, #e8f4fd 0%, #dbeafe 100%);
            border: 2px solid #3b82f6;
            border-radius: 20px;
            padding: 2rem;
            margin-bottom: 3rem;
        }
        
        .insights-title {
            font-size: 1.8rem;
            color: #1e40af;
            margin-bottom: 1rem;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }
        
        .insights-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 1rem;
        }
        
        .insight-item {
            background: rgba(255,255,255,0.8);
            padding: 1rem;
            border-radius: 10px;
            border-left: 4px solid #3b82f6;
        }
        
        .section {
            margin-bottom: 4rem;
        }
        
        .section-title {
            font-size: 2rem;
            color: #2c3e50;
            margin-bottom: 2rem;
            padding-bottom: 0.5rem;
            border-bottom: 3px solid #4a90e2;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }
        
        .subsection {
            margin-bottom: 2rem;
        }
        
        .subsection-title {
            font-size: 1.5rem;
            color: #4a90e2;
            margin-bottom: 1rem;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }
        
        .comparison-list {
            background: #f8f9fa;
            border-radius: 15px;
            padding: 1.5rem;
            margin: 1rem 0;
        }
        
        .comparison-item {
            padding: 0.5rem 0;
            font-size: 1.1rem;
            color: #2c3e50;
            border-bottom: 1px solid #e9ecef;
        }
        
        .comparison-item:last-child {
            border-bottom: none;
        }
        
        .hero-card {
            background: linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%);
            border: 2px solid #f39c12;
            border-radius: 20px;
            padding: 2rem;
            text-align: center;
            margin: 1rem 0;
            box-shadow: 0 8px 25px rgba(243, 156, 18, 0.2);
        }
        
        .hero-title {
            font-size: 1.5rem;
            color: #d35400;
            font-weight: 700;
            margin-bottom: 1rem;
        }
        
        .hero-name {
            font-size: 1.3rem;
            color: #2c3e50;
            font-weight: 600;
            margin-bottom: 0.5rem;
        }
        
        .hero-details {
            font-size: 1rem;
            color: #6c757d;
        }
        
        .table-container {
            background: white;
            border-radius: 20px;
            overflow: hidden;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
            margin-bottom: 2rem;
        }
        
        .table-header {
            background: linear-gradient(135deg, #4a90e2 0%, #357abd 100%);
            color: white;
            padding: 1.5rem;
            font-size: 1.4rem;
            font-weight: 600;
        }
        
        .table {
            width: 100%;
            border-collapse: collapse;
        }
        
        .table thead {
            background: #f8f9fa;
        }
        
        .table th,
        .table td {
            padding: 1rem;
            text-align: left;
            border-bottom: 1px solid #e9ecef;
        }
        
        .table th {
            font-weight: 600;
            color: #495057;
            font-size: 0.9rem;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .table tbody tr:nth-child(even) {
            background-color: #f8f9fa;
        }
        
        .table tbody tr:hover {
            background-color: #e3f2fd;
            transform: scale(1.01);
            transition: all 0.2s ease;
        }
        
        .rank {
            font-weight: 700;
            color: #4a90e2;
            font-size: 1.1rem;
        }
        
        .trophy-icon {
            font-size: 1.2rem;
            margin-right: 0.5rem;
        }
        
        .highlight {
            background: linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%) !important;
            font-weight: 600;
        }
        
        .charts-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
            gap: 2rem;
            margin-bottom: 3rem;
        }
        
        .chart-container {
            background: white;
            border-radius: 20px;
            padding: 2rem;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
            border: 1px solid #e9ecef;
        }
        
        .chart-title {
            font-size: 1.4rem;
            color: #2c3e50;
            margin-bottom: 1rem;
            text-align: center;
            font-weight: 600;
        }
        
        .footer {
            background: #2c3e50;
            color: white;
            padding: 2rem;
            text-align: center;
            margin-top: 3rem;
        }
        
        @media (max-width: 768px) {
            .header h1 {
                font-size: 2.5rem;
            }
            
            .stats-grid,
            .charts-grid {
                grid-template-columns: 1fr;
            }
            
            .content {
                padding: 1rem;
            }
            
            .nav-tabs {
                flex-direction: column;
            }
            
            .nav-tab {
                margin: 0.125rem;
            }
        }
        
        @media print {
            body {
                background: white;
            }
            
            .container {
                box-shadow: none;
            }
            
            .nav-tabs {
                display: none;
            }
            
            .tab-content {
                display: block !important;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="header-content">
                <h1>📊 Sponsorenlauf Statistiken</h1>
                <div class="subtitle">Detaillierte Auswertung der Laufleistungen und Spenden</div>
                <div class="date">Erstellt am ${formatDate()}</div>
            </div>
        </div>
        
        <div class="content">
            <!-- Navigation -->
            <div class="nav-tabs">
                <button class="nav-tab active" onclick="switchTab('general')">📊 Allgemeine Statistiken</button>
                <button class="nav-tab" onclick="switchTab('gender')">👧👦 Geschlechterauswertung</button>
                <button class="nav-tab" onclick="switchTab('classes')">🏫 Klassen & Jahrgänge</button>
                <button class="nav-tab" onclick="switchTab('heroes')">🎯 Held:innen des Laufs</button>
                <button class="nav-tab" onclick="switchTab('rankings')">🏆 Rankings</button>
                <button class="nav-tab" onclick="switchTab('charts')">📈 Diagramme</button>
            </div>
            
            ${generateGeneralTab(stats)}
            ${generateGenderTab(stats)}
            ${generateClassesTab(stats)}
            ${generateHeroesTab(stats)}
            ${generateRankingsTab(stats)}
            ${generateChartsTab(stats)}
        </div>
        
        <div class="footer">
            <p><strong>📊 Generiert vom Sponsorenlauf-Tool</strong></p>
            <p>Diese detaillierte Auswertung wurde automatisch erstellt am ${formatDate()}</p>
        </div>
    </div>

    <script>
        // Tab-Funktionalität
        function switchTab(tabName) {
            document.querySelectorAll('.tab-content').forEach(tab => {
                tab.classList.remove('active');
            });
            
            document.querySelectorAll('.nav-tab').forEach(btn => {
                btn.classList.remove('active');
            });
            
            document.getElementById(tabName).classList.add('active');
            event.target.classList.add('active');
            
            if (tabName === 'charts') {
                setTimeout(initCharts, 100);
            }
        }
        
        // Charts initialisieren
        function initCharts() {
            ${generateChartsScript(stats)}
        }
        
        document.addEventListener('DOMContentLoaded', function() {
            setTimeout(initCharts, 500);
        });
    </script>
</body>
</html>`;
};

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return handleMethodNotAllowed(res, ['GET']);
    }

    try {
        const students = await loadDataForHtml();
        const stats = calculateStatsForHtml(students);
        const htmlContent = createStatisticsHTML(stats);

        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.setHeader('Content-Disposition', 'attachment; filename=sponsorenlauf_statistiken_detailliert.html');
        res.send(htmlContent);
    } catch (error) {
        return handleError(res, error, 500, 'Fehler beim Erstellen der HTML-Auswertung');
    }
}
