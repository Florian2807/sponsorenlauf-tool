import React, { createContext, useContext, useState, useCallback, useRef } from 'react';

const ErrorContext = createContext();

export const ErrorProvider = ({ children }) => {
    const [notification, setNotification] = useState(null);
    const [isVisible, setIsVisible] = useState(false);
    const timeoutRef = useRef(null);

    const showNotification = useCallback((message, type = 'error', context = '', autoClose = true) => {
        // Clear existing timeout
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        // Parse error message
        let displayMessage = '';
        if (typeof message === 'string') {
            displayMessage = message;
        } else if (message?.response?.data?.message) {
            displayMessage = message.response.data.message;
        } else if (message?.response?.data?.errors?.length > 0) {
            displayMessage = message.response.data.errors.join('\n');
        } else if (message?.message) {
            displayMessage = message.message;
        } else {
            displayMessage = type === 'error' ? 'Ein unerwarteter Fehler ist aufgetreten.' : 'Operation erfolgreich';
        }

        setNotification({ message: displayMessage, type, context });
        setIsVisible(true);

        // Auto-dismiss
        if (autoClose) {
            const timeout = type === 'success' ? 3000 : 8000;
            timeoutRef.current = setTimeout(() => {
                setIsVisible(false);
                setTimeout(() => setNotification(null), 300);
            }, timeout);
        }
    }, []);

    const showError = useCallback((error, context = '') => {
        showNotification(error, 'error', context);
    }, [showNotification]);

    const showSuccess = useCallback((message, context = '') => {
        showNotification(message, 'success', context);
    }, [showNotification]);

    const dismiss = useCallback(() => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        setIsVisible(false);
        setTimeout(() => setNotification(null), 300);
    }, []);

    return (
        <ErrorContext.Provider value={{ showError, showSuccess, dismiss }}>
            {children}
            {notification && (
                <div className={`notification ${isVisible ? 'show' : ''} ${notification.type}`}>
                    <div className="notification-content">
                        <div className="notification-icon">
                            {notification.type === 'success' ? (
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                    <path
                                        d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                </svg>
                            ) : (
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                    <path
                                        d="M12 9V11M12 15H12.01M5.07183 19H18.9282C20.4678 19 21.4301 17.3333 20.6603 16L13.7321 4C12.9623 2.66667 11.0377 2.66667 10.2679 4L3.33975 16C2.56987 17.3333 3.53223 19 5.07183 19Z"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                </svg>
                            )}
                        </div>
                        <div className="notification-message">
                            <p>{notification.message}</p>
                            {notification.context && (
                                <small className="notification-context">{notification.context}</small>
                            )}
                        </div>
                        <button className="notification-close" onClick={dismiss} aria-label="Schließen">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                <path
                                    d="M18 6L6 18M6 6L18 18"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            </svg>
                        </button>
                    </div>
                    <div className="notification-progress-bar">
                        <div className="notification-progress-fill"></div>
                    </div>
                </div>
            )}
            <style jsx>{`
                .notification {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    max-width: 400px;
                    border-radius: 8px;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                    z-index: 1000;
                    transform: translateX(100%);
                    transition: transform 0.3s ease-in-out;
                    overflow: hidden;
                }

                .notification.show {
                    transform: translateX(0);
                }

                .notification.error {
                    background-color: #f8d7da;
                    border: 1px solid #f5c6cb;
                    border-left: 4px solid #dc3545;
                    color: #721c24;
                }

                .notification.success {
                    background-color: #d4edda;
                    border: 1px solid #c3e6cb;
                    border-left: 4px solid #28a745;
                    color: #155724;
                }

                .notification-content {
                    display: flex;
                    align-items: flex-start;
                    padding: 12px 16px;
                    gap: 10px;
                    position: relative;
                }

                .notification-icon {
                    flex-shrink: 0;
                    margin-top: 1px;
                }

                .notification-message {
                    flex: 1;
                    min-width: 0;
                }

                .notification-message p {
                    margin: 0 0 4px 0;
                    font-size: 14px;
                    font-weight: 500;
                    line-height: 1.4;
                    word-wrap: break-word;
                    white-space: pre-wrap;
                }

                .notification-context {
                    font-size: 12px;
                    opacity: 0.8;
                    font-weight: 400;
                }

                .notification-close {
                    flex-shrink: 0;
                    background: none;
                    border: none;
                    cursor: pointer;
                    padding: 2px;
                    border-radius: 3px;
                    transition: background-color 0.2s;
                    color: inherit;
                }

                .notification.error .notification-close:hover {
                    background-color: rgba(114, 28, 36, 0.1);
                }

                .notification.success .notification-close:hover {
                    background-color: rgba(21, 87, 36, 0.1);
                }

                .notification-progress-bar {
                    position: absolute;
                    bottom: 0;
                    left: 0;
                    right: 0;
                    height: 3px;
                    background-color: rgba(0, 0, 0, 0.1);
                }

                .notification-progress-fill {
                    height: 100%;
                    background: linear-gradient(90deg, 
                        rgba(255, 255, 255, 0.8) 0%, 
                        rgba(255, 255, 255, 0.4) 50%, 
                        rgba(255, 255, 255, 0.8) 100%
                    );
                    width: 100%;
                    transform-origin: left;
                    animation: progressCountdown var(--duration) linear forwards;
                }

                .notification.error {
                    --duration: 8s;
                }

                .notification.success {
                    --duration: 3s;
                }

                @keyframes progressCountdown {
                    from {
                        transform: scaleX(1);
                    }
                    to {
                        transform: scaleX(0);
                    }
                }

                @media (max-width: 480px) {
                    .notification {
                        left: 16px;
                        right: 16px;
                        max-width: none;
                        transform: translateY(-120%);
                    }

                    .notification.show {
                        transform: translateY(0);
                    }
                }
            `}</style>
        </ErrorContext.Provider>
    );
};

export const useGlobalError = () => {
    const context = useContext(ErrorContext);
    if (!context) {
        throw new Error('useGlobalError must be used within an ErrorProvider');
    }
    return context;
};
