import { useState, useEffect, useMemo, useCallback } from 'react';
import styles from '../styles/Statistics.module.css';
import config from '../../data/config.json';
import { formatCurrency, API_ENDPOINTS, downloadFile } from '../utils/constants';
import { useApi } from '../hooks/useApi';

const classOrder = Object.values(config.availableClasses).flat();

export default function Statistics() {
  const [stats, setStats] = useState({
    classStats: [],
    topStudentsByRounds: [],
    topStudentsByMoney: [],
    topClassesOfGrades: {},
    averageRounds: 0,
    totalRounds: 0,
  });

  const [showSections, setShowSections] = useState({
    classStats: false,
    topStudentsByRounds: false,
    topStudentsByMoney: false,
    topClassesOfGrades: false,
    overallStats: false,
  });

  const [sortConfig, setSortConfig] = useState({
    classStats: { key: 'totalRounds', direction: 'descending' },
    topStudentsByRounds: { key: 'timestamps', direction: 'descending' },
    topStudentsByMoney: { key: 'spenden', direction: 'descending' },
    topClassesOfGrades: { key: 'totalRounds', direction: 'descending' },
  });

  const { request, loading, error } = useApi();

  useEffect(() => {
    const fetchStatistics = async () => {
      try {
        const data = await request(API_ENDPOINTS.STATISTICS);
        setStats(data);
      } catch (error) {
        console.error('Fehler beim Abrufen der Statistiken:', error);
      }
    };
    fetchStatistics();
  }, [request]);

  const handleExport = useCallback(async () => {
    try {
      const response = await request(API_ENDPOINTS.EXPORT_EXCEL, {
        responseType: 'blob'
      });
      downloadFile(response, 'class_statistics.zip');
    } catch (error) {
      console.error('Fehler beim Export der Excel-Dateien:', error);
    }
  }, [request]);

  const handleSort = useCallback((section, key) => {
    setSortConfig((prevConfig) => {
      const direction = prevConfig[section].key === key && prevConfig[section].direction === 'descending' ? 'ascending' : 'descending';
      return { ...prevConfig, [section]: { key, direction } };
    });
  }, []);

  const sortedData = useCallback((data, sortConfig) => {
    if (!sortConfig.key) return data;
    return [...data].sort((a, b) => {
      if (sortConfig.key === 'klasse') {
        const indexA = classOrder.indexOf(a.klasse);
        const indexB = classOrder.indexOf(b.klasse);
        return sortConfig.direction === 'ascending' ? indexA - indexB : indexB - indexA;
      } else if (typeof a[sortConfig.key] === 'number' && typeof b[sortConfig.key] === 'number') {
        return sortConfig.direction === 'ascending' ? a[sortConfig.key] - b[sortConfig.key] : b[sortConfig.key] - a[sortConfig.key];
      } else if (typeof a[sortConfig.key] === 'string' && typeof b[sortConfig.key] === 'string') {
        return sortConfig.direction === 'ascending'
          ? a[sortConfig.key].localeCompare(b[sortConfig.key])
          : b[sortConfig.key].localeCompare(a[sortConfig.key]);
      } else {
        return 0;
      }
    });
  }, []);

  const getSortIndicator = useCallback((section, key) => {
    if (sortConfig[section].key === key) {
      return sortConfig[section].direction === 'ascending' ? '▲' : '▼';
    }
    return '';
  }, [sortConfig]);

  const sortedClassStats = useMemo(() => sortedData(stats.classStats, sortConfig.classStats), [stats.classStats, sortConfig.classStats, sortedData]);
  const sortedTopStudentsByRounds = useMemo(() => sortedData(stats.topStudentsByRounds, sortConfig.topStudentsByRounds), [stats.topStudentsByRounds, sortConfig.topStudentsByRounds, sortedData]);
  const sortedTopStudentsByMoney = useMemo(() => sortedData(stats.topStudentsByMoney, sortConfig.topStudentsByMoney), [stats.topStudentsByMoney, sortConfig.topStudentsByMoney, sortedData]);
  const sortedTopClassesOfGrades = useMemo(() => {
    return Object.keys(stats.topClassesOfGrades).reduce((acc, grade) => {
      acc[grade] = sortedData(stats.topClassesOfGrades[grade], sortConfig.topClassesOfGrades);
      return acc;
    }, {});
  }, [stats.topClassesOfGrades, sortConfig.topClassesOfGrades, sortedData]);

  return (
    <div className={styles.container}>
      <h1 className={styles.header}>Statistiken</h1>

      <button onClick={handleExport} disabled={loading}>
        {loading ? 'Exportiere...' : 'Exportiere Excel-Tabellen'}
      </button>

      {error && <p className={styles.error}>{error}</p>}

      <div className={styles.section}>
        <h2
          className={styles.toggleHeader}
          onClick={() => setShowSections((prev) => ({ ...prev, classStats: !prev.classStats }))}
        >
          Klassen-Statistiken {showSections.classStats ? '▲' : '▼'}
        </h2>
        {showSections.classStats && (
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.tableHeader} onClick={() => handleSort('classStats', 'klasse')}>
                  Klasse {getSortIndicator('classStats', 'klasse')}
                </th>
                <th className={styles.tableHeader} onClick={() => handleSort('classStats', 'totalRounds')}>
                  Gesamt Runden {getSortIndicator('classStats', 'totalRounds')}
                </th>
                <th className={styles.tableHeader} onClick={() => handleSort('classStats', 'averageRounds')}>
                  Durchschnitt Runden {getSortIndicator('classStats', 'averageRounds')}
                </th>
                <th className={styles.tableHeader} onClick={() => handleSort('classStats', 'totalMoney')}>
                  Gesamt Spenden {getSortIndicator('classStats', 'totalMoney')}
                </th>
                <th className={styles.tableHeader} onClick={() => handleSort('classStats', 'averageMoney')}>
                  Durchschnitt Spenden {getSortIndicator('classStats', 'averageMoney')}
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedClassStats.map((stat) => (
                <tr key={stat.klasse}>
                  <td className={styles.tableCell}>{stat.klasse}</td>
                  <td className={styles.tableCell}>{stat.totalRounds ?? 0}</td>
                  <td className={styles.tableCell}>{stat.averageRounds?.toFixed(2) ?? 0}</td>
                  <td className={styles.tableCell}>{formatCurrency(stat.totalMoney ?? 0)}</td>
                  <td className={styles.tableCell}>{formatCurrency(stat.averageMoney ?? 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className={styles.section}>
        <h2
          className={styles.toggleHeader}
          onClick={() => setShowSections((prev) => ({ ...prev, topStudentsByRounds: !prev.topStudentsByRounds }))}
        >
          Top Schüler nach Runden {showSections.topStudentsByRounds ? '▲' : '▼'}
        </h2>
        {showSections.topStudentsByRounds && (
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.tableHeader} onClick={() => handleSort('topStudentsByRounds', 'id')}>
                  ID {getSortIndicator('topStudentsByRounds', 'id')}
                </th>
                <th className={styles.tableHeader} onClick={() => handleSort('topStudentsByRounds', 'vorname')}>
                  Vorname {getSortIndicator('topStudentsByRounds', 'vorname')}
                </th>
                <th className={styles.tableHeader} onClick={() => handleSort('topStudentsByRounds', 'nachname')}>
                  Nachname {getSortIndicator('topStudentsByRounds', 'nachname')}
                </th>
                <th className={styles.tableHeader} onClick={() => handleSort('topStudentsByRounds', 'timestamps')}>
                  Runden {getSortIndicator('topStudentsByRounds', 'timestamps')}
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedTopStudentsByRounds.map((student) => (
                <tr key={student.id}>
                  <td className={styles.tableCell}>{student.id}</td>
                  <td className={styles.tableCell}>{student.vorname}</td>
                  <td className={styles.tableCell}>{student.nachname}</td>
                  <td className={styles.tableCell}>{student.timestamps.length}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className={styles.section}>
        <h2
          className={styles.toggleHeader}
          onClick={() => setShowSections((prev) => ({ ...prev, topStudentsByMoney: !prev.topStudentsByMoney }))}
        >
          Top Schüler nach gesammeltem Geld {showSections.topStudentsByMoney ? '▲' : '▼'}
        </h2>
        {showSections.topStudentsByMoney && (
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.tableHeader} onClick={() => handleSort('topStudentsByMoney', 'id')}>
                  ID {getSortIndicator('topStudentsByMoney', 'id')}
                </th>
                <th className={styles.tableHeader} onClick={() => handleSort('topStudentsByMoney', 'vorname')}>
                  Vorname {getSortIndicator('topStudentsByMoney', 'vorname')}
                </th>
                <th className={styles.tableHeader} onClick={() => handleSort('topStudentsByMoney', 'nachname')}>
                  Nachname {getSortIndicator('topStudentsByMoney', 'nachname')}
                </th>
                <th className={styles.tableHeader} onClick={() => handleSort('topStudentsByMoney', 'spenden')}>
                  Gesammeltes Geld {getSortIndicator('topStudentsByMoney', 'spenden')}
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedTopStudentsByMoney.map((student) => (
                <tr key={student.id}>
                  <td className={styles.tableCell}>{student.id}</td>
                  <td className={styles.tableCell}>{student.vorname}</td>
                  <td className={styles.tableCell}>{student.nachname}</td>
                  <td className={styles.tableCell}>{formatCurrency(student.spenden)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className={styles.section}>
        <h2
          className={styles.toggleHeader}
          onClick={() => setShowSections((prev) => ({ ...prev, topClassesOfGrades: !prev.topClassesOfGrades }))}
        >
          Top Klassen jeder Stufe {showSections.topClassesOfGrades ? '▲' : '▼'}
        </h2>
        {showSections.topClassesOfGrades && (
          <>
            {Object.keys(sortedTopClassesOfGrades).map((grade) => (
              <div key={grade}>
                <h2>Stufe {grade}:</h2>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th className={styles.tableHeader} onClick={() => handleSort('topClassesOfGrades', 'klasse')}>
                        Klasse {getSortIndicator('topClassesOfGrades', 'klasse')}
                      </th>
                      <th className={styles.tableHeader} onClick={() => handleSort('topClassesOfGrades', 'totalRounds')}>
                        Gesamt Runden {getSortIndicator('topClassesOfGrades', 'totalRounds')}
                      </th>
                      <th className={styles.tableHeader} onClick={() => handleSort('topClassesOfGrades', 'averageRounds')}>
                        Durchschnitt Runden {getSortIndicator('topClassesOfGrades', 'averageRounds')}
                      </th>
                      <th className={styles.tableHeader} onClick={() => handleSort('topClassesOfGrades', 'totalMoney')}>
                        Gesamt Spenden {getSortIndicator('topClassesOfGrades', 'totalMoney')}
                      </th>
                      <th className={styles.tableHeader} onClick={() => handleSort('topClassesOfGrades', 'averageMoney')}>
                        Durchschnitt Spenden {getSortIndicator('topClassesOfGrades', 'averageMoney')}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedTopClassesOfGrades[grade].map((stat) => (
                      <tr key={stat.klasse}>
                        <td className={styles.tableCell}>{stat.klasse}</td>
                        <td className={styles.tableCell}>{stat.totalRounds ?? 0}</td>
                        <td className={styles.tableCell}>{stat.averageRounds.toFixed(2) ?? 0}</td>
                        <td className={styles.tableCell}>{formatCurrency(stat.totalMoney)}</td>
                        <td className={styles.tableCell}>{formatCurrency(stat.averageMoney)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </>
        )}
      </div>

      <div className={styles.section}>
        <h2
          className={styles.toggleHeader}
          onClick={() => setShowSections((prev) => ({ ...prev, overallStats: !prev.overallStats }))}
        >
          Gesamtstatistiken {showSections.overallStats ? '▲' : '▼'}
        </h2>
        {showSections.overallStats && (
          <div>
            <p className={styles.stats}>
              Durchschnittliche Runden pro Schüler: {stats.averageRounds?.toFixed(2) ?? 0}
            </p>
            <p className={styles.stats}>Gesamtanzahl der Runden: {stats.totalRounds}</p>
          </div>
        )}
      </div>
    </div>
  );
}

// Entferne die doppelte formatCurrency Funktion da sie jetzt in constants.js ist