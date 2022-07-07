const getNextCardIndex = (script, scriptIndex, roleId) => {
  if (!script) return false;

  const findNextCard = (from) => {
    let nextCard = script.slice(from, script.length).find(card => card.role === roleId);
    return { card: nextCard, index: script.indexOf(nextCard) };
  }
  let nextCard = findNextCard(scriptIndex);
  if (!nextCard) { return false };
  let cardAfterNext = findNextCard(nextCard.index + 1);
  if (!cardAfterNext) { return nextCard.index };
  return cardAfterNext.index + (nextCard.index + 1);
}
export default getNextCardIndex