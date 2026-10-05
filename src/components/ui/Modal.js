import React, { useRef, useImperativeHandle } from 'react';
import BaseDialog from '../BaseDialog';

// Both modal entry points use the same appearance and keyboard behavior.
const Modal = React.forwardRef(({ title, children, onClose, className = '', size = 'medium' }, ref) => {
  const dialogRef = useRef(null);
  useImperativeHandle(ref, () => dialogRef.current);
  const content = React.Children.toArray(children);
  const footer = content.find((child) => child.type === ModalFooter);
  return <BaseDialog dialogRef={dialogRef} title={title} onClose={onClose}
    className={className} size={size} footer={footer} showDefaultClose={!footer}>
    {content.filter((child) => child !== footer)}
  </BaseDialog>;
});
Modal.displayName = 'Modal';
export function ModalBody({ children, className = '' }) {
  return <div className={className}>{children}</div>;
}
export function ModalFooter({ children, className = '' }) {
  return <div className={`dialog-actions ${className}`}>{children}</div>;
}
export default Modal;
