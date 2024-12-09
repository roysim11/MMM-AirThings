Module.register("MMM-AirThings", {
    defaults: {
        updateInterval: 10 * 60 * 1000, // Update every 10 minutes
        airThingsToken: "YOUR_API_TOKEN",
        sensorId: null // Replace with your specific AirThings sensor ID
    },

    getStyles: function () {
        return ["MMM-AirThings.css"]; // Link to the CSS file
    },

    start: function () {
        this.loaded = false;
        this.sensorData = null;
        this.getData();
        setInterval(() => this.getData(), this.config.updateInterval);
    },

    getData: function () {
        this.sendSocketNotification("FETCH_AIRTHINGS_DATA", {
            token: this.config.airThingsToken,
            sensorId: this.config.sensorId
        });
    },

    socketNotificationReceived: function (notification, payload) {
        if (notification === "AIRTHINGS_DATA_RECEIVED") {
            this.sensorData = payload;
            this.loaded = true;
            this.updateDom();
        }
    },

    getDom: function () {
        const wrapper = document.createElement("div");
        wrapper.className = "MMM-AirThings";

        if (!this.loaded) {
            wrapper.innerHTML = "Loading AirThings data...";
            return wrapper;
        }

        if (!this.sensorData) {
            wrapper.innerHTML = "No data available.";
            return wrapper;
        }

        wrapper.innerHTML = `
            <div>
                <h2>AirThings Data</h2>
                <p>Temperature: ${this.sensorData.temperature} °C</p>
                <p>Humidity: ${this.sensorData.humidity} %</p>
                <p>CO2: ${this.sensorData.co2} ppm</p>
            </div>
        `;
        return wrapper;
    }
});
