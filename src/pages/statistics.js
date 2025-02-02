import { useState, useEffect } from 'react';
import axios from 'axios';
import styles from '../styles/Statistics.module.css';

export default function Statistics() {
  const [stats, setStats] = useState({
    classStats: [],
    topStudentsByRounds: [],
    topStudentsByMoney: [],
    topClassesOfGrades: {},
    averageRounds: 0,
    totalRounds: 0,
  });

  const [showClassStats, setShowClassStats] = useState(false);
  const [showTopStudentsByRounds, setShowTopStudentsByRounds] = useState(false);
  const [showTopStudentsByMoney, setShowTopStudentsByMoney] = useState(false);
  const [showTopClassesOfGrades, setShowTopClassesOfGrades] = useState(false);
  const [showOverallStats, setShowOverallStats] = useState(false);

  useEffect(() => {
    const fetchStatistics = async () => {
      try {
        const response = await axios.get('/api/statistics');
        setStats(response.data);
      } catch (error) {
        console.error('Fehler beim Abrufen der Statistiken:', error);
      }
    };
    fetchStatistics();
  }, []);

  const handleExport = async () => {
    try {
      const response = await axios.get('/api/exportExcel', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'class_statistics.zip');
      document.body.appendChild(link);
      link.click();
    } catch (error) {
      console.error('Fehler beim Export der Excel-Dateien:', error);
    }
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.header}>Statistiken</h1>

      <button onClick={handleExport}>
        Exportiere Excel-Tabellen
      </button>

      <div className={styles.section}>
        <h2
          className={styles.toggleHeader}
          onClick={() => setShowClassStats(!showClassStats)}
        >
          Klassen-Statistiken {showClassStats ? '▲' : '▼'}
        </h2>
        {showClassStats && (
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.tableHeader}>Klasse</th>
                <th className={styles.tableHeader}>Gesamt Runden</th>
                <th className={styles.tableHeader}>Durchschnitt Runden</th>
              </tr>
            </thead>
            <tbody>
              {stats.classStats.map((stat) => (
                <tr key={stat.klasse}>
                  <td className={styles.tableCell}>{stat.klasse}</td>
                  <td className={styles.tableCell}>{stat.totalRounds ?? 0}</td>
                  <td className={styles.tableCell}>{stat.averageRounds.toFixed(2) ?? 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className={styles.section}>
        <h2
          className={styles.toggleHeader}
          onClick={() => setShowTopStudentsByRounds(!showTopStudentsByRounds)}
        >
          Top Schüler nach Runden {showTopStudentsByRounds ? '▲' : '▼'}
        </h2>
        {showTopStudentsByRounds && (
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.tableHeader}>ID</th>
                <th className={styles.tableHeader}>Vorname</th>
                <th className={styles.tableHeader}>Nachname</th>
                <th className={styles.tableHeader}>Runden</th>
              </tr>
            </thead>
            <tbody>
              {stats.topStudentsByRounds.map((student) => (
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
          onClick={() => setShowTopStudentsByMoney(!showTopStudentsByMoney)}
        >
          Top Schüler nach gesammeltem Geld {showTopStudentsByMoney ? '▲' : '▼'}
        </h2>
        {showTopStudentsByMoney && (
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.tableHeader}>ID</th>
                <th className={styles.tableHeader}>Vorname</th>
                <th className={styles.tableHeader}>Nachname</th>
                <th className={styles.tableHeader}>Gesammeltes Geld</th>
              </tr>
            </thead>
            <tbody>
              {stats.topStudentsByMoney.map((student) => (
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
          onClick={() => setShowTopClassesOfGrades(!showTopClassesOfGrades)}
        >
          Top Klassen jeder Stufe {showClassStats ? '▲' : '▼'}
        </h2>
        {showTopClassesOfGrades && (
          <>
            {Object.keys(stats.topClassesOfGrades).map((grade) => (
              <div>
              <h2>Stufe {grade}:</h2>
              <table key={grade} className={styles.table}>
                <thead>
                  <tr>
                    <th className={styles.tableHeader}>Klasse</th>
                    <th className={styles.tableHeader}>Gesamt Runden</th>
                    <th className={styles.tableHeader}>Durchschnitt Runden</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.topClassesOfGrades[grade].map((stat) => (
                    <tr key={stat.klasse}>
                      <td className={styles.tableCell}>{stat.klasse}</td>
                      <td className={styles.tableCell}>{stat.totalRounds ?? 0}</td>
                      <td className={styles.tableCell}>{stat.averageRounds.toFixed(2) ?? 0}</td>
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
          onClick={() => setShowOverallStats(!showOverallStats)}
        >
          Gesamtstatistiken {showOverallStats ? '▲' : '▼'}
        </h2>
        {showOverallStats && (
          <div>
            <p className={styles.stats}>
              Durchschnittliche Runden pro Schüler: {stats.averageRounds.toFixed(2)}
            </p>
            <p className={styles.stats}>Gesamtanzahl der Runden: {stats.totalRounds}</p>
          </div>
        )}
      </div>
    </div>
  );
}

const formatCurrency = (value) => {
  if (value === null || value === undefined) return '0,00€';
  const numericValue = parseFloat(value).toFixed(2); // Konvertiere zu einer Zahl mit zwei Dezimalstellen
  const [euros, cents] = numericValue.split('.'); // Teile die Zahl in Euros und Cents
  return `${euros},${cents}€`; // Ersetze den Punkt durch ein Komma und füge das Euro-Zeichen hinzu
};