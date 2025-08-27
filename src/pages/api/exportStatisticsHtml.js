import { dbAll } from '../../utils/database.js';
import { handleMethodNotAllowed, handleError } from '../../utils/apiHelpers.js';
import { getSetting, getLegacyConfig } from '../../utils/settingsService.js';

/**
 * Lädt alle Statistikdaten für den HTML-Export
 */
const loadDataForHtml = async () => {
    // Zuerst alle Schülerdaten mit Runden und Spenden
    const studentsQuery = `
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

    // Klasseninformationen aus der Klassen-Datenbank
    const classesQuery = `
    SELECT grade, class_name 
    FROM classes 
    ORDER BY grade, class_name
  `;

    const students = await dbAll(studentsQuery);
    const classes = await dbAll(classesQuery);

    // Klassenstufenmap erstellen
    const classGradeMap = {};
    classes.forEach(cls => {
        classGradeMap[cls.class_name] = cls.grade;
    });

    return { students, classGradeMap };
};

/**
 * Berechnet umfassende Statistiken für den HTML-Export
 */
const calculateStatsForHtml = (students, classGradeMap) => {
    // Konstanten
    const METERS_PER_ROUND = 400; // 400m pro Runde

    // Basis-Variablen
    const classStats = {};
    let totalRounds = 0;
    let totalActiveStudents = 0;
    let totalStudents = students.length;
    let totalExpectedDonations = 0;
    let totalReceivedDonations = 0;

    // Basis-Statistiken pro Klasse berechnen
    students.forEach(student => {
        if (!classStats[student.klasse]) {
            classStats[student.klasse] = {
                totalRounds: 0,
                studentCount: 0,
                activeStudents: 0,
                expectedDonations: 0,
                receivedDonations: 0,
                students: [],
                grade: classGradeMap[student.klasse] || extractGradeFromClass(student.klasse)  // Primär aus DB, Fallback Extraktion
            };
        }

        const classData = classStats[student.klasse];
        classData.studentCount += 1;
        classData.students.push(student);

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

    // Statistische Kennzahlen
    const rounds = students.map(s => s.rounds).sort((a, b) => a - b);
    const medianRounds = calculateMedian(rounds);
    const minRounds = Math.min(...rounds);
    const maxRounds = Math.max(...rounds);

    // Detaillierte Häufigkeitsverteilung
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

    // Erweiterte Geschlechterstatistiken
    const genderStats = calculateDetailedGenderStats(students, METERS_PER_ROUND);

    // Klassenstufen-Analyse
    const gradeStats = calculateGradeStats(classStats);

    // Klassen-Rankings (verschiedene Kategorien)
    const classRankings = calculateClassRankings(classStats);

    // Top-Performer verschiedener Kategorien
    const topPerformers = calculateTopPerformers(students);

    // Spezielle Auszeichnungen und Helden
    const heroes = findHeroes(students, classStats);

    // Leistungsanalyse
    const performanceAnalysis = calculatePerformanceAnalysis(students, genderStats);

    return {
        // Basis-Statistiken
        totalStudents,
        totalActiveStudents,
        totalRounds,
        averageRounds: totalActiveStudents > 0 ? totalRounds / totalActiveStudents : 0,
        totalExpectedDonations,
        totalReceivedDonations,
        totalDonations: totalExpectedDonations,  // Nur erwartete Spenden für Auswertung
        averageDonationsPerStudent: totalStudents > 0 ? totalExpectedDonations / totalStudents : 0,
        averageDonationsPerActiveStudent: totalActiveStudents > 0 ? totalExpectedDonations / totalActiveStudents : 0,
        averageDonationsPerRound: totalRounds > 0 ? totalExpectedDonations / totalRounds : 0,
        participationRate: (totalActiveStudents / totalStudents) * 100,

        // Statistische Kennzahlen
        medianRounds,
        minRounds,
        maxRounds,
        roundsDistribution,

        // Rankings und Analysen
        classRankings,
        gradeStats,
        topPerformers,
        genderStats,
        heroes,
        performanceAnalysis
    };
};

/**
 * Hilfsfunktionen für erweiterte Statistiken
 */

// Detaillierte Geschlechterstatistiken
const calculateDetailedGenderStats = (students, METERS_PER_ROUND) => {
    const allGenderStats = {};
    const activeGenderStats = {};
    const genderParticipation = {};

    students.forEach(student => {
        let gender = normalizeGender(student.geschlecht);
        const studentDonations = student.expected_donations;

        // Alle Schüler
        if (!allGenderStats[gender]) {
            allGenderStats[gender] = {
                count: 0,
                totalRounds: 0,
                totalDonations: 0,
                activeCount: 0,
                participationRate: 0
            };
        }
        allGenderStats[gender].count++;
        allGenderStats[gender].totalRounds += student.rounds;
        allGenderStats[gender].totalDonations += studentDonations;

        if (student.rounds > 0) {
            allGenderStats[gender].activeCount++;

            // Nur aktive Läufer
            if (!activeGenderStats[gender]) {
                activeGenderStats[gender] = {
                    count: 0,
                    totalRounds: 0,
                    totalDonations: 0,
                    averageRounds: 0,
                    averageDonations: 0,
                    averageDonationsPerRound: 0,
                    topPerformers: []
                };
            }
            activeGenderStats[gender].count++;
            activeGenderStats[gender].totalRounds += student.rounds;
            activeGenderStats[gender].totalDonations += studentDonations;
            activeGenderStats[gender].topPerformers.push(student);
        }
    });

    // Durchschnitte und Teilnahmequoten berechnen
    Object.keys(allGenderStats).forEach(gender => {
        const allStats = allGenderStats[gender];
        allStats.participationRate = allStats.count > 0 ? (allStats.activeCount / allStats.count) * 100 : 0;

        if (activeGenderStats[gender]) {
            const activeStats = activeGenderStats[gender];
            activeStats.averageRounds = activeStats.count > 0 ? activeStats.totalRounds / activeStats.count : 0;
            activeStats.averageDonations = activeStats.count > 0 ? activeStats.totalDonations / activeStats.count : 0;
            activeStats.averageDonationsPerRound = activeStats.totalRounds > 0 ? activeStats.totalDonations / activeStats.totalRounds : 0;

            // Top-Performer nach Runden sortieren
            activeStats.topPerformers.sort((a, b) => b.rounds - a.rounds);
        }
    });

    return { all: allGenderStats, active: activeGenderStats };
};

// Klassenstufen-Statistiken
const calculateGradeStats = (classStats) => {
    const gradeStats = {};

    Object.values(classStats).forEach(classData => {
        const grade = classData.grade;
        if (!gradeStats[grade]) {
            gradeStats[grade] = {
                classes: [],
                totalStudents: 0,
                totalActiveStudents: 0,
                totalRounds: 0,
                totalDonations: 0,
                averageRoundsPerStudent: 0,
                averageDonationsPerStudent: 0,
                averageDonationsPerRound: 0,
                participationRate: 0,
                bestClass: null,
                worstClass: null
            };
        }

        gradeStats[grade].classes.push(classData);
        gradeStats[grade].totalStudents += classData.studentCount;
        gradeStats[grade].totalActiveStudents += classData.activeStudents;
        gradeStats[grade].totalRounds += classData.totalRounds;
        gradeStats[grade].totalDonations += classData.expectedDonations;  // Nur erwartete Spenden
    });

    // Durchschnitte und Extremwerte berechnen
    Object.keys(gradeStats).forEach(grade => {
        const stats = gradeStats[grade];
        stats.averageRoundsPerStudent = stats.totalStudents > 0 ? stats.totalRounds / stats.totalStudents : 0;
        stats.averageDonationsPerStudent = stats.totalStudents > 0 ? stats.totalDonations / stats.totalStudents : 0;
        stats.averageDonationsPerRound = stats.totalRounds > 0 ? stats.totalDonations / stats.totalRounds : 0;
        stats.participationRate = stats.totalStudents > 0 ? (stats.totalActiveStudents / stats.totalStudents) * 100 : 0;

        // Beste und schlechteste Klasse der Stufe
        if (stats.classes.length > 0) {
            stats.bestClass = stats.classes.reduce((best, current) =>
                (current.totalRounds > best.totalRounds) ? current : best
            );
            stats.worstClass = stats.classes.reduce((worst, current) =>
                (current.totalRounds < worst.totalRounds) ? current : worst
            );
        }
    });

    return gradeStats;
};

// Klassen-Rankings für verschiedene Kategorien
const calculateClassRankings = (classStats) => {
    const baseRanking = Object.entries(classStats).map(([klasse, stats]) => ({
        klasse,
        ...stats,
        averageRounds: stats.activeStudents > 0 ? stats.totalRounds / stats.activeStudents : 0,
        averageRoundsPerStudent: stats.studentCount > 0 ? stats.totalRounds / stats.studentCount : 0,
        participationRate: (stats.activeStudents / stats.studentCount) * 100,
        totalDonations: stats.expectedDonations, // Fokus auf erwartete Spenden
        averageDonationsPerStudent: stats.studentCount > 0 ? stats.expectedDonations / stats.studentCount : 0,
        averageDonationsPerRound: stats.totalRounds > 0 ? stats.expectedDonations / stats.totalRounds : 0
    }));

    return {
        byTotalRounds: [...baseRanking].sort((a, b) => b.totalRounds - a.totalRounds),
        byAverageRoundsPerStudent: [...baseRanking].sort((a, b) => b.averageRoundsPerStudent - a.averageRoundsPerStudent),
        byTotalDonations: [...baseRanking].sort((a, b) => b.totalDonations - a.totalDonations),
        byAverageDonationsPerStudent: [...baseRanking].sort((a, b) => b.averageDonationsPerStudent - a.averageDonationsPerStudent),
        byParticipationRate: [...baseRanking].sort((a, b) => b.participationRate - a.participationRate),
        byEfficiency: [...baseRanking].sort((a, b) => b.averageDonationsPerRound - a.averageDonationsPerRound)
    };
};

// Top-Performer verschiedener Kategorien
const calculateTopPerformers = (students) => {
    return {
        topRunners: students.filter(s => s.rounds > 0).sort((a, b) => b.rounds - a.rounds).slice(0, 20),
        topFundraisers: students
            .filter(s => s.expected_donations > 0)
            .sort((a, b) => b.expected_donations - a.expected_donations)
            .slice(0, 20),
        topEfficiency: students
            .filter(s => s.rounds > 0)
            .sort((a, b) => {
                const aEff = a.expected_donations / a.rounds;
                const bEff = b.expected_donations / b.rounds;
                return bEff - aEff;
            })
            .slice(0, 10),
        topByGender: calculateTopRunnersByGender(students)
    };
};

// Geschlecht normalisieren
const normalizeGender = (gender) => {
    if (gender === 'm' || gender === 'männlich' || gender === 'M') {
        return 'm';
    } else if (gender === 'w' || gender === 'weiblich' || gender === 'W') {
        return 'w';
    } else if (gender === 'd' || gender === 'divers' || gender === 'D') {
        return 'd';
    } else {
        return 'nicht_angegeben';
    }
};

// Helden und besondere Leistungen finden
const findHeroes = (students, classStats) => {
    const heroes = {
        youngestHighPerformer: null,
        oldestHighPerformer: null,
        topFundraiser: null,
        mostRounds: null,
        bestEfficiency: null,
        mostImprovedClass: null,
        bestSmallClass: null,
        mostDedicatedRunner: null
    };

    // Top-Spender
    heroes.topFundraiser = students
        .sort((a, b) => b.expected_donations - a.expected_donations)[0];

    // Meiste Runden
    heroes.mostRounds = students
        .sort((a, b) => b.rounds - a.rounds)[0];

    // Beste Effizienz (Spenden pro Runde)
    heroes.bestEfficiency = students
        .filter(s => s.rounds > 0)
        .sort((a, b) => {
            const aEff = a.expected_donations / a.rounds;
            const bEff = b.expected_donations / b.rounds;
            return bEff - aEff;
        })[0];

    // Beste kleine Klasse (unter 20 Schüler)
    const smallClasses = Object.values(classStats).filter(c => c.studentCount < 20);
    if (smallClasses.length > 0) {
        heroes.bestSmallClass = smallClasses
            .sort((a, b) => b.averageRoundsPerStudent - a.averageRoundsPerStudent)[0];
    }

    return heroes;
};

// Leistungsanalyse
const calculatePerformanceAnalysis = (students, genderStats) => {
    const analysis = {
        genderComparison: {},
        ageGroupComparison: {},
        performanceCategories: {
            elite: students.filter(s => s.rounds >= 30).length,
            advanced: students.filter(s => s.rounds >= 20 && s.rounds < 30).length,
            intermediate: students.filter(s => s.rounds >= 10 && s.rounds < 20).length,
            beginner: students.filter(s => s.rounds >= 1 && s.rounds < 10).length,
            nonParticipant: students.filter(s => s.rounds === 0).length
        },
        topPercentiles: {
            top1Percent: Math.ceil(students.length * 0.01),
            top5Percent: Math.ceil(students.length * 0.05),
            top10Percent: Math.ceil(students.length * 0.10)
        }
    };

    // Geschlechtervergleich für Leistungsanalyse
    if (genderStats.active) {
        Object.entries(genderStats.active).forEach(([gender, stats]) => {
            analysis.genderComparison[gender] = {
                averageRounds: stats.averageRounds,
                averageDonations: stats.averageDonations,
                averageDonationsPerRound: stats.averageDonationsPerRound,
                topPerformerRounds: stats.topPerformers.length > 0 ? stats.topPerformers[0].rounds : 0,
                participationRate: genderStats.all[gender] ? genderStats.all[gender].participationRate : 0
            };
        });
    }

    return analysis;
};

// Median berechnen
const calculateMedian = (sortedArray) => {
    const mid = Math.floor(sortedArray.length / 2);
    return sortedArray.length % 2 !== 0
        ? sortedArray[mid]
        : (sortedArray[mid - 1] + sortedArray[mid]) / 2;
};

// Klassenstufe aus Klassenname extrahieren
const extractGradeFromClass = (className) => {
    const match = className.match(/^(\d+)/);
    return match ? parseInt(match[1]) : 0;
};

// Top-Läufer nach Geschlecht
const calculateTopRunnersByGender = (students) => {
    const topRunnersByGender = {};
    ['m', 'w', 'd', 'nicht_angegeben'].forEach(gender => {
        const genderRunners = students
            .filter(s => normalizeGender(s.geschlecht) === gender && s.rounds > 0)
            .sort((a, b) => b.rounds - a.rounds);

        if (genderRunners.length > 0) {
            topRunnersByGender[gender] = genderRunners;
        }
    });
    return topRunnersByGender;
};

/**
 * Berechnet Erkenntnisse für die HTML-Anzeige
 */
const calculateInsights = (stats) => {
    const classRankings = stats.classRankings;
    const topPerformers = stats.topPerformers;

    return {
        bestPerformingClass: classRankings.byTotalRounds[0] || null,
        mostActiveClass: classRankings.byAverageRoundsPerStudent[0] || null,
        topPerformer: topPerformers.topRunners[0] || null,
        topFundraiser: topPerformers.topFundraisers[0] || null,
        averageDonationPerRound: stats.averageDonationsPerRound || 0
    };
};

/**
 * Bereitet Geschlechterstatistiken für die Anzeige vor
 */
const calculateGenderStatsForDisplay = (genderStats) => {
    const result = {};

    if (genderStats && genderStats.all) {
        Object.entries(genderStats.all).forEach(([gender, data]) => {
            result[gender] = {
                count: data.count,
                totalRounds: data.totalRounds,
                totalDonations: data.totalDonations,
                participationRate: data.participationRate
            };
        });
    }

    return result;
};

/**
 * Berechnet die Leistungsverteilung für Diagramme
 */
const calculatePerformanceDistribution = (stats) => {
    const distribution = stats.roundsDistribution || {};

    return {
        noRounds: distribution['0'] || 0,
        lowPerformance: (distribution['1-5'] || 0),
        mediumPerformance: (distribution['6-10'] || 0) + (distribution['11-15'] || 0),
        highPerformance: (distribution['16-20'] || 0) + (distribution['21-25'] || 0) + (distribution['26-30'] || 0),
        veryHighPerformance: distribution['31+'] || 0
    };
};

/**
 * Formatiert Währungsbeträge für die Anzeige
 */
const formatCurrency = (amount) => {
    return new Intl.NumberFormat('de-DE', {
        style: 'currency',
        currency: 'EUR'
    }).format(amount);
};

/**
 * Formatiert Datum für die Anzeige
 */
const formatDate = () => {
    return new Date().toLocaleDateString('de-DE', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

/**
 * Erstellt eine moderne, interaktive HTML-Auswertung der Statistiken
 */
const createStatisticsHTML = (stats) => {
    // Zusätzliche Berechnungen für die HTML-Anzeige
    const insights = calculateInsights(stats);
    const classRankingByRounds = stats.classRankings.byTotalRounds || [];
    const classRankingByAverage = stats.classRankings.byAverageRoundsPerStudent || [];
    const topRunners = stats.topPerformers.topRunners || [];
    const topFundraisers = stats.topPerformers.topFundraisers || [];
    const topRunnersByGender = stats.topPerformers.topByGender || {};
    const genderStats = calculateGenderStatsForDisplay(stats.genderStats);
    const performanceDistribution = calculatePerformanceDistribution(stats);

    return `<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>📊 Sponsorenlauf Statistiken - Umfassende Auswertung</title>
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
            max-width: 1400px;
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
        }
        
        .nav-tab {
            flex: 1;
            padding: 1rem;
            text-align: center;
            background: transparent;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-size: 1rem;
            font-weight: 600;
            color: #6c757d;
            transition: all 0.3s ease;
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
        
        .overview-grid {
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
            font-size: 3rem;
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
        
        /* Scrollable table styles */
        .scrollable-container {
            max-height: 500px;
            overflow-y: auto;
            border: 1px solid #ddd;
            border-radius: 8px;
        }
        
        .scrollable-container .table thead th {
            position: sticky;
            top: 0;
            background: #f8f9fa;
            z-index: 10;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        
        .two-column {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 2rem;
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
            
            .overview-grid,
            .charts-grid,
            .two-column {
                grid-template-columns: 1fr;
            }
            
            .content {
                padding: 1rem;
            }
            
            .nav-tabs {
                flex-direction: column;
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
                <div class="subtitle">Umfassende Auswertung der Laufleistungen und Spenden</div>
                <div class="date">Erstellt am ${formatDate()}</div>
            </div>
        </div>
        
        <div class="content">
            <!-- Navigation -->
            <div class="nav-tabs">
                <button class="nav-tab active" onclick="switchTab('overview')">🔢 Übersicht</button>
                <button class="nav-tab" onclick="switchTab('charts')">📊 Diagramme</button>
                <button class="nav-tab" onclick="switchTab('rankings')">🏆 Rankings</button>
                <button class="nav-tab" onclick="switchTab('details')">📋 Details</button>
                <button class="nav-tab" onclick="switchTab('analysis')">🔍 Tiefe Analyse</button>
            </div>
            
            <!-- Tab: Übersicht -->
            <div id="overview" class="tab-content active">
                <!-- Haupt-Statistiken -->
                <div class="overview-grid">
                    <div class="stat-card">
                        <span class="icon">👥</span>
                        <div class="title">Gesamte Teilnehmer</div>
                        <div class="value">${stats.totalStudents}</div>
                        <div class="subtitle">${stats.totalActiveStudents} aktive Läufer (${stats.participationRate.toFixed(1)}%)</div>
                    </div>
                    
                    <div class="stat-card">
                        <span class="icon">🏃‍♂️</span>
                        <div class="title">Gesamte Runden</div>
                        <div class="value">${stats.totalRounds}</div>
                        <div class="subtitle">∅ ${stats.averageRounds.toFixed(2)} pro Läufer</div>
                    </div>
                    
                    <div class="stat-card">
                        <span class="icon">💰</span>
                        <div class="title">Erwartete Spenden</div>
                        <div class="value">${formatCurrency(stats.totalDonations)}</div>
                        <div class="subtitle">Basis der Auswertung</div>
                    </div>
                    
                    <div class="stat-card">
                        <span class="icon">📈</span>
                        <div class="title">∅ Spende pro Runde</div>
                        <div class="value">${formatCurrency(insights.averageDonationPerRound)}</div>
                        <div class="subtitle">Durchschnittliche Effizienz</div>
                    </div>
                    
                    <div class="stat-card">
                        <span class="icon">🎯</span>
                        <div class="title">Median Runden</div>
                        <div class="value">${stats.medianRounds}</div>
                        <div class="subtitle">Min: ${stats.minRounds} | Max: ${stats.maxRounds}</div>
                    </div>
                </div>
                
                <!-- Wichtige Erkenntnisse -->
                <div class="insights-box">
                    <div class="insights-title">🎯 Wichtige Erkenntnisse</div>
                    <div class="insights-grid">
                        <div class="insight-item">
                            <strong>🏆 Beste Klasse (Gesamtrunden):</strong><br>
                            ${insights.bestPerformingClass ? `${insights.bestPerformingClass.klasse} mit ${insights.bestPerformingClass.totalRounds} Runden` : 'Keine Daten'}
                        </div>
                        <div class="insight-item">
                            <strong>⚡ Aktivste Klasse (Rundenschnitt):</strong><br>
                            ${insights.mostActiveClass ? `${insights.mostActiveClass.klasse} mit ∅ ${insights.mostActiveClass.averageRoundsPerStudent.toFixed(2)} Runden/Schüler` : 'Keine Daten'}
                        </div>
                        <div class="insight-item">
                            <strong>⭐ Top-Läufer:</strong><br>
                            ${insights.topPerformer ? `${insights.topPerformer.vorname} ${insights.topPerformer.nachname} (${insights.topPerformer.rounds} Runden)` : 'Keine Daten'}
                        </div>
                        <div class="insight-item">
                            <strong>💎 Top-Spendensammler:</strong><br>
                            ${insights.topFundraiser ? `${insights.topFundraiser.vorname} ${insights.topFundraiser.nachname} (${formatCurrency(insights.topFundraiser.expected_donations)})` : 'Keine Daten'}
                        </div>
                        <div class="insight-item">
                            <strong> Teilnahmequote:</strong><br>
                            ${stats.participationRate.toFixed(1)}% aller Schüler sind gelaufen
                        </div>
                    </div>
                </div>
                
                <!-- Schnellzugriff auf wichtige Zahlen -->
                <div class="overview-grid" style="margin-top: 3rem;">
                    <div class="stat-card" style="background: linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%);">
                        <span class="icon">💪</span>
                        <div class="title">Elite-Läufer (30+ Runden)</div>
                        <div class="value">${stats.performanceAnalysis.performanceCategories.elite}</div>
                        <div class="subtitle">Absolute Spitzenleistung</div>
                    </div>
                    
                    <div class="stat-card" style="background: linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%);">
                        <span class="icon">🏆</span>
                        <div class="title">Fortgeschrittene (20-29 Runden)</div>
                        <div class="value">${stats.performanceAnalysis.performanceCategories.advanced}</div>
                        <div class="subtitle">Sehr gute Leistung</div>
                    </div>
                    
                    <div class="stat-card" style="background: linear-gradient(135deg, #cce5ff 0%, #b3d9ff 100%);">
                        <span class="icon">🎯</span>
                        <div class="title">Mittelfeld (10-19 Runden)</div>
                        <div class="value">${stats.performanceAnalysis.performanceCategories.intermediate}</div>
                        <div class="subtitle">Solide Leistung</div>
                    </div>
                    
                    <div class="stat-card" style="background: linear-gradient(135deg, #f8d7da 0%, #f5c6cb 100%);">
                        <span class="icon">🏃‍♂️</span>
                        <div class="title">Einsteiger (1-9 Runden)</div>
                        <div class="value">${stats.performanceAnalysis.performanceCategories.beginner}</div>
                        <div class="subtitle">Erste Schritte</div>
                    </div>
                </div>
            </div>
            
            <!-- Tab: Diagramme -->
            <div id="charts" class="tab-content">
                <div class="charts-grid">
                    <!-- Größere Leistungsverteilung -->
                    <div class="chart-container" style="grid-column: 1 / -1;">
                        <div class="chart-title">📊 Leistungsverteilung aller Schüler</div>
                        <canvas id="performanceChart" style="height: 400px; max-height: 400px"></canvas>
                    </div>
                    
                    <!-- Klassen nach Gesamtrunden (Säulendiagramm mit Scrollbar) -->
                    <div class="chart-container" style="grid-column: 1 / -1;">
                        <div class="chart-title">🏆 Alle Klassen nach Gesamtrunden</div>
                        <div style="height: 450px; overflow-x: auto; overflow-y: hidden;">
                            <canvas id="classChart" style="width: ${Math.max(800, classRankingByRounds.length * 60)}px; height: 400px;"></canvas>
                        </div>
                    </div>
                    
                    <!-- Rundenverteilung -->
                    <div class="chart-container">
                        <div class="chart-title">📊 Rundenverteilung</div>
                        <canvas id="roundsDistributionChart"></canvas>
                    </div>
                    
                    <!-- Geschlechtervergleich -->
                    ${Object.keys(genderStats).length > 0 ? `
                    <div class="chart-container">
                        <div class="chart-title">👫 Leistung nach Geschlecht</div>
                        <canvas id="genderChart"></canvas>
                    </div>
                    ` : ''}
                </div>
            </div>
            
            <!-- Tab: Rankings -->
            <div id="rankings" class="tab-content">
                <!-- Top-Läufer und Top-Spendensammler -->
                <div class="two-column">
                    <!-- Top-Läufer -->
                    <div class="table-container">
                        <div class="table-header">🥇 Top 20 Läufer</div>
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
                                ${topRunners.slice(0, 20).map((runner, index) => {
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
                    
                    <!-- Top-Spendensammler -->
                    <div class="table-container">
                        <div class="table-header">💰 Top 20 Spendensammler</div>
                        <table class="table">
                            <thead>
                                <tr>
                                    <th>Rang</th>
                                    <th>Name</th>
                                    <th>Klasse</th>
                                    <th>Spenden</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${topFundraisers.slice(0, 20).map((fundraiser, index) => {
        const totalDonations = fundraiser.expected_donations;
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
                                        </tr>
                                    `;
    }).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
                
                <!-- Bestenliste nach Geschlecht -->
                <div class="overview-grid" style="margin-top: 3rem;">
                    ${topRunnersByGender && Object.keys(topRunnersByGender).length > 0 ? Object.entries(topRunnersByGender).map(([gender, runners]) => {
        if (!runners || runners.length === 0) return '';
        const displayGender = gender === 'm' ? '👦 Männlich' :
            gender === 'w' ? '👧 Weiblich' :
                gender === 'd' ? '🌈 Divers' :
                    '❓ Nicht angegeben';
        return `
                            <div class="table-container">
                                <div class="table-header">🏃‍♂️ Top 10 Läufer - ${displayGender}</div>
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
    }).join('') : '<div class="insight-item">Keine geschlechtsspezifischen Daten verfügbar</div>'}
                </div>
            </div>
            
            <!-- Tab: Details -->
            <div id="details" class="tab-content">
                <!-- Klassen-Ranking -->
                <div class="table-container">
                    <div class="table-header">🏆 Vollständiges Klassen-Ranking (nach durchschnittlichen Runden pro Schüler)</div>
                    <div class="scrollable-container">
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
                                    <th>Spenden</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${classRankingByAverage.map((classData, index) => {
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
                                            <td>${formatCurrency(classData.totalDonations)}</td>
                                        </tr>
                                    `;
    }).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
                
                <!-- Klassenstufen-Analyse -->
                <div class="table-container">
                    <div class="table-header">🎓 Detaillierte Klassenstufen-Analyse</div>
                    <div class="scrollable-container">
                        <table class="table">
                            <thead>
                                <tr>
                                    <th>Klassenstufe</th>
                                    <th>Klassen</th>
                                    <th>Schüler</th>
                                    <th>Aktive</th>
                                    <th>Teilnahme %</th>
                                    <th>∅ Runden</th>
                                    <th>∅ Spenden</th>
                                    <th>Beste Klasse</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${stats.gradeStats && Object.keys(stats.gradeStats).length > 0 ?
            Object.entries(stats.gradeStats)
                .sort(([a], [b]) => parseInt(a) - parseInt(b))
                .map(([grade, gradeData]) => `
                                        <tr>
                                            <td><strong>${grade}. Klasse</strong></td>
                                            <td>${gradeData.classes.length}</td>
                                            <td>${gradeData.totalStudents}</td>
                                            <td>${gradeData.totalActiveStudents}</td>
                                            <td>${gradeData.participationRate.toFixed(1)}%</td>
                                            <td>${gradeData.averageRoundsPerStudent.toFixed(1)}</td>
                                            <td>${formatCurrency(gradeData.averageDonationsPerStudent)}</td>
                                            <td>${gradeData.bestClass ? gradeData.bestClass.klasse : '-'}</td>
                                        </tr>
                                    `).join('')
            : '<tr><td colspan="8">Keine Klassenstufen-Daten verfügbar</td></tr>'}
                            </tbody>
                        </table>
                    </div>
                </div>
                
                ${Object.keys(genderStats).length > 0 ? `
                <!-- Erweiterte Geschlechterverteilung -->
                <div class="table-container">
                    <div class="table-header">👫 Erweiterte Geschlechter-Analyse</div>
                    <table class="table">
                        <thead>
                            <tr>
                                <th>Geschlecht</th>
                                <th>Anzahl</th>
                                <th>Aktive</th>
                                <th>Teilnahme %</th>
                                <th>∅ Runden</th>
                                <th>∅ Spenden</th>
                                <th>∅ €/Runde</th>
                                <th>Bester Läufer</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${Object.entries(genderStats).map(([gender, data]) => {
                const displayGender = gender === 'm' ? '👦 Männlich' :
                    gender === 'w' ? '👧 Weiblich' :
                        gender === 'd' ? '🌈 Divers' :
                            '❓ Nicht angegeben';
                const avgRounds = data.count > 0 ? (data.totalRounds / data.count).toFixed(1) : '0.0';
                const activeCount = data.count - (stats.performanceAnalysis.performanceCategories.nonParticipant || 0);
                const topRunner = topRunnersByGender[gender] && topRunnersByGender[gender][0] ?
                    `${topRunnersByGender[gender][0].vorname} (${topRunnersByGender[gender][0].rounds})` : '-';
                return `
                                    <tr>
                                        <td><strong>${displayGender}</strong></td>
                                        <td>${data.count}</td>
                                        <td>${activeCount >= 0 ? activeCount : data.count}</td>
                                        <td>${data.participationRate.toFixed(1)}%</td>
                                        <td>${avgRounds}</td>
                                        <td>${formatCurrency(data.totalDonations / Math.max(data.count, 1))}</td>
                                        <td>${data.totalRounds > 0 ? formatCurrency(data.totalDonations / data.totalRounds) : formatCurrency(0)}</td>
                                        <td>${topRunner}</td>
                                    </tr>
                                `;
            }).join('')}
                        </tbody>
                    </table>
                </div>
                ` : ''}
                
                <!-- Leistungsanalyse nach Kategorien -->
                <div class="table-container">
                    <div class="table-header">🏆 Leistungsanalyse nach Kategorien</div>
                    <table class="table">
                        <thead>
                            <tr>
                                <th>Kategorie</th>
                                <th>Runden-Bereich</th>
                                <th>Anzahl Schüler</th>
                                <th>Prozent</th>
                                <th>Gesamt Runden</th>
                                <th>Gesamt Spenden</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr class="highlight">
                                <td><strong>🥇 Elite</strong></td>
                                <td>30+ Runden</td>
                                <td>${stats.performanceAnalysis.performanceCategories.elite}</td>
                                <td>${((stats.performanceAnalysis.performanceCategories.elite / stats.totalStudents) * 100).toFixed(1)}%</td>
                                <td>-</td>
                                <td>-</td>
                            </tr>
                            <tr>
                                <td><strong>🥈 Fortgeschritten</strong></td>
                                <td>20-29 Runden</td>
                                <td>${stats.performanceAnalysis.performanceCategories.advanced}</td>
                                <td>${((stats.performanceAnalysis.performanceCategories.advanced / stats.totalStudents) * 100).toFixed(1)}%</td>
                                <td>-</td>
                                <td>-</td>
                            </tr>
                            <tr>
                                <td><strong>🥉 Mittelfeld</strong></td>
                                <td>10-19 Runden</td>
                                <td>${stats.performanceAnalysis.performanceCategories.intermediate}</td>
                                <td>${((stats.performanceAnalysis.performanceCategories.intermediate / stats.totalStudents) * 100).toFixed(1)}%</td>
                                <td>-</td>
                                <td>-</td>
                            </tr>
                            <tr>
                                <td><strong>🏃‍♂️ Einsteiger</strong></td>
                                <td>1-9 Runden</td>
                                <td>${stats.performanceAnalysis.performanceCategories.beginner}</td>
                                <td>${((stats.performanceAnalysis.performanceCategories.beginner / stats.totalStudents) * 100).toFixed(1)}%</td>
                                <td>-</td>
                                <td>-</td>
                            </tr>
                            <tr style="background-color: #f8d7da;">
                                <td><strong>😴 Nicht teilgenommen</strong></td>
                                <td>0 Runden</td>
                                <td>${stats.performanceAnalysis.performanceCategories.nonParticipant}</td>
                                <td>${((stats.performanceAnalysis.performanceCategories.nonParticipant / stats.totalStudents) * 100).toFixed(1)}%</td>
                                <td>-</td>
                                <td>-</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                
                <!-- Weitere Details: Rundenverteilung -->
                <div class="table-container">
                    <div class="table-header">📊 Detaillierte Rundenverteilung</div>
                    <table class="table">
                        <thead>
                            <tr>
                                <th>Rundenkategorie</th>
                                <th>Anzahl Schüler</th>
                                <th>Prozent</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${Object.entries(stats.roundsDistribution).map(([category, count]) => `
                                <tr>
                                    <td><strong>${category} Runden</strong></td>
                                    <td>${count}</td>
                                    <td>${((count / stats.totalStudents) * 100).toFixed(1)}%</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
                
                <!-- Helden des Laufs -->
                ${stats.heroes && Object.keys(stats.heroes).length > 0 ? `
                <div class="table-container">
                    <div class="table-header">🎖️ Held:innen des Laufs</div>
                    <div style="padding: 2rem;">
                        <div class="insights-grid">
                            ${stats.heroes.mostRounds ? `
                            <div class="insight-item">
                                <strong>🏃‍♂️ Ausdauer-Champion:</strong><br>
                                ${stats.heroes.mostRounds.vorname} ${stats.heroes.mostRounds.nachname} (${stats.heroes.mostRounds.rounds} Runden)
                            </div>
                            ` : ''}
                            ${stats.heroes.topFundraiser ? `
                            <div class="insight-item">
                                <strong>💰 Spenden-Champion:</strong><br>
                                ${stats.heroes.topFundraiser.vorname} ${stats.heroes.topFundraiser.nachname} (${formatCurrency(stats.heroes.topFundraiser.expected_donations)})
                            </div>
                            ` : ''}
                            ${stats.heroes.bestEfficiency ? `
                            <div class="insight-item">
                                <strong>⚡ Effizienz-Champion:</strong><br>
                                ${stats.heroes.bestEfficiency.vorname} ${stats.heroes.bestEfficiency.nachname} (${formatCurrency(stats.heroes.bestEfficiency.expected_donations / stats.heroes.bestEfficiency.rounds)} pro Runde)
                            </div>
                            ` : ''}
                            ${stats.heroes.bestSmallClass ? `
                            <div class="insight-item">
                                <strong>🏫 Beste kleine Klasse:</strong><br>
                                ${stats.heroes.bestSmallClass.klasse} (${stats.heroes.bestSmallClass.studentCount} Schüler)
                            </div>
                            ` : ''}
                        </div>
                    </div>
                </div>
                ` : ''}
            </div>
            
            <!-- Tab: Tiefe Analyse -->
            <div id="analysis" class="tab-content">
                <!-- Spenden-Effizienz-Vergleiche -->
                <div class="insights-box">
                    <div class="insights-title">💡 Spenden-Effizienz-Analyse</div>
                    <div class="insights-grid">
                        <div class="insight-item">
                            <strong>💰 Durchschnitt pro Schüler (alle):</strong><br>
                            ${formatCurrency(stats.averageDonationsPerStudent)}
                        </div>
                        <div class="insight-item">
                            <strong>🏃‍♂️ Durchschnitt pro aktivem Läufer:</strong><br>
                            ${formatCurrency(stats.averageDonationsPerActiveStudent)}
                        </div>
                        <div class="insight-item">
                            <strong>⚡ Effizienz pro Runde:</strong><br>
                            ${formatCurrency(stats.averageDonationsPerRound)} pro Runde
                        </div>
                        <div class="insight-item">
                            <strong>🎯 Bester Effizienz-Wert:</strong><br>
                            ${stats.heroes && stats.heroes.bestEfficiency ?
            `${stats.heroes.bestEfficiency.vorname} ${stats.heroes.bestEfficiency.nachname} 
                               (${formatCurrency(stats.heroes.bestEfficiency.expected_donations / stats.heroes.bestEfficiency.rounds)} pro Runde)`
            : 'Keine Daten'}
                        </div>
                        <div class="insight-item">
                            <strong>📈 Teilnahme-Erfolg:</strong><br>
                            ${stats.participationRate.toFixed(1)}% Teilnahme | ${stats.totalActiveStudents} von ${stats.totalStudents} Schülern
                        </div>
                    </div>
                </div>
                
                <!-- Vergleichsanalyse Top vs. Durchschnitt -->
                <div class="two-column">
                    <div class="table-container">
                        <div class="table-header">🔥 Top 10% vs. Durchschnitt</div>
                        <table class="table">
                            <thead>
                                <tr>
                                    <th>Metrik</th>
                                    <th>Top 10%</th>
                                    <th>Durchschnitt</th>
                                    <th>Faktor</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${(() => {
            const topRunners = stats.topPerformers.topRunners.slice(0, Math.max(1, Math.ceil(stats.totalActiveStudents * 0.1)));
            const topAvgRounds = topRunners.length > 0 ?
                topRunners.reduce((sum, r) => sum + r.rounds, 0) / topRunners.length : 0;
            const topAvgDonations = topRunners.length > 0 ?
                topRunners.reduce((sum, r) => sum + r.expected_donations, 0) / topRunners.length : 0;

            const roundsFactor = stats.averageRounds > 0 ? (topAvgRounds / stats.averageRounds).toFixed(1) : '-';
            const donationsFactor = stats.averageDonationsPerActiveStudent > 0 ? (topAvgDonations / stats.averageDonationsPerActiveStudent).toFixed(1) : '-';

            return `
                                        <tr>
                                            <td><strong>Runden</strong></td>
                                            <td>${topAvgRounds.toFixed(1)}</td>
                                            <td>${stats.averageRounds.toFixed(1)}</td>
                                            <td><strong>${roundsFactor}x</strong></td>
                                        </tr>
                                        <tr>
                                            <td><strong>Spenden</strong></td>
                                            <td>${formatCurrency(topAvgDonations)}</td>
                                            <td>${formatCurrency(stats.averageDonationsPerActiveStudent)}</td>
                                            <td><strong>${donationsFactor}x</strong></td>
                                        </tr>
                                    `;
        })()}
                            </tbody>
                        </table>
                    </div>
                    
                    <div class="table-container">
                        <div class="table-header">🎲 Statistische Kennzahlen</div>
                        <table class="table">
                            <thead>
                                <tr>
                                    <th>Kennzahl</th>
                                    <th>Wert</th>
                                    <th>Einheit</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td><strong>Median Runden</strong></td>
                                    <td>${stats.medianRounds}</td>
                                    <td>Runden</td>
                                </tr>
                                <tr>
                                    <td><strong>Minimum Runden</strong></td>
                                    <td>${stats.minRounds}</td>
                                    <td>Runden</td>
                                </tr>
                                <tr>
                                    <td><strong>Maximum Runden</strong></td>
                                    <td>${stats.maxRounds}</td>
                                    <td>Runden</td>
                                </tr>
                                <tr>
                                    <td><strong>Spannweite</strong></td>
                                    <td>${stats.maxRounds - stats.minRounds}</td>
                                    <td>Runden</td>
                                </tr>
                                <tr>
                                    <td><strong>Erwartete Spenden</strong></td>
                                    <td>${formatCurrency(stats.totalDonations)}</td>
                                    <td>€</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="footer">
            <p><strong>📊 Generiert vom Sponsorenlauf-Tool</strong></p>
            <p>Diese interaktive Auswertung wurde automatisch erstellt am ${formatDate()}</p>
        </div>
    </div>

    <script>
        // Tab-Funktionalität
        function switchTab(tabName) {
            // Alle Tabs verstecken
            document.querySelectorAll('.tab-content').forEach(tab => {
                tab.classList.remove('active');
            });
            
            // Alle Tab-Buttons deaktivieren
            document.querySelectorAll('.nav-tab').forEach(btn => {
                btn.classList.remove('active');
            });
            
            // Gewählten Tab anzeigen
            document.getElementById(tabName).classList.add('active');
            event.target.classList.add('active');
            
            // Charts neu zeichnen wenn Diagramme-Tab gewählt wird
            if (tabName === 'charts') {
                setTimeout(initCharts, 100);
            }
        }
        
        // Charts initialisieren
        function initCharts() {
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
                                ${performanceDistribution.noRounds},
                                ${performanceDistribution.lowPerformance},
                                ${performanceDistribution.mediumPerformance},
                                ${performanceDistribution.highPerformance},
                                ${performanceDistribution.veryHighPerformance}
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
            
            // Klassen Chart (Säulendiagramm mit horizontaler Scrollbar)
            const classCtx = document.getElementById('classChart');
            if (classCtx) {
                const allClasses = ${JSON.stringify(classRankingByRounds)};
                
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
            
            // Rundenverteilung Chart
            const roundsCtx = document.getElementById('roundsDistributionChart');
            if (roundsCtx) {
                const roundsData = ${JSON.stringify(stats.roundsDistribution)};
                new Chart(roundsCtx, {
                    type: 'doughnut',
                    data: {
                        labels: Object.keys(roundsData).map(key => key + ' Runden'),
                        datasets: [{
                            data: Object.values(roundsData),
                            backgroundColor: [
                                '#e74c3c', '#e67e22', '#f39c12', '#f1c40f', 
                                '#2ecc71', '#27ae60', '#3498db', '#9b59b6'
                            ],
                            borderWidth: 2,
                            borderColor: '#fff'
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: true,
                        plugins: {
                            legend: {
                                position: 'bottom'
                            }
                        }
                    }
                });
            }
            
            // Geschlechter Chart
            const genderCtx = document.getElementById('genderChart');
            if (genderCtx && Object.keys(${JSON.stringify(genderStats)}).length > 0) {
                const genderData = ${JSON.stringify(genderStats)};
                const genderLabels = Object.keys(genderData).map(gender => {
                    const displayNames = {
                        'm': 'Männlich',
                        'w': 'Weiblich', 
                        'd': 'Divers',
                        'nicht_angegeben': 'Nicht angegeben'
                    };
                    return displayNames[gender] || gender;
                });
                
                new Chart(genderCtx, {
                    type: 'bar',
                    data: {
                        labels: genderLabels,
                        datasets: [{
                            label: 'Durchschnittliche Runden',
                            data: Object.values(genderData).map(data => 
                                data.count > 0 ? (data.totalRounds / data.count).toFixed(1) : 0
                            ),
                            backgroundColor: ['#3498db', '#e91e63', '#9c27b0', '#607d8b'],
                            borderColor: '#2c3e50',
                            borderWidth: 1
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: true,
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
        }
        
        // Charts beim Laden der Seite initialisieren
        document.addEventListener('DOMContentLoaded', function() {
            // Warte bis Chart.js geladen ist
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
        const { students, classGradeMap } = await loadDataForHtml();
        const stats = calculateStatsForHtml(students, classGradeMap);
        const htmlContent = createStatisticsHTML(stats);

        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.setHeader('Content-Disposition', 'attachment; filename=sponsorenlauf_statistiken_interaktiv.html');
        res.send(htmlContent);
    } catch (error) {
        return handleError(res, error, 500, 'Fehler beim Erstellen der HTML-Auswertung');
    }
}
