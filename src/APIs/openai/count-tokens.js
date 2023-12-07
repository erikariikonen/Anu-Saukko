module.exports = (str) => {
    const regex =
      /[\s\.,!?:;"'<>\(\)\[\]\{\}\+\-\*\%\/@#\$%\^&\*\(\)_=\|\\\u00a1-\uFFFF]|\w+/g;
    let match;
    let tokenCount = 0;
  
    while ((match = regex.exec(str)) !== null) {
      tokenCount++;
    }
  
    return tokenCount;
};