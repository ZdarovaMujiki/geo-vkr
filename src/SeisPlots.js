import SeisPlot from "./SeisPlot";
import React, {useEffect, useState} from "react";
import {useGlobalKeys} from "@consta/uikit/useGlobalKeys";
import {getSD} from "./util/utils";
import Plotly from 'plotly.js-dist'

export const SeisPlots = ({
  seisMap,
  // yRange,
  xRange,
  setXRange,
  isGlobal,
}) => {
  const [yRange, setYRange] = useState(1000);
  const [maxY, setMaxY] = useState(1000);

  const setRange = (range) => {
    // console.log(range);
    // console.log(xRange);
    if (range[0] !== undefined) {
      // console.log("NE");
      setXRange(range);
    }
  }

  useEffect(() => {
    ids.forEach((id) => {
      if (!array[0][1]) {
        return;
      }
      Plotly.relayout(id, {
        'xaxis.range': xRange,
      });
    })
  }, [xRange]);

  useGlobalKeys({
    ArrowRight: () => setYRange((prev) => prev / 2),
    ArrowLeft: () => setYRange((prev) => prev * 2),
  });

  const array = Array.from(seisMap);
  const ids = array.map((arr) => arr[0]);

  let layout = {
    xaxis: { range: xRange, showline: true, mirror: 'allticks'},
    hovermode: 'closest',
    showlegend: false,
    autosize: true,
    yaxis: {domain: [0, 0.33], range: [-yRange, +yRange],  tickfont: {size: 10}, zeroline: false},
    yaxis2: {domain: [0.33, 0.66], range: [-yRange, +yRange], tickfont: {size: 10}, zeroline: false, title: {text: "", font: {size: 10}}},
    yaxis3: {domain: [0.66, 1], range: [-yRange, +yRange], tickfont: {size: 10}, zeroline: false},
    margin: {l: 40, r: 0, b: 20, t: 1},
  };

  useEffect(() => {
    ids.forEach((id) => {
      if (!array[0][1]) {
        return;
      }
      Plotly.relayout(id, {
        'yaxis.range': [-yRange, yRange],
        'yaxis2.range': [-yRange, yRange],
        'yaxis3.range': [-yRange, yRange],
      });
    })
  }, [yRange]);

  useEffect(() => {
    const array = Array.from(seisMap);
    array.forEach(([name, seis]) => {
      if (!seis) {
        return;
      }
      console.log(seis);
      let maxes = [];
      let data = seis.data.map(trace => {
        let startTime = trace.startTime._d.getTime();
        let length = trace.numPoints;

        const traceSD = isGlobal ? getSD(trace.y) : 1;
        const y = trace.y.map((a) => a / traceSD);
        maxes.push(Math.max(...y));
        return {
          name: trace.channelCode,
          x: Array.from({length: length}, (v, i) => new Date(startTime + i * 5)),
          y,
          line: { width: 1 }
        }
      });
      data[1].yaxis = 'y2';
      data[2].yaxis = 'y3';

      const max = Math.max(...maxes);

      const letterOffset = data[0].x.length / 40;
      const [p, s] = seis.waves;
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
            x: p - letterOffset,
            y: 1,
            xref: 'x',
            yref: 'paper',
            text: 'P',
            showarrow: false,
            font: { size: 14 }
          },
          {
            x: s - letterOffset,
            y: 1,
            xref: 'x',
            yref: 'paper',
            text: 'S',
            showarrow: false,
            font: { size: 14 }
          }
        ]
      }

      layout.yaxis2.title.text = name;
      layout.shapes = shapes;
      layout.annotations = annotations;

      Plotly.react(name, {
        data: data,
        layout: layout,
      });

      const plot = document.getElementById(name);
      plot.on('plotly_relayout', (e) => {setRange([e['xaxis.range[0]'], e['xaxis.range[1]']])});
    })
  }, [seisMap, isGlobal]);

  useEffect(() => {
    const subjers = array?.map((a) => a[1]);
    const idk = subjers
      ?.flatMap((b) => b?.data
        ?.flatMap((c) => {
          const traceSD = isGlobal ? getSD(c._y) : 1;
          return c._y?.map((e) => Math.abs(e) / traceSD);
        }));

    if (idk[0]) {
      const max = Math.max(...idk.map((a) => Math.max(...a)));

      ids.forEach((id) => {
        if (!array[0][1]) {
          return;
        }
        Plotly.relayout(id, {
          'yaxis.range': [-max, max],
          'yaxis2.range': [-max, max],
          'yaxis3.range': [-max, max],
        });
      })
      console.log(max);
    }
  }, [seisMap, isGlobal]);

  return <div className='plots'>
    {/*<div className="plot" id={"0"}/>*/}
    {ids.map((id) =>
      <div className="plot" id={id} key={id}/>
    )}
    {/*{array.filter(([, v]) => v === null || v.data.length > 0).length > 0*/}
    {/*  ? array.map(([, v], index) =>*/}
    {/*    v?.data.length > 0 &&*/}
    {/*    <div id={index} key={index} className='plot'>*/}
    {/*      <SeisPlot*/}
    {/*        id={index}*/}
    {/*        yRange={yRange}*/}
    {/*        range={xRange}*/}
    {/*        setRange={setXRange}*/}
    {/*        seis={v?.data}*/}
    {/*        waves={v?.waves}*/}
    {/*        isGlobal={isGlobal}*/}
    {/*      />*/}
    {/*    </div>)*/}
    {/*  : 'no data'*/}
    {/*}*/}
  </div>
}