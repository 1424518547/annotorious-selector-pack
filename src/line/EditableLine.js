import EditableShape from '@recogito/annotorious/src/tools/EditableShape';
import { drawEmbeddedSVG, svgFragmentToShape, toSVGTarget } from '@recogito/annotorious/src/selectors/EmbeddedSVG';
import { SVG_NAMESPACE } from '@recogito/annotorious/src/util/SVG';
import { format, setFormatterElSize } from '@recogito/annotorious/src/util/Formatting';
// TODO optional: mask to dim the outside area
//import Mask from './FreehandMask';

const getPoints = shape => {
  const pointList = shape.querySelector('.a9s-inner').getAttribute('d').split('L');
  const points = [];
  if (pointList.length > 0) {
    let point = pointList[0].substring(1).trim().split(' ');
    points.push({ x: parseFloat(point[0]), y: parseFloat(point[1]) });

    for (let i = 1; i < pointList.length; i++) {
      point = pointList[i].trim().split(' ');
      points.push({ x: parseFloat(point[0]), y: parseFloat(point[1]) });
    }
  }

  return points;
}

const getBBox = shape =>
  shape.querySelector('.a9s-inner').getBBox();

/**
 * An editable freehand drawing.
 */
export default class EditableLine extends EditableShape {

  constructor(annotation, g, config, env) {
    super(annotation, g, config, env);

    this.svg.addEventListener('mousemove', this.onMouseMove);
    this.svg.addEventListener('mouseup', this.onMouseUp);

    // SVG markup for this class looks like this:
    // 
    // <g>
    //   <path class="a9s-selection mask"... />
    //   <g> <-- return this node as .element
    //     <polygon class="a9s-outer" ... />
    //     <polygon class="a9s-inner" ... />
    //     <g class="a9s-handle" ...> ... </g>
    //     <g class="a9s-handle" ...> ... </g>
    //     <g class="a9s-handle" ...> ... </g>
    //     ...
    //   </g> 
    // </g>

    // 'g' for the editable free drawing compound shape
    this.containerGroup = document.createElementNS(SVG_NAMESPACE, 'g');

    this.shape = drawEmbeddedSVG(annotation);
    this.shape.querySelector('.a9s-inner')
      .addEventListener('mousedown', this.onGrab(this.shape));

    // TODO optional: mask to dim the outside area
    // this.mask = new Mask(env.image, this.shape.querySelector('.a9s-inner'));

    // this.containerGroup.appendChild(this.mask.element);

    this.elementGroup = document.createElementNS(SVG_NAMESPACE, 'g');
    this.elementGroup.setAttribute('class', 'a9s-annotation editable selected');
    this.elementGroup.setAttribute('data-id', annotation.id);
    this.elementGroup.appendChild(this.shape);

    // TODO optional: handles to stretch the shape
    this.handles = getPoints(this.shape).map(point => {
      const { x, y } = point;
      const handle = this.drawHandle(x, y);

      handle.addEventListener('mousedown', this.onGrab(handle));
      this.elementGroup.appendChild(handle);
      return handle;
    });
    this.containerGroup.appendChild(this.elementGroup);
    g.appendChild(this.containerGroup);

    format(this.shape, annotation, config.formatter);

    // The grabbed element (handle or entire shape), if any
    this.grabbedElem = null;

    // Mouse grab point
    this.grabbedAt = null;

    // // Mouse xy offset inside the shape, if mouse pressed
    // this.mouseOffset = null;
  }
  onScaleChanged = () =>
    this.handles.map(this.scaleHandle);

  setPoints = (points) => {
    // Not using .toFixed(1) because that will ALWAYS
    // return one decimal, e.g. "15.0" (when we want "15")
    const round = num => Math.round(10 * num) / 10;

    var str = points.map(pt => `L${round(pt.x)} ${round(pt.y)}`).join(' ');
    str = 'M' + str.substring(1);

    const inner = this.shape.querySelector('.a9s-inner');
    inner.setAttribute('d', str);

    const outer = this.shape.querySelector('.a9s-outer');
    outer.setAttribute('d', str);

    points.forEach((pt, idx) => this.setHandleXY(this.handles[idx], pt.x, pt.y));


    // TODO optional: mask to dim the outside area
    // this.mask.redraw();
  }

  onGrab = grabbedElem => evt => {
    this.grabbedElem = grabbedElem;
    const pos = this.getSVGPoint(evt);
    this.grabbedAt = { x: pos.x, y: pos.y };
  }

  onMouseMove = evt => {
    const constrain = (coord, delta, max) =>
      coord + delta < 0 ? -coord : (coord + delta > max ? max - coord : delta);

    if (this.grabbedElem) {
      const pos = this.getSVGPoint(evt);
      const { x, y, width, height } = getBBox(this.shape);

      if (this.grabbedElem === this.shape) { // position change

        const { naturalWidth, naturalHeight } = this.env.image;

        const dx = constrain(x, pos.x - this.grabbedAt.x, naturalWidth - width);
        const dy = constrain(y, pos.y - this.grabbedAt.y, naturalHeight - height);

        const updatedPoints = getPoints(this.shape).map(pt => ({ x: pt.x + dx, y: pt.y + dy }));

        this.grabbedAt = pos;

        this.setPoints(updatedPoints);

        this.emit('update', toSVGTarget(this.shape, this.env.image));
      } else { // TODO optional: handles to stretch the shape
        const handleIdx = this.handles.indexOf(this.grabbedElem);
        const updatedPoints = getPoints(this.shape).map((pt, idx) => (idx === handleIdx) ? pos : pt);
        this.setPoints(updatedPoints);
        this.setHandleXY(this.handles[handleIdx], pos.x, pos.y);
        this.emit('update', toSVGTarget(this.shape, this.env.image));
      }
    }
  }

  onMouseUp = evt => {
    this.grabbedElem = null;
    this.grabbedAt = null;
  }

  get element() {
    return this.elementGroup;
  }

  updateState = annotation => {
    console.log(annotation)
    const points = getPoints(svgFragmentToShape(annotation));
    this.setPoints(points);
  }

  destroy = () => {
    this.containerGroup.parentNode.removeChild(this.containerGroup);
    super.destroy();
  }

}
