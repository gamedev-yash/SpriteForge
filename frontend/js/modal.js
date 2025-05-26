function showModal(message, confirmText = 'Continue', cancelText = 'Cancel') {
    return new Promise((resolve) => {
        const modal = document.getElementById('warningModal');
        const modalMessage = document.getElementById('modalMessage');
        const modalConfirm = document.getElementById('modalConfirm');
        const modalCancel = document.getElementById('modalCancel');
        const closeModal = document.querySelector('.close-modal');

        modalMessage.textContent = message;
        modalConfirm.textContent = confirmText;
        modalCancel.textContent = cancelText;
        
        modal.classList.remove('hidden');
        setTimeout(() => modal.classList.add('show'), 10);

        const hideModal = () => {
            modal.classList.remove('show');
            setTimeout(() => modal.classList.add('hidden'), 300);
        };

        const handleConfirm = () => {
            hideModal();
            resolve(true);
        };

        const handleCancel = () => {
            hideModal();
            resolve(false);
        };

        modalConfirm.addEventListener('click', handleConfirm, { once: true });
        modalCancel.addEventListener('click', handleCancel, { once: true });
        closeModal.addEventListener('click', handleCancel, { once: true });
    });
}

window.showModal = showModal;