export const array_push = (arr, el) => [...arr, el];
export const array_insert = (arr, index, el) => [...arr.slice(0, index), el, ...arr.slice(index)]
export const array_insert_after_element = (arr, el, other_el) =>
  array_insert(arr, arr.indexOf(other_el), el)

export const array_remove = (arr, index) => {
  if (parseInt(index) !== index || index < 0) return arr
  return [...arr.slice(0, index), ...arr.slice(index + 1)]
}
export const array_remove_element = (arr, el) => {
  const i = arr.indexOf(el);
  return i === -1 ? arr : array_remove(arr, i)
}
export const array_shuffle = (array) => {
  let currentIndex = array.length, randomIndex;
  while (currentIndex != 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    // And swap it with the current element.
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex], array[currentIndex]];
  }
  return array;
}