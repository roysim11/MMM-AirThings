const NodeHelper = require("node_helper");
const fetch = require("node-fetch");

module.exports = NodeHelper.create({
    start: function () {
        console.log("Starting node_helper for: " + this.name);
    },

    socketNotificationReceived: function (notification, payload) {
        if (notification === "FETCH_AIRTHINGS_DATA") {
            this.fetchAirThingsData(payload.token, payload.sensorId);
        }
    },

    fetchAirThingsData: async function (token, sensorId) {
        const url = `https://api.airthings.com/v1/devices/${sensorId}/latest-samples`;
        const options = {
            headers: {
                Authorization: `Bearer ${token}`
            }
        };

        try {
            const response = await fetch(url, options);
            const data = await response.json();

            const processedData = {
                temperature: data.temp,
                humidity: data.humidity,
                co2: data.co2 // Adjust based on AirThings API response
            };

            this.sendSocketNotification("AIRTHINGS_DATA_RECEIVED", processedData);
        } catch (error) {
            console.error("Error fetching AirThings data:", error);
        }
    }
});
