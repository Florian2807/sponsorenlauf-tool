import { dbAll } from './database.js';
import { getSetting, getModuleConfig } from './settingsService.js';

export const GENDER_ORDER = ['weiblich', 'männlich', 'divers', 'unbekannt'];

export const normalizeGender = (gender) => {
    if (gender === 'm' || gender === 'männlich' || gender === 'M') {
        return 'männlich';
    }

    if (gender === 'w' || gender === 'weiblich' || gender === 'W') {
        return 'weiblich';
    }

    if (gender === 'd' || gender === 'divers' || gender === 'D') {
        return 'divers';
    }

    return 'unbekannt';
};

export const getDonationDisplayMode = async () => {
    return await getSetting('donation_display_mode', 'expected');
};

export const loadStudentsForStatistics = async () => {
    const donationMode = await getDonationDisplayMode();

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
    `;

    const rows = await dbAll(query);

    if (rows.length === 0) {
        return [];
    }

    const studentIds = rows.map((row) => row.id);
    const placeholders = studentIds.map(() => '?').join(',');

    const roundsData = await dbAll(`
      SELECT student_id, timestamp 
      FROM rounds 
      WHERE student_id IN (${placeholders})
      ORDER BY student_id, timestamp DESC
    `, studentIds);

    const roundsMap = roundsData.reduce((acc, { student_id, timestamp }) => {
        if (!acc[student_id]) acc[student_id] = [];
        acc[student_id].push(timestamp);
        return acc;
    }, {});

    return rows.map((row) => ({
        ...row,
        geschlechtNormalized: normalizeGender(row.geschlecht),
        timestamps: roundsMap[row.id] || [],
        rounds: (roundsMap[row.id] || []).length,
        spenden: donationMode === 'expected' ? row.expected_donations : row.received_donations,
    }));
};

export const calculateStatistics = async (students, donationMode) => {
    const classStats = {};
    let totalRounds = 0;
    let totalActiveStudents = 0;
    const totalStudents = students.length;
    let totalDonations = 0;

    students.forEach((student) => {
        if (!classStats[student.klasse]) {
            classStats[student.klasse] = {
                totalRounds: 0,
                studentCount: 0,
                totalMoney: 0,
                activeStudents: 0,
            };
        }

        classStats[student.klasse].studentCount += 1;

        if (student.timestamps.length > 0) {
            classStats[student.klasse].totalRounds += student.timestamps.length;
            classStats[student.klasse].activeStudents += 1;
            totalRounds += student.timestamps.length;
            totalActiveStudents += 1;
        }

        const studentDonations = donationMode === 'expected'
            ? (student.expected_donations || 0)
            : (student.received_donations || 0);
        classStats[student.klasse].totalMoney += studentDonations;
        totalDonations += studentDonations;
    });

    const grades = await getSetting('class_structure', {});
    const topClassesOfGrades = Object.entries(grades).reduce((acc, [grade, classes]) => {
        acc[grade] = classes
            .map((klasse) => ({
                klasse,
                totalRounds: classStats[klasse]?.totalRounds || 0,
                averageRounds: classStats[klasse]?.activeStudents
                    ? classStats[klasse].totalRounds / classStats[klasse].activeStudents
                    : 0,
                totalMoney: classStats[klasse]?.totalMoney || 0,
                averageMoney: classStats[klasse]?.studentCount
                    ? classStats[klasse].totalMoney / classStats[klasse].studentCount
                    : 0,
                activeStudents: classStats[klasse]?.activeStudents || 0,
                totalStudents: classStats[klasse]?.studentCount || 0,
            }))
            .sort((a, b) => b.totalRounds - a.totalRounds);
        return acc;
    }, {});

    const sortedClassStats = Object.entries(classStats)
        .map(([klasse, stats]) => ({
            klasse,
            totalRounds: stats.totalRounds,
            averageRounds: stats.activeStudents ? stats.totalRounds / stats.activeStudents : 0,
            totalMoney: stats.totalMoney,
            averageMoney: stats.studentCount ? stats.totalMoney / stats.studentCount : 0,
            activeStudents: stats.activeStudents,
            totalStudents: stats.studentCount,
            participationRate: stats.studentCount ? (stats.activeStudents / stats.studentCount) * 100 : 0,
        }))
        .sort((a, b) => b.totalRounds - a.totalRounds);

    const topStudentsByRounds = students
        .filter((student) => student.rounds > 0)
        .sort((a, b) => b.rounds - a.rounds)
        .slice(0, 50);

    const topStudentsByMoney = students
        .filter((student) => {
            const donations = donationMode === 'expected'
                ? student.expected_donations
                : student.received_donations;
            return donations > 0;
        })
        .map((student) => ({
            ...student,
            spenden: donationMode === 'expected'
                ? student.expected_donations
                : student.received_donations,
        }))
        .sort((a, b) => b.spenden - a.spenden)
        .slice(0, 50);

    const averageRounds = totalActiveStudents > 0 ? totalRounds / totalActiveStudents : 0;

    const genderBuckets = students.reduce((acc, student) => {
        const gender = student.geschlechtNormalized || normalizeGender(student.geschlecht);

        if (!acc[gender]) {
            acc[gender] = {
                gender,
                count: 0,
                activeCount: 0,
                totalRounds: 0,
                totalMoney: 0,
                students: [],
            };
        }

        acc[gender].count += 1;
        acc[gender].totalRounds += student.rounds;
        acc[gender].totalMoney += student.spenden || 0;
        acc[gender].students.push(student);

        if (student.rounds > 0) {
            acc[gender].activeCount += 1;
        }

        return acc;
    }, {});

    const genderBreakdown = GENDER_ORDER
        .filter((gender) => genderBuckets[gender])
        .map((gender) => {
            const bucket = genderBuckets[gender];

            return {
                gender,
                count: bucket.count,
                activeCount: bucket.activeCount,
                inactiveCount: bucket.count - bucket.activeCount,
                totalRounds: bucket.totalRounds,
                totalMoney: bucket.totalMoney,
                participationRate: bucket.count ? (bucket.activeCount / bucket.count) * 100 : 0,
                averageRoundsActive: bucket.activeCount ? bucket.totalRounds / bucket.activeCount : 0,
                averageRoundsAll: bucket.count ? bucket.totalRounds / bucket.count : 0,
                averageMoney: bucket.count ? bucket.totalMoney / bucket.count : 0,
                highPerformers: bucket.students.filter((student) => student.rounds >= 10).length,
                mediumPerformers: bucket.students.filter((student) => student.rounds >= 5 && student.rounds < 10).length,
                lowPerformers: bucket.students.filter((student) => student.rounds > 0 && student.rounds < 5).length,
                topRoundStudent: bucket.students
                    .filter((student) => student.rounds > 0)
                    .sort((left, right) => right.rounds - left.rounds)[0] || null,
                topMoneyStudent: bucket.students
                    .filter((student) => (student.spenden || 0) > 0)
                    .sort((left, right) => (right.spenden || 0) - (left.spenden || 0))[0] || null,
            };
        });

    const genderStats = genderBreakdown.reduce((acc, item) => {
        acc[item.gender] = {
            count: item.count,
            totalRounds: item.totalRounds,
            activeCount: item.activeCount,
            participationRate: item.participationRate,
            averageRoundsActive: item.averageRoundsActive,
            averageMoney: item.averageMoney,
        };
        return acc;
    }, {});

    const topStudentsByRoundsByGender = genderBreakdown.reduce((acc, item) => {
        acc[item.gender] = students
            .filter((student) => student.geschlechtNormalized === item.gender && student.rounds > 0)
            .sort((left, right) => right.rounds - left.rounds)
            .slice(0, 5);
        return acc;
    }, {});

    const topStudentsByMoneyByGender = genderBreakdown.reduce((acc, item) => {
        acc[item.gender] = students
            .filter((student) => student.geschlechtNormalized === item.gender && (student.spenden || 0) > 0)
            .sort((left, right) => (right.spenden || 0) - (left.spenden || 0))
            .slice(0, 5);
        return acc;
    }, {});

    const activityDistribution = {
        active: totalActiveStudents,
        inactive: totalStudents - totalActiveStudents,
        highPerformers: students.filter((student) => student.rounds >= 10).length,
        mediumPerformers: students.filter((student) => student.rounds >= 5 && student.rounds < 10).length,
        lowPerformers: students.filter((student) => student.rounds > 0 && student.rounds < 5).length,
    };

    const activityDistributionByGender = genderBreakdown.reduce((acc, item) => {
        acc[item.gender] = {
            active: item.activeCount,
            inactive: item.inactiveCount,
            highPerformers: item.highPerformers,
            mediumPerformers: item.mediumPerformers,
            lowPerformers: item.lowPerformers,
        };
        return acc;
    }, {});

    return {
        classStats: sortedClassStats,
        topStudentsByRounds,
        topStudentsByMoney,
        topStudentsByRoundsByGender,
        topStudentsByMoneyByGender,
        topClassesOfGrades,
        averageRounds,
        totalRounds,
        totalStudents,
        activeStudents: totalActiveStudents,
        totalDonations,
        genderStats,
        genderBreakdown,
        activityDistribution,
        activityDistributionByGender,
        rawStudents: students,
    };
};

export const getStatisticsPayload = async () => {
    const [students, donationMode, moduleConfig] = await Promise.all([
        loadStudentsForStatistics(),
        getDonationDisplayMode(),
        getModuleConfig(),
    ]);

    const statistics = await calculateStatistics(students, donationMode);

    return {
        statistics,
        donationMode,
        moduleConfig,
    };
};
