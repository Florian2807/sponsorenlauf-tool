import { useEffect, useState } from 'react';

export const useCapsLock = () => {
    const [active, setActive] = useState(false);
    useEffect(() => {
        const update = (event) => setActive(event.getModifierState('CapsLock'));
        const reset = () => setActive(false);
        window.addEventListener('keydown', update, true);
        window.addEventListener('keyup', update, true);
        window.addEventListener('blur', reset);
        return () => {
            window.removeEventListener('keydown', update, true);
            window.removeEventListener('keyup', update, true);
            window.removeEventListener('blur', reset);
        };
    }, []);
    return active;
};
