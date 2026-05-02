import React, { createContext, useContext, useState } from 'react';
import CustomModal from '../components/CustomModal';

const ModalContext = createContext();

export function ModalProvider({ children }) {
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'info',
    onConfirm: null,
    confirmText: 'Confirm',
    cancelText: 'Cancel'
  });

  const showModal = ({ 
    title, 
    message, 
    type = 'info', 
    onConfirm = null,
    confirmText = 'Confirm',
    cancelText = 'Cancel'
  }) => {
    setModalConfig({
      isOpen: true,
      title,
      message,
      type,
      onConfirm,
      confirmText,
      cancelText
    });
  };

  const hideModal = () => {
    setModalConfig(prev => ({ ...prev, isOpen: false }));
  };

  return (
    <ModalContext.Provider value={{ showModal, hideModal }}>
      {children}
      <CustomModal 
        {...modalConfig}
        onClose={hideModal}
      />
    </ModalContext.Provider>
  );
}

export const useModal = () => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
};
