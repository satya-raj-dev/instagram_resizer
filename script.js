document.addEventListener('DOMContentLoaded', () => {
  const uploadForm = document.getElementById('upload-form');
  const imageUpload = document.getElementById('image-upload');
  const fileName = document.getElementById('file-name');
  const convertBtn = document.getElementById('convert-btn');
  const resultSection = document.getElementById('result');
  const loadingSection = document.getElementById('loading');
  const errorSection = document.getElementById('error');
  const originalImg = document.getElementById('original-img');
  const convertedImg = document.getElementById('converted-img');
  const downloadLink = document.getElementById('download-link');

  // Update file name when file is selected
  imageUpload.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
      fileName.textContent = e.target.files[0].name;
      
      // Show preview of original image
      const reader = new FileReader();
      reader.onload = (event) => {
        originalImg.src = event.target.result;
      };
      reader.readAsDataURL(e.target.files[0]);
    } else {
      fileName.textContent = 'No file chosen';
    }
  });

  // Handle form submission
  uploadForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Validate file input
    if (!imageUpload.files.length) {
      alert('Please select an image to convert');
      return;
    }
    
    // Show loading state
    resultSection.classList.add('hidden');
    errorSection.classList.add('hidden');
    loadingSection.classList.remove('hidden');
    convertBtn.disabled = true;
    
    // Create form data
    const formData = new FormData();
    formData.append('image', imageUpload.files[0]);
    
    // Get selected format
    const formatRadios = document.getElementsByName('format');
    let selectedFormat;
    for (const radio of formatRadios) {
      if (radio.checked) {
        selectedFormat = radio.value;
        break;
      }
    }
    formData.append('format', selectedFormat);
    
    try {
      // Send request to server
      const response = await fetch('/convert', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        throw new Error('Server error');
      }
      
      const data = await response.json();
      
      if (data.success) {
        // Display result
        convertedImg.src = data.imageUrl;
        downloadLink.href = data.imageUrl;
        resultSection.classList.remove('hidden');
      } else {
        throw new Error(data.error || 'Unknown error');
      }
    } catch (error) {
      console.error('Error:', error);
      errorSection.classList.remove('hidden');
    } finally {
      loadingSection.classList.add('hidden');
      convertBtn.disabled = false;
    }
  });
});