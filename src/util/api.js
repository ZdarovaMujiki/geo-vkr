const BASE_URL = "http://84.237.89.72:8080"
const BASE_FDSNWS_URL = `${BASE_URL}/fdsnws`;

export const fetchStations = async (network) => {
  const params = new URLSearchParams({
    format: "text",
    network,
  });

  const response = await fetch(`${BASE_FDSNWS_URL}/station/1/query?${params.toString()}`);
  return await response.text();
};

export const fetchEvents = async (network, start, end) => {
  const params = new URLSearchParams({
    start: start.toISOString(),
    end: end.toISOString(),
    format: "text",
    network,
  });

  const response = await fetch(`${BASE_FDSNWS_URL}/event/1/query?${params.toString()}`);
  return await response.text();
};

export const fetchWaves = async (eventId) => {
  const params = new URLSearchParams({
    includearrivals: "true",
    eventid: eventId,
  });
  console.log(`${BASE_FDSNWS_URL}/event/1/query?${params.toString()}`);

  const response = await fetch(`${BASE_FDSNWS_URL}/event/1/query?${params.toString()}`);
  return await response.text();
};

export const fetchData = async (station, start, end) => {
  const params = new URLSearchParams({
    start: start.toISOString(),
    end: end.toISOString(),
    station,
  });
  console.log(`${BASE_FDSNWS_URL}/dataselect/1/query?${params.toString()}`);

  return await fetch(`${BASE_FDSNWS_URL}/dataselect/1/query?${params.toString()}`);
};


export const removeEvent = async (eventId) => {
  fetch(`${BASE_URL}/update_picks/delete`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({eventId}),
  }).then((response) => {
    console.log(response.status);
  });
}