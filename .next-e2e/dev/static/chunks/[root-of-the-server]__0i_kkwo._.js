(globalThis["TURBOPACK"] || (globalThis["TURBOPACK"] = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[hmr-entry]/hmr-entry.js { ENTRY => \"[project]/src/pages/show\" }", (function(__turbopack_context__){
"use strict";

__turbopack_context__.r("[next]/entry/page-loader.ts { PAGE => \"[project]/src/pages/show.js [client] (ecmascript)\" } [client] (ecmascript)");
}),
"[next]/entry/page-loader.ts { PAGE => \"[project]/src/pages/show.js [client] (ecmascript)\" } [client] (ecmascript)", ((__turbopack_context__, module, exports) => {

const PAGE_PATH = "/show";
(window.__NEXT_P = window.__NEXT_P || []).push([
    PAGE_PATH,
    ()=>{
        return __turbopack_context__.r("[project]/src/pages/show.js [client] (ecmascript)");
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
"[project]/src/pages/show.js [client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>Show
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/react/jsx-dev-runtime.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/react/index.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$constants$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/constants.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$useApi$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/hooks/useApi.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$contexts$2f$ErrorContext$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/contexts/ErrorContext.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$studentId$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/studentId.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$contexts$2f$AdminAuthContext$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/contexts/AdminAuthContext.js [client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
;
;
;
;
;
;
function Show() {
    _s();
    const [id, setID] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])('');
    const [currentTimestamp, setCurrentTimestamp] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [studentInfo, setStudentInfo] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const { request } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$useApi$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useApi"])();
    const { showError, showSuccess } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$contexts$2f$ErrorContext$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useGlobalError"])();
    const { authenticated } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$contexts$2f$AdminAuthContext$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useAdminAuth"])();
    const inputRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "Show.useEffect": ()=>{
            inputRef.current.focus();
        }
    }["Show.useEffect"], []);
    const cleanId = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "Show.useCallback[cleanId]": (rawId)=>{
            return (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$studentId$2e$js__$5b$client$5d$__$28$ecmascript$29$__["cleanScannedStudentId"])(rawId);
        }
    }["Show.useCallback[cleanId]"], []);
    const handleSubmit = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "Show.useCallback[handleSubmit]": async (event)=>{
            event.preventDefault();
            const cleanedId = cleanId(id);
            try {
                const data = await request(`/api/students/${cleanedId}`, {
                    errorContext: 'Beim Laden der Schülerdaten'
                });
                setStudentInfo(data);
                setCurrentTimestamp(new Date());
                setID('');
            } catch (error) {
                setID('');
                setStudentInfo(null);
                showError('Schüler nicht gefunden', 'Schülersuche');
            }
        }
    }["Show.useCallback[handleSubmit]"], [
        id,
        cleanId,
        request,
        showError
    ]);
    const handleDeleteTimestamp = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "Show.useCallback[handleDeleteTimestamp]": async (roundId)=>{
            if (!studentInfo) return;
            try {
                await request(`/api/rounds/${roundId}`, {
                    method: 'DELETE',
                    data: {
                        studentId: studentInfo.id
                    },
                    errorContext: 'Beim Löschen des Zeitstempels'
                });
                setStudentInfo({
                    "Show.useCallback[handleDeleteTimestamp]": (currentStudent)=>{
                        const rounds = currentStudent.rounds.filter({
                            "Show.useCallback[handleDeleteTimestamp].rounds": (round)=>round.id !== roundId
                        }["Show.useCallback[handleDeleteTimestamp].rounds"]);
                        return {
                            ...currentStudent,
                            rounds,
                            timestamps: rounds.map({
                                "Show.useCallback[handleDeleteTimestamp]": (round)=>round.timestamp
                            }["Show.useCallback[handleDeleteTimestamp]"])
                        };
                    }
                }["Show.useCallback[handleDeleteTimestamp]"]);
                showSuccess('Zeitstempel erfolgreich gelöscht', 'Zeitstempel löschen');
            } catch (error) {
            // Fehler wird automatisch über useApi gehandelt
            }
        }
    }["Show.useCallback[handleDeleteTimestamp]"], [
        request,
        showSuccess,
        studentInfo
    ]);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "page-container",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                className: "page-title",
                children: "Schüler anzeigen"
            }, void 0, false, {
                fileName: "[project]/src/pages/show.js",
                lineNumber: 68,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                className: "message message-warning",
                children: "Achtung: Hier werden keine Runden hinzugefügt, nur die Schülerdaten angezeigt."
            }, void 0, false, {
                fileName: "[project]/src/pages/show.js",
                lineNumber: 69,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("form", {
                onSubmit: handleSubmit,
                className: "form",
                "data-tour": "show",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                        className: "form-label",
                        htmlFor: "show-id",
                        children: "Barcode oder Schüler-ID"
                    }, void 0, false, {
                        fileName: "[project]/src/pages/show.js",
                        lineNumber: 71,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                        id: "show-id",
                        type: "text",
                        ref: inputRef,
                        value: id,
                        onChange: (e)=>setID(e.target.value),
                        placeholder: "Barcode scannen",
                        required: true,
                        className: "form-control",
                        autoComplete: "off"
                    }, void 0, false, {
                        fileName: "[project]/src/pages/show.js",
                        lineNumber: 72,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "field-hint",
                        children: "Hier werden nur Daten angezeigt. Es wird keine neue Runde gespeichert."
                    }, void 0, false, {
                        fileName: "[project]/src/pages/show.js",
                        lineNumber: 83,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        type: "submit",
                        className: "btn",
                        children: "Anzeigen"
                    }, void 0, false, {
                        fileName: "[project]/src/pages/show.js",
                        lineNumber: 84,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/pages/show.js",
                lineNumber: 70,
                columnNumber: 7
            }, this),
            studentInfo && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "student-info",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                        children: "Schüler-Informationen"
                    }, void 0, false, {
                        fileName: "[project]/src/pages/show.js",
                        lineNumber: 88,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                children: "Klasse:"
                            }, void 0, false, {
                                fileName: "[project]/src/pages/show.js",
                                lineNumber: 89,
                                columnNumber: 14
                            }, this),
                            " ",
                            studentInfo.klasse
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/pages/show.js",
                        lineNumber: 89,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                children: "Name:"
                            }, void 0, false, {
                                fileName: "[project]/src/pages/show.js",
                                lineNumber: 90,
                                columnNumber: 14
                            }, this),
                            " ",
                            studentInfo.vorname,
                            " ",
                            studentInfo.nachname
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/pages/show.js",
                        lineNumber: 90,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                children: "Geschlecht:"
                            }, void 0, false, {
                                fileName: "[project]/src/pages/show.js",
                                lineNumber: 91,
                                columnNumber: 14
                            }, this),
                            " ",
                            studentInfo.geschlecht || 'Nicht angegeben'
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/pages/show.js",
                        lineNumber: 91,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                children: "Gelaufene Runden:"
                            }, void 0, false, {
                                fileName: "[project]/src/pages/show.js",
                                lineNumber: 92,
                                columnNumber: 14
                            }, this),
                            " ",
                            studentInfo.rounds.length
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/pages/show.js",
                        lineNumber: 92,
                        columnNumber: 11
                    }, this),
                    studentInfo.rounds && studentInfo.rounds.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "mt-3",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                children: "Scan-Timestamps:"
                            }, void 0, false, {
                                fileName: "[project]/src/pages/show.js",
                                lineNumber: 96,
                                columnNumber: 15
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("ul", {
                                className: "timestamp-list",
                                children: studentInfo.rounds.slice() // Kopie erstellen
                                .sort((a, b)=>new Date(b.timestamp) - new Date(a.timestamp)) // Neueste zuerst
                                .map((round, index, sortedArray)=>{
                                    const timestamp = round.timestamp;
                                    // Finde vorherige Runde (chronologisch früher)
                                    const previousTimestamp = index < sortedArray.length - 1 ? sortedArray[index + 1].timestamp : null;
                                    const timeDifference = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$constants$2e$js__$5b$client$5d$__$28$ecmascript$29$__["calculateTimeDifference"])(timestamp, previousTimestamp);
                                    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                        className: "timestamp-item",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                children: [
                                                    (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$constants$2e$js__$5b$client$5d$__$28$ecmascript$29$__["formatDate"])(new Date(timestamp)) + " Uhr => " + (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$constants$2e$js__$5b$client$5d$__$28$ecmascript$29$__["timeAgo"])(currentTimestamp, new Date(timestamp)),
                                                    timeDifference && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        style: {
                                                            color: '#666',
                                                            marginLeft: '8px',
                                                            fontSize: '0.9em'
                                                        },
                                                        children: [
                                                            "(+",
                                                            timeDifference,
                                                            ")"
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/src/pages/show.js",
                                                        lineNumber: 112,
                                                        columnNumber: 29
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/src/pages/show.js",
                                                lineNumber: 109,
                                                columnNumber: 25
                                            }, this),
                                            authenticated && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                type: "button",
                                                className: "btn btn-danger btn-sm",
                                                onClick: ()=>handleDeleteTimestamp(round.id),
                                                children: "Löschen"
                                            }, void 0, false, {
                                                fileName: "[project]/src/pages/show.js",
                                                lineNumber: 118,
                                                columnNumber: 27
                                            }, this)
                                        ]
                                    }, round.id, true, {
                                        fileName: "[project]/src/pages/show.js",
                                        lineNumber: 108,
                                        columnNumber: 23
                                    }, this);
                                })
                            }, void 0, false, {
                                fileName: "[project]/src/pages/show.js",
                                lineNumber: 97,
                                columnNumber: 15
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/pages/show.js",
                        lineNumber: 95,
                        columnNumber: 13
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/pages/show.js",
                lineNumber: 87,
                columnNumber: 9
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/pages/show.js",
        lineNumber: 67,
        columnNumber: 5
    }, this);
}
_s(Show, "PrvAssS2VBTyj+WfyVjeNRGoTt4=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$useApi$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useApi"],
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$contexts$2f$ErrorContext$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useGlobalError"],
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$contexts$2f$AdminAuthContext$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useAdminAuth"]
    ];
});
_c = Show;
var _c;
__turbopack_context__.k.register(_c, "Show");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/utils/constants.js [client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// Konstanten für häufig verwendete API-Endpunkte
__turbopack_context__.s([
    "API_ENDPOINTS",
    ()=>API_ENDPOINTS,
    "DATABASE_PATH",
    ()=>DATABASE_PATH,
    "calculateTimeDifference",
    ()=>calculateTimeDifference,
    "downloadFile",
    ()=>downloadFile,
    "formatCurrency",
    ()=>formatCurrency,
    "formatDate",
    ()=>formatDate,
    "getNextId",
    ()=>getNextId,
    "timeAgo",
    ()=>timeAgo
]);
const API_ENDPOINTS = {
    STUDENTS: '/api/getAllStudents',
    TEACHERS: '/api/getAllTeachers',
    CLASSES: '/api/getAvailableClasses',
    CLASS_STRUCTURE: '/api/classStructure',
    STATISTICS: '/api/statistics',
    GENERATE_LABELS: '/api/generate-labels',
    DELETE_ALL_STUDENTS: '/api/deleteAllStudents',
    EXPORT_EXCEL: '/api/exportExcel',
    EXPORT_SPENDEN: '/api/exportSpenden',
    EXPORT_STATISTICS_HTML: '/api/exportStatisticsHtml',
    SEND_MAILS: '/api/send-mails',
    DONATIONS: '/api/donations'
};
const DATABASE_PATH = './database.db';
const downloadFile = (blob, filename)=>{
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
};
const formatCurrency = (value)=>{
    if (value === null || value === undefined) return '0,00€';
    const numericValue = parseFloat(value).toFixed(2);
    const [euros, cents] = numericValue.split('.');
    return `${euros},${cents}€`;
};
const formatDate = (timestamp)=>{
    const timeOptions = {
        hour: '2-digit',
        minute: '2-digit'
    };
    return timestamp.toLocaleTimeString(undefined, timeOptions);
};
const timeAgo = (now, pastDate)=>{
    const diffInSeconds = Math.floor((now - new Date(pastDate)) / 1000);
    if (diffInSeconds < 2) return "jetzt";
    if (diffInSeconds < 60) return `vor ${diffInSeconds} Sekunden`;
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `vor ${diffInMinutes} Minuten`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `vor ${diffInHours} Stunden`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 30) return `vor ${diffInDays} Tagen`;
    const diffInMonths = Math.floor(diffInDays / 30);
    if (diffInMonths < 12) return `vor ${diffInMonths} Monaten`;
    return `vor ${Math.floor(diffInMonths / 12)} Jahren`;
};
const getNextId = (items)=>{
    return Math.max(...items.map((item)=>parseInt(item.id, 10)), 0) + 1;
};
const calculateTimeDifference = (currentTimestamp, previousTimestamp)=>{
    if (!previousTimestamp || !currentTimestamp) return null;
    const diffInMs = new Date(currentTimestamp) - new Date(previousTimestamp);
    const diffInSeconds = Math.floor(diffInMs / 1000);
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInSeconds < 60) {
        return `${diffInSeconds} Sek.`;
    } else if (diffInMinutes < 60) {
        const remainingSeconds = diffInSeconds % 60;
        return remainingSeconds > 0 ? `${diffInMinutes} Min. ${remainingSeconds} Sek.` : `${diffInMinutes} Min.`;
    } else if (diffInHours < 24) {
        const remainingMinutes = diffInMinutes % 60;
        return remainingMinutes > 0 ? `${diffInHours} Std. ${remainingMinutes} Min.` : `${diffInHours} Std.`;
    } else {
        const diffInDays = Math.floor(diffInHours / 24);
        const remainingHours = diffInHours % 24;
        return remainingHours > 0 ? `${diffInDays} Tag(e) ${remainingHours} Std.` : `${diffInDays} Tag(e)`;
    }
};
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/utils/studentId.js [client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "cleanScannedStudentId",
    ()=>cleanScannedStudentId,
    "parseImportedStudentId",
    ()=>parseImportedStudentId
]);
const cleanScannedStudentId = (rawId, year = new Date().getFullYear())=>{
    if (rawId === null || rawId === undefined) return '';
    return String(rawId).trim().replace(new RegExp(`^${year}[ß/\\-]?`, 'i'), '').trim();
};
const parseImportedStudentId = (value)=>{
    if (value === null || value === undefined || value === '') {
        return null;
    }
    const numericValue = typeof value === 'number' ? value : Number(String(value).trim().replace(',', '.'));
    if (!Number.isInteger(numericValue) || numericValue <= 0) {
        return Number.NaN;
    }
    return numericValue;
};
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
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

//# sourceMappingURL=%5Broot-of-the-server%5D__0i_kkwo._.js.map