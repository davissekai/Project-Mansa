document.addEventListener('DOMContentLoaded', function() {
    const generateButton = document.getElementById('generate-button');
    const numSamplesInput = document.getElementById('num-samples');
    const measurementsPerSamples = document.getElementById('measurements-per-sample'); // Check if this should be 'measurementsPerSample' singular to match HTML ID

    // Get references to the statistics display elements
    const overallMeanElem = document.getElementById('overall-mean');
    const meanRangeElem = document.getElementById('mean-range');
    const uclElem = document.getElementById('ucl');
    const lclElem = document.getElementById('lcl');

    // Variable to hold the chart.js instance (so we can update it later)
    let xbarChartInstance = null; // initialize to null

    generateButton.addEventListener( 'click', async function() { // async was added later
        console.log('Generate button clicked');

        const numSamples = parseInt(numSamplesInput.value);
        const measurementsPerSample = parseInt(measurementsPerSamples.value); // Use 'measurementsPerSamples' here if that's what your const above is

        // Basic client side validation
        if (isNaN(numSamples) || isNaN(measurementsPerSample) || numSamples <= 0 || measurementsPerSample <= 0) {
            alert('Please enter valid positive numbers for samples and measurements per sample.');
            return;
        }

        console.log('Number of Samples:', numSamples);
        console.log('Measurements of Samples:', measurementsPerSample);

        // 1. get the values from the input fields
        const requestData = {
            num_samples: numSamples,
            measurements_per_sample: measurementsPerSample
        };

        // 2. define the backend point URL
        const backendURL = '/generate_chart';

        try {
            // 3. Send the POST request using fetch
            const response = await fetch(backendURL, {
                method: 'POST', // sending the data, POST request
                headers: {
                    'Content-Type': 'application/json' // tells the server we're sending JSON
                },
                body: JSON.stringify(requestData) // convert the JS object to a JSOn string.
            });

            // 4. Check if the request was successful
            if (!response.ok) {
                // Improved error handling: try to get message from backend if available
                const errorData = await response.json();
                throw new Error(`HTTP error! status: ${response.status} - ${errorData.error || 'Unknown error'}`);
            }

            // 5. Parse the JSON response from the backend
            const responseData = await response.json();
            console.log('Data received from backend:', responseData);

            // new code starts here

            // 1. update key statistics display
            // fix: Corrected template literal syntax from $ to ${}
            overallMeanElem.textContent = `Overall Mean (CL): ${responseData.keyStats.overallMean}`;
            meanRangeElem.textContent = `Mean Range: ${responseData.keyStats.meanRange}`;
            uclElem.textContent = `UCL: ${responseData.keyStats.ucl}`;
            lclElem.textContent = `LCL: ${responseData.keyStats.lcl}`;

            // 2. Prepare the data for Chart.js
            const xBarValues = responseData.chartData.xBarValues;
            const centerLine = responseData.chartData.centerLine;
            const ucl = responseData.chartData.ucl; // Corrected variable name as backend sends 'ucl' directly
            const lcl = responseData.chartData.lcl; // Corrected variable name as backend sends 'lcl' directly

            // Generate labels for the x-axis (Sample 1, Sample 2, etc.)
            const labels = Array.from({length: xBarValues.length}, (_, i) => `Sample ${i + 1}`);

            // Ensure the canvas ID matches 'xbarChart' in HTML
            const ctx = document.getElementById('xbarChart').getContext('2d');

            // If the chart instance already exists, destroy it before creating a new one
            if (xbarChartInstance) {
                xbarChartInstance.destroy();
            }

            
            // create the new Chart.js instance
            xbarChartInstance = new Chart(ctx, {
                type: 'line', // Line chart for X-bar
                data: {
                    labels: labels,
                    datasets: [
                        {
                            label: 'Sample Means (X-bar)',
                            data: xBarValues,
                            borderColor: '#3498db', // Blue
                            backgroundColor: 'rgba(52, 152, 219, 0.2)',
                            fill: false, // Don't fill area under the line
                            tension: 0.1 // Smoothness of the line
                        },
                        {
                            label: 'Center Line (CL)',
                            data: Array(xBarValues.length).fill(centerLine), // Fill with CL value
                            borderColor: '#2ecc71', // Green
                            backgroundColor: 'transparent',
                            borderDash: [5, 5], // Dashed line
                            pointRadius: 0, // No points on this line
                            fill: false
                        },
                        {
                            label: 'UCL',
                            data: Array(xBarValues.length).fill(ucl), // Fill with UCL value
                            borderColor: '#e74c3c', // Red
                            backgroundColor: 'transparent',
                            borderDash: [5, 5],
                            pointRadius: 0,
                            fill: false
                        },
                        {
                            label: 'LCL',
                            data: Array(xBarValues.length).fill(lcl), // Fill with LCL value
                            borderColor: '#e74c3c', // Red
                            backgroundColor: 'transparent',
                            borderDash: [5, 5],
                            pointRadius: 0,
                            fill: false
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false, // Allows canvas to resize
                    scales: {
                        x: {
                            title: {
                                display: true,
                                text: 'Sample Number',
                                color: 'white'
                            },
                            ticks: { color: 'white' },
                            grid: { color: 'rgba(255,255,255,0.1)' }
                        },
                        y: {
                            title: {
                                display: true,
                                text: 'X-bar Value',
                                color: 'white'
                            },
                            ticks: { color: 'white' },
                            grid: { color: 'rgba(255,255,255,0.1)' }
                        }
                    },
                    plugins: {
                        legend: {
                            labels: {
                                color: 'white'
                            }
                        },
                        title: {
                            display: true,
                            text: 'X-bar Control Chart',
                            color: 'white',
                            font: {
                                size: 18
                            }
                        }
                    }
                }
            });
            // END OF CHART.JS INSTANTIATION BLOCK

            

        } catch (error) {
            console.error('Error fetching data:', error); // Changed to console.error
            alert('Failed to generate chart. Please check input and try again.\n' + error.message); // Added error.message
        }
    });
});