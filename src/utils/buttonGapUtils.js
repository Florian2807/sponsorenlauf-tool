/**
 * Utility functions for adaptive button group spacing
 */

/**
 * Automatically applies the appropriate gap class to button groups based on button count
 * @param {HTMLElement} buttonGroup - The button group element
 */
export function applyAdaptiveButtonGap(buttonGroup) {
    if (!buttonGroup) return;

    const buttons = buttonGroup.querySelectorAll('.btn');
    const buttonCount = buttons.length;

    // Remove existing gap classes
    buttonGroup.classList.remove(
        'btn-group-gap-none',
        'btn-group-gap-xs',
        'btn-group-gap-sm',
        'btn-group-gap-md',
        'btn-group-gap-lg',
        'btn-group-gap-xl',
        'btn-group-gap-2xl'
    );

    // Apply appropriate gap class based on button count
    switch (buttonCount) {
        case 1:
            buttonGroup.classList.add('btn-group-gap-none');
            break;
        case 2:
            buttonGroup.classList.add('btn-group-gap-2xl');
            break;
        case 3:
            buttonGroup.classList.add('btn-group-gap-xl');
            break;
        case 4:
            buttonGroup.classList.add('btn-group-gap-lg');
            break;
        default: // 5 or more
            buttonGroup.classList.add('btn-group-gap-sm');
            break;
    }
}

/**
 * Automatically applies adaptive gaps to all button groups on the page
 */
export function applyAdaptiveGapsToAllButtonGroups() {
    const buttonGroups = document.querySelectorAll('.btn-group, .btn-group-center');
    buttonGroups.forEach(applyAdaptiveButtonGap);
}

/**
 * Sets up automatic gap adjustment when button groups change
 * @param {HTMLElement} container - Container to observe for changes
 */
export function setupAdaptiveButtonGaps(container = document.body) {
    // Initial application
    applyAdaptiveGapsToAllButtonGroups();

    // Set up observer for dynamic changes
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'childList') {
                // Check if any button groups were affected
                const target = mutation.target;
                if (target.classList.contains('btn-group') || target.classList.contains('btn-group-center')) {
                    applyAdaptiveButtonGap(target);
                }

                // Check for new button groups in added nodes
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        const buttonGroups = node.querySelectorAll ?
                            node.querySelectorAll('.btn-group, .btn-group-center') : [];
                        buttonGroups.forEach(applyAdaptiveButtonGap);

                        if (node.classList && (node.classList.contains('btn-group') || node.classList.contains('btn-group-center'))) {
                            applyAdaptiveButtonGap(node);
                        }
                    }
                });
            }
        });
    });

    observer.observe(container, {
        childList: true,
        subtree: true
    });

    return observer;
}

/**
 * React hook for adaptive button gaps
 * @param {Array} dependencies - Dependencies to trigger recalculation
 */
export function useAdaptiveButtonGaps(dependencies = []) {
    React.useEffect(() => {
        applyAdaptiveGapsToAllButtonGroups();
    }, dependencies);
}

// CSS class mapping for button counts
export const BUTTON_GAP_CLASSES = {
    1: 'btn-group-gap-none',
    2: 'btn-group-gap-2xl',
    3: 'btn-group-gap-xl',
    4: 'btn-group-gap-lg',
    5: 'btn-group-gap-sm'
};

// Example usage in React components:
/*
import { applyAdaptiveButtonGap, BUTTON_GAP_CLASSES } from './buttonGapUtils';

// Manual application
const MyComponent = () => {
    const buttonGroupRef = useRef();
    const [buttons, setButtons] = useState([]);
    
    useEffect(() => {
        if (buttonGroupRef.current) {
            applyAdaptiveButtonGap(buttonGroupRef.current);
        }
    }, [buttons]);
    
    return (
        <div ref={buttonGroupRef} className="btn-group-center">
            {buttons.map(button => <button key={button.id} className="btn">{button.label}</button>)}
        </div>
    );
};
*/
