// Read the rendered name split, independent of how the animation is driven.
export const titleProgress = `(() => {
  const transform = getComputedStyle(document.querySelector('.hero h1 span')).transform;
  return transform === 'none' ? 0 : Math.max(0, -new DOMMatrixReadOnly(transform).m41 / (innerWidth * .3));
})()`;
