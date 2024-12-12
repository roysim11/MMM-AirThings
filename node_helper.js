const NodeHelper = require("node_helper");
const fetch = require("node-fetch");

module.exports = NodeHelper.create({
    start: function () {
        console.log("MMM-AirThings helper started...");
    },

    socketNotificationReceived: function (notification, payload) {
        if (notification === "FETCH_AIRTHINGS_DATA") {
            this.fetchAirThingsData(payload.token, payload.sensorIds);
        }
    },

    async fetchAirThingsData(token, sensorIds) {
        const results = [];

        try {
            for (const sensorId of sensorIds) {
                // Fetch device details to get the name
                const deviceUrl = `https://ext-api.airthings.com/v1/devices/${sensorId}`;
                const deviceResponse = await fetch(deviceUrl, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });

                if (!deviceResponse.ok) {
                    throw new Error(`Error fetching device info for sensor ${sensorId}: ${deviceResponse.statusText}`);
                }

                const deviceData = await deviceResponse.json();
                const deviceName = deviceData.segment.name || `Sensor ${sensorId}`;

                // Fetch the latest samples data
                const dataUrl = `https://ext-api.airthings.com/v1/devices/${sensorId}/latest-samples`;
                const dataResponse = await fetch(dataUrl, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });

                if (!dataResponse.ok) {
                    throw new Error(`Error fetching data for sensor ${sensorId}: ${dataResponse.statusText}`);
                }

                const responseData = await dataResponse.json();
                if (responseData && responseData.data) {
                    const metricData = responseData.data;

                    // Always return the sensor, but with missing data points as null
                    const sensorInfo = {
                        sensorId,
                        name: deviceName, // Use the device name fetched earlier
                        time: metricData.time,
                        battery: metricData.battery,
                        humidity: metricData.humidity !== undefined ? metricData.humidity : null,
                        radon: metricData.radonShortTermAvg !== undefined ? (metricData.radonShortTermAvg * 0.027) : null, // Convert Bq/m to pCi/L
                        co2: metricData.co2 !== undefined ? metricData.co2 : null, // CO2 value
                        temperature: metricData.temp !== undefined ? (metricData.temp * 9) / 5 + 32 : null // Celsius to Fahrenheit
                    };

                    // Add sensor info even if some values are null (to display the sensor)
                    results.push(sensorInfo);
                } else {
                    console.log(`No data found for sensor: ${sensorId}`);
                }
            }

            // Send the data to the front-end (MagicMirror)
            if (results.length > 0) {
                this.sendSocketNotification("AIRTHINGS_DATA_RECEIVED", results);
            } else {
                console.log("No valid data found for any sensor.");
                this.sendSocketNotification("AIRTHINGS_DATA_ERROR", "No valid data found.");
            }
        } catch (error) {
            console.error("Error in fetchAirThingsData:", error.message);
            this.sendSocketNotification("AIRTHINGS_DATA_ERROR", error.message);
        }
    }
});
