const fetch = require('node-fetch');

const testImageURL = 'http://localhost:5000/uploads/leaders/leader-1759647072604-901940212.jpeg';

console.log('Testing image URL:', testImageURL);
console.log('');

fetch(testImageURL)
    .then(response => {
        console.log('✅ Response Status:', response.status);
        console.log('✅ Content-Type:', response.headers.get('content-type'));
        
        if (response.status === 200) {
            console.log('');
            console.log('✅ SUCCESS! Image is accessible!');
            console.log('The image URL works correctly.');
        } else {
            console.log('');
            console.log('❌ ERROR! Status is not 200');
        }
    })
    .catch(error => {
        console.log('❌ FETCH ERROR:', error.message);
        console.log('');
        console.log('Make sure backend server is running on port 5000');
    });
