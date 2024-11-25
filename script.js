const filepicker = document.getElementById('filepicker');
const gallery = document.getElementById('gallery');
const error = document.getElementById('error');
let myGallery;
let allImages = [];

filepicker.addEventListener('change', async () => {
    const files = filepicker.files;
    if (files.length > 0) {
        Array.from(files).forEach(async file => {
            if (!file.type.startsWith('image/')) {
                error.textContent = `Die Datei "${file.name}" ist kein gültiges Bild.`;
                return;
            }
            const blob = new Blob([file], { type: file.type });
            console.log('Neue Datei', blob);

            const compressedBase64 = await compressImage(file, 800, 800, 0.7);
            const img = document.createElement('img');
            img.src = compressedBase64;
            gallery.appendChild(img);
            const viewer = new Viewer(img);

            allImages.push({
                filename: file.name,
                fileType: blob.type,
                base64: compressedBase64,
                viewer: viewer
            });
            save();
        });
    }
});

function save() {
    let arrayAsString = JSON.stringify(allImages);
    localStorage.setItem('allImages', arrayAsString);
}

function load() {
    let arrayAsString = localStorage.getItem('allImages');
    if (arrayAsString) {
        allImages = JSON.parse(arrayAsString);
        render();
    }
}

function render() {
    gallery.innerHTML = '';
    allImages.forEach(image => {
        gallery.innerHTML += `
            <img src="${image.base64}">
            `;
    });
    myGallery = new Viewer(document.getElementById('gallery'));
}

function blobToBase64(blob) {
    return new Promise((resolve, _) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(blob);
    });
}

/**
 * Komprimiert ein Bild auf eine Zielgröße oder -qualität
 * @param {File} file - Die Bilddatei, die komprimiert werden soll
 * @param {number} maxWidth - Die maximale Breite des Bildes
 * @param {number} maxHeight - Die maximale Höhe des Bildes
 * @param {number} quality - Qualität des komprimierten Bildes (zwischen 0 und 1)
 * @returns {Promise<string>} - Base64-String des komprimierten Bildes
 */
 function compressImage(file, maxWidth = 800, maxHeight = 800, quality = 0.8) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');

                // Berechnung der neuen Größe, um die Proportionen beizubehalten
                let width = img.width;
                let height = img.height;

                if (width > maxWidth || height > maxHeight) {
                    if (width > height) {
                        height = (height * maxWidth) / width;
                        width = maxWidth;
                    } else {
                        width = (width * maxHeight) / height;
                        height = maxHeight;
                    }
                }

                canvas.width = width;
                canvas.height = height;

                // Zeichne das Bild in das Canvas
                ctx.drawImage(img, 0, 0, width, height);

                // Exportiere das Bild als Base64
                const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
                resolve(compressedBase64);
            };

            img.onerror = () => reject('Fehler beim Laden des Bildes.');
            img.src = event.target.result;
        };

        reader.onerror = () => reject('Fehler beim Lesen der Datei.');
        reader.readAsDataURL(file);
    });
}