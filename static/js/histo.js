const verticalLinePlugin = {
    id: 'verticalLine',
    afterDraw: (chart) => {
        if (chart.dragStart !== undefined && chart.dragEnd !== undefined) {
            const ctx = chart.ctx;
            const xAxis = chart.scales.x;
            const yAxis = chart.scales.y;

            // Draw selection area
            ctx.save();
            ctx.fillStyle = 'rgba(75, 192, 192, 0.2)';
            ctx.fillRect(chart.dragStart, yAxis.top, chart.dragEnd - chart.dragStart, yAxis.bottom - yAxis.top);

            // Draw vertical lines
            ctx.beginPath();
            ctx.strokeStyle = 'rgb(75, 192, 192)';
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);

            ctx.moveTo(chart.dragStart, yAxis.top);
            ctx.lineTo(chart.dragStart, yAxis.bottom);
            ctx.moveTo(chart.dragEnd, yAxis.top);
            ctx.lineTo(chart.dragEnd, yAxis.bottom);
            ctx.stroke();
            ctx.restore();
        }
    },
};

// Global chart instance for logs histogram
let chart = null;

// Global flag and data for timechart
window.runTimechart = false; // Default to false, no UI change unless set
window.timechartData = null; // Store timechart data

window.updateHistogram = function (logData) {
    console.log('updateHistogram called with data:', logData);

    // Ensure DOM is ready and canvas exists
    $(document).ready(function () {
        const histogramCanvas = document.getElementById('histogram');
        if (!histogramCanvas) {
            console.error("Histogram canvas '#histogram' not found in DOM.");
            return;
        }

        // Aggregate logs by date for the histogram
        const dateCounts = {};
        logData.forEach((log) => {
            const timestamp = log.timestamp; // Assuming timestamp is in milliseconds
            const date = moment(timestamp).format('YYYY-MM-DD'); // Convert to date string

            console.log('Processing log with timestamp:', timestamp, 'Date:', date);

            if (!dateCounts[date]) {
                dateCounts[date] = 0;
            }
            dateCounts[date]++;
        });

        console.log('Aggregated date counts:', dateCounts);

        // Convert aggregated data to arrays for Chart.js
        const dates = Object.keys(dateCounts);
        const counts = Object.values(dateCounts);

        console.log('Dates for histogram:', dates);
        console.log('Counts for histogram:', counts);

        // Initialize or update the histogram
        if (!chart) {
            // Initialize Chart.js for logs histogram
            chart = new Chart(histogramCanvas.getContext('2d'), {
                type: 'bar',
                data: {
                    labels: dates,
                    datasets: [
                        {
                            label: 'Log Count',
                            data: counts,
                            backgroundColor: 'rgb(75, 192, 192)',
                            borderColor: 'rgb(75, 192, 192)',
                            borderWidth: 1,
                        },
                    ],
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        verticalLinePlugin: true,
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            title: {
                                display: true,
                                text: 'Count of Logs',
                            },
                            ticks: {
                                stepSize: 500,
                                callback: function (value) {
                                    return value.toLocaleString();
                                },
                            },
                            afterDataLimits: (scale) => {
                                scale.max = Math.ceil(scale.max / 500) * 500;
                            },
                        },
                        x: {
                            title: {
                                display: true,
                                text: 'Time',
                            },
                        },
                    },
                },
                plugins: [verticalLinePlugin],
            });
            console.log('Chart initialized successfully for logs.');

            // Add mouse event listeners for dragging
            let isDragging = false;

            $('#histogram').on('mousedown', function (e) {
                isDragging = true;
                const rect = chart.canvas.getBoundingClientRect();
                chart.dragStart = e.clientX - rect.left;
                chart.dragEnd = chart.dragStart;
                chart.update();
            });

            $(document).on('mousemove', function (e) {
                if (isDragging) {
                    const rect = chart.canvas.getBoundingClientRect();
                    chart.dragEnd = Math.min(Math.max(e.clientX - rect.left, 0), chart.width);
                    chart.update();
                }
            });

            $(document).on('mouseup', function () {
                if (isDragging) {
                    isDragging = false;
                    console.log('Dragging completed, but no date range update possible without inputs.');
                }
            });
        } else {
            // Update existing chart with logs data
            chart.data.labels = dates;
            chart.data.datasets[0].data = counts;
            chart.update();
            console.log('Histogram updated successfully for logs.');
        }
    });
};

