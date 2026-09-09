(globalThis["TURBOPACK"] || (globalThis["TURBOPACK"] = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[hmr-entry]/hmr-entry.js { ENTRY => \"[project]/src/pages/_app\" }", (function(__turbopack_context__){
"use strict";

__turbopack_context__.r("[next]/entry/page-loader.ts { PAGE => \"[project]/src/pages/_app.js [client] (ecmascript)\" } [client] (ecmascript)");
}),
"[next]/entry/page-loader.ts { PAGE => \"[project]/src/pages/_app.js [client] (ecmascript)\" } [client] (ecmascript)", ((__turbopack_context__, module, exports) => {

const PAGE_PATH = "/_app";
(window.__NEXT_P = window.__NEXT_P || []).push([
    PAGE_PATH,
    ()=>{
        return __turbopack_context__.r("[project]/src/pages/_app.js [client] (ecmascript)");
    }
]);
// @ts-expect-error module.hot exists
if ("TURBOPACK compile-time truthy", 1) {
    // @ts-expect-error module.hot exists
    module.hot.dispose(function() {
        window.__NEXT_P.push([
            PAGE_PATH
        ]);
    });
}
}),
"[project]/src/components/ErrorBoundary.js [client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>__TURBOPACK__default__export__
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/node_modules/next/dist/build/polyfills/process.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/react/jsx-dev-runtime.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$styled$2d$jsx$2f$style$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/styled-jsx/style.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/react/index.js [client] (ecmascript)");
;
;
;
/**
 * Error Boundary Komponente für das Abfangen von React-Fehlern
 */ class ErrorBoundary extends __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["default"].Component {
    constructor(props){
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null
        };
    }
    static getDerivedStateFromError(error) {
        // Update state so the next render will show the fallback UI
        return {
            hasError: true
        };
    }
    componentDidCatch(error, errorInfo) {
        // Log the error to the console for debugging
        console.error('ErrorBoundary caught an error:', error, errorInfo);
        // Store error details in state
        this.setState({
            error,
            errorInfo
        });
        // You can also log the error to an error reporting service here
        if (("TURBOPACK compile-time value", "object") !== 'undefined' && window.gtag) {
            window.gtag('event', 'exception', {
                description: error.toString(),
                fatal: false
            });
        }
    }
    handleRetry = ()=>{
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null
        });
    };
    render() {
        if (this.state.hasError) {
            // Custom fallback UI
            return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "jsx-c7c2a5629ab3e29e" + " " + "error-boundary",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "jsx-c7c2a5629ab3e29e" + " " + "error-boundary-content",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                className: "jsx-c7c2a5629ab3e29e",
                                children: "Etwas ist schiefgelaufen"
                            }, void 0, false, {
                                fileName: "[project]/src/components/ErrorBoundary.js",
                                lineNumber: 54,
                                columnNumber: 25
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "jsx-c7c2a5629ab3e29e",
                                children: "Ein unerwarteter Fehler ist aufgetreten. Bitte laden Sie die Seite neu oder versuchen Sie es später erneut."
                            }, void 0, false, {
                                fileName: "[project]/src/components/ErrorBoundary.js",
                                lineNumber: 55,
                                columnNumber: 25
                            }, this),
                            ("TURBOPACK compile-time value", "development") === 'development' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("details", {
                                className: "jsx-c7c2a5629ab3e29e" + " " + "error-details",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("summary", {
                                        className: "jsx-c7c2a5629ab3e29e",
                                        children: "Technische Details (nur in Entwicklungsumgebung)"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/ErrorBoundary.js",
                                        lineNumber: 62,
                                        columnNumber: 33
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("pre", {
                                        className: "jsx-c7c2a5629ab3e29e" + " " + "error-stack",
                                        children: [
                                            this.state.error && this.state.error.toString(),
                                            this.state.errorInfo.componentStack
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/components/ErrorBoundary.js",
                                        lineNumber: 63,
                                        columnNumber: 33
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/ErrorBoundary.js",
                                lineNumber: 61,
                                columnNumber: 29
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "jsx-c7c2a5629ab3e29e" + " " + "error-actions",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        onClick: this.handleRetry,
                                        className: "jsx-c7c2a5629ab3e29e" + " " + "btn btn-primary",
                                        children: "Erneut versuchen"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/ErrorBoundary.js",
                                        lineNumber: 71,
                                        columnNumber: 29
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        onClick: ()=>window.location.reload(),
                                        className: "jsx-c7c2a5629ab3e29e" + " " + "btn btn-secondary",
                                        children: "Seite neu laden"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/ErrorBoundary.js",
                                        lineNumber: 77,
                                        columnNumber: 29
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/ErrorBoundary.js",
                                lineNumber: 70,
                                columnNumber: 25
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/ErrorBoundary.js",
                        lineNumber: 53,
                        columnNumber: 21
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$styled$2d$jsx$2f$style$2e$js__$5b$client$5d$__$28$ecmascript$29$__["default"], {
                        id: "c7c2a5629ab3e29e",
                        children: ".error-boundary.jsx-c7c2a5629ab3e29e{background-color:#f8f9fa;border-radius:8px;justify-content:center;align-items:center;min-height:400px;margin:2rem;padding:2rem;display:flex}.error-boundary-content.jsx-c7c2a5629ab3e29e{text-align:center;max-width:600px}.error-boundary-content.jsx-c7c2a5629ab3e29e h2.jsx-c7c2a5629ab3e29e{color:#dc3545;margin-bottom:1rem}.error-boundary-content.jsx-c7c2a5629ab3e29e p.jsx-c7c2a5629ab3e29e{color:#6c757d;margin-bottom:2rem;line-height:1.6}.error-details.jsx-c7c2a5629ab3e29e{text-align:left;background-color:#fff;border:1px solid #dee2e6;border-radius:4px;margin:1rem 0;padding:1rem}.error-details.jsx-c7c2a5629ab3e29e summary.jsx-c7c2a5629ab3e29e{cursor:pointer;margin-bottom:.5rem;font-weight:700}.error-stack.jsx-c7c2a5629ab3e29e{background-color:#f8f9fa;border-radius:4px;margin-top:.5rem;padding:1rem;font-size:.875rem;overflow-x:auto}.error-actions.jsx-c7c2a5629ab3e29e{justify-content:center;gap:1rem;display:flex}.btn.jsx-c7c2a5629ab3e29e{cursor:pointer;border:none;border-radius:4px;padding:.75rem 1.5rem;font-size:1rem;transition:background-color .2s}.btn-primary.jsx-c7c2a5629ab3e29e{color:#fff;background-color:#007bff}.btn-primary.jsx-c7c2a5629ab3e29e:hover{background-color:#0056b3}.btn-secondary.jsx-c7c2a5629ab3e29e{color:#fff;background-color:#6c757d}.btn-secondary.jsx-c7c2a5629ab3e29e:hover{background-color:#545b62}"
                    }, void 0, false, void 0, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/ErrorBoundary.js",
                lineNumber: 52,
                columnNumber: 17
            }, this);
        }
        return this.props.children;
    }
}
const __TURBOPACK__default__export__ = ErrorBoundary;
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/components/FirstRunGate.js [client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>FirstRunGate
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/react/jsx-dev-runtime.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/react/index.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$router$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/router.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$axios$2f$lib$2f$axios$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/axios/lib/axios.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$contexts$2f$AdminAuthContext$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/contexts/AdminAuthContext.js [client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
;
;
;
;
function FirstRunGate({ children }) {
    _s();
    const router = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$router$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useRouter"])();
    const { authenticated, loading: authLoading } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$contexts$2f$AdminAuthContext$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useAdminAuth"])();
    const [checking, setChecking] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(true);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "FirstRunGate.useEffect": ()=>{
            if (!router.isReady || authLoading) return;
            let cancelled = false;
            const checkFirstRun = {
                "FirstRunGate.useEffect.checkFirstRun": async ()=>{
                    try {
                        const response = await __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$axios$2f$lib$2f$axios$2e$js__$5b$client$5d$__$28$ecmascript$29$__["default"].get('/api/setupStatus', {
                            timeout: 5000
                        });
                        const setupCompleted = Boolean(response.data?.data?.isSetupCompleted);
                        if (!cancelled && !setupCompleted && !authenticated && router.pathname !== '/admin-login') {
                            await router.replace('/admin-login?next=/setup');
                        }
                    } catch  {
                    // A temporary status-check failure must not make the whole application unusable.
                    } finally{
                        if (!cancelled) setChecking(false);
                    }
                }
            }["FirstRunGate.useEffect.checkFirstRun"];
            checkFirstRun();
            return ({
                "FirstRunGate.useEffect": ()=>{
                    cancelled = true;
                }
            })["FirstRunGate.useEffect"];
        }
    }["FirstRunGate.useEffect"], [
        authenticated,
        authLoading,
        router,
        router.isReady,
        router.pathname
    ]);
    if (checking && router.pathname !== '/admin-login') {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("main", {
            className: "page-container",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                children: "Ersteinrichtung wird vorbereitet…"
            }, void 0, false, {
                fileName: "[project]/src/components/FirstRunGate.js",
                lineNumber: 41,
                columnNumber: 9
            }, this)
        }, void 0, false, {
            fileName: "[project]/src/components/FirstRunGate.js",
            lineNumber: 40,
            columnNumber: 7
        }, this);
    }
    return children;
}
_s(FirstRunGate, "yhHMbWyP9D4kUhrs6J57zpj0Nog=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$router$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useRouter"],
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$contexts$2f$AdminAuthContext$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useAdminAuth"]
    ];
});
_c = FirstRunGate;
var _c;
__turbopack_context__.k.register(_c, "FirstRunGate");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/components/FirstRunTour.js [client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>FirstRunTour
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/react/jsx-dev-runtime.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/react/index.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$router$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/router.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$axios$2f$lib$2f$axios$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/axios/lib/axios.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$contexts$2f$AdminAuthContext$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/contexts/AdminAuthContext.js [client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
;
;
;
;
const TOUR_STEPS = [
    {
        route: '/setup',
        title: 'Willkommen beim Sponsorenlauf-Tool',
        description: 'Wir schauen uns jetzt gemeinsam die wichtigsten Seiten an. Mit „Weiter“ wechseln Sie automatisch zum nächsten Bereich.',
        location: [
            'Einführung'
        ],
        navigationHint: 'Die Einführung kann später unter Admin → Einführung starten erneut geöffnet werden.'
    },
    {
        route: '/setup',
        target: '[data-tour="classes"]',
        title: 'Klassenstruktur',
        description: 'Hier legen Sie zuerst Jahrgänge und Klassen fest. Diese Struktur wird für Importe, Lehrerzuordnungen und Auswertungen verwendet.',
        location: [
            'Admin',
            'Datenbank',
            'Klassenstruktur'
        ],
        navigationHint: 'Oben in der Navigation Admin wählen und im Bereich Datenbank auf Klassenstruktur klicken.'
    },
    {
        route: '/setup',
        target: '[data-tour="modules"]',
        title: 'Funktionen und Scan-Schutz',
        description: 'Aktivieren Sie nur die benötigten Module und bestimmen Sie, wie das Tool mit versehentlichen Doppel-Scans umgehen soll.',
        location: [
            'Admin',
            'Einstellungen',
            'Module verwalten'
        ],
        navigationHint: 'Oben Admin wählen und unter Einstellungen auf Module verwalten klicken.'
    },
    {
        route: '/manage',
        target: '[data-tour="manage"]',
        title: 'Schüler verwalten',
        description: 'Auf dieser Seite können Sie Schüler suchen, hinzufügen, bearbeiten und Ersatz-Barcodes verwalten. Größere Datenmengen importieren Sie unter Admin.',
        location: [
            'Schüler verwalten'
        ],
        navigationHint: 'Diese Seite ist direkt über Schüler verwalten in der oberen Navigation erreichbar.'
    },
    {
        route: '/scan',
        target: '[data-tour="scan"]',
        title: 'Runden zählen',
        description: 'Das ist die wichtigste Ansicht am Veranstaltungstag. Ein Barcode-Scanner schreibt die ID in dieses Feld und bestätigt sie normalerweise automatisch mit Enter.',
        location: [
            'Runden zählen',
            'Scanner'
        ],
        navigationHint: 'Diese Seite ist direkt über Runden zählen in der oberen Navigation erreichbar.'
    },
    {
        route: '/show',
        target: '[data-tour="show"]',
        title: 'Schüler anzeigen',
        description: 'Hier können Sie einen Barcode prüfen und die bisherigen Runden ansehen, ohne versehentlich eine neue Runde hinzuzufügen.',
        location: [
            'Schüler anzeigen',
            'Barcode-Suche'
        ],
        navigationHint: 'Diese Seite ist direkt über Schüler anzeigen in der oberen Navigation erreichbar.'
    },
    {
        route: '/statistics',
        target: '[data-tour="statistics"]',
        title: 'Live-Statistiken',
        description: 'Dieses Dashboard zeigt Fortschritt, Teilnahme, Klassenvergleiche und – falls aktiviert – die Spendenentwicklung.',
        location: [
            'Statistiken',
            'Dashboard'
        ],
        navigationHint: 'Diese Seite ist direkt über Statistiken in der oberen Navigation erreichbar.'
    },
    {
        route: '/mails',
        target: '[data-tour="mail"]',
        title: 'E-Mail und SMTP',
        description: 'Richten Sie den Versand unter Admin → Einstellungen → E-Mail-Versand ein. Dort finden Sie Microsoft-365-OAuth, SMTP-Anbieter, einen Verbindungstest und ausführliche Schritt-für-Schritt-Anleitungen. Anschließend versenden Sie hier die Klassenergebnisse.',
        location: [
            'Admin',
            'Auswertungen',
            'E-Mails versenden'
        ],
        navigationHint: 'Oben Admin wählen und unter Auswertungen auf E-Mails versenden klicken.'
    },
    {
        route: '/setup',
        target: '[data-tour="operations"]',
        title: 'Bereitschaft, Backups und Wartung',
        description: 'Vor dem Lauf prüfen Sie hier Datenbank, Speicher, Scanner und SMTP. Erstellen und laden Sie außerdem Backups direkt über die Weboberfläche herunter.',
        location: [
            'Admin',
            'Einstellungen',
            'Bereitschaft, Backups & Wartung'
        ],
        navigationHint: 'Oben Admin wählen und unter Einstellungen das Kontrollzentrum öffnen.'
    },
    {
        route: '/setup',
        title: 'Die Einführung ist abgeschlossen',
        description: 'Alle gezeigten Einstellungen bleiben unter Admin erreichbar. Richten Sie als Nächstes Klassen und Module ein und importieren Sie anschließend Ihre Teilnehmerdaten.',
        location: [
            'Admin'
        ],
        navigationHint: 'Über Admin erreichen Sie später alle Konfigurations-, Import-, Export- und Wartungsfunktionen.'
    }
];
const getSpotlightRect = (element)=>{
    if (!element) return null;
    const rect = element.getBoundingClientRect();
    const padding = 7;
    return {
        left: rect.left - padding,
        top: rect.top - padding,
        width: rect.width + padding * 2,
        height: rect.height + padding * 2
    };
};
const getPopoverPosition = (element, popover)=>{
    if (!element) return {
        centered: true
    };
    const rect = element.getBoundingClientRect();
    const margin = 16;
    const gap = 18;
    const width = Math.min(380, window.innerWidth - margin * 2);
    const height = Math.min(popover?.scrollHeight || 420, window.innerHeight - margin * 2);
    const clampLeft = (left)=>Math.max(margin, Math.min(left, window.innerWidth - width - margin));
    const clampTop = (top)=>Math.max(margin, Math.min(top, window.innerHeight - height - margin));
    const centeredTop = clampTop(rect.top + rect.height / 2 - height / 2);
    const centeredLeft = clampLeft(rect.left + rect.width / 2 - width / 2);
    if (window.innerWidth - rect.right >= width + gap) {
        return {
            centered: false,
            left: rect.right + gap,
            top: centeredTop,
            width
        };
    }
    if (rect.left >= width + gap) {
        return {
            centered: false,
            left: rect.left - width - gap,
            top: centeredTop,
            width
        };
    }
    if (window.innerHeight - rect.bottom >= height + gap) {
        return {
            centered: false,
            left: centeredLeft,
            top: rect.bottom + gap,
            width
        };
    }
    if (rect.top >= height + gap) {
        return {
            centered: false,
            left: centeredLeft,
            top: rect.top - height - gap,
            width
        };
    }
    return {
        centered: false,
        left: rect.right < window.innerWidth / 2 ? window.innerWidth - width - margin : margin,
        top: margin,
        width
    };
};
function FirstRunTour() {
    _s();
    const router = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$router$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useRouter"])();
    const { authenticated, loading: authLoading } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$contexts$2f$AdminAuthContext$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useAdminAuth"])();
    const [active, setActive] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [currentStep, setCurrentStep] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(0);
    const [targetElement, setTargetElement] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [spotlightRect, setSpotlightRect] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [position, setPosition] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])({
        centered: true
    });
    const [finishing, setFinishing] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const popoverRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const step = TOUR_STEPS[currentStep];
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "FirstRunTour.useEffect": ()=>{
            if (active || authLoading || !authenticated || router.pathname === '/admin-login') return;
            let cancelled = false;
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$axios$2f$lib$2f$axios$2e$js__$5b$client$5d$__$28$ecmascript$29$__["default"].get('/api/setupStatus', {
                timeout: 5000
            }).then({
                "FirstRunTour.useEffect": async (response)=>{
                    const explicitlyStarted = router.query.tour === '1';
                    if (cancelled || response.data?.data?.isSetupCompleted && !explicitlyStarted) return;
                    const requestedStep = Number.parseInt(router.query.step, 10);
                    const initialStep = Number.isInteger(requestedStep) && requestedStep >= 0 && requestedStep < TOUR_STEPS.length ? requestedStep : 0;
                    setActive(true);
                    setCurrentStep(initialStep);
                    if (router.pathname !== TOUR_STEPS[initialStep].route) {
                        await router.replace({
                            pathname: TOUR_STEPS[initialStep].route,
                            query: {
                                tour: '1',
                                step: initialStep
                            }
                        });
                    }
                }
            }["FirstRunTour.useEffect"]).catch({
                "FirstRunTour.useEffect": ()=>{}
            }["FirstRunTour.useEffect"]);
            return ({
                "FirstRunTour.useEffect": ()=>{
                    cancelled = true;
                }
            })["FirstRunTour.useEffect"];
        }
    }["FirstRunTour.useEffect"], [
        active,
        authenticated,
        authLoading,
        router,
        router.pathname,
        router.query.tour
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "FirstRunTour.useEffect": ()=>{
            if (!active || router.pathname !== step.route) return undefined;
            let layoutFrame = null;
            const timer = window.setTimeout({
                "FirstRunTour.useEffect.timer": ()=>{
                    const highlightedElement = step.target ? document.querySelector(step.target) : null;
                    if (highlightedElement) {
                        highlightedElement.scrollIntoView({
                            behavior: 'smooth',
                            block: 'center'
                        });
                    }
                    setTargetElement(highlightedElement);
                    setSpotlightRect(getSpotlightRect(highlightedElement));
                    setPosition(getPopoverPosition(highlightedElement, popoverRef.current));
                    layoutFrame = window.requestAnimationFrame({
                        "FirstRunTour.useEffect.timer": ()=>{
                            setSpotlightRect(getSpotlightRect(highlightedElement));
                            setPosition(getPopoverPosition(highlightedElement, popoverRef.current));
                        }
                    }["FirstRunTour.useEffect.timer"]);
                }
            }["FirstRunTour.useEffect.timer"], 180);
            return ({
                "FirstRunTour.useEffect": ()=>{
                    window.clearTimeout(timer);
                    if (layoutFrame) window.cancelAnimationFrame(layoutFrame);
                }
            })["FirstRunTour.useEffect"];
        }
    }["FirstRunTour.useEffect"], [
        active,
        router.pathname,
        step
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "FirstRunTour.useEffect": ()=>{
            if (!active) return undefined;
            const updatePosition = {
                "FirstRunTour.useEffect.updatePosition": ()=>{
                    setSpotlightRect(getSpotlightRect(targetElement));
                    setPosition(getPopoverPosition(targetElement, popoverRef.current));
                }
            }["FirstRunTour.useEffect.updatePosition"];
            window.addEventListener('resize', updatePosition);
            window.addEventListener('scroll', updatePosition, true);
            return ({
                "FirstRunTour.useEffect": ()=>{
                    window.removeEventListener('resize', updatePosition);
                    window.removeEventListener('scroll', updatePosition, true);
                }
            })["FirstRunTour.useEffect"];
        }
    }["FirstRunTour.useEffect"], [
        active,
        targetElement
    ]);
    const goToStep = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "FirstRunTour.useCallback[goToStep]": async (nextStep)=>{
            const boundedStep = Math.max(0, Math.min(nextStep, TOUR_STEPS.length - 1));
            setTargetElement(null);
            setSpotlightRect(null);
            setPosition({
                centered: true
            });
            setCurrentStep(boundedStep);
            const nextRoute = TOUR_STEPS[boundedStep].route;
            await router.push({
                pathname: nextRoute,
                query: {
                    tour: '1',
                    step: boundedStep
                }
            }, undefined, {
                shallow: router.pathname === nextRoute
            });
        }
    }["FirstRunTour.useCallback[goToStep]"], [
        router
    ]);
    const finishTour = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "FirstRunTour.useCallback[finishTour]": async ()=>{
            setFinishing(true);
            try {
                await __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$axios$2f$lib$2f$axios$2e$js__$5b$client$5d$__$28$ecmascript$29$__["default"].post('/api/setupStatus');
                setActive(false);
                await router.push('/setup');
            } finally{
                setFinishing(false);
            }
        }
    }["FirstRunTour.useCallback[finishTour]"], [
        router
    ]);
    const popoverStyle = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "FirstRunTour.useMemo[popoverStyle]": ()=>position.centered ? undefined : {
                left: `${position.left}px`,
                top: `${position.top}px`,
                width: `${position.width}px`
            }
    }["FirstRunTour.useMemo[popoverStyle]"], [
        position
    ]);
    const spotlightStyle = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "FirstRunTour.useMemo[spotlightStyle]": ()=>spotlightRect ? {
                left: `${spotlightRect.left}px`,
                top: `${spotlightRect.top}px`,
                width: `${spotlightRect.width}px`,
                height: `${spotlightRect.height}px`
            } : undefined
    }["FirstRunTour.useMemo[spotlightStyle]"], [
        spotlightRect
    ]);
    if (!active || router.pathname !== step.route) return null;
    const isLastStep = currentStep === TOUR_STEPS.length - 1;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "first-run-tour",
        "aria-live": "polite",
        children: [
            spotlightRect ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "first-run-tour-spotlight",
                style: spotlightStyle,
                "aria-hidden": "true"
            }, void 0, false, {
                fileName: "[project]/src/components/FirstRunTour.js",
                lineNumber: 259,
                columnNumber: 9
            }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "first-run-tour-backdrop"
            }, void 0, false, {
                fileName: "[project]/src/components/FirstRunTour.js",
                lineNumber: 261,
                columnNumber: 9
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                ref: popoverRef,
                className: `first-run-tour-popover ${position.centered ? 'first-run-tour-popover--centered' : ''}`,
                style: popoverStyle,
                role: "dialog",
                "aria-modal": "true",
                "aria-labelledby": "first-run-tour-title",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "first-run-tour-progress",
                        children: [
                            "Schritt ",
                            currentStep + 1,
                            " von ",
                            TOUR_STEPS.length
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/FirstRunTour.js",
                        lineNumber: 271,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "first-run-tour-location",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                children: "Sie sind hier"
                            }, void 0, false, {
                                fileName: "[project]/src/components/FirstRunTour.js",
                                lineNumber: 273,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "first-run-tour-breadcrumb",
                                "aria-label": `Aktueller Bereich: ${step.location.join(', ')}`,
                                children: step.location.map((item, index)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        children: [
                                            index > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "first-run-tour-breadcrumb-separator",
                                                "aria-hidden": "true",
                                                children: "›"
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/FirstRunTour.js",
                                                lineNumber: 277,
                                                columnNumber: 31
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                                children: item
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/FirstRunTour.js",
                                                lineNumber: 278,
                                                columnNumber: 17
                                            }, this)
                                        ]
                                    }, `${item}-${index}`, true, {
                                        fileName: "[project]/src/components/FirstRunTour.js",
                                        lineNumber: 276,
                                        columnNumber: 15
                                    }, this))
                            }, void 0, false, {
                                fileName: "[project]/src/components/FirstRunTour.js",
                                lineNumber: 274,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/FirstRunTour.js",
                        lineNumber: 272,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                        id: "first-run-tour-title",
                        children: step.title
                    }, void 0, false, {
                        fileName: "[project]/src/components/FirstRunTour.js",
                        lineNumber: 283,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        children: step.description
                    }, void 0, false, {
                        fileName: "[project]/src/components/FirstRunTour.js",
                        lineNumber: 284,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "first-run-tour-navigation-hint",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                children: "So kommen Sie später hierher:"
                            }, void 0, false, {
                                fileName: "[project]/src/components/FirstRunTour.js",
                                lineNumber: 286,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                children: step.navigationHint
                            }, void 0, false, {
                                fileName: "[project]/src/components/FirstRunTour.js",
                                lineNumber: 287,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/FirstRunTour.js",
                        lineNumber: 285,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "first-run-tour-actions",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                type: "button",
                                className: "btn btn-secondary",
                                onClick: finishTour,
                                disabled: finishing,
                                children: "Überspringen"
                            }, void 0, false, {
                                fileName: "[project]/src/components/FirstRunTour.js",
                                lineNumber: 290,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                children: [
                                    currentStep > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        type: "button",
                                        className: "btn btn-secondary",
                                        onClick: ()=>goToStep(currentStep - 1),
                                        children: "Zurück"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/FirstRunTour.js",
                                        lineNumber: 295,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        type: "button",
                                        className: "btn btn-primary",
                                        onClick: isLastStep ? finishTour : ()=>goToStep(currentStep + 1),
                                        disabled: finishing,
                                        children: finishing ? 'Bitte warten…' : isLastStep ? 'Tour beenden' : 'Weiter'
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/FirstRunTour.js",
                                        lineNumber: 299,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/FirstRunTour.js",
                                lineNumber: 293,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/FirstRunTour.js",
                        lineNumber: 289,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/FirstRunTour.js",
                lineNumber: 263,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/FirstRunTour.js",
        lineNumber: 257,
        columnNumber: 5
    }, this);
}
_s(FirstRunTour, "8qeGTzDWKhgW5YJpQyHb3kn379s=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$router$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useRouter"],
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$contexts$2f$AdminAuthContext$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useAdminAuth"]
    ];
});
_c = FirstRunTour;
var _c;
__turbopack_context__.k.register(_c, "FirstRunTour");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/components/Layout.js [client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>Layout
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/react/jsx-dev-runtime.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$Topbar$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/Topbar.js [client] (ecmascript)");
;
;
function Layout({ children, className = 'layout-main' }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["Fragment"], {
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$Topbar$2e$js__$5b$client$5d$__$28$ecmascript$29$__["default"], {}, void 0, false, {
                fileName: "[project]/src/components/Layout.js",
                lineNumber: 6,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("main", {
                id: "main-content",
                className: className,
                children: children
            }, void 0, false, {
                fileName: "[project]/src/components/Layout.js",
                lineNumber: 7,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/Layout.js",
        lineNumber: 5,
        columnNumber: 5
    }, this);
}
_c = Layout;
var _c;
__turbopack_context__.k.register(_c, "Layout");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/components/Topbar.js [client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>Topbar
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/react/jsx-dev-runtime.js [client] (ecmascript)");
/* eslint-disable @next/next/no-img-element */ var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$link$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/link.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$router$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/router.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/react/index.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$styles$2f$Topbar$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__ = __turbopack_context__.i("[project]/src/styles/Topbar.module.css [client] (css module)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$contexts$2f$AdminAuthContext$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/contexts/AdminAuthContext.js [client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
;
;
;
;
;
function Topbar() {
    _s();
    const [isDarkMode, setIsDarkMode] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const router = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$router$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useRouter"])();
    const { authenticated, logout } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$contexts$2f$AdminAuthContext$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useAdminAuth"])();
    const applyTheme = (darkMode, persist = false)=>{
        const theme = darkMode ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', theme);
        document.body.setAttribute('data-theme', theme);
        if (persist) {
            localStorage.setItem('theme', theme);
        }
    };
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "Topbar.useEffect": ()=>{
            const savedTheme = localStorage.getItem('theme');
            const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            const darkMode = savedTheme === 'dark' || !savedTheme && systemPrefersDark;
            setIsDarkMode(darkMode);
            applyTheme(darkMode);
        }
    }["Topbar.useEffect"], []);
    const toggleTheme = ()=>{
        const newTheme = !isDarkMode;
        setIsDarkMode(newTheme);
        applyTheme(newTheme, true);
    };
    const primaryNavItems = [
        {
            href: '/scan',
            label: 'Runden zählen'
        },
        {
            href: '/show',
            label: 'Schüler anzeigen'
        },
        {
            href: '/statistics',
            label: 'Statistiken'
        },
        ...authenticated ? [
            {
                href: '/manage',
                label: 'Schüler verwalten'
            },
            {
                href: '/setup',
                label: 'Admin'
            }
        ] : [
            {
                href: '/admin-login',
                label: 'Admin 🔒'
            }
        ]
    ];
    const isActive = (href)=>router.pathname === href;
    const getLinkClassName = (href)=>{
        const classes = [
            __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$styles$2f$Topbar$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].navLink
        ];
        if (isActive(href)) {
            classes.push(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$styles$2f$Topbar$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].navLinkActive);
        }
        return classes.join(' ');
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("header", {
        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$styles$2f$Topbar$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].topbar,
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$link$2e$js__$5b$client$5d$__$28$ecmascript$29$__["default"], {
                href: "/scan",
                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$styles$2f$Topbar$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].brand,
                "aria-label": "Zur Scan-Ansicht wechseln",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("img", {
                    src: "/logo.png",
                    alt: "Sponsorenlauf Tool",
                    className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$styles$2f$Topbar$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].logo
                }, void 0, false, {
                    fileName: "[project]/src/components/Topbar.js",
                    lineNumber: 63,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/src/components/Topbar.js",
                lineNumber: 62,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("nav", {
                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$styles$2f$Topbar$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].navContainer,
                "aria-label": "Hauptnavigation",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$styles$2f$Topbar$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].primaryNav,
                    children: primaryNavItems.map((item)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$link$2e$js__$5b$client$5d$__$28$ecmascript$29$__["default"], {
                            href: item.href,
                            className: getLinkClassName(item.href),
                            "aria-current": isActive(item.href) ? 'page' : undefined,
                            children: item.label
                        }, item.href, false, {
                            fileName: "[project]/src/components/Topbar.js",
                            lineNumber: 69,
                            columnNumber: 13
                        }, this))
                }, void 0, false, {
                    fileName: "[project]/src/components/Topbar.js",
                    lineNumber: 67,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/src/components/Topbar.js",
                lineNumber: 66,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$styles$2f$Topbar$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].headerActions,
                children: [
                    authenticated && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$styles$2f$Topbar$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].logoutButton,
                        type: "button",
                        onClick: async ()=>{
                            await logout();
                            router.push('/scan');
                        },
                        children: "Sperren"
                    }, void 0, false, {
                        fileName: "[project]/src/components/Topbar.js",
                        lineNumber: 83,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$styles$2f$Topbar$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].themeToggle,
                        onClick: toggleTheme,
                        type: "button",
                        "aria-label": `Zu ${isDarkMode ? 'Hell' : 'Dunkel'}modus wechseln`,
                        "aria-pressed": isDarkMode,
                        title: `Zu ${isDarkMode ? 'Hell' : 'Dunkel'}modus wechseln`,
                        children: isDarkMode ? '☀️' : '🌙'
                    }, void 0, false, {
                        fileName: "[project]/src/components/Topbar.js",
                        lineNumber: 94,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/Topbar.js",
                lineNumber: 81,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/Topbar.js",
        lineNumber: 61,
        columnNumber: 5
    }, this);
}
_s(Topbar, "IDFsxIYGJKIwEoMVLx2FivIrEAQ=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$router$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useRouter"],
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$contexts$2f$AdminAuthContext$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useAdminAuth"]
    ];
});
_c = Topbar;
var _c;
__turbopack_context__.k.register(_c, "Topbar");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/contexts/AdminAuthContext.js [client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "AdminAuthProvider",
    ()=>AdminAuthProvider,
    "useAdminAuth",
    ()=>useAdminAuth
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/react/jsx-dev-runtime.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/react/index.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$axios$2f$lib$2f$axios$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/axios/lib/axios.js [client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature(), _s1 = __turbopack_context__.k.signature();
;
;
const AdminAuthContext = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createContext"])(null);
const AdminAuthProvider = ({ children })=>{
    _s();
    const [configured, setConfigured] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [authenticated, setAuthenticated] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(true);
    const refresh = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "AdminAuthProvider.useCallback[refresh]": async ()=>{
            try {
                const response = await __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$axios$2f$lib$2f$axios$2e$js__$5b$client$5d$__$28$ecmascript$29$__["default"].get('/api/admin-auth', {
                    timeout: 5000
                });
                setConfigured(Boolean(response.data?.data?.configured));
                setAuthenticated(Boolean(response.data?.data?.authenticated));
                return response.data?.data;
            } catch  {
                setAuthenticated(false);
                return null;
            } finally{
                setLoading(false);
            }
        }
    }["AdminAuthProvider.useCallback[refresh]"], []);
    const logout = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "AdminAuthProvider.useCallback[logout]": async ()=>{
            await __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$axios$2f$lib$2f$axios$2e$js__$5b$client$5d$__$28$ecmascript$29$__["default"].post('/api/admin-auth', {
                action: 'logout'
            });
            setAuthenticated(false);
        }
    }["AdminAuthProvider.useCallback[logout]"], []);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "AdminAuthProvider.useEffect": ()=>{
            refresh();
        }
    }["AdminAuthProvider.useEffect"], [
        refresh
    ]);
    const value = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "AdminAuthProvider.useMemo[value]": ()=>({
                configured,
                authenticated,
                loading,
                refresh,
                logout
            })
    }["AdminAuthProvider.useMemo[value]"], [
        authenticated,
        configured,
        loading,
        logout,
        refresh
    ]);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(AdminAuthContext.Provider, {
        value: value,
        children: children
    }, void 0, false, {
        fileName: "[project]/src/contexts/AdminAuthContext.js",
        lineNumber: 40,
        columnNumber: 12
    }, ("TURBOPACK compile-time value", void 0));
};
_s(AdminAuthProvider, "XZMM9gVtht5yldKsxO+oL6N3s1w=");
_c = AdminAuthProvider;
const useAdminAuth = ()=>{
    _s1();
    const context = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useContext"])(AdminAuthContext);
    if (!context) throw new Error('useAdminAuth muss innerhalb von AdminAuthProvider verwendet werden');
    return context;
};
_s1(useAdminAuth, "b9L3QQ+jgeyIrH0NfHrJ8nn7VMU=");
var _c;
__turbopack_context__.k.register(_c, "AdminAuthProvider");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/contexts/DonationDisplayModeContext.js [client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "DonationDisplayModeProvider",
    ()=>DonationDisplayModeProvider,
    "useDonationDisplayMode",
    ()=>useDonationDisplayMode
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/react/jsx-dev-runtime.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/react/index.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$useApi$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/hooks/useApi.js [client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature(), _s1 = __turbopack_context__.k.signature();
;
;
const DonationDisplayModeContext = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createContext"])();
const DonationDisplayModeProvider = ({ children })=>{
    _s();
    const [mode, setMode] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])('expected');
    const { request } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$useApi$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useApi"])();
    // Initiale Einstellung aus Backend laden
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "DonationDisplayModeProvider.useEffect": ()=>{
            const fetchMode = {
                "DonationDisplayModeProvider.useEffect.fetchMode": async ()=>{
                    try {
                        const data = await request('/api/donationSettings');
                        setMode(data.donationDisplayMode || 'expected');
                    } catch  {
                        setMode('expected');
                    }
                }
            }["DonationDisplayModeProvider.useEffect.fetchMode"];
            fetchMode();
        }
    }["DonationDisplayModeProvider.useEffect"], [
        request
    ]);
    // Modus ändern und im Backend speichern
    const updateMode = async (newMode)=>{
        setMode(newMode);
        try {
            await request('/api/donationSettings', {
                method: 'POST',
                data: {
                    donationDisplayMode: newMode
                },
                headers: {
                    'Content-Type': 'application/json'
                }
            });
        } catch (error) {
            console.error('Fehler beim Speichern des Donation Display Mode:', error);
        // Optional: Rollback bei Fehler
        // setMode(previousMode);
        }
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(DonationDisplayModeContext.Provider, {
        value: {
            mode,
            updateMode
        },
        children: children
    }, void 0, false, {
        fileName: "[project]/src/contexts/DonationDisplayModeContext.js",
        lineNumber: 42,
        columnNumber: 9
    }, ("TURBOPACK compile-time value", void 0));
};
_s(DonationDisplayModeProvider, "t5BYPo2sKHVLhZiaie3NW9Dd/bI=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$useApi$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useApi"]
    ];
});
_c = DonationDisplayModeProvider;
const useDonationDisplayMode = ()=>{
    _s1();
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useContext"])(DonationDisplayModeContext);
};
_s1(useDonationDisplayMode, "gDsCjeeItUuvgOWf1v4qoK9RF6k=");
var _c;
__turbopack_context__.k.register(_c, "DonationDisplayModeProvider");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/contexts/ErrorContext.js [client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ErrorProvider",
    ()=>ErrorProvider,
    "useGlobalError",
    ()=>useGlobalError
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/react/jsx-dev-runtime.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$styled$2d$jsx$2f$style$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/styled-jsx/style.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/react/index.js [client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature(), _s1 = __turbopack_context__.k.signature();
;
;
const ErrorContext = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createContext"])();
const ErrorProvider = ({ children })=>{
    _s();
    const [notification, setNotification] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [isVisible, setIsVisible] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const timeoutRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const showNotification = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "ErrorProvider.useCallback[showNotification]": (message, type = 'error', context = '', autoClose = true)=>{
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
            setNotification({
                message: displayMessage,
                type,
                context
            });
            setIsVisible(true);
            // Auto-dismiss
            if (autoClose) {
                const timeout = type === 'success' ? 3000 : 8000;
                timeoutRef.current = setTimeout({
                    "ErrorProvider.useCallback[showNotification]": ()=>{
                        setIsVisible(false);
                        setTimeout({
                            "ErrorProvider.useCallback[showNotification]": ()=>setNotification(null)
                        }["ErrorProvider.useCallback[showNotification]"], 300);
                    }
                }["ErrorProvider.useCallback[showNotification]"], timeout);
            }
        }
    }["ErrorProvider.useCallback[showNotification]"], []);
    const showError = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "ErrorProvider.useCallback[showError]": (error, context = '')=>{
            showNotification(error, 'error', context);
        }
    }["ErrorProvider.useCallback[showError]"], [
        showNotification
    ]);
    const showSuccess = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "ErrorProvider.useCallback[showSuccess]": (message, context = '')=>{
            showNotification(message, 'success', context);
        }
    }["ErrorProvider.useCallback[showSuccess]"], [
        showNotification
    ]);
    const dismiss = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "ErrorProvider.useCallback[dismiss]": ()=>{
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
            setIsVisible(false);
            setTimeout({
                "ErrorProvider.useCallback[dismiss]": ()=>setNotification(null)
            }["ErrorProvider.useCallback[dismiss]"], 300);
        }
    }["ErrorProvider.useCallback[dismiss]"], []);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(ErrorContext.Provider, {
        value: {
            showError,
            showSuccess,
            dismiss
        },
        children: [
            children,
            notification && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "jsx-7917b33124df91e" + " " + `notification ${isVisible ? 'show' : ''} ${notification.type}`,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "jsx-7917b33124df91e" + " " + "notification-content",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "jsx-7917b33124df91e" + " " + "notification-icon",
                                children: notification.type === 'success' ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                    width: "20",
                                    height: "20",
                                    viewBox: "0 0 24 24",
                                    fill: "none",
                                    className: "jsx-7917b33124df91e",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                        d: "M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z",
                                        stroke: "currentColor",
                                        strokeWidth: "2",
                                        strokeLinecap: "round",
                                        strokeLinejoin: "round",
                                        className: "jsx-7917b33124df91e"
                                    }, void 0, false, {
                                        fileName: "[project]/src/contexts/ErrorContext.js",
                                        lineNumber: 68,
                                        columnNumber: 37
                                    }, ("TURBOPACK compile-time value", void 0))
                                }, void 0, false, {
                                    fileName: "[project]/src/contexts/ErrorContext.js",
                                    lineNumber: 67,
                                    columnNumber: 33
                                }, ("TURBOPACK compile-time value", void 0)) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                    width: "20",
                                    height: "20",
                                    viewBox: "0 0 24 24",
                                    fill: "none",
                                    className: "jsx-7917b33124df91e",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                        d: "M12 9V11M12 15H12.01M5.07183 19H18.9282C20.4678 19 21.4301 17.3333 20.6603 16L13.7321 4C12.9623 2.66667 11.0377 2.66667 10.2679 4L3.33975 16C2.56987 17.3333 3.53223 19 5.07183 19Z",
                                        stroke: "currentColor",
                                        strokeWidth: "2",
                                        strokeLinecap: "round",
                                        strokeLinejoin: "round",
                                        className: "jsx-7917b33124df91e"
                                    }, void 0, false, {
                                        fileName: "[project]/src/contexts/ErrorContext.js",
                                        lineNumber: 78,
                                        columnNumber: 37
                                    }, ("TURBOPACK compile-time value", void 0))
                                }, void 0, false, {
                                    fileName: "[project]/src/contexts/ErrorContext.js",
                                    lineNumber: 77,
                                    columnNumber: 33
                                }, ("TURBOPACK compile-time value", void 0))
                            }, void 0, false, {
                                fileName: "[project]/src/contexts/ErrorContext.js",
                                lineNumber: 65,
                                columnNumber: 25
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "jsx-7917b33124df91e" + " " + "notification-message",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "jsx-7917b33124df91e",
                                        children: notification.message
                                    }, void 0, false, {
                                        fileName: "[project]/src/contexts/ErrorContext.js",
                                        lineNumber: 89,
                                        columnNumber: 29
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    notification.context && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("small", {
                                        className: "jsx-7917b33124df91e" + " " + "notification-context",
                                        children: notification.context
                                    }, void 0, false, {
                                        fileName: "[project]/src/contexts/ErrorContext.js",
                                        lineNumber: 91,
                                        columnNumber: 33
                                    }, ("TURBOPACK compile-time value", void 0))
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/contexts/ErrorContext.js",
                                lineNumber: 88,
                                columnNumber: 25
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                onClick: dismiss,
                                "aria-label": "Schließen",
                                className: "jsx-7917b33124df91e" + " " + "notification-close",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                    width: "16",
                                    height: "16",
                                    viewBox: "0 0 24 24",
                                    fill: "none",
                                    className: "jsx-7917b33124df91e",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                        d: "M18 6L6 18M6 6L18 18",
                                        stroke: "currentColor",
                                        strokeWidth: "2",
                                        strokeLinecap: "round",
                                        strokeLinejoin: "round",
                                        className: "jsx-7917b33124df91e"
                                    }, void 0, false, {
                                        fileName: "[project]/src/contexts/ErrorContext.js",
                                        lineNumber: 96,
                                        columnNumber: 33
                                    }, ("TURBOPACK compile-time value", void 0))
                                }, void 0, false, {
                                    fileName: "[project]/src/contexts/ErrorContext.js",
                                    lineNumber: 95,
                                    columnNumber: 29
                                }, ("TURBOPACK compile-time value", void 0))
                            }, void 0, false, {
                                fileName: "[project]/src/contexts/ErrorContext.js",
                                lineNumber: 94,
                                columnNumber: 25
                            }, ("TURBOPACK compile-time value", void 0))
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/contexts/ErrorContext.js",
                        lineNumber: 64,
                        columnNumber: 21
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "jsx-7917b33124df91e" + " " + "notification-progress-bar",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "jsx-7917b33124df91e" + " " + "notification-progress-fill"
                        }, void 0, false, {
                            fileName: "[project]/src/contexts/ErrorContext.js",
                            lineNumber: 107,
                            columnNumber: 25
                        }, ("TURBOPACK compile-time value", void 0))
                    }, void 0, false, {
                        fileName: "[project]/src/contexts/ErrorContext.js",
                        lineNumber: 106,
                        columnNumber: 21
                    }, ("TURBOPACK compile-time value", void 0))
                ]
            }, void 0, true, {
                fileName: "[project]/src/contexts/ErrorContext.js",
                lineNumber: 63,
                columnNumber: 17
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$styled$2d$jsx$2f$style$2e$js__$5b$client$5d$__$28$ecmascript$29$__["default"], {
                id: "7917b33124df91e",
                children: ".notification.jsx-7917b33124df91e{z-index:1000;border-radius:8px;max-width:400px;transition:transform .3s ease-in-out;position:fixed;top:20px;right:20px;overflow:hidden;transform:translate(100%);box-shadow:0 4px 12px #00000026}.notification.show.jsx-7917b33124df91e{transform:translate(0)}.notification.error.jsx-7917b33124df91e{color:#721c24;background-color:#f8d7da;border:1px solid #f5c6cb;border-left:4px solid #dc3545}.notification.success.jsx-7917b33124df91e{color:#155724;background-color:#d4edda;border:1px solid #c3e6cb;border-left:4px solid #28a745}.notification-content.jsx-7917b33124df91e{align-items:flex-start;gap:10px;padding:12px 16px;display:flex;position:relative}.notification-icon.jsx-7917b33124df91e{flex-shrink:0;margin-top:1px}.notification-message.jsx-7917b33124df91e{flex:1;min-width:0}.notification-message.jsx-7917b33124df91e p.jsx-7917b33124df91e{word-wrap:break-word;white-space:pre-wrap;margin:0 0 4px;font-size:14px;font-weight:500;line-height:1.4}.notification-context.jsx-7917b33124df91e{opacity:.8;font-size:12px;font-weight:400}.notification-close.jsx-7917b33124df91e{cursor:pointer;color:inherit;background:0 0;border:none;border-radius:3px;flex-shrink:0;padding:2px;transition:background-color .2s}.notification.error.jsx-7917b33124df91e .notification-close.jsx-7917b33124df91e:hover{background-color:#721c241a}.notification.success.jsx-7917b33124df91e .notification-close.jsx-7917b33124df91e:hover{background-color:#1557241a}.notification-progress-bar.jsx-7917b33124df91e{background-color:#0000001a;height:3px;position:absolute;bottom:0;left:0;right:0}.notification-progress-fill.jsx-7917b33124df91e{transform-origin:0;width:100%;height:100%;animation:progressCountdown var(--duration) linear forwards;background:linear-gradient(90deg,#fffc 0%,#fff6 50%,#fffc 100%)}.notification.error.jsx-7917b33124df91e{--duration:8s}.notification.success.jsx-7917b33124df91e{--duration:3s}@keyframes progressCountdown{0%{transform:scaleX(1)}to{transform:scaleX(0)}}@media (width<=480px){.notification.jsx-7917b33124df91e{max-width:none;left:16px;right:16px;transform:translateY(-120%)}.notification.show.jsx-7917b33124df91e{transform:translateY(0)}}"
            }, void 0, false, void 0, ("TURBOPACK compile-time value", void 0))
        ]
    }, void 0, true, {
        fileName: "[project]/src/contexts/ErrorContext.js",
        lineNumber: 60,
        columnNumber: 9
    }, ("TURBOPACK compile-time value", void 0));
};
_s(ErrorProvider, "lWrTSwcuoaaIKsr0NTt8enAdj5I=");
_c = ErrorProvider;
const useGlobalError = ()=>{
    _s1();
    const context = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useContext"])(ErrorContext);
    if (!context) {
        throw new Error('useGlobalError must be used within an ErrorProvider');
    }
    return context;
};
_s1(useGlobalError, "b9L3QQ+jgeyIrH0NfHrJ8nn7VMU=");
var _c;
__turbopack_context__.k.register(_c, "ErrorProvider");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/contexts/ModuleConfigContext.js [client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ModuleConfigProvider",
    ()=>ModuleConfigProvider,
    "useModuleConfig",
    ()=>useModuleConfig
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/react/jsx-dev-runtime.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/react/index.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$useApi$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/hooks/useApi.js [client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature(), _s1 = __turbopack_context__.k.signature();
;
;
const ModuleConfigContext = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createContext"])();
const ModuleConfigProvider = ({ children })=>{
    _s();
    const [config, setConfig] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])({
        donations: true,
        emails: true,
        teachers: true
    });
    const { request } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$useApi$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useApi"])();
    // Initiale Konfiguration aus Backend laden
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "ModuleConfigProvider.useEffect": ()=>{
            const fetchConfig = {
                "ModuleConfigProvider.useEffect.fetchConfig": async ()=>{
                    try {
                        const data = await request('/api/moduleConfig');
                        setConfig({
                            donations: data.donations !== false,
                            emails: data.emails !== false,
                            teachers: data.teachers !== false
                        });
                    } catch  {
                        // Fallback zu Standard-Konfiguration
                        setConfig({
                            donations: true,
                            emails: true,
                            teachers: true
                        });
                    }
                }
            }["ModuleConfigProvider.useEffect.fetchConfig"];
            fetchConfig();
        }
    }["ModuleConfigProvider.useEffect"], [
        request
    ]);
    // Konfiguration ändern und im Backend speichern
    const updateConfig = async (newConfig)=>{
        setConfig(newConfig);
        try {
            await request('/api/moduleConfig', {
                method: 'POST',
                data: newConfig,
                headers: {
                    'Content-Type': 'application/json'
                }
            });
        } catch (error) {
            console.error('Fehler beim Speichern der Modul-Konfiguration:', error);
        }
    };
    const updateModule = async (module, enabled)=>{
        const newConfig = {
            ...config,
            [module]: enabled
        };
        await updateConfig(newConfig);
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(ModuleConfigContext.Provider, {
        value: {
            config,
            updateConfig,
            updateModule,
            isDonationsEnabled: config.donations,
            isEmailsEnabled: config.emails,
            isTeachersEnabled: config.teachers
        },
        children: children
    }, void 0, false, {
        fileName: "[project]/src/contexts/ModuleConfigContext.js",
        lineNumber: 59,
        columnNumber: 9
    }, ("TURBOPACK compile-time value", void 0));
};
_s(ModuleConfigProvider, "2bbOMNMP8oIktHNPaCWaXZT+WF0=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$useApi$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useApi"]
    ];
});
_c = ModuleConfigProvider;
const useModuleConfig = ()=>{
    _s1();
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useContext"])(ModuleConfigContext);
};
_s1(useModuleConfig, "gDsCjeeItUuvgOWf1v4qoK9RF6k=");
var _c;
__turbopack_context__.k.register(_c, "ModuleConfigProvider");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/hooks/useApi.js [client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "useApi",
    ()=>useApi
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/react/index.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$axios$2f$lib$2f$axios$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/axios/lib/axios.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$contexts$2f$ErrorContext$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/contexts/ErrorContext.js [client] (ecmascript)");
var _s = __turbopack_context__.k.signature();
;
;
;
const ERROR_MESSAGES = {
    400: 'Ungültige Anfrage',
    401: 'Nicht autorisiert',
    403: 'Zugriff verweigert',
    404: 'Nicht gefunden',
    409: 'Konflikt - Daten bereits vorhanden',
    422: 'Validierungsfehler',
    429: 'Zu viele Anfragen. Bitte warten Sie einen Moment.',
    500: 'Serverfehler. Bitte versuchen Sie es später erneut.',
    502: 'Server nicht erreichbar',
    503: 'Service vorübergehend nicht verfügbar'
};
const useApi = ()=>{
    _s();
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const { showError } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$contexts$2f$ErrorContext$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useGlobalError"])();
    const request = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useApi.useCallback[request]": async (url, options = {})=>{
            setLoading(true);
            try {
                const response = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$axios$2f$lib$2f$axios$2e$js__$5b$client$5d$__$28$ecmascript$29$__["default"])({
                    url,
                    method: 'GET',
                    timeout: 30000,
                    ...options
                });
                // Handle API response format
                if (response.data?.hasOwnProperty('success')) {
                    if (!response.data.success) {
                        throw new Error(response.data.message || 'API-Fehler');
                    }
                    return response.data.data !== undefined ? response.data.data : response.data;
                }
                return response.data;
            } catch (err) {
                let errorMessage = 'Ein Fehler ist aufgetreten';
                if (err.code === 'ECONNABORTED') {
                    errorMessage = 'Die Anfrage dauerte zu lange. Bitte versuchen Sie es erneut.';
                } else if (err.response) {
                    const { status, data } = err.response;
                    errorMessage = (data?.errors?.length > 0 ? data.errors.join('\n') : null) || data?.message || ERROR_MESSAGES[status] || (status >= 500 ? 'Serverfehler. Bitte versuchen Sie es später erneut.' : errorMessage);
                } else if (err.request) {
                    errorMessage = 'Keine Antwort vom Server. Bitte überprüfen Sie Ihre Internetverbindung.';
                } else {
                    errorMessage = err.message || 'Unbekannter Fehler';
                }
                // Show error automatically unless disabled
                if (options.showErrorMessage !== false) {
                    showError(errorMessage, options.errorContext || `API-Request zu ${url}`);
                }
                const enhancedError = new Error(errorMessage);
                enhancedError.originalError = err;
                enhancedError.response = err.response;
                enhancedError.data = err.response?.data;
                enhancedError.status = err.response?.status;
                throw enhancedError;
            } finally{
                setLoading(false);
            }
        }
    }["useApi.useCallback[request]"], [
        showError
    ]);
    return {
        request,
        loading
    };
};
_s(useApi, "l6miw5tsgnDzEl1UBrDp/8Kd36g=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$contexts$2f$ErrorContext$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useGlobalError"]
    ];
});
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/pages/_app.js [client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>__TURBOPACK__default__export__
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/react/jsx-dev-runtime.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$Layout$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/Layout.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ErrorBoundary$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/ErrorBoundary.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$contexts$2f$ErrorContext$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/contexts/ErrorContext.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$contexts$2f$DonationDisplayModeContext$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/contexts/DonationDisplayModeContext.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$contexts$2f$ModuleConfigContext$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/contexts/ModuleConfigContext.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$contexts$2f$AdminAuthContext$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/contexts/AdminAuthContext.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$FirstRunGate$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/FirstRunGate.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$FirstRunTour$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/FirstRunTour.js [client] (ecmascript)");
;
;
;
;
;
;
;
;
;
;
;
;
function MyApp({ Component, pageProps }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$contexts$2f$ErrorContext$2e$js__$5b$client$5d$__$28$ecmascript$29$__["ErrorProvider"], {
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$contexts$2f$AdminAuthContext$2e$js__$5b$client$5d$__$28$ecmascript$29$__["AdminAuthProvider"], {
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$FirstRunGate$2e$js__$5b$client$5d$__$28$ecmascript$29$__["default"], {
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$contexts$2f$ModuleConfigContext$2e$js__$5b$client$5d$__$28$ecmascript$29$__["ModuleConfigProvider"], {
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$contexts$2f$DonationDisplayModeContext$2e$js__$5b$client$5d$__$28$ecmascript$29$__["DonationDisplayModeProvider"], {
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ErrorBoundary$2e$js__$5b$client$5d$__$28$ecmascript$29$__["default"], {
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$Layout$2e$js__$5b$client$5d$__$28$ecmascript$29$__["default"], {
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Component, {
                                        ...pageProps
                                    }, void 0, false, {
                                        fileName: "[project]/src/pages/_app.js",
                                        lineNumber: 22,
                                        columnNumber: 19
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/src/pages/_app.js",
                                    lineNumber: 21,
                                    columnNumber: 17
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$FirstRunTour$2e$js__$5b$client$5d$__$28$ecmascript$29$__["default"], {}, void 0, false, {
                                    fileName: "[project]/src/pages/_app.js",
                                    lineNumber: 24,
                                    columnNumber: 17
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/pages/_app.js",
                            lineNumber: 20,
                            columnNumber: 15
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/src/pages/_app.js",
                        lineNumber: 19,
                        columnNumber: 13
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/src/pages/_app.js",
                    lineNumber: 18,
                    columnNumber: 11
                }, this)
            }, void 0, false, {
                fileName: "[project]/src/pages/_app.js",
                lineNumber: 17,
                columnNumber: 9
            }, this)
        }, void 0, false, {
            fileName: "[project]/src/pages/_app.js",
            lineNumber: 16,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/src/pages/_app.js",
        lineNumber: 15,
        columnNumber: 5
    }, this);
}
_c = MyApp;
const __TURBOPACK__default__export__ = MyApp;
var _c;
__turbopack_context__.k.register(_c, "MyApp");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/styles/Topbar.module.css [client] (css module)", ((__turbopack_context__) => {

__turbopack_context__.v({
  "brand": "Topbar-module__q43dPW__brand",
  "headerActions": "Topbar-module__q43dPW__headerActions",
  "logo": "Topbar-module__q43dPW__logo",
  "logoutButton": "Topbar-module__q43dPW__logoutButton",
  "navContainer": "Topbar-module__q43dPW__navContainer",
  "navLink": "Topbar-module__q43dPW__navLink",
  "navLinkActive": "Topbar-module__q43dPW__navLinkActive",
  "primaryNav": "Topbar-module__q43dPW__primaryNav",
  "themeToggle": "Topbar-module__q43dPW__themeToggle",
  "topbar": "Topbar-module__q43dPW__topbar",
});
}),
"[turbopack]/browser/dev/hmr-client/hmr-client.ts [client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/// <reference path="../../../shared/runtime/runtime-types.d.ts" />
/// <reference path="../../../shared/runtime/dev-globals.d.ts" />
/// <reference path="../../../shared/runtime/dev-protocol.d.ts" />
/// <reference path="../../../shared/runtime/dev-extensions.ts" />
__turbopack_context__.s([
    "connect",
    ()=>connect,
    "setHooks",
    ()=>setHooks,
    "subscribeToUpdate",
    ()=>subscribeToUpdate
]);
function connect({ addMessageListener, sendMessage, onUpdateError = console.error }) {
    addMessageListener((msg)=>{
        switch(msg.type){
            case 'turbopack-connected':
                handleSocketConnected(sendMessage);
                break;
            default:
                try {
                    if (Array.isArray(msg.data)) {
                        for(let i = 0; i < msg.data.length; i++){
                            handleSocketMessage(msg.data[i]);
                        }
                    } else {
                        handleSocketMessage(msg.data);
                    }
                    applyAggregatedUpdates();
                } catch (e) {
                    console.warn('[Fast Refresh] performing full reload\n\n' + "Fast Refresh will perform a full reload when you edit a file that's imported by modules outside of the React rendering tree.\n" + 'You might have a file which exports a React component but also exports a value that is imported by a non-React component file.\n' + 'Consider migrating the non-React component export to a separate file and importing it into both files.\n\n' + 'It is also possible the parent component of the component you edited is a class component, which disables Fast Refresh.\n' + 'Fast Refresh requires at least one parent function component in your React tree.');
                    onUpdateError(e);
                    location.reload();
                }
                break;
        }
    });
    const queued = globalThis.TURBOPACK_CHUNK_UPDATE_LISTENERS;
    if (queued != null && !Array.isArray(queued)) {
        throw new Error('A separate HMR handler was already registered');
    }
    globalThis.TURBOPACK_CHUNK_UPDATE_LISTENERS = {
        push: ([chunkPath, callback])=>{
            subscribeToChunkUpdate(chunkPath, sendMessage, callback);
        }
    };
    if (Array.isArray(queued)) {
        for (const [chunkPath, callback] of queued){
            subscribeToChunkUpdate(chunkPath, sendMessage, callback);
        }
    }
}
const updateCallbackSets = new Map();
function sendJSON(sendMessage, message) {
    sendMessage(JSON.stringify(message));
}
function resourceKey(resource) {
    return JSON.stringify({
        path: resource.path,
        headers: resource.headers || null
    });
}
function subscribeToUpdates(sendMessage, resource) {
    sendJSON(sendMessage, {
        type: 'turbopack-subscribe',
        ...resource
    });
    return ()=>{
        sendJSON(sendMessage, {
            type: 'turbopack-unsubscribe',
            ...resource
        });
    };
}
function handleSocketConnected(sendMessage) {
    for (const key of updateCallbackSets.keys()){
        subscribeToUpdates(sendMessage, JSON.parse(key));
    }
}
// we aggregate all pending updates until the issues are resolved
const chunkListsWithPendingUpdates = new Map();
function aggregateUpdates(msg) {
    const key = resourceKey(msg.resource);
    let aggregated = chunkListsWithPendingUpdates.get(key);
    if (aggregated) {
        aggregated.instruction = mergeChunkListUpdates(aggregated.instruction, msg.instruction);
    } else {
        chunkListsWithPendingUpdates.set(key, msg);
    }
}
function applyAggregatedUpdates() {
    if (chunkListsWithPendingUpdates.size === 0) return;
    hooks.beforeRefresh();
    for (const msg of chunkListsWithPendingUpdates.values()){
        triggerUpdate(msg);
    }
    chunkListsWithPendingUpdates.clear();
    finalizeUpdate();
}
function mergeChunkListUpdates(updateA, updateB) {
    let chunks;
    if (updateA.chunks != null) {
        if (updateB.chunks == null) {
            chunks = updateA.chunks;
        } else {
            chunks = mergeChunkListChunks(updateA.chunks, updateB.chunks);
        }
    } else if (updateB.chunks != null) {
        chunks = updateB.chunks;
    }
    let merged;
    if (updateA.merged != null) {
        if (updateB.merged == null) {
            merged = updateA.merged;
        } else {
            // Since `merged` is an array of updates, we need to merge them all into
            // one, consistent update.
            // Since there can only be `EcmascriptMergeUpdates` in the array, there is
            // no need to key on the `type` field.
            let update = updateA.merged[0];
            for(let i = 1; i < updateA.merged.length; i++){
                update = mergeChunkListEcmascriptMergedUpdates(update, updateA.merged[i]);
            }
            for(let i = 0; i < updateB.merged.length; i++){
                update = mergeChunkListEcmascriptMergedUpdates(update, updateB.merged[i]);
            }
            merged = [
                update
            ];
        }
    } else if (updateB.merged != null) {
        merged = updateB.merged;
    }
    return {
        type: 'ChunkListUpdate',
        chunks,
        merged
    };
}
function mergeChunkListChunks(chunksA, chunksB) {
    const chunks = {};
    for (const [chunkPath, chunkUpdateA] of Object.entries(chunksA)){
        const chunkUpdateB = chunksB[chunkPath];
        if (chunkUpdateB != null) {
            const mergedUpdate = mergeChunkUpdates(chunkUpdateA, chunkUpdateB);
            if (mergedUpdate != null) {
                chunks[chunkPath] = mergedUpdate;
            }
        } else {
            chunks[chunkPath] = chunkUpdateA;
        }
    }
    for (const [chunkPath, chunkUpdateB] of Object.entries(chunksB)){
        if (chunks[chunkPath] == null) {
            chunks[chunkPath] = chunkUpdateB;
        }
    }
    return chunks;
}
function mergeChunkUpdates(updateA, updateB) {
    if (updateA.type === 'added' && updateB.type === 'deleted' || updateA.type === 'deleted' && updateB.type === 'added') {
        return undefined;
    }
    if (updateB.type === 'total') {
        // A total update replaces the entire chunk, so it supersedes any prior update.
        return updateB;
    }
    if (updateA.type === 'partial') {
        invariant(updateA.instruction, 'Partial updates are unsupported');
    }
    if (updateB.type === 'partial') {
        invariant(updateB.instruction, 'Partial updates are unsupported');
    }
    return undefined;
}
function mergeChunkListEcmascriptMergedUpdates(mergedA, mergedB) {
    const entries = mergeEcmascriptChunkEntries(mergedA.entries, mergedB.entries);
    const chunks = mergeEcmascriptChunksUpdates(mergedA.chunks, mergedB.chunks);
    return {
        type: 'EcmascriptMergedUpdate',
        entries,
        chunks
    };
}
function mergeEcmascriptChunkEntries(entriesA, entriesB) {
    return {
        ...entriesA,
        ...entriesB
    };
}
function mergeEcmascriptChunksUpdates(chunksA, chunksB) {
    if (chunksA == null) {
        return chunksB;
    }
    if (chunksB == null) {
        return chunksA;
    }
    const chunks = {};
    for (const [chunkPath, chunkUpdateA] of Object.entries(chunksA)){
        const chunkUpdateB = chunksB[chunkPath];
        if (chunkUpdateB != null) {
            const mergedUpdate = mergeEcmascriptChunkUpdates(chunkUpdateA, chunkUpdateB);
            if (mergedUpdate != null) {
                chunks[chunkPath] = mergedUpdate;
            }
        } else {
            chunks[chunkPath] = chunkUpdateA;
        }
    }
    for (const [chunkPath, chunkUpdateB] of Object.entries(chunksB)){
        if (chunks[chunkPath] == null) {
            chunks[chunkPath] = chunkUpdateB;
        }
    }
    if (Object.keys(chunks).length === 0) {
        return undefined;
    }
    return chunks;
}
function mergeEcmascriptChunkUpdates(updateA, updateB) {
    if (updateA.type === 'added' && updateB.type === 'deleted') {
        // These two completely cancel each other out.
        return undefined;
    }
    if (updateA.type === 'deleted' && updateB.type === 'added') {
        const added = [];
        const deleted = [];
        const deletedModules = new Set(updateA.modules ?? []);
        const addedModules = new Set(updateB.modules ?? []);
        for (const moduleId of addedModules){
            if (!deletedModules.has(moduleId)) {
                added.push(moduleId);
            }
        }
        for (const moduleId of deletedModules){
            if (!addedModules.has(moduleId)) {
                deleted.push(moduleId);
            }
        }
        if (added.length === 0 && deleted.length === 0) {
            return undefined;
        }
        return {
            type: 'partial',
            added,
            deleted
        };
    }
    if (updateA.type === 'partial' && updateB.type === 'partial') {
        const added = new Set([
            ...updateA.added ?? [],
            ...updateB.added ?? []
        ]);
        const deleted = new Set([
            ...updateA.deleted ?? [],
            ...updateB.deleted ?? []
        ]);
        if (updateB.added != null) {
            for (const moduleId of updateB.added){
                deleted.delete(moduleId);
            }
        }
        if (updateB.deleted != null) {
            for (const moduleId of updateB.deleted){
                added.delete(moduleId);
            }
        }
        return {
            type: 'partial',
            added: [
                ...added
            ],
            deleted: [
                ...deleted
            ]
        };
    }
    if (updateA.type === 'added' && updateB.type === 'partial') {
        const modules = new Set([
            ...updateA.modules ?? [],
            ...updateB.added ?? []
        ]);
        for (const moduleId of updateB.deleted ?? []){
            modules.delete(moduleId);
        }
        return {
            type: 'added',
            modules: [
                ...modules
            ]
        };
    }
    if (updateA.type === 'partial' && updateB.type === 'deleted') {
        // We could eagerly return `updateB` here, but this would potentially be
        // incorrect if `updateA` has added modules.
        const modules = new Set(updateB.modules ?? []);
        if (updateA.added != null) {
            for (const moduleId of updateA.added){
                modules.delete(moduleId);
            }
        }
        return {
            type: 'deleted',
            modules: [
                ...modules
            ]
        };
    }
    // Any other update combination is invalid.
    return undefined;
}
function invariant(_, message) {
    throw new Error(`Invariant: ${message}`);
}
const CRITICAL = [
    'bug',
    'error',
    'fatal'
];
function compareByList(list, a, b) {
    const aI = list.indexOf(a) + 1 || list.length;
    const bI = list.indexOf(b) + 1 || list.length;
    return aI - bI;
}
const chunksWithIssues = new Map();
function emitIssues() {
    const issues = [];
    const deduplicationSet = new Set();
    for (const [_, chunkIssues] of chunksWithIssues){
        for (const chunkIssue of chunkIssues){
            if (deduplicationSet.has(chunkIssue.formatted)) continue;
            issues.push(chunkIssue);
            deduplicationSet.add(chunkIssue.formatted);
        }
    }
    sortIssues(issues);
    hooks.issues(issues);
}
function handleIssues(msg) {
    const key = resourceKey(msg.resource);
    let hasCriticalIssues = false;
    for (const issue of msg.issues){
        if (CRITICAL.includes(issue.severity)) {
            hasCriticalIssues = true;
        }
    }
    if (msg.issues.length > 0) {
        chunksWithIssues.set(key, msg.issues);
    } else if (chunksWithIssues.has(key)) {
        chunksWithIssues.delete(key);
    }
    emitIssues();
    return hasCriticalIssues;
}
const SEVERITY_ORDER = [
    'bug',
    'fatal',
    'error',
    'warning',
    'info',
    'log'
];
const CATEGORY_ORDER = [
    'parse',
    'resolve',
    'code generation',
    'rendering',
    'typescript',
    'other'
];
function sortIssues(issues) {
    issues.sort((a, b)=>{
        const first = compareByList(SEVERITY_ORDER, a.severity, b.severity);
        if (first !== 0) return first;
        return compareByList(CATEGORY_ORDER, a.category, b.category);
    });
}
const hooks = {
    beforeRefresh: ()=>{},
    refresh: ()=>{},
    buildOk: ()=>{},
    issues: (_issues)=>{}
};
function setHooks(newHooks) {
    Object.assign(hooks, newHooks);
}
function handleSocketMessage(msg) {
    sortIssues(msg.issues);
    handleIssues(msg);
    switch(msg.type){
        case 'issues':
            break;
        case 'partial':
            // aggregate updates
            aggregateUpdates(msg);
            break;
        default:
            // run single update
            const runHooks = chunkListsWithPendingUpdates.size === 0;
            if (runHooks) hooks.beforeRefresh();
            triggerUpdate(msg);
            if (runHooks) finalizeUpdate();
            break;
    }
}
function finalizeUpdate() {
    hooks.refresh();
    hooks.buildOk();
    // This is used by the Next.js integration test suite to notify it when HMR
    // updates have been completed.
    // TODO: Only run this in test environments (gate by `process.env.__NEXT_TEST_MODE`)
    if (globalThis.__NEXT_HMR_CB) {
        globalThis.__NEXT_HMR_CB();
        globalThis.__NEXT_HMR_CB = null;
    }
}
function subscribeToChunkUpdate(chunkListPath, sendMessage, callback) {
    return subscribeToUpdate({
        path: chunkListPath
    }, sendMessage, callback);
}
function subscribeToUpdate(resource, sendMessage, callback) {
    const key = resourceKey(resource);
    let callbackSet;
    const existingCallbackSet = updateCallbackSets.get(key);
    if (!existingCallbackSet) {
        callbackSet = {
            callbacks: new Set([
                callback
            ]),
            unsubscribe: subscribeToUpdates(sendMessage, resource)
        };
        updateCallbackSets.set(key, callbackSet);
    } else {
        existingCallbackSet.callbacks.add(callback);
        callbackSet = existingCallbackSet;
    }
    return ()=>{
        callbackSet.callbacks.delete(callback);
        if (callbackSet.callbacks.size === 0) {
            callbackSet.unsubscribe();
            updateCallbackSets.delete(key);
        }
    };
}
function triggerUpdate(msg) {
    const key = resourceKey(msg.resource);
    const callbackSet = updateCallbackSets.get(key);
    if (!callbackSet) {
        return;
    }
    for (const callback of callbackSet.callbacks){
        callback(msg);
    }
    if (msg.type === 'notFound') {
        // This indicates that the resource which we subscribed to either does not exist or
        // has been deleted. In either case, we should clear all update callbacks, so if a
        // new subscription is created for the same resource, it will send a new "subscribe"
        // message to the server.
        // No need to send an "unsubscribe" message to the server, it will have already
        // dropped the update stream before sending the "notFound" message.
        updateCallbackSets.delete(key);
    }
}
}),
]);

//# sourceMappingURL=%5Broot-of-the-server%5D__1vqa1bn._.js.map