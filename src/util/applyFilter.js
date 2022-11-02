import {filter} from 'seisplotjs';

const butterworth = filter.createButterworth(
  2,
  filter.HIGH_PASS,
  1,
  0,
  0.005);

export function applyFilter(seismogram) {
  // return filter.applyFilter(butterworth, seismogram);
  return seismogram;
}