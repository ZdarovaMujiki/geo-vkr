import {fetchData, fetchEvents, fetchStations, fetchWaves} from "./api";
import {filter, miniseed} from "seisplotjs";

export const getSD = (array) => {
  const n = array.length;
  const mean = array.reduce((a, b) => a + b) / n;
  return Math.sqrt(array.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b) / n);
}

// export async function getStations(network) {
//   const text = await fetchStations(network);
//   let lines = text.split('\n').slice(1, -1);
//
//   let map = new Map();
//   lines.forEach(line => {
//     map.set(line.split('|')[1], null);
//   })
//   // setSeis(map);
//   return map;
// }
//
// export async function getEvents(network, timeRange) {
//   // await getStations(network);
//   const text = await fetchEvents(network, timeRange[0], timeRange[1]);
//
//   let lines = text.split('\n').slice(1, -1);
//   let events = [];
//   lines.forEach(line => {
//     let attrs = line.split('|');
//     events.push({
//       id: attrs[0],
//       time: new Date(attrs[1] + 'Z'),
//       mag: attrs[10]
//     });
//   });
//   return events;
//   // setEvents(events);
// }
//
// export async function getWaves(event) {
//   const xml = await fetchWaves(event.id);
//   let doc = parser.parseFromString(xml, 'text/xml');
//
//   let keys = new Map(seisMap).keys();
//   let map = new Map();
//   for (let key of keys) {
//     map.set(key, [null, null]);
//   }
//
//   let date = event.time;
//   let start = new Date(date.getTime() - offsetMs);
//   let end = new Date(date.getTime() + offsetMs);
//
//   let picks = doc.getElementsByTagName('pick');
//   for (let i = 0; i < picks.length; i += 3) {
//     let time = picks[i].getElementsByTagName('time')[0].firstChild.firstChild.nodeValue;
//     let date = new Date(time);
//     if (date > end || date < start) {
//       continue;
//     }
//
//     let waveform = picks[i].getElementsByTagName('waveformID')[0];
//     let station = waveform.getAttribute('stationCode');
//     if (!map.has(station)) {
//       continue;
//     }
//
//     let phase = picks[i].getElementsByTagName('phaseHint')[0].firstChild.nodeValue;
//
//     let tmp = map.get(station);
//     tmp[phase === 'P' ? 0 : 1] = date;
//     map.set(station, tmp);
//   }
//
//   return map;
// }
//
// export async function getData(event) {
//   setSeis(new Map());
//   let psMap = await getWaves(event);
//   let date = event.time;
//   let start = new Date(date.getTime() - offsetMs);
//   let end = new Date(date.getTime() + offsetMs);
//   setXRange([start, end]);
//   let stations = seisMap.keys()
//   for (let station of stations) {
//     updateSeis(station, { data: await getDataFromStation(station, start, end), waves: psMap.get(station) });
//   }
// }
//
// export async function getDataFromStation(station, start, end) {
//   const response = await fetchData(station, start, end);
//   const records = miniseed.parseDataRecords(await response.arrayBuffer());
//
//   let seismograms = miniseed.seismogramPerChannel(records);
//   seismograms = seismograms.map(seismogram => filter.applyFilter(butterworth, filter.rMean(seismogram)));
//   return seismograms;
// }