import { Selection } from '@recogito/annotorious/src/tools/Tool';
import { toSVGTarget } from '@recogito/annotorious/src/selectors/EmbeddedSVG';
import { SVG_NAMESPACE } from '@recogito/annotorious/src/util/SVG';
// TODO optional: mask to dim the outside area
import Mask from './LineMask';

/**
 * A 'rubberband' selection tool for creating line drawing by
 * clicking and dragging.
 */
export default class RubberbandLine {

  constructor(anchor, g, env) {
    this.points = [anchor];

    this.env = env;

    this.group = document.createElementNS(SVG_NAMESPACE, 'g');

    this.line = document.createElementNS(SVG_NAMESPACE, 'g');
    this.line.setAttribute('class', 'a9s-selection');

    this.outer = document.createElementNS(SVG_NAMESPACE, 'path');
    this.outer.setAttribute('class', 'a9s-outer');

    this.inner = document.createElementNS(SVG_NAMESPACE, 'path');
    this.inner.setAttribute('class', 'a9s-inner');

    this.setPoints(this.points);

    // TODO optional: mask to dim the outside area
    this.mask = new Mask(env.image, this.inner);

    this.line.appendChild(this.outer);
    this.line.appendChild(this.inner);

    // Additionally, selection remains hidden until 
    // the user actually moves the mouse
    this.group.style.display = 'none';

    // TODO optional: mask to dim the outside area
    // this.group.appendChild(this.mask.element);
    this.group.appendChild(this.line);
    g.appendChild(this.group);
  }

  setPoints = points => {
    var str = points.map(pt => `L${pt[0]} ${pt[1]}`).join(' ');
    str = 'M' + str.substring(1);
    this.outer.setAttribute('d', str);
    this.inner.setAttribute('d', str);
  }

  getBoundingClientRect = () =>
    this.outer.getBoundingClientRect();

  dragTo = xy => {
    // Make visible
    this.group.style.display = null;

    //TODO optional: edge smoothing
    this.addPoint(xy);

    // TODO optional: mask to dim the outside area
    // this.mask.redraw();
  }

  addPoint = xy => {
    this.setPoints([...this.points, xy]);
    // TODO optional: mask to dim the outside area
    // this.mask.redraw();
  }

  get element() {
    return this.line;
  }

  destroy = () => {
    this.group.parentNode.removeChild(this.group);
    this.line = null;
    this.group = null;
  }

  toSelection = () => {
    return new Selection(toSVGTarget(this.group, this.env.image));
  }

}
