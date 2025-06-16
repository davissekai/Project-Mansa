from flask import Flask, request, jsonify, render_template
import numpy as np # Import numpy

app = Flask(__name__)

# This route serves as the HTML file
@app.route('/')
def index():
    # Flask looks for 'index.html' inside the 'templates' folder
    return render_template('index.html')

# This route handles the chart generation request from the frontend
@app.route('/generate_chart', methods=['POST'])
def generate_chart():
    # Ensures the request is JSON
    if request.is_json:
        data = request.get_json()
        num_samples = data.get('num_samples')
        measurements_per_sample = data.get('measurements_per_sample')

        # Input validation (basic)
        if not isinstance(num_samples, int) or num_samples <= 0 or \
           not isinstance(measurements_per_sample, int) or measurements_per_sample <= 0:
            return jsonify({'error': 'Invalid input: num_samples and measurements_per_sample must be positive integers.'}), 400

        #  Integration of X-bar calculation Logic 

        # Step 1: Generate mock data based on frontend input
        # Using a fixed seed for reproducibility during development
        np.random.seed(42)
        # Using received num_samples and measurements_per_sample for size
        mock_data = np.random.normal(loc=100, scale=2, size=(num_samples, measurements_per_sample))

        # Step 2: Calculate sample means (X-bar) and ranges
        x_bar = np.mean(mock_data, axis=1) # mean of each sample
        r = np.ptp(mock_data, axis=1)     # range of each sample

        # Step 3: Calculate control limits for x-bar charts
        # Using A2 factor for n=measurements_per_sample
        # Important: A2 factor depends on the sample size (n).
        # For simplicity, use a fixed A2 for n=5.
        # In a real app, you'd have a lookup table or formula for A2 based on 'measurements_per_sample'.
        # For now, assume 'measurements_per_sample' is 5 for A2 = 0.577.
        # If 'measurements_per_sample' changes, A2 needs to change too
        n = measurements_per_sample
        A2 = 0.577 # A2 for n=5. If n changes, this A2 needs to be looked up from a table.
                   # For simplicity for this project, we keep A2 at 0.577 even if n changes,
                   # but in a real-world scenario, this MUST be dynamic.
        if n != 5: # Added a print warning for clarity if n is not 5
            print(f"WARNING: A2 factor (0.577) is for n=5. Received n={n}. Chart limits might be inaccurate.")


        x_bar_mean = np.mean(x_bar) # Overall mean of sample means
        r_mean = np.mean(r)         # Mean of ranges
        ucl = x_bar_mean + A2 * r_mean # Upper control limit
        lcl = x_bar_mean - A2 * r_mean # Lower control limit

        # Prepare data for frontend (JSON) 
        # Convert numpy arrays to Python lists for JSON serialization
        # (JSON doesn't understand numpy arrays directly)
        response_data = {
            'status': 'success',
            'chartData': {
                'xBarValues': x_bar.tolist(), # Convert numpy array to list
                'centerLine': x_bar_mean,
                'ucl': ucl,
                'lcl': lcl
            },
            'keyStats': {
                'overallMean': f"{x_bar_mean:.2f} g",
                'meanRange': f"{r_mean:.2f} g",
                'ucl': f"{ucl:.2f} g",
                'lcl': f"{lcl:.2f} g"
            }
        }
        return jsonify(response_data), 200
    else:
        return jsonify({'error': 'Request must be JSON'}), 400 # Bad Request if not JSON

if __name__ == '__main__':
    
   
    app.run(debug=True) # debug=True allows for automatic reloading on code changes