// Function to handle timechart visualization (optional, for Visualization tab)
window.updateTimechartVisualization = function (timechartData) {
    console.log('updateTimechartVisualization called with data:', timechartData);

    // Ensure DOM is ready
    $(document).ready(function () {
        // Example: Assume timechartData has buckets like [{"timestamp": 1740582133595, "count": 100}]
        if (!timechartData || !timechartData.buckets) {
            console.warn('No timechart data available.');
            return;
        }

        const buckets = timechartData.buckets || timechartData.TimechartUpdate?.buckets || timechartData.TimechartComplete?.buckets;
        if (!buckets) {
            console.warn('No buckets found in timechart data.');
            return;
        }

        const dates = buckets.map((bucket) => moment(bucket.timestamp).format('YYYY-MM-DD'));
        const counts = buckets.map((bucket) => bucket.count || bucket.value); // Handle different field names

        // Initialize or update a separate chart for timechart (e.g., in Visualization tab)
        const timechartCanvas = document.getElementById('timechart-visualization');
        if (timechartCanvas) {
            let timechart;
            if (!window.timechart) {
                // Initialize Chart.js for timechart
                timechart = new Chart(timechartCanvas.getContext('2d'), {
                    type: 'bar',
                    data: {
                        labels: dates,
                        datasets: [
                            {
                                label: 'Timechart Count',
                                data: counts,
                                backgroundColor: 'rgb(255, 99, 132)',
                                borderColor: 'rgb(255, 99, 132)',
                                borderWidth: 1,
                            },
                        ],
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                            y: {
                                beginAtZero: true,
                                title: {
                                    display: true,
                                    text: 'Count of Logs (Timechart)',
                                },
                                ticks: {
                                    stepSize: 500,
                                    callback: function (value) {
                                        return value.toLocaleString();
                                    },
                                },
                                afterDataLimits: (scale) => {
                                    scale.max = Math.ceil(scale.max / 500) * 500;
                                },
                            },
                            x: {
                                title: {
                                    display: true,
                                    text: 'Time',
                                },
                            },
                        },
                    },
                });
                window.timechart = timechart; // Store for future updates
                console.log('Timechart visualization initialized successfully.');
            } else {
                // Update existing timechart
                window.timechart.data.labels = dates;
                window.timechart.data.datasets[0].data = counts;
                window.timechart.update();
                console.log('Timechart visualization updated successfully.');
            }
        } else {
            console.warn("Timechart canvas '#timechart-visualization' not found in DOM.");
        }
    });
};

// Ensure toggle button functionality and initialize with data if available
$(document).ready(function () {
    $('#toggle-btn').click(function (event) {
        event.stopPropagation();
        $('#histogram-container').slideToggle(function () {
            if ($('#histogram-container').is(':visible')) {
                $('#initial-response').hide();
            } else {
                $('#initial-response').show();
            }
            // Update histogram if data is available (logs)
            if (typeof logsRowData !== 'undefined' && logsRowData.length > 0 && typeof window.updateHistogram === 'function') {
                window.updateHistogram(logsRowData);
            }
            // Optionally update timechart if enabled and data is available
            if (window.runTimechart && typeof window.updateTimechartVisualization === 'function' && window.timechartData) {
                window.updateTimechartVisualization(window.timechartData);
            }
        });
    });

    $(document).click(function (event) {
        if (!$(event.target).closest('#histogram-container, #toggle-btn').length) {
            $('#histogram-container').slideUp();
        }
    });

    // Initial update if data is available
    if (typeof logsRowData !== 'undefined' && logsRowData.length > 0 && typeof window.updateHistogram === 'function') {
        window.updateHistogram(logsRowData);
    }
    if (window.runTimechart && typeof window.updateTimechartVisualization === 'function' && window.timechartData) {
        window.updateTimechartVisualization(window.timechartData);
    }
});
