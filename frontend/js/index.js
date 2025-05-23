document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('uploadForm');
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    const submitBtn = document.getElementById('submitBtn');
    const result = document.getElementById('result');
    const previewContainer = document.getElementById('imagePreviewContainer');
    const cleanupBtn = document.getElementById('cleanupBtn');
    cleanupBtn.style.display = 'none'; // Hide by default

    const modal = document.getElementById('warningModal');
    const modalMessage = document.getElementById('modalMessage');
    const modalConfirm = document.getElementById('modalConfirm');
    const modalCancel = document.getElementById('modalCancel');
    const closeModal = document.querySelector('.close-modal');

    function showModal(message) {
        return new Promise((resolve) => {
            modalMessage.textContent = message;
            modal.classList.remove('hidden');
            setTimeout(() => modal.classList.add('show'), 10);

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

    function hideModal() {
        modal.classList.remove('show');
        setTimeout(() => modal.classList.add('hidden'), 300);
    }

    let files = new DataTransfer();

    // Handle drag and drop
    dropZone.addEventListener('click', () => fileInput.click());
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('dragover');
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('dragover');
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
        handleFiles(e.dataTransfer.files);
    });

    fileInput.addEventListener('change', (e) => {
        handleFiles(e.target.files);
    });

    function handleFiles(newFiles) {
        Array.from(newFiles).forEach(file => {
            if (file.type.startsWith('image/')) {
                files.items.add(file);
                createImagePreview(file);
            }
        });
        updateFileInput();
    }

    function createImagePreview(file) {
        const wrapper = document.createElement('div');
        wrapper.className = 'image-preview-wrapper';

        const img = document.createElement('img');
        img.className = 'image-preview';
        img.file = file;

        const removeBtn = document.createElement('button');
        removeBtn.className = 'remove-image';
        removeBtn.innerHTML = '<i class="fas fa-times"></i>';
        removeBtn.onclick = () => removeImage(file, wrapper);

        wrapper.appendChild(img);
        wrapper.appendChild(removeBtn);
        previewContainer.appendChild(wrapper);

        const reader = new FileReader();
        reader.onload = (e) => img.src = e.target.result;
        reader.readAsDataURL(file);
    }

    function removeImage(file, wrapper) {
        const newFiles = new DataTransfer();
        Array.from(files.files)
            .filter(f => f !== file)
            .forEach(f => newFiles.items.add(f));
        files = newFiles;
        wrapper.remove();
        updateFileInput();
    }

    function updateFileInput() {
        fileInput.files = files.files;
        submitBtn.disabled = files.files.length === 0;
    }

    async function checkUploads() {
        try {
            const response = await fetch('/check-uploads');
            const data = await response.json();
            if (data.hasFiles) {
                cleanupBtn.style.display = 'block';
                return true;
            } else {
                cleanupBtn.style.display = 'none';
                return false;
            }
        } catch (error) {
            console.error('Failed to check uploads:', error);
            return false;
        }
    }

    async function cleanupUploads() {
        try {
            const response = await fetch('/cleanup', {
                method: 'POST'
            });
            const data = await response.json();
            console.log('Cleanup response:', data);

            if (data.filesDeleted > 0) {
                alert(`Cleaned up ${data.filesDeleted} files`);
            }

            // Clear everything
            previewContainer.innerHTML = '';
            files = new DataTransfer();
            updateFileInput();
            cleanupBtn.style.display = 'none';
            document.getElementById('result').classList.add('hidden'); // Hide download section
        } catch (error) {
            console.error('Cleanup failed:', error);
            alert('Failed to clean up uploads');
        }
    }

    // Check for existing uploads on page load
    checkUploads();

    // Handle cleanup button click
    cleanupBtn.addEventListener('click', async () => {
        if (confirm('Are you sure you want to clean up all uploaded files?')) {
            cleanupBtn.disabled = true;
            cleanupBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Cleaning...';
            await cleanupUploads();
            cleanupBtn.disabled = false;
            cleanupBtn.innerHTML = '<i class="fas fa-broom"></i> Clean All Uploads';
        }
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const outputBaseName = document.getElementById('outputBaseName').value || 'sprite';

        // Check if output name exists
        const checkRes = await fetch(`/check-output-name?name=${encodeURIComponent(outputBaseName)}`);
        const checkData = await checkRes.json();
        if (checkData.exists) {
            const confirmed = await showModal(
                `A sprite sheet with the name "${outputBaseName}" already exists. Do you want to overwrite it?`
            );
            if (!confirmed) return;
        }

        const formData = new FormData();

        // Add images
        Array.from(files.files).forEach(file => {
            formData.append('images', file);
        });

        // Add options
        formData.append('outputBaseName', outputBaseName);
        formData.append('maxWidth', document.getElementById('maxWidth').value || '2048');
        formData.append('maxHeight', document.getElementById('maxHeight').value || '2048');
        formData.append('format', document.getElementById('format').value || 'json');
        formData.append('trim', document.getElementById('trim').checked ? 'true' : '');
        formData.append('enableRotation', document.getElementById('enableRotation').checked ? 'true' : '');

        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';

        try {
            const response = await fetch('/pack', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();
            console.log('Server response:', data);

            if (data.success) {
                console.log('Sprite sheet generated successfully');
                console.log('Processed files:', data.processedFiles);

                // Compare sent vs processed files
                const sentFiles = Array.from(files.files).map(f => f.name);
                const receivedFiles = data.processedFiles.received.map(f => f.name);

                console.log('Files comparison:');
                console.log('- Sent:', sentFiles);
                console.log('- Received:', receivedFiles);

                // Check for missing files
                const missingFiles = sentFiles.filter(f => !receivedFiles.includes(f));
                if (missingFiles.length > 0) {
                    console.warn('Missing files:', missingFiles);
                }

                showResult(data.files);
                await checkUploads();
            } else {
                console.error('Error:', data.error);
                if (data.files) {
                    console.error('Files that failed:', data.files);
                }
                alert(`Error generating sprite sheet: ${data.error}`);
                if (data.details) {
                    console.error('Details:', data.details);
                }
            }
        } catch (error) {
            console.error('Request failed:', error);
            alert('Error uploading files');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = 'Generate Sprite Sheet';
        }
    });

    function showResult(files) {
        const links = document.querySelector('.download-links');
        const resultDiv = document.getElementById('result');

        // Only show download links if we have files to preview
        if (previewContainer.children.length > 0) {
            links.innerHTML = `
                <a href="${files.spriteSheet}" download>
                    <i class="fas fa-download"></i> Download Sprite Sheet
                </a>
                <a href="${files.data}" download>
                    <i class="fas fa-download"></i> Download Sprite Data
                </a>
            `;
            resultDiv.classList.remove('hidden');
        } else {
            links.innerHTML = '';
            resultDiv.classList.add('hidden');
        }
    }
});