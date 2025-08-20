import React, { useState } from 'react';
import BaseDialog from '../../BaseDialog';

const SetupGuideDialog = ({ 
    dialogRef, 
    onOpenClassStructure, 
    onOpenModuleSettings,
    onComplete,
    onClassStructureComplete,
    onModuleSettingsComplete
}) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [completedSteps, setCompletedSteps] = useState([]);

    // Handler functions - defined before steps array
    const handleConfigureClassStructure = () => {
        if (onOpenClassStructure) {
            onOpenClassStructure();
            markStepCompleted('class-structure');
            // Automatisch zum nächsten Schritt nach einer kurzen Verzögerung
            setTimeout(() => {
                setCurrentStep(2); // Gehe zum Module-Schritt (Index 2)
            }, 500);
        }
    };

    const handleConfigureModules = () => {
        if (onOpenModuleSettings) {
            onOpenModuleSettings();
            markStepCompleted('modules');
            // Automatisch zum nächsten Schritt nach einer kurzen Verzögerung
            setTimeout(() => {
                setCurrentStep(3); // Gehe zum Complete-Schritt (Index 3)
            }, 500);
        }
    };

    const markStepCompleted = (stepId) => {
        setCompletedSteps(prev => {
            if (!prev.includes(stepId)) {
                return [...prev, stepId];
            }
            return prev;
        });
    };

    const steps = [
        {
            id: 'welcome',
            title: 'Willkommen beim Sponsorenlauf-Tool',
            icon: '🎉',
            gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            content: (
                <div className="welcome-step">
                    <div className="hero-section">
                        <div className="hero-icon">🏃‍♂️</div>
                        <h3>Herzlich willkommen!</h3>
                        <p className="hero-text">
                            Dieses Setup-Guide führt Sie durch die wichtigsten Einstellungen 
                            für Ihr Sponsorenlauf-Tool. In wenigen Minuten ist alles bereit!
                        </p>
                    </div>
                    
                    <div className="features-grid">
                        <div className="feature-card">
                            <div className="feature-icon">🏫</div>
                            <h4>Klassenstruktur</h4>
                            <p>Definieren Sie Jahrgänge und Klassen für optimale Organisation</p>
                        </div>
                        <div className="feature-card">
                            <div className="feature-icon">🔧</div>
                            <h4>Module konfigurieren</h4>
                            <p>Aktivieren Sie nur die Funktionen, die Sie wirklich benötigen</p>
                        </div>
                        <div className="feature-card">
                            <div className="feature-icon">📊</div>
                            <h4>Auswertungen</h4>
                            <p>Automatische Berichte und Statistiken für Ihren Sponsorenlauf</p>
                        </div>
                    </div>
                    
                    <div className="benefits-badge">
                        <span className="badge-icon">⚡</span>
                        <span>Setup in nur 2 Minuten abgeschlossen</span>
                    </div>
                </div>
            )
        },
        {
            id: 'class-structure',
            title: 'Klassenstruktur konfigurieren',
            icon: '🏫',
            gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            content: (
                <div className="config-step">
                    <div className="step-header">
                        <div className="step-icon">🏫</div>
                        <div className="step-info">
                            <h3>Schritt 1: Klassenstruktur definieren</h3>
                            <p>Strukturieren Sie Ihre Schule für optimale Verwaltung und Auswertungen</p>
                        </div>
                    </div>
                    
                    <div className="benefits-list">
                        <div className="benefit-item">
                            <div className="benefit-icon">✅</div>
                            <div className="benefit-content">
                                <strong>Automatische Zuordnung</strong>
                                <span>Schüler werden beim Import automatisch den richtigen Klassen zugeordnet</span>
                            </div>
                        </div>
                        <div className="benefit-item">
                            <div className="benefit-icon">📊</div>
                            <div className="benefit-content">
                                <strong>Detaillierte Auswertungen</strong>
                                <span>Übersichtliche Statistiken und Berichte nach Klassen und Jahrgängen</span>
                            </div>
                        </div>
                        <div className="benefit-item">
                            <div className="benefit-icon">📧</div>
                            <div className="benefit-content">
                                <strong>Gezielter E-Mail-Versand</strong>
                                <span>Rundenergebnisse direkt an die entsprechenden Klassenlehrer</span>
                            </div>
                        </div>
                    </div>
                    
                    <div className="action-area">
                        <div className="action-buttons-group">
                            <button 
                                className="action-btn primary-btn"
                                onClick={handleConfigureClassStructure}
                            >
                                <span className="btn-icon">🏫</span>
                                <span>Klassenstruktur konfigurieren</span>
                                <span className="btn-arrow">→</span>
                            </button>
                            <button 
                                className="action-btn skip-btn"
                                onClick={() => {
                                    markStepCompleted('class-structure');
                                    setCurrentStep(2); // Springe zum Module-Schritt (Index 2)
                                }}
                            >
                                <span>Überspringen</span>
                            </button>
                        </div>
                        <p className="action-hint">Sie können dies auch später in den Einstellungen konfigurieren</p>
                    </div>
                </div>
            )
        },
        {
            id: 'modules',
            title: 'Module aktivieren',
            icon: '🔧',
            gradient: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
            content: (
                <div className="config-step">
                    <div className="step-header">
                        <div className="step-icon">🔧</div>
                        <div className="step-info">
                            <h3>Schritt 2: Module aktivieren</h3>
                            <p>Wählen Sie die Funktionen aus, die Sie für Ihren Sponsorenlauf benötigen</p>
                        </div>
                    </div>
                    
                    <div className="modules-grid">
                        <div className="module-card">
                            <div className="module-header">
                                <span className="module-icon">💰</span>
                                <h4>Spenden-Verwaltung</h4>
                            </div>
                            <p>Verwalten Sie erwartete und erhaltene Spenden pro Schüler</p>
                            <div className="module-features">
                                <span>• Excel-Export</span>
                                <span>• Automatische Berechnungen</span>
                                <span>• Übersichtliche Statistiken</span>
                            </div>
                        </div>
                        
                        <div className="module-card">
                            <div className="module-header">
                                <span className="module-icon">📧</span>
                                <h4>E-Mail-System</h4>
                            </div>
                            <p>Automatischer Versand von Rundenergebnissen an Sponsoren</p>
                            <div className="module-features">
                                <span>• Persönliche E-Mails</span>
                                <span>• Template-System</span>
                                <span>• Massenversand</span>
                            </div>
                        </div>
                        
                        <div className="module-card">
                            <div className="module-header">
                                <span className="module-icon">👨‍🏫</span>
                                <h4>Lehrer-Verwaltung</h4>
                            </div>
                            <p>Zentrale Verwaltung aller Lehrerdaten und E-Mail-Adressen</p>
                            <div className="module-features">
                                <span>• Klassenzuordnung</span>
                                <span>• Kontaktdaten</span>
                                <span>• Benachrichtigungen</span>
                            </div>
                        </div>
                    </div>
                    
                    <div className="action-area">
                        <div className="action-buttons-group">
                            <button 
                                className="action-btn secondary-btn"
                                onClick={handleConfigureModules}
                            >
                                <span className="btn-icon">🔧</span>
                                <span>Module konfigurieren</span>
                                <span className="btn-arrow">→</span>
                            </button>
                            <button 
                                className="action-btn skip-btn"
                                onClick={() => {
                                    markStepCompleted('modules');
                                    setCurrentStep(3); // Springe zum Complete-Schritt
                                }}
                            >
                                <span>Überspringen</span>
                            </button>
                        </div>
                        <p className="action-hint">Alle Module können jederzeit aktiviert oder deaktiviert werden</p>
                    </div>
                </div>
            )
        },
        {
            id: 'complete',
            title: 'Setup abgeschlossen!',
            icon: '🎊',
            gradient: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
            content: (
                <div className="complete-step">
                    <div className="success-animation">
                        <div className="checkmark">✓</div>
                    </div>
                    
                    <div className="success-content">
                        <h3>🎊 Herzlichen Glückwunsch!</h3>
                        <p className="success-text">
                            Ihr Sponsorenlauf-Tool ist erfolgreich konfiguriert und einsatzbereit!
                        </p>
                    </div>
                    
                    <div className="next-steps-card">
                        <h4>🚀 Empfohlene nächste Schritte:</h4>
                        <div className="steps-timeline">
                            <div className="timeline-item">
                                <div className="timeline-number">1</div>
                                <div className="timeline-content">
                                    <strong>Schülerdaten importieren</strong>
                                    <span>Über Excel-Import schnell alle Teilnehmer hinzufügen</span>
                                </div>
                            </div>
                            <div className="timeline-item">
                                <div className="timeline-number">2</div>
                                <div className="timeline-content">
                                    <strong>Barcode-Etiketten erstellen</strong>
                                    <span>Eindeutige Kennzeichnung für jeden Schüler</span>
                                </div>
                            </div>
                            <div className="timeline-item">
                                <div className="timeline-number">3</div>
                                <div className="timeline-content">
                                    <strong>Sponsorenlauf durchführen</strong>
                                    <span>Runden erfassen und Ergebnisse auswerten</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div className="celebration-banner">
                        <span>🎉 Viel Erfolg bei Ihrem Sponsorenlauf! 🎉</span>
                    </div>
                </div>
            )
        }
    ];

    const handleNext = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(currentStep + 1);
        }
    };

    const handlePrevious = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    const handleFinish = () => {
        if (onComplete) {
            onComplete();
        }
        dialogRef.current?.close();
    };

    const handleSkip = () => {
        if (onComplete) {
            onComplete();
        }
        dialogRef.current?.close();
    };

    const currentStepData = steps[currentStep];
    const isLastStep = currentStep === steps.length - 1;
    const isFirstStep = currentStep === 0;

    const actions = [
        {
            label: 'Setup überspringen',
            position: 'left',
            onClick: handleSkip,
            variant: 'text'
        },
        ...(isFirstStep ? [] : [{
            label: 'Zurück',
            position: 'left',
            onClick: handlePrevious,
            variant: 'secondary'
        }]),
        {
            label: isLastStep ? '✨ Setup abschließen' : 'Weiter →',
            onClick: isLastStep ? handleFinish : handleNext,
            variant: 'primary'
        }
    ];

    return (
        <BaseDialog
            dialogRef={dialogRef}
            title=""
            actions={actions}
            showDefaultClose={false}
            size="xl"
        >
            <div className="setup-guide-container">
                {/* Modern Progress Bar */}
                <div className="progress-header">
                    <div className="progress-info">
                        <h2 className="guide-title">{currentStepData.title}</h2>
                        <div className="step-counter">
                            Schritt {currentStep + 1} von {steps.length}
                        </div>
                    </div>
                </div>

                {/* Enhanced Progress Visualization */}
                <div className="progress-section">
                    <div className="progress-track">
                        <div 
                            className="progress-fill"
                            style={{ 
                                width: `${((currentStep + 1) / steps.length) * 100}%`,
                                background: currentStepData.gradient
                            }}
                        />
                    </div>
                    <div className="step-indicators">
                        {steps.map((step, index) => (
                            <div
                                key={step.id}
                                className={`step-indicator ${index <= currentStep ? 'active' : ''} ${
                                    completedSteps.includes(step.id) ? 'completed' : ''
                                } ${index === currentStep ? 'current' : ''}`}
                            >
                                <div className="indicator-content">
                                    {completedSteps.includes(step.id) ? '✓' : step.icon}
                                </div>
                                <span className="indicator-label">{step.title}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Step Content */}
                <div className="step-content-area">
                    {currentStepData.content}
                </div>
            </div>

            <style jsx>{`
                .setup-guide-container {
                    display: flex;
                    flex-direction: column;
                    min-height: 650px;
                    gap: 1.5rem;
                    padding: 1rem;
                    background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
                    border-radius: 20px;
                }

                /* Enhanced Progress Header */
                .progress-header {
                    text-align: center;
                    margin-bottom: 1.5rem;
                    position: relative;
                }

                .progress-header::before {
                    content: '';
                    position: absolute;
                    top: -2rem;
                    left: 50%;
                    transform: translateX(-50%);
                    width: 100px;
                    height: 4px;
                    background: linear-gradient(90deg, #667eea, #764ba2, #f093fb, #f5576c);
                    border-radius: 2px;
                    animation: headerShimmer 3s ease-in-out infinite;
                }

                @keyframes headerShimmer {
                    0%, 100% { opacity: 0.5; transform: translateX(-50%) scale(0.8); }
                    50% { opacity: 1; transform: translateX(-50%) scale(1); }
                }

                .guide-title {
                    font-size: 2rem;
                    font-weight: 800;
                    color: transparent;
                    margin: 0 0 0.75rem 0;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                    text-shadow: 0 4px 8px rgba(102, 126, 234, 0.1);
                    letter-spacing: -0.02em;
                }

                .step-counter {
                    display: inline-block;
                    background: linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(248,250,252,0.9) 100%);
                    color: var(--primary-color);
                    padding: 0.75rem 2rem;
                    border-radius: 30px;
                    font-size: 0.95rem;
                    font-weight: 700;
                    border: 2px solid rgba(102, 126, 234, 0.15);
                    box-shadow: 0 8px 25px rgba(102, 126, 234, 0.1);
                    backdrop-filter: blur(10px);
                    position: relative;
                    overflow: hidden;
                }

                .step-counter::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: -100%;
                    width: 100%;
                    height: 100%;
                    background: linear-gradient(90deg, transparent, rgba(102, 126, 234, 0.1), transparent);
                    animation: counterShine 4s ease-in-out infinite;
                }

                @keyframes counterShine {
                    0%, 100% { left: -100%; }
                    50% { left: 100%; }
                }

                /* Ultra-modern Progress Section */
                .progress-section {
                    margin-bottom: 2.5rem;
                    background: rgba(255, 255, 255, 0.6);
                    backdrop-filter: blur(20px);
                    border-radius: 20px;
                    padding: 2rem;
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.05);
                }

                .progress-track {
                    height: 12px;
                    background: linear-gradient(90deg, #e2e8f0 0%, #cbd5e1 100%);
                    border-radius: 10px;
                    overflow: hidden;
                    margin-bottom: 2.5rem;
                    position: relative;
                    box-shadow: inset 0 2px 8px rgba(0,0,0,0.1);
                }

                .progress-track::after {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: linear-gradient(45deg, transparent 25%, rgba(255,255,255,0.1) 25%, rgba(255,255,255,0.1) 50%, transparent 50%, transparent 75%, rgba(255,255,255,0.1) 75%);
                    background-size: 20px 20px;
                    animation: progressPattern 2s linear infinite;
                }

                @keyframes progressPattern {
                    0% { background-position: 0 0; }
                    100% { background-position: 20px 0; }
                }

                .progress-fill {
                    height: 100%;
                    border-radius: 10px;
                    transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1);
                    position: relative;
                    overflow: hidden;
                    z-index: 1;
                }

                .progress-fill::after {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: -150%;
                    width: 100%;
                    height: 100%;
                    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent);
                    animation: progressShimmer 2.5s infinite ease-in-out;
                }

                @keyframes progressShimmer {
                    0% { left: -150%; }
                    100% { left: 150%; }
                }

                .step-indicators {
                    display: grid;
                    grid-template-columns: repeat(${steps.length}, 1fr);
                    gap: 1.5rem;
                    max-width: 900px;
                    margin: 0 auto;
                }

                .step-indicator {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 1rem;
                    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
                    cursor: pointer;
                    padding: 1rem;
                    border-radius: 15px;
                    position: relative;
                }

                .step-indicator:hover {
                    background: rgba(255, 255, 255, 0.3);
                    backdrop-filter: blur(10px);
                }

                .indicator-content {
                    width: 70px;
                    height: 70px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1.8rem;
                    background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
                    color: #64748b;
                    border: 3px solid #e2e8f0;
                    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
                    position: relative;
                    overflow: hidden;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.08);
                }

                .indicator-content::before {
                    content: '';
                    position: absolute;
                    top: -50%;
                    left: -50%;
                    width: 200%;
                    height: 200%;
                    background: conic-gradient(from 0deg, transparent, rgba(102, 126, 234, 0.3), transparent);
                    opacity: 0;
                    transition: opacity 0.3s ease;
                    animation: rotate 2s linear infinite;
                }

                @keyframes rotate {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }

                .step-indicator.active .indicator-content {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    border-color: #667eea;
                    transform: scale(1.15);
                    box-shadow: 0 12px 30px rgba(102, 126, 234, 0.4);
                }

                .step-indicator.active .indicator-content::before {
                    opacity: 1;
                }

                .step-indicator.completed .indicator-content {
                    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                    color: white;
                    border-color: #10b981;
                    box-shadow: 0 8px 25px rgba(16, 185, 129, 0.3);
                }

                .step-indicator.current .indicator-content {
                    animation: currentPulse 2s infinite;
                    box-shadow: 0 0 0 0 rgba(102, 126, 234, 0.5);
                }

                @keyframes currentPulse {
                    0% { 
                        transform: scale(1.15);
                        box-shadow: 0 12px 30px rgba(102, 126, 234, 0.4), 0 0 0 0 rgba(102, 126, 234, 0.5);
                    }
                    50% { 
                        transform: scale(1.25);
                        box-shadow: 0 15px 35px rgba(102, 126, 234, 0.5), 0 0 0 15px rgba(102, 126, 234, 0.1);
                    }
                    100% { 
                        transform: scale(1.15);
                        box-shadow: 0 12px 30px rgba(102, 126, 234, 0.4), 0 0 0 0 rgba(102, 126, 234, 0.5);
                    }
                }

                .indicator-label {
                    font-size: 0.85rem;
                    font-weight: 700;
                    color: var(--text-muted);
                    text-align: center;
                    line-height: 1.3;
                    transition: all 0.3s ease;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }

                .step-indicator.active .indicator-label,
                .step-indicator.completed .indicator-label {
                    color: var(--primary-color);
                    font-weight: 800;
                }

                /* Enhanced Step Content Area */
                .step-content-area {
                    flex: 1;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 3rem;
                    background: linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(248,250,252,0.95) 100%);
                    border-radius: 25px;
                    border: 1px solid rgba(255,255,255,0.3);
                    box-shadow: 0 20px 60px rgba(0,0,0,0.08);
                    backdrop-filter: blur(20px);
                    position: relative;
                    overflow: hidden;
                }

                .step-content-area::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    height: 4px;
                    background: linear-gradient(90deg, #667eea, #764ba2, #f093fb, #f5576c);
                    background-size: 400% 400%;
                    animation: gradientFlow 4s ease infinite;
                }

                @keyframes gradientFlow {
                    0%, 100% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                }

                /* Enhanced Welcome Step */
                .welcome-step {
                    text-align: center;
                    max-width: 750px;
                    width: 100%;
                }

                .hero-section {
                    margin-bottom: 3.5rem;
                    position: relative;
                }

                .hero-icon {
                    font-size: 5rem;
                    margin-bottom: 1.5rem;
                    display: block;
                    animation: heroFloat 3s ease-in-out infinite;
                    filter: drop-shadow(0 10px 20px rgba(102, 126, 234, 0.2));
                }

                @keyframes heroFloat {
                    0%, 100% { transform: translateY(0px) rotate(0deg); }
                    33% { transform: translateY(-8px) rotate(2deg); }
                    66% { transform: translateY(-4px) rotate(-2deg); }
                }

                .welcome-step h3 {
                    font-size: 2.5rem;
                    font-weight: 800;
                    color: transparent;
                    margin-bottom: 1.5rem;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                    letter-spacing: -0.03em;
                    line-height: 1.2;
                }

                .hero-text {
                    font-size: 1.3rem;
                    color: #64748b;
                    line-height: 1.7;
                    margin-bottom: 0;
                    font-weight: 400;
                }

                .features-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
                    gap: 2rem;
                    margin: 3rem 0;
                }

                .feature-card {
                    background: linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(248,250,252,0.9) 100%);
                    padding: 2.5rem 2rem;
                    border-radius: 20px;
                    text-align: center;
                    border: 2px solid transparent;
                    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
                    box-shadow: 0 8px 30px rgba(0,0,0,0.08);
                    position: relative;
                    overflow: hidden;
                    backdrop-filter: blur(10px);
                }

                .feature-card::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    height: 4px;
                    background: linear-gradient(90deg, #667eea, #764ba2, #f093fb, #f5576c);
                    background-size: 400% 400%;
                    animation: cardGradientShift 3s ease infinite;
                    opacity: 0;
                    transition: opacity 0.3s ease;
                }

                @keyframes cardGradientShift {
                    0%, 100% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                }

                .feature-card:hover::before {
                    opacity: 1;
                }

                .feature-card:hover {
                    transform: translateY(-8px) scale(1.02);
                    box-shadow: 0 20px 50px rgba(0,0,0,0.15);
                    border-color: rgba(102, 126, 234, 0.2);
                }

                .feature-card .feature-icon {
                    font-size: 3rem;
                    margin-bottom: 1.5rem;
                    display: block;
                    transition: transform 0.3s ease;
                }

                .feature-card:hover .feature-icon {
                    transform: scale(1.1) rotate(5deg);
                }

                .feature-card h4 {
                    font-size: 1.2rem;
                    font-weight: 700;
                    color: var(--text-color);
                    margin-bottom: 0.75rem;
                }

                .feature-card p {
                    font-size: 0.95rem;
                    color: var(--text-muted);
                    line-height: 1.5;
                    margin: 0;
                }

                .benefits-badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.75rem;
                    background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
                    color: #065f46;
                    padding: 1rem 2rem;
                    border-radius: 30px;
                    font-weight: 700;
                    border: 2px solid rgba(16, 185, 129, 0.2);
                    margin-top: 2.5rem;
                    box-shadow: 0 8px 25px rgba(16, 185, 129, 0.1);
                    animation: badgePulse 3s ease-in-out infinite;
                }

                @keyframes badgePulse {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.02); }
                }

                .badge-icon {
                    font-size: 1.3rem;
                    animation: badgeIconSpin 4s linear infinite;
                }

                @keyframes badgeIconSpin {
                    0%, 90%, 100% { transform: rotate(0deg); }
                    95% { transform: rotate(360deg); }
                }

                /* Enhanced Config Step Styles */
                .config-step {
                    max-width: 850px;
                    width: 100%;
                }

                .step-header {
                    display: flex;
                    align-items: flex-start;
                    gap: 2rem;
                    margin-bottom: 3rem;
                    text-align: left;
                    background: linear-gradient(135deg, rgba(255,255,255,0.8) 0%, rgba(248,250,252,0.9) 100%);
                    padding: 2rem;
                    border-radius: 20px;
                    border: 2px solid rgba(102, 126, 234, 0.1);
                    box-shadow: 0 10px 30px rgba(102, 126, 234, 0.05);
                    position: relative;
                    overflow: hidden;
                }

                .step-header::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    height: 4px;
                    background: linear-gradient(90deg, #667eea, #764ba2, #f093fb, #f5576c);
                    background-size: 400% 400%;
                    animation: headerGradient 4s ease infinite;
                }

                @keyframes headerGradient {
                    0%, 100% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                }

                .step-icon {
                    font-size: 3.5rem;
                    flex-shrink: 0;
                    padding: 1.5rem;
                    background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.15) 100%);
                    border-radius: 25px;
                    border: 2px solid rgba(102, 126, 234, 0.2);
                    animation: iconFloat 3s ease-in-out infinite;
                    box-shadow: 0 8px 25px rgba(102, 126, 234, 0.1);
                }

                @keyframes iconFloat {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-5px); }
                }

                .step-info h3 {
                    font-size: 1.8rem;
                    font-weight: 800;
                    color: transparent;
                    margin-bottom: 0.75rem;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                    letter-spacing: -0.02em;
                }

                .step-info p {
                    font-size: 1.15rem;
                    color: #64748b;
                    line-height: 1.6;
                    margin: 0;
                    font-weight: 400;
                }

                .benefits-list {
                    display: flex;
                    flex-direction: column;
                    gap: 1.5rem;
                    margin: 3rem 0;
                }

                .benefit-item {
                    display: flex;
                    align-items: flex-start;
                    gap: 1.5rem;
                    padding: 2rem;
                    background: linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(248,250,252,0.95) 100%);
                    border-radius: 15px;
                    border: 2px solid rgba(0,0,0,0.05);
                    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
                    position: relative;
                    overflow: hidden;
                    backdrop-filter: blur(10px);
                }

                .benefit-item::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 4px;
                    height: 100%;
                    background: linear-gradient(180deg, #667eea 0%, #764ba2 100%);
                    transform: scaleY(0);
                    transition: transform 0.3s ease;
                    transform-origin: bottom;
                }

                .benefit-item:hover::before {
                    transform: scaleY(1);
                }

                .benefit-item:hover {
                    border-color: rgba(102, 126, 234, 0.2);
                    transform: translateX(8px);
                    box-shadow: 0 15px 40px rgba(102, 126, 234, 0.1);
                }

                .benefit-icon {
                    font-size: 1.8rem;
                    flex-shrink: 0;
                    width: 50px;
                    height: 50px;
                    background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border: 2px solid rgba(16, 185, 129, 0.2);
                    transition: all 0.3s ease;
                }

                .benefit-item:hover .benefit-icon {
                    transform: scale(1.1);
                    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                    color: white;
                    border-color: #10b981;
                }

                .benefit-content {
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                    flex: 1;
                }

                .benefit-content strong {
                    font-size: 1.1rem;
                    font-weight: 700;
                    color: var(--text-color);
                }

                .benefit-content span {
                    font-size: 1rem;
                    color: #64748b;
                    line-height: 1.5;
                }

                .modules-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
                    gap: 2rem;
                    margin: 3rem 0;
                }

                .module-card {
                    background: linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(248,250,252,0.95) 100%);
                    border: 2px solid rgba(0,0,0,0.05);
                    border-radius: 20px;
                    padding: 2.5rem 2rem;
                    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
                    text-align: left;
                    position: relative;
                    overflow: hidden;
                    backdrop-filter: blur(10px);
                    box-shadow: 0 8px 30px rgba(0,0,0,0.05);
                }

                .module-card::before {
                    content: '';
                    position: absolute;
                    top: -2px;
                    left: -2px;
                    right: -2px;
                    bottom: -2px;
                    background: linear-gradient(135deg, #667eea, #764ba2, #f093fb, #f5576c);
                    border-radius: 20px;
                    z-index: -1;
                    opacity: 0;
                    transition: opacity 0.3s ease;
                }

                .module-card:hover::before {
                    opacity: 1;
                }

                .module-card:hover {
                    transform: translateY(-5px) scale(1.02);
                    box-shadow: 0 20px 50px rgba(0,0,0,0.15);
                    background: rgba(255,255,255,0.95);
                }

                .module-header {
                    display: flex;
                    align-items: center;
                    gap: 1.5rem;
                    margin-bottom: 1.5rem;
                    padding-bottom: 1rem;
                    border-bottom: 2px solid rgba(0,0,0,0.05);
                }

                .module-card .module-icon {
                    font-size: 2.5rem;
                    flex-shrink: 0;
                    padding: 0.75rem;
                    background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.15) 100%);
                    border-radius: 15px;
                    transition: all 0.3s ease;
                }

                .module-card:hover .module-icon {
                    transform: rotate(10deg) scale(1.1);
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                }

                .module-card h4 {
                    font-size: 1.3rem;
                    font-weight: 700;
                    color: var(--text-color);
                    margin: 0;
                }

                .module-card p {
                    color: #64748b;
                    line-height: 1.6;
                    margin-bottom: 1.5rem;
                    font-size: 1rem;
                }

                .module-features {
                    display: flex;
                    flex-direction: column;
                    gap: 0.75rem;
                }

                .module-features span {
                    font-size: 0.9rem;
                    color: #64748b;
                    padding-left: 1rem;
                    position: relative;
                }

                .module-features span::before {
                    content: '✓';
                    position: absolute;
                    left: 0;
                    color: #10b981;
                    font-weight: bold;
                }

                /* Enhanced Action Area */
                .action-area {
                    text-align: center;
                    margin-top: 3rem;
                }

                .action-buttons-group {
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                    align-items: center;
                }

                .action-btn {
                    display: inline-flex;
                    align-items: center;
                    gap: 1rem;
                    padding: 1.25rem 2.5rem;
                    border: none;
                    border-radius: 15px;
                    font-size: 1.1rem;
                    font-weight: 700;
                    cursor: pointer;
                    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
                    text-decoration: none;
                    position: relative;
                    overflow: hidden;
                    min-width: 320px;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    box-shadow: 0 8px 30px rgba(0,0,0,0.1);
                }

                .action-btn::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: -100%;
                    width: 100%;
                    height: 100%;
                    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
                    transition: left 0.6s;
                }

                .action-btn:hover::before {
                    left: 100%;
                }

                .action-btn::after {
                    content: '';
                    position: absolute;
                    inset: 0;
                    background: inherit;
                    border-radius: inherit;
                    opacity: 0;
                    transition: opacity 0.3s ease;
                }

                .action-btn:hover::after {
                    opacity: 0.1;
                }

                .primary-btn {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    box-shadow: 0 12px 35px rgba(102, 126, 234, 0.4);
                }

                .primary-btn:hover {
                    transform: translateY(-3px) scale(1.02);
                    box-shadow: 0 20px 50px rgba(102, 126, 234, 0.5);
                }

                .secondary-btn {
                    background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
                    color: white;
                    box-shadow: 0 12px 35px rgba(240, 147, 251, 0.4);
                }

                .secondary-btn:hover {
                    transform: translateY(-3px) scale(1.02);
                    box-shadow: 0 20px 50px rgba(240, 147, 251, 0.5);
                }

                .skip-btn {
                    background: linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(248,250,252,0.9) 100%);
                    color: #64748b;
                    border: 2px solid rgba(102, 126, 234, 0.2);
                    min-width: 200px;
                    padding: 1rem 2rem;
                    font-size: 0.95rem;
                    font-weight: 600;
                    text-transform: none;
                    letter-spacing: normal;
                    backdrop-filter: blur(10px);
                    box-shadow: 0 6px 20px rgba(0,0,0,0.05);
                }

                .skip-btn:hover {
                    background: linear-gradient(135deg, rgba(255,255,255,1) 0%, rgba(248,250,252,1) 100%);
                    color: var(--primary-color);
                    border-color: var(--primary-color);
                    transform: translateY(-2px);
                    box-shadow: 0 10px 30px rgba(102, 126, 234, 0.2);
                }

                .btn-icon {
                    font-size: 1.4rem;
                    transition: transform 0.3s ease;
                }

                .btn-arrow {
                    font-size: 1.4rem;
                    transition: transform 0.3s ease;
                }

                .action-btn:hover .btn-arrow {
                    transform: translateX(5px);
                }

                .action-btn:hover .btn-icon {
                    transform: scale(1.1);
                }

                .action-hint {
                    font-size: 0.9rem;
                    color: #64748b;
                    margin-top: 1.5rem;
                    font-style: italic;
                    max-width: 400px;
                    margin-left: auto;
                    margin-right: auto;
                }

                /* Ultra-modern Complete Step */
                .complete-step {
                    text-align: center;
                    max-width: 750px;
                    width: 100%;
                }

                .success-animation {
                    margin-bottom: 3rem;
                    position: relative;
                }

                .success-animation::before {
                    content: '🎉';
                    position: absolute;
                    top: -20px;
                    left: 20px;
                    font-size: 2rem;
                    animation: confetti1 3s ease-in-out infinite;
                }

                .success-animation::after {
                    content: '🎊';
                    position: absolute;
                    top: -20px;
                    right: 20px;
                    font-size: 2rem;
                    animation: confetti2 3s ease-in-out infinite;
                }

                @keyframes confetti1 {
                    0%, 100% { transform: translateY(0px) rotate(0deg); }
                    25% { transform: translateY(-10px) rotate(20deg); }
                    50% { transform: translateY(-5px) rotate(-10deg); }
                    75% { transform: translateY(-8px) rotate(15deg); }
                }

                @keyframes confetti2 {
                    0%, 100% { transform: translateY(0px) rotate(0deg); }
                    25% { transform: translateY(-8px) rotate(-15deg); }
                    50% { transform: translateY(-12px) rotate(10deg); }
                    75% { transform: translateY(-6px) rotate(-20deg); }
                }

                .checkmark {
                    width: 100px;
                    height: 100px;
                    border-radius: 50%;
                    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                    color: white;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 4rem;
                    font-weight: bold;
                    margin: 0 auto;
                    animation: successAnimation 2s ease-in-out infinite;
                    box-shadow: 0 15px 40px rgba(16, 185, 129, 0.4);
                    position: relative;
                    overflow: hidden;
                }

                .checkmark::before {
                    content: '';
                    position: absolute;
                    inset: -3px;
                    background: conic-gradient(from 0deg, #10b981, #059669, #047857, #10b981);
                    border-radius: 50%;
                    z-index: -1;
                    animation: checkmarkRotate 3s linear infinite;
                }

                @keyframes successAnimation {
                    0%, 100% { transform: scale(1); }
                    25% { transform: scale(1.05); }
                    50% { transform: scale(1.1); }
                    75% { transform: scale(1.05); }
                }

                @keyframes checkmarkRotate {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }

                .success-content h3 {
                    font-size: 2.5rem;
                    font-weight: 800;
                    color: transparent;
                    margin-bottom: 1.5rem;
                    background: linear-gradient(135deg, #10b981 0%, #059669 50%, #047857 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                    letter-spacing: -0.02em;
                }

                .success-text {
                    font-size: 1.3rem;
                    color: #64748b;
                    line-height: 1.7;
                    margin-bottom: 3rem;
                    font-weight: 400;
                }

                .next-steps-card {
                    background: linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(248,250,252,0.95) 100%);
                    border: 2px solid rgba(16, 185, 129, 0.1);
                    border-radius: 25px;
                    padding: 3rem 2.5rem;
                    margin: 3rem 0;
                    text-align: left;
                    backdrop-filter: blur(20px);
                    box-shadow: 0 20px 60px rgba(16, 185, 129, 0.1);
                    position: relative;
                    overflow: hidden;
                }

                .next-steps-card::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    height: 4px;
                    background: linear-gradient(90deg, #10b981, #059669, #047857, #065f46);
                    background-size: 400% 400%;
                    animation: nextStepsGradient 4s ease infinite;
                }

                @keyframes nextStepsGradient {
                    0%, 100% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                }

                .next-steps-card h4 {
                    font-size: 1.5rem;
                    font-weight: 700;
                    color: var(--text-color);
                    margin-bottom: 2rem;
                    text-align: center;
                    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                }

                .steps-timeline {
                    display: flex;
                    flex-direction: column;
                    gap: 2rem;
                }

                .timeline-item {
                    display: flex;
                    align-items: flex-start;
                    gap: 1.5rem;
                    padding: 1.5rem;
                    background: rgba(255, 255, 255, 0.7);
                    border-radius: 15px;
                    transition: all 0.3s ease;
                    border: 2px solid transparent;
                }

                .timeline-item:hover {
                    background: rgba(255, 255, 255, 0.9);
                    border-color: rgba(16, 185, 129, 0.2);
                    transform: translateX(5px);
                }

                .timeline-number {
                    width: 45px;
                    height: 45px;
                    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                    color: white;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1.2rem;
                    font-weight: bold;
                    flex-shrink: 0;
                    box-shadow: 0 6px 20px rgba(16, 185, 129, 0.3);
                    transition: all 0.3s ease;
                }

                .timeline-item:hover .timeline-number {
                    transform: scale(1.1);
                    box-shadow: 0 8px 25px rgba(16, 185, 129, 0.4);
                }

                .timeline-content {
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                    padding-top: 0.25rem;
                    flex: 1;
                }

                .timeline-content strong {
                    font-size: 1.1rem;
                    font-weight: 700;
                    color: var(--text-color);
                }

                .timeline-content span {
                    font-size: 1rem;
                    color: #64748b;
                    line-height: 1.5;
                }

                .celebration-banner {
                    background: linear-gradient(135deg, #fef3c7 0%, #fde68a 50%, #f59e0b 100%);
                    color: #92400e;
                    padding: 1.5rem 3rem;
                    border-radius: 30px;
                    font-size: 1.2rem;
                    font-weight: 700;
                    margin-top: 3rem;
                    border: 3px solid rgba(251, 191, 36, 0.3);
                    animation: celebrationPulse 2s ease-in-out infinite alternate;
                    box-shadow: 0 10px 30px rgba(251, 191, 36, 0.2);
                    text-transform: uppercase;
                    letter-spacing: 1px;
                }

                @keyframes celebrationPulse {
                    0% { transform: scale(1) rotate(-0.5deg); }
                    100% { transform: scale(1.02) rotate(0.5deg); }
                }

                /* Enhanced Responsive Design */
                @media (max-width: 1024px) {
                    .setup-guide-container {
                        gap: 1.25rem;
                        padding: 0.75rem;
                    }

                    .step-content-area {
                        padding: 2rem;
                    }
                }

                @media (max-width: 768px) {
                    .setup-guide-container {
                        gap: 1rem;
                        padding: 0.5rem;
                        min-height: 550px;
                    }

                    .guide-title {
                        font-size: 1.75rem;
                    }

                    .step-indicators {
                        grid-template-columns: repeat(${steps.length}, 1fr);
                        gap: 0.75rem;
                    }

                    .indicator-content {
                        width: 55px;
                        height: 55px;
                        font-size: 1.5rem;
                    }

                    .indicator-label {
                        font-size: 0.75rem;
                    }

                    .step-content-area {
                        padding: 1.5rem;
                    }

                    .features-grid {
                        grid-template-columns: 1fr;
                        gap: 1.5rem;
                    }

                    .modules-grid {
                        grid-template-columns: 1fr;
                        gap: 1.5rem;
                    }

                    .step-header {
                        flex-direction: column;
                        text-align: center;
                        gap: 1.5rem;
                        padding: 1.5rem;
                    }

                    .step-info h3 {
                        font-size: 1.5rem;
                    }

                    .benefits-list {
                        gap: 1.25rem;
                    }

                    .benefit-item {
                        padding: 1.5rem;
                        flex-direction: column;
                        text-align: center;
                        gap: 1rem;
                    }

                    .action-btn {
                        min-width: 280px;
                        padding: 1rem 2rem;
                        font-size: 1rem;
                    }

                    .hero-icon {
                        font-size: 4rem;
                    }

                    .welcome-step h3 {
                        font-size: 2rem;
                    }

                    .hero-text {
                        font-size: 1.1rem;
                    }

                    .success-content h3 {
                        font-size: 2rem;
                    }

                    .checkmark {
                        width: 80px;
                        height: 80px;
                        font-size: 3rem;
                    }

                    .next-steps-card {
                        padding: 2rem 1.5rem;
                    }

                    .timeline-item {
                        padding: 1.25rem;
                    }
                }

                @media (max-width: 480px) {
                    .setup-guide-container {
                        padding: 0.25rem;
                        min-height: 500px;
                    }

                    .progress-section {
                        padding: 1.5rem;
                    }

                    .step-indicators {
                        gap: 0.5rem;
                    }

                    .indicator-content {
                        width: 45px;
                        height: 45px;
                        font-size: 1.2rem;
                    }

                    .indicator-label {
                        font-size: 0.7rem;
                    }

                    .step-content-area {
                        padding: 1rem;
                    }

                    .action-btn {
                        min-width: 250px;
                        padding: 0.875rem 1.5rem;
                    }

                    .guide-title {
                        font-size: 1.5rem;
                    }

                    .hero-icon {
                        font-size: 3rem;
                    }

                    .welcome-step h3 {
                        font-size: 1.75rem;
                    }

                    .hero-text {
                        font-size: 1rem;
                    }

                    .step-header {
                        padding: 1rem;
                    }

                    .step-icon {
                        font-size: 2.5rem;
                        padding: 1rem;
                    }

                    .step-info h3 {
                        font-size: 1.3rem;
                    }

                    .benefit-item {
                        padding: 1rem;
                    }

                    .module-card {
                        padding: 1.5rem;
                    }

                    .checkmark {
                        width: 70px;
                        height: 70px;
                        font-size: 2.5rem;
                    }

                    .success-content h3 {
                        font-size: 1.75rem;
                    }

                    .next-steps-card {
                        padding: 1.5rem 1rem;
                    }

                    .celebration-banner {
                        font-size: 1rem;
                        padding: 1rem 1.5rem;
                    }
                }

                /* High DPI and Retina Displays */
                @media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi) {
                    .setup-guide-container {
                        -webkit-font-smoothing: antialiased;
                        -moz-osx-font-smoothing: grayscale;
                    }

                    .progress-fill::after,
                    .action-btn::before,
                    .feature-card::before {
                        will-change: transform;
                    }
                }

                /* Dark Mode Support */
                @media (prefers-color-scheme: dark) {
                    .setup-guide-container {
                        background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
                    }

                    .progress-section {
                        background: rgba(30, 41, 59, 0.6);
                        border-color: rgba(148, 163, 184, 0.2);
                    }

                    .step-content-area {
                        background: linear-gradient(135deg, rgba(30, 41, 59, 0.9) 0%, rgba(15, 23, 42, 0.95) 100%);
                        border-color: rgba(148, 163, 184, 0.2);
                    }

                    .feature-card,
                    .benefit-item,
                    .module-card {
                        background: linear-gradient(135deg, rgba(30, 41, 59, 0.9) 0%, rgba(15, 23, 42, 0.95) 100%);
                        border-color: rgba(148, 163, 184, 0.1);
                    }

                    .next-steps-card {
                        background: linear-gradient(135deg, rgba(30, 41, 59, 0.95) 0%, rgba(15, 23, 42, 0.95) 100%);
                        border-color: rgba(16, 185, 129, 0.3);
                    }

                    .timeline-item {
                        background: rgba(30, 41, 59, 0.7);
                    }
                }

                /* Reduced Motion */
                @media (prefers-reduced-motion: reduce) {
                    .hero-icon,
                    .checkmark,
                    .progress-fill::after,
                    .action-btn::before,
                    .feature-card::before {
                        animation: none;
                    }

                    .action-btn:hover,
                    .feature-card:hover,
                    .module-card:hover,
                    .benefit-item:hover {
                        transform: none;
                    }

                    * {
                        transition-duration: 0.01ms !important;
                    }
                }

                /* High Contrast Mode */
                @media (prefers-contrast: high) {
                    .setup-guide-container {
                        background: #ffffff;
                    }

                    .guide-title {
                        color: #000000;
                        background: none;
                        -webkit-text-fill-color: #000000;
                    }

                    .step-content-area {
                        background: #ffffff;
                        border: 2px solid #000000;
                    }

                    .action-btn {
                        border: 2px solid #000000;
                    }
                }
            `}</style>
        </BaseDialog>
    );
};

export default SetupGuideDialog;
