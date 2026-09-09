module.exports = [
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
"[externals]/node:stream [external] (node:stream, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("node:stream", () => require("node:stream"));

module.exports = mod;
}),
"[project]/src/components/BaseDialog.js [ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>__TURBOPACK__default__export__
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/react/jsx-dev-runtime [external] (react/jsx-dev-runtime, cjs)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/react [external] (react, cjs)");
;
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
    const titleId = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useId"])();
    const lastFocusedElementRef = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useRef"])(null);
    const handleClose = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useCallback"])(()=>{
        dialogRef.current?.close();
    }, [
        dialogRef
    ]);
    const enabledActions = getEnabledActions(actions, showDefaultClose, handleClose);
    const cancelAction = getCancelAction(enabledActions);
    const primaryAction = getPrimaryAction(enabledActions);
    (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useEffect"])(()=>{
        const dialog = dialogRef.current;
        if (!dialog) {
            return undefined;
        }
        const rememberLastFocusedElement = ()=>{
            if (!dialog.open && document.activeElement instanceof HTMLElement) {
                lastFocusedElementRef.current = document.activeElement;
            }
        };
        const triggerDialogAction = (selector, fallback)=>{
            const actionButton = dialog.querySelector(selector);
            if (actionButton instanceof HTMLButtonElement) {
                actionButton.click();
                return true;
            }
            fallback?.();
            return false;
        };
        const focusPrimaryAction = ()=>{
            requestAnimationFrame(()=>{
                const preferredActionButton = dialog.querySelector('[data-dialog-primary-action="true"]');
                preferredActionButton?.focus();
            });
        };
        const observer = new MutationObserver(()=>{
            if (dialog.open) {
                focusPrimaryAction();
            }
        });
        const handleCancel = (event)=>{
            event.preventDefault();
            triggerDialogAction('[data-dialog-cancel-action="true"]', ()=>dialog.close());
        };
        const handleKeyDown = (event)=>{
            if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey) {
                return;
            }
            const targetTagName = event.target?.tagName;
            if (event.key === 'Escape') {
                event.preventDefault();
                triggerDialogAction('[data-dialog-cancel-action="true"]', ()=>dialog.close());
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
        };
        const handleCloseEvent = ()=>{
            onClose?.();
            lastFocusedElementRef.current?.focus?.();
        };
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
        return ()=>{
            document.removeEventListener('focusin', rememberLastFocusedElement);
            observer.disconnect();
            dialog.removeEventListener('cancel', handleCancel);
            dialog.removeEventListener('keydown', handleKeyDown);
            dialog.removeEventListener('close', handleCloseEvent);
        };
    }, [
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
                return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                    className: actionClass,
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                            className: "btn-group",
                            children: leftActions.map((action, index)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("button", {
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
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                            className: "btn-group",
                            children: rightActions.map((action, index)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("button", {
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
                return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                    className: actionClass,
                    children: actions.map((action, index)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("button", {
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
            return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                className: "dialog-actions",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("button", {
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
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("dialog", {
        ref: dialogRef,
        className: `dialog-shell ${className} ${sizeClasses[size]}`,
        "aria-labelledby": title ? titleId : undefined,
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                className: "dialog-header",
                children: [
                    title ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("h2", {
                        id: titleId,
                        className: "dialog-title",
                        children: title
                    }, void 0, false, {
                        fileName: "[project]/src/components/BaseDialog.js",
                        lineNumber: 260,
                        columnNumber: 26
                    }, ("TURBOPACK compile-time value", void 0)) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("span", {}, void 0, false, {
                        fileName: "[project]/src/components/BaseDialog.js",
                        lineNumber: 260,
                        columnNumber: 83
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("button", {
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
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
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
const __TURBOPACK__default__export__ = BaseDialog;
}),
"[project]/src/components/dialogs/scan/DoubleScanConfirmationDialog.js [ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>__TURBOPACK__default__export__
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/react/jsx-dev-runtime [external] (react/jsx-dev-runtime, cjs)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/react [external] (react, cjs)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$BaseDialog$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/BaseDialog.js [ssr] (ecmascript)");
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
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$BaseDialog$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__["default"], {
        dialogRef: dialogRef,
        title: "Doppel-Scan Warnung",
        size: "large",
        actions: actions,
        showDefaultClose: false,
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
            className: "double-scan-content",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                    className: "scan-alert",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                            className: "alert-icon",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("svg", {
                                width: "48",
                                height: "48",
                                viewBox: "0 0 24 24",
                                fill: "none",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("path", {
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
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                            className: "alert-content",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("h3", {
                                    className: "alert-title",
                                    children: "Zu schneller Scan erkannt"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/dialogs/scan/DoubleScanConfirmationDialog.js",
                                    lineNumber: 55,
                                    columnNumber: 13
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("p", {
                                    className: "alert-message",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("span", {
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
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("span", {
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
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                    className: "student-card",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                            className: "card-header",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
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
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                    className: "student-basic-info",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("h4", {
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
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("p", {
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
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                            className: "card-stats",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                    className: "stat-item",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                            className: "stat-number",
                                            children: studentInfo?.roundCount || 0
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/dialogs/scan/DoubleScanConfirmationDialog.js",
                                            lineNumber: 79,
                                            columnNumber: 15
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
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
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                    className: "stat-divider"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/dialogs/scan/DoubleScanConfirmationDialog.js",
                                    lineNumber: 82,
                                    columnNumber: 13
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                    className: "stat-item",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                            className: "stat-number",
                                            children: thresholdMinutes
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/dialogs/scan/DoubleScanConfirmationDialog.js",
                                            lineNumber: 84,
                                            columnNumber: 15
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
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
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                    className: "stat-divider"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/dialogs/scan/DoubleScanConfirmationDialog.js",
                                    lineNumber: 87,
                                    columnNumber: 13
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                    className: "stat-item",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
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
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
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
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                    className: "decision-box",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("h4", {
                            className: "decision-title",
                            children: "Was möchten Sie tun?"
                        }, void 0, false, {
                            fileName: "[project]/src/components/dialogs/scan/DoubleScanConfirmationDialog.js",
                            lineNumber: 97,
                            columnNumber: 11
                        }, ("TURBOPACK compile-time value", void 0)),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("p", {
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
const __TURBOPACK__default__export__ = DoubleScanConfirmationDialog;
}),
"[project]/src/pages/scan.js [ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

return __turbopack_context__.a(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {
__turbopack_context__.s([
    "default",
    ()=>Scan
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/react/jsx-dev-runtime [external] (react/jsx-dev-runtime, cjs)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/react [external] (react, cjs)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$constants$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/constants.js [ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$useApi$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/hooks/useApi.js [ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$contexts$2f$ErrorContext$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/contexts/ErrorContext.js [ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$dialogs$2f$scan$2f$DoubleScanConfirmationDialog$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/dialogs/scan/DoubleScanConfirmationDialog.js [ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$studentId$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/studentId.js [ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$axios__$5b$external$5d$__$28$axios$2c$__esm_import$2c$__$5b$project$5d2f$node_modules$2f$axios$29$__ = __turbopack_context__.i("[externals]/axios [external] (axios, esm_import, [project]/node_modules/axios)");
var __turbopack_async_dependencies__ = __turbopack_handle_async_dependencies__([
    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$useApi$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__,
    __TURBOPACK__imported__module__$5b$externals$5d2f$axios__$5b$external$5d$__$28$axios$2c$__esm_import$2c$__$5b$project$5d2f$node_modules$2f$axios$29$__
]);
[__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$useApi$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__, __TURBOPACK__imported__module__$5b$externals$5d2f$axios__$5b$external$5d$__$28$axios$2c$__esm_import$2c$__$5b$project$5d2f$node_modules$2f$axios$29$__] = __turbopack_async_dependencies__.then ? (await __turbopack_async_dependencies__)() : __turbopack_async_dependencies__;
;
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
    const [id, setID] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])('');
    const [currentTimestamp, setCurrentTimestamp] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])(null);
    const [message, setMessage] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])('');
    const [messageType, setMessageType] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])('');
    const [studentInfo, setStudentInfo] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])(null);
    const [rounds, setRounds] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])([]);
    const [timestampsLoading, setTimestampsLoading] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])(false);
    const [isProcessing, setIsProcessing] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])(false);
    const [doubleScanData, setDoubleScanData] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])(null);
    const [queuedScanCount, setQueuedScanCount] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])(0);
    const { request, loading } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$useApi$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__["useApi"])();
    const { showError } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$contexts$2f$ErrorContext$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__["useGlobalError"])();
    const formRef = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useRef"])(null);
    const inputRef = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useRef"])(null);
    const doubleScanDialogRef = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useRef"])(null);
    const idRef = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useRef"])('');
    const pendingScanRef = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useRef"])(null);
    const deviceIdRef = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useRef"])(null);
    const scanQueueRef = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useRef"])([]);
    const flushingQueueRef = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useRef"])(false);
    const audioContextRef = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useRef"])(null);
    const getAudioContext = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useCallback"])(()=>{
        if ("TURBOPACK compile-time truthy", 1) return null;
        //TURBOPACK unreachable
        ;
        const AudioContext = undefined;
    }, []);
    const playErrorSound = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useCallback"])(()=>{
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
    }, [
        getAudioContext
    ]);
    (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useEffect"])(()=>{
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
                    if (!queue.some((entry)=>entry.scanId === pendingScan.scanId)) queue.push(pendingScan);
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
    }, []);
    (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useEffect"])(()=>{
        const sendHeartbeat = ()=>{
            if (!deviceIdRef.current) return;
            __TURBOPACK__imported__module__$5b$externals$5d2f$axios__$5b$external$5d$__$28$axios$2c$__esm_import$2c$__$5b$project$5d2f$node_modules$2f$axios$29$__["default"].post('/api/stations/heartbeat', {
                deviceId: deviceIdRef.current
            }, {
                timeout: 5000
            }).catch(()=>{});
        };
        sendHeartbeat();
        const interval = window.setInterval(sendHeartbeat, 30000);
        return ()=>window.clearInterval(interval);
    }, []);
    (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useEffect"])(()=>()=>{
            audioContextRef.current?.close().catch(()=>{});
        }, []);
    // Fokus nach Submit wiederherstellen
    (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useEffect"])(()=>{
        if (!isProcessing) {
            const timer = setTimeout(()=>{
                inputRef.current?.focus();
            }, 100);
            return ()=>clearTimeout(timer);
        }
    }, [
        isProcessing
    ]);
    // Dialog öffnen sobald doubleScanData gesetzt wird
    (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useEffect"])(()=>{
        if (doubleScanData && doubleScanDialogRef.current) {
            doubleScanDialogRef.current.showModal();
        }
    }, [
        doubleScanData
    ]);
    (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useEffect"])(()=>{
        const handleGlobalKeyDown = (event)=>{
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
        };
        document.addEventListener('keydown', handleGlobalKeyDown);
        return ()=>document.removeEventListener('keydown', handleGlobalKeyDown);
    }, []);
    const cleanId = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useCallback"])((rawId)=>{
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$studentId$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__["cleanScannedStudentId"])(rawId);
    }, []);
    const handleInputChange = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useCallback"])((e)=>{
        idRef.current = e.target.value;
        setID(e.target.value);
    }, []);
    const rememberPendingScan = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useCallback"])((pendingScan)=>{
        pendingScanRef.current = pendingScan;
        window.localStorage.setItem(PENDING_SCAN_STORAGE_KEY, JSON.stringify(pendingScan));
    }, []);
    const clearPendingScan = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useCallback"])(()=>{
        pendingScanRef.current = null;
        window.localStorage.removeItem(PENDING_SCAN_STORAGE_KEY);
    }, []);
    const persistQueue = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useCallback"])((queue)=>{
        scanQueueRef.current = queue;
        window.localStorage.setItem(SCAN_QUEUE_STORAGE_KEY, JSON.stringify(queue));
        setQueuedScanCount(queue.length);
    }, []);
    const enqueueScan = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useCallback"])((pendingScan)=>{
        if (!pendingScan?.scanId) return;
        const queue = scanQueueRef.current.some((entry)=>entry.scanId === pendingScan.scanId) ? scanQueueRef.current : [
            ...scanQueueRef.current,
            pendingScan
        ].slice(-MAX_QUEUED_SCANS);
        persistQueue(queue);
    }, [
        persistQueue
    ]);
    // Funktion zum asynchronen Laden der Timestamps
    const loadTimestamps = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useCallback"])(async (studentId)=>{
        setTimestampsLoading(true);
        try {
            const response = await request(`/api/students/${studentId}/timestamps`);
            const loadedRounds = response.rounds || (response.timestamps || []).map((timestamp, index)=>({
                    id: `legacy-${index}`,
                    timestamp
                }));
            setRounds(loadedRounds);
        } catch (error) {
            console.warn('Timestamps konnten nicht geladen werden:', error);
            setRounds([]);
        } finally{
            setTimestampsLoading(false);
        }
    }, [
        request
    ]);
    const performScan = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useCallback"])(async (cleanedId, confirmDoubleScan = false, scanId)=>{
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
                    setRounds((currentRounds)=>[
                            response.round,
                            ...currentRounds.filter((round)=>round.id !== response.round.id)
                        ]);
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
    }, [
        request,
        loadTimestamps,
        clearPendingScan,
        enqueueScan,
        playErrorSound
    ]);
    const flushScanQueue = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useCallback"])(async ()=>{
        if (flushingQueueRef.current || !navigator.onLine || scanQueueRef.current.length === 0) return;
        flushingQueueRef.current = true;
        try {
            while(scanQueueRef.current.length > 0 && navigator.onLine){
                const pendingIndex = scanQueueRef.current.findIndex((entry)=>!entry.requiresConfirmation);
                if (pendingIndex === -1) break;
                const pending = scanQueueRef.current[pendingIndex];
                try {
                    const response = await __TURBOPACK__imported__module__$5b$externals$5d2f$axios__$5b$external$5d$__$28$axios$2c$__esm_import$2c$__$5b$project$5d2f$node_modules$2f$axios$29$__["default"].post('/api/runden', {
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
                        persistQueue(scanQueueRef.current.map((entry)=>entry.scanId === pending.scanId ? {
                                ...entry,
                                requiresConfirmation: true
                            } : entry));
                        continue;
                    }
                    persistQueue(scanQueueRef.current.filter((entry)=>entry.scanId !== pending.scanId));
                    setMessage('Vorgemerkter Scan wurde erfolgreich nachgetragen');
                    setMessageType('success');
                } catch (error) {
                    if (!error.response || error.response.status >= 500 || error.response.status === 429) break;
                    persistQueue(scanQueueRef.current.filter((entry)=>entry.scanId !== pending.scanId));
                    setMessage(`Vorgemerkter Scan wurde verworfen: ${error.response?.data?.message || 'ungültige Daten'}`);
                    setMessageType('error');
                }
            }
        } finally{
            flushingQueueRef.current = false;
        }
    }, [
        persistQueue
    ]);
    (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useEffect"])(()=>{
        const handleOnline = ()=>flushScanQueue();
        window.addEventListener('online', handleOnline);
        const interval = window.setInterval(flushScanQueue, 5000);
        flushScanQueue();
        return ()=>{
            window.removeEventListener('online', handleOnline);
            window.clearInterval(interval);
        };
    }, [
        flushScanQueue
    ]);
    const handleDoubleScanConfirm = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useCallback"])(async ()=>{
        if (!doubleScanData) return;
        doubleScanDialogRef.current?.close();
        setIsProcessing(true);
        setMessage('Verarbeite...');
        setMessageType('info');
        await performScan(doubleScanData.cleanedId, true, doubleScanData.scanId); // confirmDoubleScan = true
        // performScan handled setIsProcessing(false)
        setTimeout(()=>inputRef.current?.focus(), 100);
    }, [
        doubleScanData,
        performScan
    ]);
    const handleDoubleScanCancel = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useCallback"])(()=>{
        doubleScanDialogRef.current?.close();
        setDoubleScanData(null);
        clearPendingScan();
        idRef.current = '';
        setID('');
        setMessage('Scan abgebrochen - möglicher Doppel-Scan erkannt');
        setMessageType('warning');
        setTimeout(()=>inputRef.current?.focus(), 100);
    }, [
        clearPendingScan
    ]);
    const handleSubmit = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useCallback"])(async (event)=>{
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
        const queuedPendingScan = scanQueueRef.current.find((scan)=>scan.cleanedId === cleanedId);
        const existingPendingScan = pendingScanRef.current || queuedPendingScan;
        const scanId = existingPendingScan?.cleanedId === cleanedId ? existingPendingScan.scanId : createClientId('scan');
        if (queuedPendingScan?.scanId === scanId) {
            persistQueue(scanQueueRef.current.filter((scan)=>scan.scanId !== scanId));
        }
        rememberPendingScan({
            cleanedId,
            scanId,
            createdAt: new Date().toISOString()
        });
        await performScan(cleanedId, false, scanId); // confirmDoubleScan = false
        // Fokus nach Verarbeitung wiederherstellen (performScan handled setIsProcessing)
        setTimeout(()=>inputRef.current?.focus(), 100);
    }, [
        cleanId,
        getAudioContext,
        isProcessing,
        performScan,
        persistQueue,
        playErrorSound,
        rememberPendingScan
    ]);
    const handleDeleteTimestamp = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useCallback"])(async (roundId)=>{
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
            const updatedRounds = rounds.filter((round)=>round.id !== roundId);
            setRounds(updatedRounds);
            // Aktualisiere auch die Rundenzahl im studentInfo
            setStudentInfo((prevStudentInfo)=>({
                    ...prevStudentInfo,
                    roundCount: Math.max(0, Number(prevStudentInfo.roundCount) - 1)
                }));
            setMessage('Zeitstempel erfolgreich gelöscht');
            setMessageType('success');
        } catch (error) {
            showError(error, 'Beim Löschen des Zeitstempels');
        }
    }, [
        rounds,
        studentInfo,
        request,
        showError
    ]);
    const sortedRounds = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useMemo"])(()=>rounds.slice().sort((a, b)=>new Date(b.timestamp) - new Date(a.timestamp)), [
        rounds
    ]);
    const latestTimestamp = sortedRounds[0]?.timestamp || null;
    const previousTimestamp = sortedRounds[1]?.timestamp || null;
    const latestTimestampMinutesAgo = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useMemo"])(()=>{
        if (!latestTimestamp) {
            return 'Bereit';
        }
        const previousRoundDifference = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$constants$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__["calculateTimeDifference"])(latestTimestamp, previousTimestamp);
        if (!previousRoundDifference) {
            return 'Erste Runde';
        }
        return previousRoundDifference;
    }, [
        latestTimestamp,
        previousTimestamp
    ]);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
        className: "page-container-wide scan-dashboard",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                className: "scan-dashboard-header",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("h1", {
                        className: "page-title scan-dashboard-title",
                        children: "Runden zählen"
                    }, void 0, false, {
                        fileName: "[project]/src/pages/scan.js",
                        lineNumber: 556,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                        className: "scan-status",
                        "aria-live": "polite",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("span", {
                                className: `status-pill ${isProcessing ? 'status-pill-warning' : 'status-pill-ready'}`,
                                children: isProcessing ? 'Scan wird verarbeitet' : 'Scanner bereit'
                            }, void 0, false, {
                                fileName: "[project]/src/pages/scan.js",
                                lineNumber: 559,
                                columnNumber: 11
                            }, this),
                            queuedScanCount > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("span", {
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
            message && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                className: `message ${messageType === 'success' ? 'message-success' : messageType === 'warning' ? 'message-warning' : messageType === 'info' ? 'message-info' : 'message-error'}`,
                role: messageType === 'error' ? 'alert' : 'status',
                "aria-live": messageType === 'error' ? 'assertive' : 'polite',
                children: message
            }, void 0, false, {
                fileName: "[project]/src/pages/scan.js",
                lineNumber: 569,
                columnNumber: 9
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                className: "scan-dashboard-layout",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("aside", {
                        className: "scan-sidebar",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                            className: "scan-input-panel",
                            "data-tour": "scan",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                    className: "scan-input-panel-header",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("h2", {
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
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("form", {
                                    ref: formRef,
                                    onSubmit: handleSubmit,
                                    className: "form",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("input", {
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
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("button", {
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
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("section", {
                        className: "scan-primary-column",
                        children: studentInfo ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["Fragment"], {
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                    className: "scan-student-hero",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                            className: "scan-student-identity",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("span", {
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
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("h2", {
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
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("p", {
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
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                            className: "scan-round-summary",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("span", {
                                                    children: "Runden gesamt"
                                                }, void 0, false, {
                                                    fileName: "[project]/src/pages/scan.js",
                                                    lineNumber: 624,
                                                    columnNumber: 19
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("strong", {
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
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                    className: "scan-student-metrics",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                            className: "scan-metric-card",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("span", {
                                                    children: "Letzte Erfassung"
                                                }, void 0, false, {
                                                    fileName: "[project]/src/pages/scan.js",
                                                    lineNumber: 631,
                                                    columnNumber: 19
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("strong", {
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
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                            className: "scan-metric-card",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("span", {
                                                    children: "Zuletzt um"
                                                }, void 0, false, {
                                                    fileName: "[project]/src/pages/scan.js",
                                                    lineNumber: 635,
                                                    columnNumber: 19
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("strong", {
                                                    children: latestTimestamp ? `${(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$constants$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__["formatDate"])(new Date(latestTimestamp))} Uhr` : 'Noch keine Runde'
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
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                            className: "scan-metric-card",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("span", {
                                                    children: "Status"
                                                }, void 0, false, {
                                                    fileName: "[project]/src/pages/scan.js",
                                                    lineNumber: 639,
                                                    columnNumber: 19
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("strong", {
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
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                    className: "student-info-card",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("h3", {
                                            children: "Scan-Timestamps"
                                        }, void 0, false, {
                                            fileName: "[project]/src/pages/scan.js",
                                            lineNumber: 645,
                                            columnNumber: 17
                                        }, this),
                                        timestampsLoading ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("p", {
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
                                        }, this) : sortedRounds.length > 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("ul", {
                                            className: "timestamp-list",
                                            children: sortedRounds.map((round, index, sortedArray)=>{
                                                const timestamp = round.timestamp;
                                                const previousTimestamp = index < sortedArray.length - 1 ? sortedArray[index + 1].timestamp : null;
                                                const timeDifference = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$constants$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__["calculateTimeDifference"])(timestamp, previousTimestamp);
                                                return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("li", {
                                                    className: "timestamp-item",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("span", {
                                                            children: [
                                                                (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$constants$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__["formatDate"])(new Date(timestamp)),
                                                                " Uhr ",
                                                                '->',
                                                                " ",
                                                                (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$constants$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__["timeAgo"])(currentTimestamp, new Date(timestamp)),
                                                                timeDifference && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("span", {
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
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("button", {
                                                            type: "button",
                                                            className: "btn btn-danger btn-sm",
                                                            onClick: ()=>handleDeleteTimestamp(round.id),
                                                            disabled: isProcessing || loading,
                                                            "aria-label": `Zeitstempel ${(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$constants$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__["formatDate"])(new Date(timestamp))} löschen`,
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
                                        }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
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
                        }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                            className: "scan-empty-hero",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("h2", {
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
            doubleScanData && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$dialogs$2f$scan$2f$DoubleScanConfirmationDialog$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__["default"], {
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
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, false);}),
"[project]/src/utils/constants.js [ssr] (ecmascript)", ((__turbopack_context__) => {
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
}),
"[project]/src/utils/studentId.js [ssr] (ecmascript)", ((__turbopack_context__) => {
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
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__1bxpb6b._.js.map