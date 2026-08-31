import React from 'react';

/**
 * Modern Modal Component
 * Enhanced version of BaseDialog with better styling
 * 
 * @example
 * <Modal
 *   ref={modalRef}
 *   title="Confirm Action"
 *   onClose={handleClose}
 * >
 *   <ModalBody>Content here</ModalBody>
 *   <ModalFooter>
 *     <Button onClick={handleClose}>Cancel</Button>
 *     <Button variant="primary">Confirm</Button>
 *   </ModalFooter>
 * </Modal>
 */
const Modal = React.forwardRef(({
  title,
  children,
  onClose,
  maxWidth = '600px',
  className = '',
  ...props
}, ref) => {
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose?.();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onClose?.();
    }
  };

  return (
    <dialog
      ref={ref}
      className={`modal ${className}`}
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      style={{ maxWidth }}
      {...props}
    >
      <div className="modal-content">
        {title && (
          <div className="modal-header">
            <h2 className="modal-title">{title}</h2>
            {onClose && (
              <button
                type="button"
                className="modal-close"
                onClick={onClose}
                aria-label="Close modal"
              >
                ×
              </button>
            )}
          </div>
        )}
        {children}
      </div>
    </dialog>
  );
});

Modal.displayName = 'Modal';

export function ModalBody({ children, className = '' }) {
  return (
    <div className={`modal-body ${className}`}>
      {children}
    </div>
  );
}

export function ModalFooter({ children, className = '' }) {
  return (
    <div className={`modal-footer ${className}`}>
      {children}
    </div>
  );
}

export default Modal;
