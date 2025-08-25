import React, { useState } from 'react';

const MailTemplateSelector = ({ templates, onSelect, currentText, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [customTemplate, setCustomTemplate] = useState('');
    const [showCustom, setShowCustom] = useState(false);

    const handleTemplateSelect = (template) => {
        onSelect(template);
        setIsOpen(false);
    };

    const handleCustomSave = () => {
        if (customTemplate.trim()) {
            const newTemplate = {
                name: 'Benutzerdefiniert',
                content: customTemplate
            };
            onSelect(newTemplate);
            setShowCustom(false);
            setIsOpen(false);
        }
    };

    const getCharCount = (text) => text?.length || 0;

    return (
        <div className="mail-template-selector">
            <div className="template-header">
                <button 
                    className="template-toggle"
                    onClick={() => setIsOpen(!isOpen)}
                    type="button"
                >
                    <i className="icon-template"></i>
                    E-Mail Vorlagen
                    <i className={`icon-chevron ${isOpen ? 'down' : 'right'}`}></i>
                </button>
            </div>

            {isOpen && (
                <div className="template-dropdown">
                    <div className="template-grid">
                        {templates.map((template, index) => (
                            <div key={index} className="template-card">
                                <div className="template-card-header">
                                    <h4>{template.name}</h4>
                                    <div className="template-meta">
                                        {getCharCount(template.content)} Zeichen
                                    </div>
                                </div>
                                <div className="template-preview">
                                    {template.content.substring(0, 150)}
                                    {template.content.length > 150 && '...'}
                                </div>
                                <button
                                    className="template-select-btn"
                                    onClick={() => handleTemplateSelect(template)}
                                    type="button"
                                >
                                    Verwenden
                                </button>
                            </div>
                        ))}
                        
                        <div className="template-card custom-card">
                            <div className="template-card-header">
                                <h4>Benutzerdefiniert</h4>
                                <i className="icon-edit"></i>
                            </div>
                            <div className="template-preview">
                                Erstellen Sie Ihre eigene E-Mail-Vorlage
                            </div>
                            <button
                                className="template-select-btn"
                                onClick={() => setShowCustom(!showCustom)}
                                type="button"
                            >
                                {showCustom ? 'Schließen' : 'Erstellen'}
                            </button>
                        </div>
                    </div>

                    {showCustom && (
                        <div className="custom-template-editor">
                            <h4>Benutzerdefinierte Vorlage erstellen</h4>
                            <textarea
                                value={customTemplate}
                                onChange={(e) => setCustomTemplate(e.target.value)}
                                placeholder="Erstellen Sie hier Ihre eigene E-Mail-Vorlage..."
                                className="custom-template-textarea"
                                rows="8"
                            />
                            <div className="custom-template-actions">
                                <div className="char-counter">
                                    {getCharCount(customTemplate)} Zeichen
                                </div>
                                <div className="button-group">
                                    <button
                                        className="btn btn-secondary"
                                        onClick={() => {
                                            setCustomTemplate('');
                                            setShowCustom(false);
                                        }}
                                        type="button"
                                    >
                                        Abbrechen
                                    </button>
                                    <button
                                        className="btn btn-primary"
                                        onClick={handleCustomSave}
                                        disabled={!customTemplate.trim()}
                                        type="button"
                                    >
                                        Verwenden
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="template-help">
                        <div className="help-section">
                            <h5>💡 Tipps für E-Mail-Vorlagen:</h5>
                            <ul>
                                <li>Verwenden Sie <code>{'{jahr}'}</code> für das aktuelle Jahr</li>
                                <li>Verwenden Sie <code>{'{klasse}'}</code> für den Klassennamen</li>
                                <li>Halten Sie die Nachricht freundlich und professionell</li>
                                <li>Erwähnen Sie wichtige Hinweise zu Ersatzkarten</li>
                            </ul>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MailTemplateSelector;
