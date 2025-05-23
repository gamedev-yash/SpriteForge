document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('uploadForm');
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    const submitBtn = document.getElementById('submitBtn');
    const result = document.getElementById('result');
    const previewContainer = document.getElementById('imagePreviewContainer');
    const cleanupBtn = document.getElementById('cleanupBtn');
    cleanupBtn.style.display = 'none'; // Hide by default
    
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
            
            // Clear the preview container and reset files
            previewContainer.innerHTML = '';
            files = new DataTransfer();
            updateFileInput();
            cleanupBtn.style.display = 'none';
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
        const formData = new FormData();
        
        Array.from(files.files).forEach(file => {
            formData.append('images', file);
        });
        
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
                showResult(data.files);
                await checkUploads(); // Check if we need to show cleanup button
                // Clear the preview container and reset files
                previewContainer.innerHTML = '';
                files = new DataTransfer();
                updateFileInput();
            } else {
                console.error('Error:', data.error);
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
        links.innerHTML = `
            <a href="${files.spriteSheet}" download>
                <i class="fas fa-download"></i> Download Sprite Sheet
            </a>
            <a href="${files.data}" download>
                <i class="fas fa-download"></i> Download Sprite Data
            </a>
        `;
        result.classList.remove('hidden');
    }
});