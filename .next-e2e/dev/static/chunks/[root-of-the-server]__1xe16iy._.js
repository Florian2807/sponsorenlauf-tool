(globalThis["TURBOPACK"] || (globalThis["TURBOPACK"] = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[hmr-entry]/hmr-entry.js { ENTRY => \"[project]/src/pages/scan\" }", (function(__turbopack_context__){
"use strict";

__turbopack_context__.r("[next]/entry/page-loader.ts { PAGE => \"[project]/src/pages/scan.js [client] (ecmascript)\" } [client] (ecmascript)");
}),
"[next]/entry/page-loader.ts { PAGE => \"[project]/src/pages/scan.js [client] (ecmascript)\" } [client] (ecmascript)", ((__turbopack_context__, module, exports) => {

const PAGE_PATH = "/scan";
(window.__NEXT_P = window.__NEXT_P || []).push([
    PAGE_PATH,
    ()=>{
        return __turbopack_context__.r("[project]/src/pages/scan.js [client] (ecmascript)");
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
"[project]/src/components/BaseDialog.js [client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>__TURBOPACK__default__export__
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/react/jsx-dev-runtime.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/react/index.js [client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
;
const getEnabledActions = (actions, showDefaultClose, handleClose)=>{
    if (actions?.length) {
        return actions.filter((action)=>!action.disabled);
    }
    if (showDefaultClose) {
        return [
            {
                label: 'Schließen',
                variant: 'primary',
                onClick: handleClose,
                primary: true
            }
        ];
    }
    return [];
};
const getCancelAction = (enabledActions)=>{
    return enabledActions.find((action)=>action.cancel) || enabledActions.find((action)=>action.position === 'left') || enabledActions.find((action)=>action.variant === 'secondary') || enabledActions.find((action)=>/abbrechen|schließen|nein/i.test(action.label || '')) || null;
};
const getPrimaryAction = (enabledActions)=>{
    return enabledActions.find((action)=>action.primary) || enabledActions.find((action)=>action.position !== 'left' && action.variant !== 'secondary') || (enabledActions.length > 1 ? enabledActions.at(-1) : null) || null;
};
const BaseDialog = ({ dialogRef, title, children, onClose, className = '', size = 'medium', actions = null, showDefaultClose = true })=>{
    _s();
    const titleId = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useId"])();
    const lastFocusedElementRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const handleClose = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "BaseDialog.useCallback[handleClose]": ()=>{
            dialogRef.current?.close();
        }
    }["BaseDialog.useCallback[handleClose]"], [
        dialogRef
    ]);
    const enabledActions = getEnabledActions(actions, showDefaultClose, handleClose);
    const cancelAction = getCancelAction(enabledActions);
    const primaryAction = getPrimaryAction(enabledActions);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "BaseDialog.useEffect": ()=>{
            const dialog = dialogRef.current;
            if (!dialog) {
                return undefined;
            }
            const rememberLastFocusedElement = {
                "BaseDialog.useEffect.rememberLastFocusedElement": ()=>{
                    if (!dialog.open && document.activeElement instanceof HTMLElement) {
                        lastFocusedElementRef.current = document.activeElement;
                    }
                }
            }["BaseDialog.useEffect.rememberLastFocusedElement"];
            const triggerDialogAction = {
                "BaseDialog.useEffect.triggerDialogAction": (selector, fallback)=>{
                    const actionButton = dialog.querySelector(selector);
                    if (actionButton instanceof HTMLButtonElement) {
                        actionButton.click();
                        return true;
                    }
                    fallback?.();
                    return false;
                }
            }["BaseDialog.useEffect.triggerDialogAction"];
            const focusPrimaryAction = {
                "BaseDialog.useEffect.focusPrimaryAction": ()=>{
                    requestAnimationFrame({
                        "BaseDialog.useEffect.focusPrimaryAction": ()=>{
                            const preferredActionButton = dialog.querySelector('[data-dialog-primary-action="true"]');
                            preferredActionButton?.focus();
                        }
                    }["BaseDialog.useEffect.focusPrimaryAction"]);
                }
            }["BaseDialog.useEffect.focusPrimaryAction"];
            const observer = new MutationObserver({
                "BaseDialog.useEffect": ()=>{
                    if (dialog.open) {
                        focusPrimaryAction();
                    }
                }
            }["BaseDialog.useEffect"]);
            const handleCancel = {
                "BaseDialog.useEffect.handleCancel": (event)=>{
                    event.preventDefault();
                    triggerDialogAction('[data-dialog-cancel-action="true"]', {
                        "BaseDialog.useEffect.handleCancel": ()=>dialog.close()
                    }["BaseDialog.useEffect.handleCancel"]);
                }
            }["BaseDialog.useEffect.handleCancel"];
            const handleKeyDown = {
                "BaseDialog.useEffect.handleKeyDown": (event)=>{
                    if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey) {
                        return;
                    }
                    const targetTagName = event.target?.tagName;
                    if (event.key === 'Escape') {
                        event.preventDefault();
                        triggerDialogAction('[data-dialog-cancel-action="true"]', {
                            "BaseDialog.useEffect.handleKeyDown": ()=>dialog.close()
                        }["BaseDialog.useEffect.handleKeyDown"]);
                        return;
                    }
                    if (event.key !== 'Enter') {
                        return;
                    }
                    if (targetTagName === 'TEXTAREA' || targetTagName === 'BUTTON') {
                        return;
                    }
                    event.preventDefault();
                    triggerDialogAction('[data-dialog-primary-action="true"]');
                }
            }["BaseDialog.useEffect.handleKeyDown"];
            const handleCloseEvent = {
                "BaseDialog.useEffect.handleCloseEvent": ()=>{
                    onClose?.();
                    lastFocusedElementRef.current?.focus?.();
                }
            }["BaseDialog.useEffect.handleCloseEvent"];
            document.addEventListener('focusin', rememberLastFocusedElement);
            observer.observe(dialog, {
                attributes: true,
                attributeFilter: [
                    'open'
                ]
            });
            dialog.addEventListener('cancel', handleCancel);
            dialog.addEventListener('keydown', handleKeyDown);
            dialog.addEventListener('close', handleCloseEvent);
            return ({
                "BaseDialog.useEffect": ()=>{
                    document.removeEventListener('focusin', rememberLastFocusedElement);
                    observer.disconnect();
                    dialog.removeEventListener('cancel', handleCancel);
                    dialog.removeEventListener('keydown', handleKeyDown);
                    dialog.removeEventListener('close', handleCloseEvent);
                }
            })["BaseDialog.useEffect"];
        }
    }["BaseDialog.useEffect"], [
        dialogRef,
        onClose
    ]);
    const sizeClasses = {
        small: 'dialog-sm',
        medium: 'dialog-md',
        large: 'dialog-lg',
        xl: 'dialog-xl'
    };
    const renderActions = ()=>{
        if (actions) {
            const actionCount = actions.length;
            // Determine action layout class based on count and layout preference
            let actionClass = 'dialog-actions';
            if (actionCount === 2) {
                // Special handling for split layout with exactly 2 actions
                actionClass += ' dialog-actions-split';
                const leftActions = actions.filter((action)=>action.position === 'left');
                const rightActions = actions.filter((action)=>action.position !== 'left');
                // If no position specified, put first action left, second right
                if (leftActions.length === 0 && rightActions.length === 0) {
                    leftActions.push(actions[0]);
                    rightActions.push(actions[1]);
                } else if (leftActions.length === 0) {
                    leftActions.push(actions[0]);
                } else if (rightActions.length === 0) {
                    rightActions.push(actions[1]);
                }
                return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: actionClass,
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "btn-group",
                            children: leftActions.map((action, index)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    onClick: action.onClick,
                                    "data-dialog-cancel-action": cancelAction === action ? 'true' : undefined,
                                    "data-dialog-primary-action": primaryAction === action ? 'true' : undefined,
                                    className: `btn ${action.variant === 'danger' ? 'btn-danger' : action.variant === 'secondary' ? 'btn-secondary' : action.variant === 'success' ? 'btn-success' : 'btn-primary'}`,
                                    type: action.type || 'button',
                                    disabled: action.disabled,
                                    children: action.label
                                }, `left-${index}`, false, {
                                    fileName: "[project]/src/components/BaseDialog.js",
                                    lineNumber: 180,
                                    columnNumber: 33
                                }, ("TURBOPACK compile-time value", void 0)))
                        }, void 0, false, {
                            fileName: "[project]/src/components/BaseDialog.js",
                            lineNumber: 178,
                            columnNumber: 25
                        }, ("TURBOPACK compile-time value", void 0)),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "btn-group",
                            children: rightActions.map((action, index)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    onClick: action.onClick,
                                    "data-dialog-cancel-action": cancelAction === action ? 'true' : undefined,
                                    "data-dialog-primary-action": primaryAction === action ? 'true' : undefined,
                                    className: `btn ${action.variant === 'danger' ? 'btn-danger' : action.variant === 'secondary' ? 'btn-secondary' : action.variant === 'success' ? 'btn-success' : 'btn-primary'}`,
                                    type: action.type || 'button',
                                    disabled: action.disabled,
                                    children: action.label
                                }, `right-${index}`, false, {
                                    fileName: "[project]/src/components/BaseDialog.js",
                                    lineNumber: 197,
                                    columnNumber: 33
                                }, ("TURBOPACK compile-time value", void 0)))
                        }, void 0, false, {
                            fileName: "[project]/src/components/BaseDialog.js",
                            lineNumber: 195,
                            columnNumber: 25
                        }, ("TURBOPACK compile-time value", void 0))
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/components/BaseDialog.js",
                    lineNumber: 177,
                    columnNumber: 21
                }, ("TURBOPACK compile-time value", void 0));
            } else {
                // Auto-distribute actions based on count
                if (actionCount >= 2) {
                    actionClass += ` dialog-actions-distributed dialog-actions-count-${Math.min(actionCount, 5)}`;
                }
                return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: actionClass,
                    children: actions.map((action, index)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            onClick: action.onClick,
                            "data-dialog-cancel-action": cancelAction === action ? 'true' : undefined,
                            "data-dialog-primary-action": primaryAction === action ? 'true' : undefined,
                            className: `btn ${action.variant === 'danger' ? 'btn-danger' : action.variant === 'secondary' ? 'btn-secondary' : action.variant === 'success' ? 'btn-success' : 'btn-primary'}`,
                            type: action.type || 'button',
                            disabled: action.disabled,
                            children: action.label
                        }, index, false, {
                            fileName: "[project]/src/components/BaseDialog.js",
                            lineNumber: 223,
                            columnNumber: 29
                        }, ("TURBOPACK compile-time value", void 0)))
                }, void 0, false, {
                    fileName: "[project]/src/components/BaseDialog.js",
                    lineNumber: 221,
                    columnNumber: 21
                }, ("TURBOPACK compile-time value", void 0));
            }
        }
        if (showDefaultClose) {
            return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "dialog-actions",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                    className: "btn btn-primary",
                    onClick: handleClose,
                    "data-dialog-primary-action": "true",
                    children: "Schließen"
                }, void 0, false, {
                    fileName: "[project]/src/components/BaseDialog.js",
                    lineNumber: 245,
                    columnNumber: 21
                }, ("TURBOPACK compile-time value", void 0))
            }, void 0, false, {
                fileName: "[project]/src/components/BaseDialog.js",
                lineNumber: 244,
                columnNumber: 17
            }, ("TURBOPACK compile-time value", void 0));
        }
        return null;
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("dialog", {
        ref: dialogRef,
        className: `dialog-shell ${className} ${sizeClasses[size]}`,
        "aria-labelledby": title ? titleId : undefined,
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "dialog-header",
                children: [
                    title ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                        id: titleId,
                        className: "dialog-title",
                        children: title
                    }, void 0, false, {
                        fileName: "[project]/src/components/BaseDialog.js",
                        lineNumber: 260,
                        columnNumber: 26
                    }, ("TURBOPACK compile-time value", void 0)) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {}, void 0, false, {
                        fileName: "[project]/src/components/BaseDialog.js",
                        lineNumber: 260,
                        columnNumber: 83
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        className: "dialog-close",
                        onClick: handleClose,
                        type: "button",
                        "aria-label": "Dialog schließen",
                        title: "Dialog schließen",
                        children: "×"
                    }, void 0, false, {
                        fileName: "[project]/src/components/BaseDialog.js",
                        lineNumber: 261,
                        columnNumber: 17
                    }, ("TURBOPACK compile-time value", void 0))
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/BaseDialog.js",
                lineNumber: 259,
                columnNumber: 13
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "dialog-body card-body",
                children: children
            }, void 0, false, {
                fileName: "[project]/src/components/BaseDialog.js",
                lineNumber: 272,
                columnNumber: 13
            }, ("TURBOPACK compile-time value", void 0)),
            renderActions()
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/BaseDialog.js",
        lineNumber: 254,
        columnNumber: 9
    }, ("TURBOPACK compile-time value", void 0));
};
_s(BaseDialog, "F0EJxzl91iilYCQqHi0nMUAW0Nk=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useId"]
    ];
});
_c = BaseDialog;
const __TURBOPACK__default__export__ = BaseDialog;
var _c;
__turbopack_context__.k.register(_c, "BaseDialog");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/components/dialogs/scan/DoubleScanConfirmationDialog.js [client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>__TURBOPACK__default__export__
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/react/jsx-dev-runtime.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/react/index.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$BaseDialog$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/BaseDialog.js [client] (ecmascript)");
;
;
;
const DoubleScanConfirmationDialog = ({ dialogRef, studentInfo, lastRoundTime, thresholdMinutes = 5, onConfirm, onCancel })=>{
    const formatTimeDiff = (timestamp)=>{
        const diff = Date.now() - new Date(timestamp).getTime();
        const minutes = Math.floor(diff / 60000);
        const seconds = Math.floor(diff % 60000 / 1000);
        if (minutes > 0) {
            return `${minutes} Minute${minutes !== 1 ? 'n' : ''} und ${seconds} Sekunde${seconds !== 1 ? 'n' : ''}`;
        }
        return `${seconds} Sekunde${seconds !== 1 ? 'n' : ''}`;
    };
    const actions = [
        {
            label: 'Abbrechen',
            onClick: onCancel,
            variant: 'secondary',
            position: 'left'
        },
        {
            label: 'Runde trotzdem zählen',
            onClick: onConfirm,
            variant: 'primary',
            position: 'right'
        }
    ];
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$BaseDialog$2e$js__$5b$client$5d$__$28$ecmascript$29$__["default"], {
        dialogRef: dialogRef,
        title: "Doppel-Scan Warnung",
        size: "large",
        actions: actions,
        showDefaultClose: false,
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "double-scan-content",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "scan-alert",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "alert-icon",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                width: "48",
                                height: "48",
                                viewBox: "0 0 24 24",
                                fill: "none",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                    d: "M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z",
                                    stroke: "currentColor",
                                    strokeWidth: "1.5",
                                    strokeLinecap: "round",
                                    strokeLinejoin: "round"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/dialogs/scan/DoubleScanConfirmationDialog.js",
                                    lineNumber: 51,
                                    columnNumber: 15
                                }, ("TURBOPACK compile-time value", void 0))
                            }, void 0, false, {
                                fileName: "[project]/src/components/dialogs/scan/DoubleScanConfirmationDialog.js",
                                lineNumber: 50,
                                columnNumber: 13
                            }, ("TURBOPACK compile-time value", void 0))
                        }, void 0, false, {
                            fileName: "[project]/src/components/dialogs/scan/DoubleScanConfirmationDialog.js",
                            lineNumber: 49,
                            columnNumber: 11
                        }, ("TURBOPACK compile-time value", void 0)),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "alert-content",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                    className: "alert-title",
                                    children: "Zu schneller Scan erkannt"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/dialogs/scan/DoubleScanConfirmationDialog.js",
                                    lineNumber: 55,
                                    columnNumber: 13
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                    className: "alert-message",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: "student-highlight",
                                            children: [
                                                studentInfo?.vorname,
                                                " ",
                                                studentInfo?.nachname
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/components/dialogs/scan/DoubleScanConfirmationDialog.js",
                                            lineNumber: 57,
                                            columnNumber: 15
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        ' ',
                                        "wurde bereits vor",
                                        ' ',
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: "time-highlight",
                                            children: formatTimeDiff(lastRoundTime)
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/dialogs/scan/DoubleScanConfirmationDialog.js",
                                            lineNumber: 59,
                                            columnNumber: 15
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        ' ',
                                        "gescannt."
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/components/dialogs/scan/DoubleScanConfirmationDialog.js",
                                    lineNumber: 56,
                                    columnNumber: 13
                                }, ("TURBOPACK compile-time value", void 0))
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/components/dialogs/scan/DoubleScanConfirmationDialog.js",
                            lineNumber: 54,
                            columnNumber: 11
                        }, ("TURBOPACK compile-time value", void 0))
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/components/dialogs/scan/DoubleScanConfirmationDialog.js",
                    lineNumber: 48,
                    columnNumber: 9
                }, ("TURBOPACK compile-time value", void 0)),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "student-card",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "card-header",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "student-avatar",
                                    children: [
                                        studentInfo?.vorname?.[0],
                                        studentInfo?.nachname?.[0]
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/components/dialogs/scan/DoubleScanConfirmationDialog.js",
                                    lineNumber: 68,
                                    columnNumber: 13
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "student-basic-info",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h4", {
                                            className: "student-full-name",
                                            children: [
                                                studentInfo?.vorname,
                                                " ",
                                                studentInfo?.nachname
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/components/dialogs/scan/DoubleScanConfirmationDialog.js",
                                            lineNumber: 72,
                                            columnNumber: 15
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                            className: "student-class",
                                            children: [
                                                "Klasse ",
                                                studentInfo?.klasse
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/components/dialogs/scan/DoubleScanConfirmationDialog.js",
                                            lineNumber: 73,
                                            columnNumber: 15
                                        }, ("TURBOPACK compile-time value", void 0))
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/components/dialogs/scan/DoubleScanConfirmationDialog.js",
                                    lineNumber: 71,
                                    columnNumber: 13
                                }, ("TURBOPACK compile-time value", void 0))
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/components/dialogs/scan/DoubleScanConfirmationDialog.js",
                            lineNumber: 67,
                            columnNumber: 11
                        }, ("TURBOPACK compile-time value", void 0)),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "card-stats",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "stat-item",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "stat-number",
                                            children: studentInfo?.roundCount || 0
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/dialogs/scan/DoubleScanConfirmationDialog.js",
                                            lineNumber: 79,
                                            columnNumber: 15
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "stat-label",
                                            children: "Runden heute"
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/dialogs/scan/DoubleScanConfirmationDialog.js",
                                            lineNumber: 80,
                                            columnNumber: 15
                                        }, ("TURBOPACK compile-time value", void 0))
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/components/dialogs/scan/DoubleScanConfirmationDialog.js",
                                    lineNumber: 78,
                                    columnNumber: 13
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "stat-divider"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/dialogs/scan/DoubleScanConfirmationDialog.js",
                                    lineNumber: 82,
                                    columnNumber: 13
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "stat-item",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "stat-number",
                                            children: thresholdMinutes
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/dialogs/scan/DoubleScanConfirmationDialog.js",
                                            lineNumber: 84,
                                            columnNumber: 15
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "stat-label",
                                            children: "Min. Abstand"
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/dialogs/scan/DoubleScanConfirmationDialog.js",
                                            lineNumber: 85,
                                            columnNumber: 15
                                        }, ("TURBOPACK compile-time value", void 0))
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/components/dialogs/scan/DoubleScanConfirmationDialog.js",
                                    lineNumber: 83,
                                    columnNumber: 13
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "stat-divider"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/dialogs/scan/DoubleScanConfirmationDialog.js",
                                    lineNumber: 87,
                                    columnNumber: 13
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "stat-item",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "stat-time",
                                            children: new Date(lastRoundTime).toLocaleTimeString('de-DE', {
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/dialogs/scan/DoubleScanConfirmationDialog.js",
                                            lineNumber: 89,
                                            columnNumber: 15
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "stat-label",
                                            children: "Letzte Runde"
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/dialogs/scan/DoubleScanConfirmationDialog.js",
                                            lineNumber: 90,
                                            columnNumber: 15
                                        }, ("TURBOPACK compile-time value", void 0))
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/components/dialogs/scan/DoubleScanConfirmationDialog.js",
                                    lineNumber: 88,
                                    columnNumber: 13
                                }, ("TURBOPACK compile-time value", void 0))
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/components/dialogs/scan/DoubleScanConfirmationDialog.js",
                            lineNumber: 77,
                            columnNumber: 11
                        }, ("TURBOPACK compile-time value", void 0))
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/components/dialogs/scan/DoubleScanConfirmationDialog.js",
                    lineNumber: 66,
                    columnNumber: 9
                }, ("TURBOPACK compile-time value", void 0)),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "decision-box",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h4", {
                            className: "decision-title",
                            children: "Was möchten Sie tun?"
                        }, void 0, false, {
                            fileName: "[project]/src/components/dialogs/scan/DoubleScanConfirmationDialog.js",
                            lineNumber: 97,
                            columnNumber: 11
                        }, ("TURBOPACK compile-time value", void 0)),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: "decision-subtitle",
                            children: "War dies ein versehentlicher Doppel-Scan oder soll die Runde gezählt werden?"
                        }, void 0, false, {
                            fileName: "[project]/src/components/dialogs/scan/DoubleScanConfirmationDialog.js",
                            lineNumber: 98,
                            columnNumber: 11
                        }, ("TURBOPACK compile-time value", void 0))
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/components/dialogs/scan/DoubleScanConfirmationDialog.js",
                    lineNumber: 96,
                    columnNumber: 9
                }, ("TURBOPACK compile-time value", void 0))
            ]
        }, void 0, true, {
            fileName: "[project]/src/components/dialogs/scan/DoubleScanConfirmationDialog.js",
            lineNumber: 46,
            columnNumber: 7
        }, ("TURBOPACK compile-time value", void 0))
    }, void 0, false, {
        fileName: "[project]/src/components/dialogs/scan/DoubleScanConfirmationDialog.js",
        lineNumber: 39,
        columnNumber: 5
    }, ("TURBOPACK compile-time value", void 0));
};
_c = DoubleScanConfirmationDialog;
const __TURBOPACK__default__export__ = DoubleScanConfirmationDialog;
var _c;
__turbopack_context__.k.register(_c, "DoubleScanConfirmationDialog");
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
"[project]/src/pages/scan.js [client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>Scan
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/react/jsx-dev-runtime.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/react/index.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$constants$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/constants.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$useApi$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/hooks/useApi.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$contexts$2f$ErrorContext$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/contexts/ErrorContext.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$dialogs$2f$scan$2f$DoubleScanConfirmationDialog$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/dialogs/scan/DoubleScanConfirmationDialog.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$studentId$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/studentId.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$axios$2f$lib$2f$axios$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/axios/lib/axios.js [client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
;
;
;
;
;
;
;
const PENDING_SCAN_STORAGE_KEY = 'sponsorenlauf.pendingScan';
const SCAN_QUEUE_STORAGE_KEY = 'sponsorenlauf.scanQueue';
const DEVICE_ID_STORAGE_KEY = 'sponsorenlauf.deviceId';
const MAX_QUEUED_SCANS = 500;
const MAX_QUEUED_SCAN_AGE_MS = 7 * 24 * 60 * 60 * 1000;
const isValidQueuedScan = (entry)=>entry && typeof entry.cleanedId === 'string' && typeof entry.scanId === 'string' && entry.scanId.length >= 8 && entry.scanId.length <= 100 && Number.isFinite(Date.parse(entry.createdAt)) && Date.now() - Date.parse(entry.createdAt) <= MAX_QUEUED_SCAN_AGE_MS;
const createClientId = (prefix)=>{
    const randomPart = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : `${Date.now()}_${Math.random().toString(36).slice(2)}`;
    return `${prefix}_${randomPart}`;
};
function Scan() {
    _s();
    const [id, setID] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])('');
    const [currentTimestamp, setCurrentTimestamp] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [message, setMessage] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])('');
    const [messageType, setMessageType] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])('');
    const [studentInfo, setStudentInfo] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [rounds, setRounds] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [timestampsLoading, setTimestampsLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [isProcessing, setIsProcessing] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [doubleScanData, setDoubleScanData] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [queuedScanCount, setQueuedScanCount] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(0);
    const { request, loading } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$useApi$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useApi"])();
    const { showError } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$contexts$2f$ErrorContext$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useGlobalError"])();
    const formRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const inputRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const doubleScanDialogRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const idRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useRef"])('');
    const pendingScanRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const deviceIdRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const scanQueueRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useRef"])([]);
    const flushingQueueRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useRef"])(false);
    const audioContextRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const getAudioContext = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "Scan.useCallback[getAudioContext]": ()=>{
            if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
            ;
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (!AudioContext) return null;
            if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
                audioContextRef.current = new AudioContext();
            }
            if (audioContextRef.current.state === 'suspended') {
                audioContextRef.current.resume().catch({
                    "Scan.useCallback[getAudioContext]": ()=>{}
                }["Scan.useCallback[getAudioContext]"]);
            }
            return audioContextRef.current;
        }
    }["Scan.useCallback[getAudioContext]"], []);
    const playErrorSound = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "Scan.useCallback[playErrorSound]": ()=>{
            const audioContext = getAudioContext();
            if (!audioContext) return;
            const startAt = audioContext.currentTime;
            const gain = audioContext.createGain();
            gain.gain.setValueAtTime(0.0001, startAt);
            gain.gain.exponentialRampToValueAtTime(0.22, startAt + 0.01);
            gain.gain.setValueAtTime(0.22, startAt + 0.28);
            gain.gain.exponentialRampToValueAtTime(0.0001, startAt + 0.36);
            gain.connect(audioContext.destination);
            const firstTone = audioContext.createOscillator();
            firstTone.type = 'square';
            firstTone.frequency.setValueAtTime(330, startAt);
            firstTone.connect(gain);
            firstTone.start(startAt);
            firstTone.stop(startAt + 0.14);
            const secondTone = audioContext.createOscillator();
            secondTone.type = 'square';
            secondTone.frequency.setValueAtTime(180, startAt + 0.17);
            secondTone.connect(gain);
            secondTone.start(startAt + 0.17);
            secondTone.stop(startAt + 0.36);
        }
    }["Scan.useCallback[playErrorSound]"], [
        getAudioContext
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "Scan.useEffect": ()=>{
            let deviceId = window.localStorage.getItem(DEVICE_ID_STORAGE_KEY);
            if (!deviceId) {
                deviceId = createClientId('device');
                window.localStorage.setItem(DEVICE_ID_STORAGE_KEY, deviceId);
            }
            deviceIdRef.current = deviceId;
            let queue = [];
            try {
                queue = JSON.parse(window.localStorage.getItem(SCAN_QUEUE_STORAGE_KEY) || '[]');
                if (!Array.isArray(queue)) queue = [];
                queue = queue.filter(isValidQueuedScan).slice(-MAX_QUEUED_SCANS);
            } catch  {
                queue = [];
            }
            const storedPendingScan = window.localStorage.getItem(PENDING_SCAN_STORAGE_KEY);
            if (storedPendingScan) {
                try {
                    const pendingScan = JSON.parse(storedPendingScan);
                    if (pendingScan?.cleanedId && pendingScan?.scanId) {
                        if (!queue.some({
                            "Scan.useEffect": (entry)=>entry.scanId === pendingScan.scanId
                        }["Scan.useEffect"])) queue.push(pendingScan);
                        window.localStorage.removeItem(PENDING_SCAN_STORAGE_KEY);
                    }
                } catch  {
                    window.localStorage.removeItem(PENDING_SCAN_STORAGE_KEY);
                }
            }
            scanQueueRef.current = queue;
            window.localStorage.setItem(SCAN_QUEUE_STORAGE_KEY, JSON.stringify(queue));
            setQueuedScanCount(queue.length);
            if (queue.length) {
                setMessage(`${queue.length} nicht bestätigte Scan(s) werden automatisch erneut gesendet.`);
                setMessageType('warning');
            }
            inputRef.current?.focus();
        }
    }["Scan.useEffect"], []);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "Scan.useEffect": ()=>{
            const sendHeartbeat = {
                "Scan.useEffect.sendHeartbeat": ()=>{
                    if (!deviceIdRef.current) return;
                    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$axios$2f$lib$2f$axios$2e$js__$5b$client$5d$__$28$ecmascript$29$__["default"].post('/api/stations/heartbeat', {
                        deviceId: deviceIdRef.current
                    }, {
                        timeout: 5000
                    }).catch({
                        "Scan.useEffect.sendHeartbeat": ()=>{}
                    }["Scan.useEffect.sendHeartbeat"]);
                }
            }["Scan.useEffect.sendHeartbeat"];
            sendHeartbeat();
            const interval = window.setInterval(sendHeartbeat, 30000);
            return ({
                "Scan.useEffect": ()=>window.clearInterval(interval)
            })["Scan.useEffect"];
        }
    }["Scan.useEffect"], []);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "Scan.useEffect": ()=>({
                "Scan.useEffect": ()=>{
                    audioContextRef.current?.close().catch({
                        "Scan.useEffect": ()=>{}
                    }["Scan.useEffect"]);
                }
            })["Scan.useEffect"]
    }["Scan.useEffect"], []);
    // Fokus nach Submit wiederherstellen
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "Scan.useEffect": ()=>{
            if (!isProcessing) {
                const timer = setTimeout({
                    "Scan.useEffect.timer": ()=>{
                        inputRef.current?.focus();
                    }
                }["Scan.useEffect.timer"], 100);
                return ({
                    "Scan.useEffect": ()=>clearTimeout(timer)
                })["Scan.useEffect"];
            }
        }
    }["Scan.useEffect"], [
        isProcessing
    ]);
    // Dialog öffnen sobald doubleScanData gesetzt wird
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "Scan.useEffect": ()=>{
            if (doubleScanData && doubleScanDialogRef.current) {
                doubleScanDialogRef.current.showModal();
            }
        }
    }["Scan.useEffect"], [
        doubleScanData
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "Scan.useEffect": ()=>{
            const handleGlobalKeyDown = {
                "Scan.useEffect.handleGlobalKeyDown": (event)=>{
                    if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey) {
                        return;
                    }
                    if (document.querySelector('dialog[open]')) {
                        return;
                    }
                    if (document.activeElement === inputRef.current) {
                        return;
                    }
                    if (event.key === 'Tab' || event.key === 'Escape') {
                        return;
                    }
                    if (event.key === 'Enter') {
                        event.preventDefault();
                        inputRef.current?.focus();
                        formRef.current?.requestSubmit();
                        return;
                    }
                    if (event.key === 'Backspace') {
                        event.preventDefault();
                        inputRef.current?.focus();
                        const nextValue = idRef.current.slice(0, -1);
                        idRef.current = nextValue;
                        setID(nextValue);
                        return;
                    }
                    if (event.key.length !== 1) {
                        return;
                    }
                    event.preventDefault();
                    inputRef.current?.focus();
                    const nextValue = `${idRef.current}${event.key}`;
                    idRef.current = nextValue;
                    setID(nextValue);
                }
            }["Scan.useEffect.handleGlobalKeyDown"];
            document.addEventListener('keydown', handleGlobalKeyDown);
            return ({
                "Scan.useEffect": ()=>document.removeEventListener('keydown', handleGlobalKeyDown)
            })["Scan.useEffect"];
        }
    }["Scan.useEffect"], []);
    const cleanId = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "Scan.useCallback[cleanId]": (rawId)=>{
            return (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$studentId$2e$js__$5b$client$5d$__$28$ecmascript$29$__["cleanScannedStudentId"])(rawId);
        }
    }["Scan.useCallback[cleanId]"], []);
    const handleInputChange = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "Scan.useCallback[handleInputChange]": (e)=>{
            idRef.current = e.target.value;
            setID(e.target.value);
        }
    }["Scan.useCallback[handleInputChange]"], []);
    const rememberPendingScan = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "Scan.useCallback[rememberPendingScan]": (pendingScan)=>{
            pendingScanRef.current = pendingScan;
            window.localStorage.setItem(PENDING_SCAN_STORAGE_KEY, JSON.stringify(pendingScan));
        }
    }["Scan.useCallback[rememberPendingScan]"], []);
    const clearPendingScan = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "Scan.useCallback[clearPendingScan]": ()=>{
            pendingScanRef.current = null;
            window.localStorage.removeItem(PENDING_SCAN_STORAGE_KEY);
        }
    }["Scan.useCallback[clearPendingScan]"], []);
    const persistQueue = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "Scan.useCallback[persistQueue]": (queue)=>{
            scanQueueRef.current = queue;
            window.localStorage.setItem(SCAN_QUEUE_STORAGE_KEY, JSON.stringify(queue));
            setQueuedScanCount(queue.length);
        }
    }["Scan.useCallback[persistQueue]"], []);
    const enqueueScan = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "Scan.useCallback[enqueueScan]": (pendingScan)=>{
            if (!pendingScan?.scanId) return;
            const queue = scanQueueRef.current.some({
                "Scan.useCallback[enqueueScan]": (entry)=>entry.scanId === pendingScan.scanId
            }["Scan.useCallback[enqueueScan]"]) ? scanQueueRef.current : [
                ...scanQueueRef.current,
                pendingScan
            ].slice(-MAX_QUEUED_SCANS);
            persistQueue(queue);
        }
    }["Scan.useCallback[enqueueScan]"], [
        persistQueue
    ]);
    // Funktion zum asynchronen Laden der Timestamps
    const loadTimestamps = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "Scan.useCallback[loadTimestamps]": async (studentId)=>{
            setTimestampsLoading(true);
            try {
                const response = await request(`/api/students/${studentId}/timestamps`);
                const loadedRounds = response.rounds || (response.timestamps || []).map({
                    "Scan.useCallback[loadTimestamps]": (timestamp, index)=>({
                            id: `legacy-${index}`,
                            timestamp
                        })
                }["Scan.useCallback[loadTimestamps]"]);
                setRounds(loadedRounds);
            } catch (error) {
                console.warn('Timestamps konnten nicht geladen werden:', error);
                setRounds([]);
            } finally{
                setTimestampsLoading(false);
            }
        }
    }["Scan.useCallback[loadTimestamps]"], [
        request
    ]);
    const performScan = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "Scan.useCallback[performScan]": async (cleanedId, confirmDoubleScan = false, scanId)=>{
            let processingHandled = false; // Flag um sicherzustellen, dass Loading-State korrekt behandelt wird
            try {
                const response = await request('/api/runden', {
                    method: 'POST',
                    showErrorMessage: false,
                    data: {
                        id: cleanedId,
                        confirmDoubleScan,
                        scanId,
                        sourceDeviceId: deviceIdRef.current
                    }
                });
                // Server antwortet IMMER mit 200 bei gültigen Anfragen
                if (response?.success) {
                    // Fall 1: Server möchte Bestätigung für Doppel-Scan
                    if (response.requiresConfirmation) {
                        // State setzen
                        setDoubleScanData({
                            student: response.student,
                            lastRoundTime: response.lastRoundTime,
                            thresholdMinutes: response.thresholdMinutes || 5,
                            cleanedId,
                            scanId
                        });
                        setMessage('Doppel-Scan erkannt - bitte bestätigen');
                        setMessageType('warning');
                        setIsProcessing(false);
                        processingHandled = true;
                        return;
                    }
                    // Fall 2: Runde wurde erfolgreich gespeichert
                    setStudentInfo(response.student);
                    setCurrentTimestamp(new Date());
                    setMessage(response.message || 'Runde erfolgreich gezählt!');
                    setMessageType('success');
                    idRef.current = '';
                    setID('');
                    setDoubleScanData(null);
                    clearPendingScan();
                    if (response.round) {
                        setRounds({
                            "Scan.useCallback[performScan]": (currentRounds)=>[
                                    response.round,
                                    ...currentRounds.filter({
                                        "Scan.useCallback[performScan]": (round)=>round.id !== response.round.id
                                    }["Scan.useCallback[performScan]"])
                                ]
                        }["Scan.useCallback[performScan]"]);
                    }
                    // Timestamps asynchron laden
                    loadTimestamps(cleanedId);
                }
            } catch (error) {
                // Echte Fehler und Block-Modus landen hier
                const isRecoverableFailure = !error.status || error.status >= 500 || error.status === 429;
                if (isRecoverableFailure) {
                    enqueueScan(pendingScanRef.current);
                    clearPendingScan();
                    idRef.current = '';
                    setID('');
                    setMessage('Verbindung unterbrochen – Scan sicher vorgemerkt und wird automatisch erneut gesendet');
                    setMessageType('warning');
                    return;
                }
                idRef.current = '';
                setID('');
                clearPendingScan();
                playErrorSound();
                if (error.status === 404) {
                    setMessage('Schüler mit dieser ID nicht gefunden');
                    setMessageType('error');
                } else if (error.status === 400) {
                    // Prüfe verschiedene Error-Strukturen für Block-Modus
                    const errorData = error.data || error.response?.data || error || {};
                    const errorCode = errorData.error || error.error;
                    const errorMessage = errorData.message || error.message || '';
                    if (errorCode === 'DOUBLE_SCAN_BLOCKED' || errorMessage.includes('Doppel-Scan blockiert')) {
                        // Block-Modus: Scan wurde komplett abgelehnt
                        if (errorData.timeDifferenceMs && errorData.student) {
                            // Detaillierte Fehlermeldung mit Schülerinfo
                            const timeDiffMinutes = Math.floor(errorData.timeDifferenceMs / 60000);
                            const timeDiffSeconds = Math.floor(errorData.timeDifferenceMs % 60000 / 1000);
                            const timeDisplay = timeDiffMinutes > 0 ? `${timeDiffMinutes} Minute${timeDiffMinutes !== 1 ? 'n' : ''} und ${timeDiffSeconds} Sekunde${timeDiffSeconds !== 1 ? 'n' : ''}` : `${timeDiffSeconds} Sekunde${timeDiffSeconds !== 1 ? 'n' : ''}`;
                            setMessage(`⚠️ Doppel-Scan blockiert: ${errorData.student.vorname} ${errorData.student.nachname} wurde erst vor ${timeDisplay} gescannt. Mindestabstand: ${errorData.thresholdMinutes} Minuten.`);
                            setStudentInfo(errorData.student);
                        } else {
                            // Einfache Fehlermeldung vom Server
                            setMessage(`⚠️ ${errorMessage}`);
                        }
                        setMessageType('error');
                    } else {
                        // Fallback für andere 400-Fehler
                        setMessage(errorMessage || 'Ungültige ID oder Eingabe');
                        setMessageType('error');
                    }
                }
                const responseErrorCode = error.response?.data?.error;
                if (error.status !== 400 || responseErrorCode !== 'DOUBLE_SCAN_BLOCKED') {
                    setStudentInfo(null);
                }
                setRounds([]);
            } finally{
                // Stelle sicher, dass Processing immer gestoppt wird (außer bei Dialog)
                if (!processingHandled) {
                    setIsProcessing(false);
                }
            }
        }
    }["Scan.useCallback[performScan]"], [
        request,
        loadTimestamps,
        clearPendingScan,
        enqueueScan,
        playErrorSound
    ]);
    const flushScanQueue = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "Scan.useCallback[flushScanQueue]": async ()=>{
            if (flushingQueueRef.current || !navigator.onLine || scanQueueRef.current.length === 0) return;
            flushingQueueRef.current = true;
            try {
                while(scanQueueRef.current.length > 0 && navigator.onLine){
                    const pendingIndex = scanQueueRef.current.findIndex({
                        "Scan.useCallback[flushScanQueue].pendingIndex": (entry)=>!entry.requiresConfirmation
                    }["Scan.useCallback[flushScanQueue].pendingIndex"]);
                    if (pendingIndex === -1) break;
                    const pending = scanQueueRef.current[pendingIndex];
                    try {
                        const response = await __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$axios$2f$lib$2f$axios$2e$js__$5b$client$5d$__$28$ecmascript$29$__["default"].post('/api/runden', {
                            id: pending.cleanedId,
                            scanId: pending.scanId,
                            sourceDeviceId: deviceIdRef.current,
                            confirmDoubleScan: false
                        }, {
                            timeout: 10000
                        });
                        if (response.data?.requiresConfirmation || response.data?.data?.requiresConfirmation) {
                            setMessage('Ein vorgemerkter Scan benötigt eine Doppel-Scan-Bestätigung. Bitte Barcode erneut scannen.');
                            setMessageType('warning');
                            persistQueue(scanQueueRef.current.map({
                                "Scan.useCallback[flushScanQueue]": (entry)=>entry.scanId === pending.scanId ? {
                                        ...entry,
                                        requiresConfirmation: true
                                    } : entry
                            }["Scan.useCallback[flushScanQueue]"]));
                            continue;
                        }
                        persistQueue(scanQueueRef.current.filter({
                            "Scan.useCallback[flushScanQueue]": (entry)=>entry.scanId !== pending.scanId
                        }["Scan.useCallback[flushScanQueue]"]));
                        setMessage('Vorgemerkter Scan wurde erfolgreich nachgetragen');
                        setMessageType('success');
                    } catch (error) {
                        if (!error.response || error.response.status >= 500 || error.response.status === 429) break;
                        persistQueue(scanQueueRef.current.filter({
                            "Scan.useCallback[flushScanQueue]": (entry)=>entry.scanId !== pending.scanId
                        }["Scan.useCallback[flushScanQueue]"]));
                        setMessage(`Vorgemerkter Scan wurde verworfen: ${error.response?.data?.message || 'ungültige Daten'}`);
                        setMessageType('error');
                    }
                }
            } finally{
                flushingQueueRef.current = false;
            }
        }
    }["Scan.useCallback[flushScanQueue]"], [
        persistQueue
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "Scan.useEffect": ()=>{
            const handleOnline = {
                "Scan.useEffect.handleOnline": ()=>flushScanQueue()
            }["Scan.useEffect.handleOnline"];
            window.addEventListener('online', handleOnline);
            const interval = window.setInterval(flushScanQueue, 5000);
            flushScanQueue();
            return ({
                "Scan.useEffect": ()=>{
                    window.removeEventListener('online', handleOnline);
                    window.clearInterval(interval);
                }
            })["Scan.useEffect"];
        }
    }["Scan.useEffect"], [
        flushScanQueue
    ]);
    const handleDoubleScanConfirm = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "Scan.useCallback[handleDoubleScanConfirm]": async ()=>{
            if (!doubleScanData) return;
            doubleScanDialogRef.current?.close();
            setIsProcessing(true);
            setMessage('Verarbeite...');
            setMessageType('info');
            await performScan(doubleScanData.cleanedId, true, doubleScanData.scanId); // confirmDoubleScan = true
            // performScan handled setIsProcessing(false)
            setTimeout({
                "Scan.useCallback[handleDoubleScanConfirm]": ()=>inputRef.current?.focus()
            }["Scan.useCallback[handleDoubleScanConfirm]"], 100);
        }
    }["Scan.useCallback[handleDoubleScanConfirm]"], [
        doubleScanData,
        performScan
    ]);
    const handleDoubleScanCancel = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "Scan.useCallback[handleDoubleScanCancel]": ()=>{
            doubleScanDialogRef.current?.close();
            setDoubleScanData(null);
            clearPendingScan();
            idRef.current = '';
            setID('');
            setMessage('Scan abgebrochen - möglicher Doppel-Scan erkannt');
            setMessageType('warning');
            setTimeout({
                "Scan.useCallback[handleDoubleScanCancel]": ()=>inputRef.current?.focus()
            }["Scan.useCallback[handleDoubleScanCancel]"], 100);
        }
    }["Scan.useCallback[handleDoubleScanCancel]"], [
        clearPendingScan
    ]);
    const handleSubmit = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "Scan.useCallback[handleSubmit]": async (event)=>{
            event.preventDefault();
            if (isProcessing) return; // Verhindere mehrfache Submissions
            // Initializing audio during the scanner's key event keeps sound available
            // in browsers that require a user gesture before playing audio.
            getAudioContext();
            const cleanedId = cleanId(idRef.current);
            if (!cleanedId.trim()) {
                setMessage('Bitte geben Sie eine gültige ID ein');
                setMessageType('error');
                playErrorSound();
                // Fokus behalten bei Validierungsfehlern
                inputRef.current?.focus();
                return;
            }
            setIsProcessing(true);
            setMessage('Verarbeite...');
            setMessageType('info');
            const queuedPendingScan = scanQueueRef.current.find({
                "Scan.useCallback[handleSubmit].queuedPendingScan": (scan)=>scan.cleanedId === cleanedId
            }["Scan.useCallback[handleSubmit].queuedPendingScan"]);
            const existingPendingScan = pendingScanRef.current || queuedPendingScan;
            const scanId = existingPendingScan?.cleanedId === cleanedId ? existingPendingScan.scanId : createClientId('scan');
            if (queuedPendingScan?.scanId === scanId) {
                persistQueue(scanQueueRef.current.filter({
                    "Scan.useCallback[handleSubmit]": (scan)=>scan.scanId !== scanId
                }["Scan.useCallback[handleSubmit]"]));
            }
            rememberPendingScan({
                cleanedId,
                scanId,
                createdAt: new Date().toISOString()
            });
            await performScan(cleanedId, false, scanId); // confirmDoubleScan = false
            // Fokus nach Verarbeitung wiederherstellen (performScan handled setIsProcessing)
            setTimeout({
                "Scan.useCallback[handleSubmit]": ()=>inputRef.current?.focus()
            }["Scan.useCallback[handleSubmit]"], 100);
        }
    }["Scan.useCallback[handleSubmit]"], [
        cleanId,
        getAudioContext,
        isProcessing,
        performScan,
        persistQueue,
        playErrorSound,
        rememberPendingScan
    ]);
    const handleDeleteTimestamp = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "Scan.useCallback[handleDeleteTimestamp]": async (roundId)=>{
            if (!roundId || !studentInfo) {
                showError('Ungültige Runden-ID oder fehlende Schülerinformationen', 'Beim Löschen des Zeitstempels');
                return;
            }
            try {
                await request(`/api/rounds/${roundId}`, {
                    method: 'DELETE',
                    data: {
                        studentId: studentInfo.id
                    }
                });
                const updatedRounds = rounds.filter({
                    "Scan.useCallback[handleDeleteTimestamp].updatedRounds": (round)=>round.id !== roundId
                }["Scan.useCallback[handleDeleteTimestamp].updatedRounds"]);
                setRounds(updatedRounds);
                // Aktualisiere auch die Rundenzahl im studentInfo
                setStudentInfo({
                    "Scan.useCallback[handleDeleteTimestamp]": (prevStudentInfo)=>({
                            ...prevStudentInfo,
                            roundCount: Math.max(0, Number(prevStudentInfo.roundCount) - 1)
                        })
                }["Scan.useCallback[handleDeleteTimestamp]"]);
                setMessage('Zeitstempel erfolgreich gelöscht');
                setMessageType('success');
            } catch (error) {
                showError(error, 'Beim Löschen des Zeitstempels');
            }
        }
    }["Scan.useCallback[handleDeleteTimestamp]"], [
        rounds,
        studentInfo,
        request,
        showError
    ]);
    const sortedRounds = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "Scan.useMemo[sortedRounds]": ()=>rounds.slice().sort({
                "Scan.useMemo[sortedRounds]": (a, b)=>new Date(b.timestamp) - new Date(a.timestamp)
            }["Scan.useMemo[sortedRounds]"])
    }["Scan.useMemo[sortedRounds]"], [
        rounds
    ]);
    const latestTimestamp = sortedRounds[0]?.timestamp || null;
    const previousTimestamp = sortedRounds[1]?.timestamp || null;
    const latestTimestampMinutesAgo = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "Scan.useMemo[latestTimestampMinutesAgo]": ()=>{
            if (!latestTimestamp) {
                return 'Bereit';
            }
            const previousRoundDifference = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$constants$2e$js__$5b$client$5d$__$28$ecmascript$29$__["calculateTimeDifference"])(latestTimestamp, previousTimestamp);
            if (!previousRoundDifference) {
                return 'Erste Runde';
            }
            return previousRoundDifference;
        }
    }["Scan.useMemo[latestTimestampMinutesAgo]"], [
        latestTimestamp,
        previousTimestamp
    ]);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "page-container-wide scan-dashboard",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "scan-dashboard-header",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                        className: "page-title scan-dashboard-title",
                        children: "Runden zählen"
                    }, void 0, false, {
                        fileName: "[project]/src/pages/scan.js",
                        lineNumber: 556,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "scan-status",
                        "aria-live": "polite",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: `status-pill ${isProcessing ? 'status-pill-warning' : 'status-pill-ready'}`,
                                children: isProcessing ? 'Scan wird verarbeitet' : 'Scanner bereit'
                            }, void 0, false, {
                                fileName: "[project]/src/pages/scan.js",
                                lineNumber: 559,
                                columnNumber: 11
                            }, this),
                            queuedScanCount > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "status-pill status-pill-warning",
                                children: [
                                    queuedScanCount,
                                    " Scan(s) vorgemerkt"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/pages/scan.js",
                                lineNumber: 563,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/pages/scan.js",
                        lineNumber: 558,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/pages/scan.js",
                lineNumber: 555,
                columnNumber: 7
            }, this),
            message && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: `message ${messageType === 'success' ? 'message-success' : messageType === 'warning' ? 'message-warning' : messageType === 'info' ? 'message-info' : 'message-error'}`,
                role: messageType === 'error' ? 'alert' : 'status',
                "aria-live": messageType === 'error' ? 'assertive' : 'polite',
                children: message
            }, void 0, false, {
                fileName: "[project]/src/pages/scan.js",
                lineNumber: 569,
                columnNumber: 9
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "scan-dashboard-layout",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("aside", {
                        className: "scan-sidebar",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "scan-input-panel",
                            "data-tour": "scan",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "scan-input-panel-header",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                        children: "Scanner"
                                    }, void 0, false, {
                                        fileName: "[project]/src/pages/scan.js",
                                        lineNumber: 586,
                                        columnNumber: 15
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/src/pages/scan.js",
                                    lineNumber: 585,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("form", {
                                    ref: formRef,
                                    onSubmit: handleSubmit,
                                    className: "form",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                            id: "scan-id",
                                            type: "text",
                                            ref: inputRef,
                                            value: id,
                                            onChange: handleInputChange,
                                            placeholder: "Barcode scannen",
                                            required: true,
                                            disabled: isProcessing,
                                            className: "input scan-input-compact",
                                            autoComplete: "off"
                                        }, void 0, false, {
                                            fileName: "[project]/src/pages/scan.js",
                                            lineNumber: 590,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                            type: "submit",
                                            className: "btn",
                                            disabled: isProcessing,
                                            children: isProcessing ? 'Verarbeite...' : 'Runde zählen'
                                        }, void 0, false, {
                                            fileName: "[project]/src/pages/scan.js",
                                            lineNumber: 602,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/pages/scan.js",
                                    lineNumber: 589,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/pages/scan.js",
                            lineNumber: 584,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/src/pages/scan.js",
                        lineNumber: 583,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                        className: "scan-primary-column",
                        children: studentInfo ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["Fragment"], {
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "scan-student-hero",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "scan-student-identity",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    className: "scan-student-class",
                                                    children: [
                                                        "Klasse ",
                                                        studentInfo.klasse
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/src/pages/scan.js",
                                                    lineNumber: 618,
                                                    columnNumber: 19
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                                    children: [
                                                        studentInfo.vorname,
                                                        " ",
                                                        studentInfo.nachname
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/src/pages/scan.js",
                                                    lineNumber: 619,
                                                    columnNumber: 19
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                    children: [
                                                        "ID ",
                                                        studentInfo.id
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/src/pages/scan.js",
                                                    lineNumber: 620,
                                                    columnNumber: 19
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/pages/scan.js",
                                            lineNumber: 617,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "scan-round-summary",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    children: "Runden gesamt"
                                                }, void 0, false, {
                                                    fileName: "[project]/src/pages/scan.js",
                                                    lineNumber: 624,
                                                    columnNumber: 19
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                                    children: studentInfo.roundCount || 0
                                                }, void 0, false, {
                                                    fileName: "[project]/src/pages/scan.js",
                                                    lineNumber: 625,
                                                    columnNumber: 19
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/pages/scan.js",
                                            lineNumber: 623,
                                            columnNumber: 17
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/pages/scan.js",
                                    lineNumber: 616,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "scan-student-metrics",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "scan-metric-card",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    children: "Letzte Erfassung"
                                                }, void 0, false, {
                                                    fileName: "[project]/src/pages/scan.js",
                                                    lineNumber: 631,
                                                    columnNumber: 19
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                                    children: latestTimestampMinutesAgo
                                                }, void 0, false, {
                                                    fileName: "[project]/src/pages/scan.js",
                                                    lineNumber: 632,
                                                    columnNumber: 19
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/pages/scan.js",
                                            lineNumber: 630,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "scan-metric-card",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    children: "Zuletzt um"
                                                }, void 0, false, {
                                                    fileName: "[project]/src/pages/scan.js",
                                                    lineNumber: 635,
                                                    columnNumber: 19
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                                    children: latestTimestamp ? `${(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$constants$2e$js__$5b$client$5d$__$28$ecmascript$29$__["formatDate"])(new Date(latestTimestamp))} Uhr` : 'Noch keine Runde'
                                                }, void 0, false, {
                                                    fileName: "[project]/src/pages/scan.js",
                                                    lineNumber: 636,
                                                    columnNumber: 19
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/pages/scan.js",
                                            lineNumber: 634,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "scan-metric-card",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    children: "Status"
                                                }, void 0, false, {
                                                    fileName: "[project]/src/pages/scan.js",
                                                    lineNumber: 639,
                                                    columnNumber: 19
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                                    children: messageType === 'error' ? 'Prüfen' : messageType === 'warning' ? 'Bestätigung nötig' : 'Erfasst'
                                                }, void 0, false, {
                                                    fileName: "[project]/src/pages/scan.js",
                                                    lineNumber: 640,
                                                    columnNumber: 19
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/pages/scan.js",
                                            lineNumber: 638,
                                            columnNumber: 17
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/pages/scan.js",
                                    lineNumber: 629,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "student-info-card",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                            children: "Scan-Timestamps"
                                        }, void 0, false, {
                                            fileName: "[project]/src/pages/scan.js",
                                            lineNumber: 645,
                                            columnNumber: 17
                                        }, this),
                                        timestampsLoading ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                            className: "message message-info",
                                            style: {
                                                fontSize: '0.9em',
                                                opacity: 0.8
                                            },
                                            children: "Lade Details..."
                                        }, void 0, false, {
                                            fileName: "[project]/src/pages/scan.js",
                                            lineNumber: 647,
                                            columnNumber: 19
                                        }, this) : sortedRounds.length > 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("ul", {
                                            className: "timestamp-list",
                                            children: sortedRounds.map((round, index, sortedArray)=>{
                                                const timestamp = round.timestamp;
                                                const previousTimestamp = index < sortedArray.length - 1 ? sortedArray[index + 1].timestamp : null;
                                                const timeDifference = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$constants$2e$js__$5b$client$5d$__$28$ecmascript$29$__["calculateTimeDifference"])(timestamp, previousTimestamp);
                                                return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                                    className: "timestamp-item",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                            children: [
                                                                (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$constants$2e$js__$5b$client$5d$__$28$ecmascript$29$__["formatDate"])(new Date(timestamp)),
                                                                " Uhr ",
                                                                '->',
                                                                " ",
                                                                (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$constants$2e$js__$5b$client$5d$__$28$ecmascript$29$__["timeAgo"])(currentTimestamp, new Date(timestamp)),
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
                                                                    fileName: "[project]/src/pages/scan.js",
                                                                    lineNumber: 660,
                                                                    columnNumber: 31
                                                                }, this)
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/src/pages/scan.js",
                                                            lineNumber: 657,
                                                            columnNumber: 27
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                            type: "button",
                                                            className: "btn btn-danger btn-sm",
                                                            onClick: ()=>handleDeleteTimestamp(round.id),
                                                            disabled: isProcessing || loading,
                                                            "aria-label": `Zeitstempel ${(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$constants$2e$js__$5b$client$5d$__$28$ecmascript$29$__["formatDate"])(new Date(timestamp))} löschen`,
                                                            children: loading ? 'Lösche...' : 'Löschen'
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/pages/scan.js",
                                                            lineNumber: 665,
                                                            columnNumber: 27
                                                        }, this)
                                                    ]
                                                }, round.id, true, {
                                                    fileName: "[project]/src/pages/scan.js",
                                                    lineNumber: 656,
                                                    columnNumber: 25
                                                }, this);
                                            })
                                        }, void 0, false, {
                                            fileName: "[project]/src/pages/scan.js",
                                            lineNumber: 649,
                                            columnNumber: 19
                                        }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "empty-state",
                                            children: "Für diesen Schüler wurden noch keine Runden erfasst."
                                        }, void 0, false, {
                                            fileName: "[project]/src/pages/scan.js",
                                            lineNumber: 679,
                                            columnNumber: 19
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/pages/scan.js",
                                    lineNumber: 644,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/pages/scan.js",
                            lineNumber: 615,
                            columnNumber: 13
                        }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "scan-empty-hero",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                children: "Noch kein Schüler gescannt"
                            }, void 0, false, {
                                fileName: "[project]/src/pages/scan.js",
                                lineNumber: 685,
                                columnNumber: 15
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/src/pages/scan.js",
                            lineNumber: 684,
                            columnNumber: 13
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/src/pages/scan.js",
                        lineNumber: 613,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/pages/scan.js",
                lineNumber: 582,
                columnNumber: 7
            }, this),
            doubleScanData && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$dialogs$2f$scan$2f$DoubleScanConfirmationDialog$2e$js__$5b$client$5d$__$28$ecmascript$29$__["default"], {
                dialogRef: doubleScanDialogRef,
                studentInfo: doubleScanData.student,
                lastRoundTime: doubleScanData.lastRoundTime,
                thresholdMinutes: doubleScanData.thresholdMinutes,
                onConfirm: handleDoubleScanConfirm,
                onCancel: handleDoubleScanCancel
            }, void 0, false, {
                fileName: "[project]/src/pages/scan.js",
                lineNumber: 692,
                columnNumber: 9
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/pages/scan.js",
        lineNumber: 554,
        columnNumber: 5
    }, this);
}
_s(Scan, "0xktTKlS4R1LD7P7ENVPjSbItLs=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$useApi$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useApi"],
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$contexts$2f$ErrorContext$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useGlobalError"]
    ];
});
_c = Scan;
var _c;
__turbopack_context__.k.register(_c, "Scan");
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

//# sourceMappingURL=%5Broot-of-the-server%5D__1xe16iy._.js.map