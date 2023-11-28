// random color juttu nopeest tähä 🥶🍦

function getRandomColor() {
    const rainbowColors = [
        '#FF0000', '#FF7F00', '#FFFF00', '#00FF00', '#0000FF', '#4B0082', '#8B00FF'
    ];
    
    const randomIndex = Math.floor(Math.random() * rainbowColors.length);
    return rainbowColors[randomIndex];
}

module.exports = { getRandomColor };