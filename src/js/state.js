export const state = {
    apiKey: localStorage.getItem('nano_api_key') || '',
    proxyUrl: 'https://corsproxy.io/?', 
    history: JSON.parse(localStorage.getItem('nano_history') || '[]'),
    referenceImages: [] // Tableau pour stocker jusqu'à 14 images
};

