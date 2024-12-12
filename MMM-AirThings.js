Module.register("MMM-AirThings", {
    defaults: {
        updateInterval: 10 * 60 * 1000, // Update every 10 minutes
        clientId: "YOUR_CLIENT_ID",  // Replace with your client ID
        clientSecret: "YOUR_CLIENT_SECRET",  // Replace with your client secret
        oauthTokenUrl: "https://accounts-api.airthings.com/v1/token",  // Replace with your OAuth token URL
        sensorIds: [] // Array of sensor IDs
    },

    getStyles: function () {
        return ["MMM-AirThings.css"]; // Link to the CSS file
    },

    start: function () {
        this.loaded = false;
        this.sensorData = null;
        this.accessToken = null; // To store the OAuth access token
        this.getData();
        setInterval(() => this.getData(), this.config.updateInterval);
    },

    async getData() {
        try {
            // Ensure we have a valid access token
            if (!this.accessToken) {
                await this.getAccessToken();  // Fetch the access token if it doesn't exist
            }

            // Fetch data from AirThings API
            this.sendSocketNotification("FETCH_AIRTHINGS_DATA", {
                token: this.accessToken,
                sensorIds: this.config.sensorIds
            });
        } catch (error) {
            console.error("Error getting data:", error);
        }
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

        if (!this.sensorData || this.sensorData.length === 0) {
            wrapper.innerHTML = "No data available.";
            return wrapper;
        }

        // Loop through each sensor and display its data
        this.sensorData.forEach(sensor => {
            const sensorDiv = document.createElement("div");
            const sensorName = document.createElement("h2");
            sensorName.innerHTML = sensor.name || "Unnamed Sensor";
            sensorDiv.appendChild(sensorName);

            // Display data points only if they exist (i.e., not null)
            if (sensor.temperature !== null) {
                const temp = document.createElement("p");
                temp.innerHTML = `Temperature: ${sensor.temperature.toFixed(1)} F`; // One decimal place
                sensorDiv.appendChild(temp);
            }

            if (sensor.humidity !== null) {
                const humidity = document.createElement("p");
                humidity.innerHTML = `Humidity: ${sensor.humidity} %`;
                sensorDiv.appendChild(humidity);
            }

            if (sensor.radon !== null) {
                const radon = document.createElement("p");
                radon.innerHTML = `Radon: ${sensor.radon.toFixed(2)} pCi/L`; // Two decimal places
                sensorDiv.appendChild(radon);
            }

            if (sensor.co2 !== null) {
                const co2 = document.createElement("p");
                co2.innerHTML = `CO2: ${sensor.co2} ppm`;
                sensorDiv.appendChild(co2);
            }

            if (sensor.battery !== null) {
                const battery = document.createElement("p");
                battery.innerHTML = `Battery: ${sensor.battery}%`;
                sensorDiv.appendChild(battery);
            }

            wrapper.appendChild(sensorDiv);
        });

        return wrapper;
    },

    async getAccessToken() {
        try {
            const response = await fetch(this.config.oauthTokenUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    grant_type: 'client_credentials',
                    client_id: this.config.clientId,
                    client_secret: this.config.clientSecret,
                    scope: 'read:device:current_values' // Adjust this as needed
                })
            });

            console.log("Token request status:", response.status);

            if (!response.ok) {
                throw new Error("Failed to fetch access token");
            }

            const data = await response.json();
            this.accessToken = data.access_token;
            console.log("Access token retrieved:", this.accessToken);
        } catch (error) {
            console.error("Error fetching access token:", error);
            throw error; // Propagate the error
        }
    }
});
