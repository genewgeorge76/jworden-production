class FleetOperations:
    @staticmethod
    def calculate_thermal_decay(current_temp: float, delay_mins: int):
        arrival_temp = current_temp - (1.5 * delay_mins)
        if arrival_temp < 260.0:
            return "CRITICAL: Reroute truck. Asphalt will fail density tests."
        return f"Nominal. Predicted arrival temp: {arrival_temp}F."