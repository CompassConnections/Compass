export const getPixelHeight = (varname: string) => {
  // Create a temporary element
  const el = document.createElement('div')
  el.style.cssText = `
    position: absolute;
    bottom: 0;
    height: env(${varname});
    visibility: hidden;
  `
  document.body.appendChild(el)

  // Measure the computed pixel value
  const value = parseFloat(getComputedStyle(el).height)
  el.remove()

  return value
}
