function decodeSingleQuotes(text) {
    return text.replace(/&#039;/g, "'");
}
export default decodeSingleQuotes