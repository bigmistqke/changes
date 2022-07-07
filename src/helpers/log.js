const log = function () {
  // console.log("\x1b[44m", ...arguments, "\x1b[0m")
}
const error = function () {
  // console.log("\x1b[41m", ...arguments, "\x1b[0m")
}
export { log, error }