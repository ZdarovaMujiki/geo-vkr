import React, {useEffect, useState} from 'react';
import {filter, miniseed} from 'seisplotjs';

import 'bootstrap/dist/css/bootstrap.min.css';
import {presetGpnDefault, Theme} from "@consta/uikit/Theme";
import {DatePicker} from "@consta/uikit/DatePicker";
import {EventStatus, RANGE_END, RANGE_START} from "./util/constants";
import {fetchData, fetchEvents, fetchStations, fetchWaves, removeEvent} from "./util/api";
import {Button} from "@consta/uikit/Button";
import {useGlobalKeys} from "@consta/uikit/useGlobalKeys";
import {SeisPlots} from "./SeisPlots";
import {Sidebar} from '@consta/uikit/Sidebar';
import {CustomTextField} from "./components/CustomTextField";
import {CustomChoiceGroup} from "./components/CustomChoiceGroup";
import io from 'socket.io-client';
import {SnackBar} from "@consta/uikit/SnackBar";

function App() {
  const [timeRange, setTimeRange] = useState([RANGE_START, RANGE_END]);
  const [network, setNetwork] = useState();
  const [xRange, setXRange] = useState(timeRange);
  const [yRange, setYRange] = useState(1000);
  // localStorage.getItem('events').split(';').map(event => JSON.parse(event));
  // console.log(localStorage.getItem('events')?.split(';').slice(1));
  // const [events, setEvents] = useState(localStorage.getItem('events')?.split(';').slice(1).map(event => JSON.parse(event)) || []);
  const [events, setEvents] = useState([]);
  const [isGlobal, setIsGlobal] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [snackBarItems, setSnackBarItems] = useState(["Новые события: 8"]);
  const [currentEventId, setCurrentEventId] = useState(null);

  const [seisMap, setSeis] = useState(new Map());
  const updateSeis = (key, value) => {
    setSeis(map => new Map(map.set(key, value)));
  }
  const [order, setOrder] = useState(2);
  const [frequency, setFrequency] = useState(1);

  const parser = new DOMParser();
  const offsetMs = 60 * 1000;
  const butterworth = filter.createButterworth(
    order,
    filter.HIGH_PASS,
    frequency,
    0,
    0.005
  );

  useGlobalKeys({
    g: () => setIsGlobal(true),
    l: () => setIsGlobal(false),
    q: () => setIsSidebarOpen(!isSidebarOpen),
  });

  useEffect(() => {
    const socket = io("localhost:8000/", {
      cors: {
        origin: "http://localhost:3000/",
        credentials: true,
      },
    });

    socket.on("ask", async (data) => {
      await new Promise(r => setTimeout(r, 10000));
      socket.emit("ask");
    });

    socket.on("events", async (data) => {
      console.log("new events");
      setSnackBarItems([...snackBarItems, "Новые события: " + data.length]);
      await getEvents("KA");
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  async function getStations(network) {
    const text = await fetchStations(network);
    let lines = text.split('\n').slice(1, -1);

    let map = new Map();
    lines.forEach(line => {
      map.set(line.split('|')[1], null);
    })
    setSeis(map);
    return map;
  }

  async function getEvents(network) {
    await getStations(network);
    const text = await fetchEvents(network, timeRange[0], timeRange[1]);

    let lines = text.split('\n').slice(1, -1);
    let events = [];
    lines.forEach(line => {
      let attrs = line.split('|');
      events.push({
        id: attrs[0],
        time: new Date(attrs[1] + 'Z'),
        mag: attrs[10],
        status: EventStatus.NEW
      });
    });
    setEvents(events);
    // const eventString = events.reduce((prev, cur) => prev + ';' + JSON.stringify(cur));
    // console.log(eventString);
    // localStorage.setItem('events', eventString);
  }

  async function getWaves(event) {
    const xml = await fetchWaves(event.id);
    let doc = parser.parseFromString(xml, 'text/xml');

    let keys = new Map(seisMap).keys();
    let map = new Map();
    for (let key of keys) {
      map.set(key, [null, null]);
    }

    let date = event.time;
    let start = new Date(date.getTime() - offsetMs);
    let end = new Date(date.getTime() + offsetMs);

    let picks = doc.getElementsByTagName('pick');
    for (let i = 0; i < picks.length; i += 3) {
      let time = picks[i].getElementsByTagName('time')[0].firstChild.firstChild.nodeValue;
      let date = new Date(time);
      if (date > end || date < start) {
        continue;
      }

      let waveform = picks[i].getElementsByTagName('waveformID')[0];
      let station = waveform.getAttribute('stationCode');
      if (!map.has(station)) {
        continue;
      }

      let phase = picks[i].getElementsByTagName('phaseHint')[0].firstChild.nodeValue;

      let tmp = map.get(station);
      tmp[phase === 'P' ? 0 : 1] = date;
      map.set(station, tmp);
    }

    return map;
  }

  async function getData(event) {
    setSeis(new Map());
    let psMap = await getWaves(event);
    let date = event.time;
    let start = new Date(date.getTime() - offsetMs);
    let end = new Date(date.getTime() + offsetMs);
    setXRange([start, end]);
    let stations = seisMap.keys()
    for (let station of stations) {
      updateSeis(station, { data: await getDataFromStation(station, start, end), waves: psMap.get(station) });
    }
  }

  async function getDataFromStation(station, start, end) {
    const response = await fetchData(station, start, end);
    const records = miniseed.parseDataRecords(await response.arrayBuffer());

    let seismograms = miniseed.seismogramPerChannel(records);
    seismograms = seismograms.map(seismogram => filter.applyFilter(butterworth, filter.rMean(seismogram)));
    return seismograms;
  }

  return (
    <Theme preset={presetGpnDefault}>
      <div style={{display: "flex", flexDirection: "row-reverse", position: "absolute", zIndex: 100, width: "100%", padding: 10}}>
        <SnackBar
          style={{display: "flex", alignItems: "flex-end"}}
          items={snackBarItems}
          getItemMessage={(item) => item}
          getItemActions={(item) => {
            return [{
              label: "Посмотреть",
              onClick: () => {
                getEvents("KA");
                setIsSidebarOpen(true);
                setSnackBarItems(snackBarItems.filter(i => i !== item));
              }
            },
              {
                label: "Закрыть",
                onClick: () => setSnackBarItems(snackBarItems.filter(i => i !== item))
              }
            ]
          }}
        />
      </div>
      <Sidebar position="left" isOpen={isSidebarOpen} onClickOutside={() => setIsSidebarOpen(false)}>
        <Sidebar.Content>
          <div className='controlls'>
            <DatePicker
              style={{width: "100%"}}
              value={timeRange[0]}
              type="date-time"
              onChange={({value}) => setTimeRange([value, timeRange[1]])}
            />
            <DatePicker
              style={{width: "100%"}}
              value={timeRange[1]}
              type="date-time"
              onChange={({value}) => setTimeRange([timeRange[0], value])}
            />
            <hr style={{margin: 0}}/>
            <p style={{textAlign: "center", margin: 0}}>
              Настройки фильтра верхних частот
            </p>
            <CustomTextField
              text="N"
              value={order}
              onChange={({value}) => setOrder(Number(value))}
            />
            <CustomTextField
              text="CF"
              value={frequency}
              onChange={({value}) => setFrequency(Number(value))}
            />
            <hr style={{margin: 0}}/>
            <p style={{textAlign: "center", margin: 0}}>
              Выбор сети
            </p>
            <CustomChoiceGroup
              items={["8b", "KA"]}
              value={network}
              name="networks"
              onChange={(e) => {
                setNetwork(e.value);
                getEvents(e.value);
              }}
            />
            <div className="eventButtons">
              {events.length > 0 &&
                <hr style={{margin: 0}}/>
              }
              {events.map((event, index) =>
                <Button
                  key={index}
                  value={event}
                  onClick={() => {
                    getData(event);
                    setIsSidebarOpen(false);
                    events[index].status = EventStatus.CHECKED;
                    setCurrentEventId(index);
                    setEvents(events);
                  }}
                  label={`${event.time.toLocaleString()} M:${event.mag}`}
                  style={{
                    textAlign: "center",
                    padding: "0 8px",
                    backgroundColor: event.status === EventStatus.NEW ? "#ffa500"
                      : event.status === EventStatus.CHECKED ? "#0078d2" : "#008000"
                  }}
                />
              )}
            </div>

            {currentEventId !== null && events[currentEventId].status !== EventStatus.APPROVED && (
              <div style={{display: "flex", justifyContent: "space-between", width: "100%", height: "100%", alignItems: "flex-end"}}>
                <Button
                  label="Это событие"
                  onClick={() => {
                    events[currentEventId].status = EventStatus.APPROVED;
                    setEvents(events);
                    setCurrentEventId(null);
                  }}
                />
                <Button
                  label="Это не событие"
                  onClick={() => {
                    setEvents(events.filter(event => event !== events[currentEventId]));
                    setCurrentEventId(null);
                    removeEvent(events[currentEventId].id);
                  }}
                />
              </div>
            )}
          </div>
        </Sidebar.Content>
      </Sidebar>
      {events.length === 0 ? '' :
        <div className='subj'>
          <SeisPlots
            seisMap={seisMap}
            isGlobal={isGlobal}
            setXRange={setXRange}
            xRange={xRange}
          />
        </div>
      }
    </Theme>
  );
}

export default App;