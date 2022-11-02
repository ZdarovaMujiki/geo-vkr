import React, { useEffect, useState } from 'react';
import Plot from 'react-plotly.js';
import './App.css';
import {getSD} from "./util/utils";
import {yaxis} from "plotly.js/src/plots/cartesian/attributes";
import Plotly from 'plotly.js-dist'

function SeisPlot({
  id,
  range,
  setRange,
  yRange,
  seis,
  waves,
  isGlobal,
}) {
  let data = seis.map(trace => {
    let startTime = trace.startTime._d.getTime();
    let length = trace.numPoints;

    const traceSD = isGlobal ? getSD(trace.y) : 1;
    const y = trace.y.map((a) => a / traceSD);
    return {
      name: trace.channelCode,
      x: Array.from({length: length}, (v, i) => new Date(startTime + i * 5)),
      y,
      line: { width: 1 }
    }
  });
  data[1].yaxis = 'y2';
  data[2].yaxis = 'y3';

  const [p, s] = waves;
  let shapes;
  let annotations;
  if (p !== null && s !== null) {
    shapes = [
      {
        yref: 'paper',
        opacity: 0.33,
        x0: p,
        y0: 0,
        x1: p,
        y1: 1,
      },
      {
        yref: 'paper',
        opacity: 0.33,
        x0: s,
        y0: 0,
        x1: s,
        y1: 1,
      }
    ]
    annotations = [
      {
        x: p,
        y: 0.5,
        xref: 'x',
        yref: 'paper',
        text: 'P',
        showarrow: false,
        font: { size: 24 }
      },
      {
        x: s,
        y: 0.5,
        xref: 'x',
        yref: 'paper',
        text: 'S',
        showarrow: false,
        font: { size: 24 }
      }
    ]
  }

  const layout = {
    xaxis: { range: range, showline: true, mirror: 'allticks'},
    hovermode: 'closest',
    showlegend: false,
    autosize: true,
    yaxis: {domain: [0, 0.33], range: [-yRange, +yRange],  tickfont: {size: 10}, zeroline: false},
    yaxis2: {domain: [0.33, 0.66], range: [-yRange, +yRange], tickfont: {size: 10}, zeroline: false, title: {text: seis[0]?.stationCode, font: {size: 10}}},
    yaxis3: {domain: [0.66, 1], range: [-yRange, +yRange], tickfont: {size: 10}, zeroline: false},
    margin: {l: 40, r: 0, b: 20, t: 1},
    shapes: shapes,
    annotations: annotations,
  }
  const [plot, setPlot] = useState(layout);

  // useEffect(() => {
  //   // plot.xaxis.range = range;
  //   // plot.yaxis.range = [-yRange, +yRange];
  //   // plot.yaxis2.range = [-yRange, +yRange];
  //   // plot.yaxis3.range = [-yRange, +yRange];
  //   // setPlot(plot);
  //
  //   // Plotly.newPlot(id.toString(), {
  //   //   "data": [{ "y": [-yRange, yRange] }],
  //   //   "layout": { "width": '100%', "height": '100%' }
  //   // });
  //   Plotly.relayout(id.toString(), {
  //     'xaxis.range': range,
  //     'yaxis.range': [-yRange, +yRange],
  //     'yaxis2.range': [-yRange, +yRange],
  //     'yaxis3.range': [-yRange, +yRange],
  //     }
  //   );
  // }, [range, yRange]);
  // }, [plot, range, yRange]);

  function merge(segmentArray) {
    console.log(seis[0].stationCode + ' merged');
    let tmp = [];
    for (let i = 1; i < segmentArray.length; i = i + 2) {
      tmp = tmp.concat(Array.from(segmentArray[i].y));
    }
    return tmp;
  }

  return (
    <Plot
      onRelayout={(e) => {setRange([e['xaxis.range[0]'], e['xaxis.range[1]']])}}
      style={{ width: '100%', height: '100%' }}
      data={data}
      layout={plot}
      config={{
        modeBarButtonsToRemove: ['toImage', 'zoom2d', 'pan2d', 'zoomIn2d', 'zoomOut2d', 'autoScale2d'],
        displaylogo: false,
        doubleClick: false,
        responsive: true,
      }}
    />
  )
}

export default SeisPlot;