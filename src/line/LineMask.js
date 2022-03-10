import { SVG_NAMESPACE } from '@recogito/annotorious/src/util/SVG';
export default class PolygonMask {

  constructor(imageDimensions, line) {
    this.w = imageDimensions.naturalWidth;
    this.h = imageDimensions.naturalHeight;
    console.log(imageDimensions, line)
    // this.line = line;

    this.mask = document.createElementNS(SVG_NAMESPACE, 'path');
    this.mask.setAttribute('fill-rule', 'evenodd');
    this.mask.setAttribute('class', 'a9s-selection-mask');

    this.mask.setAttribute('d', `M0 0 h${this.w} v${this.h} h-${this.w} z`);
  }

  redraw = () => {
    this.mask.setAttribute('d', `M0 0 h${this.w} v${this.h} h-${this.w} z`);
  }

  get element() {
    return this.mask;
  }

  destroy = () =>
    this.mask.parentNode.removeChild(this.mask)

}