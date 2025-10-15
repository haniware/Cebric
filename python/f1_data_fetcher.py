#!/usr/bin/env python3
import sys
import json
import fastf1
import pandas as pd
import numpy as np
from fastf1.core import Laps
import warnings
import os
from datetime import datetime

# Suppress FastF1 warnings
warnings.filterwarnings('ignore')

# Create cache directory if it doesn't exist
cache_dir = 'fastf1_cache'
if not os.path.exists(cache_dir):
    os.makedirs(cache_dir)

# Enable FastF1 cache for faster data loading
fastf1.Cache.enable_cache(cache_dir)

def convert_to_serializable(obj):
    """Convert pandas/numpy objects to JSON serializable format"""
    if pd.isna(obj):
        return None
    if isinstance(obj, (pd.Timestamp, datetime)):
        return obj.isoformat()
    if isinstance(obj, (np.integer, np.int64)):
        return int(obj)
    if isinstance(obj, (np.floating, np.float64)):
        return float(obj)
    if isinstance(obj, np.ndarray):
        return obj.tolist()
    if isinstance(obj, pd.Timedelta):
        return obj.total_seconds()
    return obj

def get_session_data(year, gp, session_type, selected_drivers=None):
    """Fetch F1 session data using FastF1"""
    try:
        # Load session
        session = fastf1.get_session(int(year), gp, session_type)
        session.load()

        # Get laps data
        laps = session.laps

        # Filter by selected drivers if provided
        if selected_drivers:
            laps = laps[laps['Driver'].isin(selected_drivers)]

        # Get unique drivers
        drivers = laps['Driver'].unique().tolist()

        # Process lap data
        lap_data = []
        for _, lap in laps.iterrows():
            if pd.notna(lap['LapTime']) and lap['LapTime'].total_seconds() > 0:
                # Get compound and ensure it's uppercase
                compound = 'UNKNOWN'
                if pd.notna(lap['Compound']):
                    compound = str(lap['Compound']).upper()

                lap_data.append({
                    'driver': lap['Driver'],
                    'lapNumber': int(lap['LapNumber']),
                    'lapTime': lap['LapTime'].total_seconds(),
                    'sector1': lap['Sector1Time'].total_seconds() if pd.notna(lap['Sector1Time']) else None,
                    'sector2': lap['Sector2Time'].total_seconds() if pd.notna(lap['Sector2Time']) else None,
                    'sector3': lap['Sector3Time'].total_seconds() if pd.notna(lap['Sector3Time']) else None,
                    'compound': compound,
                    'isPersonalBest': lap['IsPersonalBest'] if pd.notna(lap['IsPersonalBest']) else False
                })

        # Calculate statistics
        valid_laps = laps.dropna(subset=['LapTime'])
        fastest_lap = valid_laps.loc[valid_laps['LapTime'].idxmin()] if len(valid_laps) > 0 else None

        # Get speed data for top speed and speed trap calculation
        top_speed_data = {'value': 0, 'driver': 'N/A'}
        speed_trap_data = {'value': 0, 'driver': 'N/A'}
        avg_lap_time = valid_laps['LapTime'].mean().total_seconds() if len(valid_laps) > 0 else 0

        try:
            # Try to get telemetry for top speed and speed trap
            for driver in drivers[:3]:  # Check first 3 drivers to avoid long processing
                driver_laps = valid_laps[valid_laps['Driver'] == driver]
                if len(driver_laps) > 0:
                    fastest_driver_lap = driver_laps.loc[driver_laps['LapTime'].idxmin()]
                    try:
                        telemetry = fastest_driver_lap.get_telemetry()
                        if 'Speed' in telemetry.columns:
                            max_speed = telemetry['Speed'].max()
                            if max_speed > top_speed_data['value']:
                                top_speed_data = {'value': float(max_speed), 'driver': driver}

                            # Speed trap is typically measured at a specific point (we use 70% distance)
                            total_distance = telemetry['Distance'].max()
                            trap_distance = total_distance * 0.7
                            trap_idx = (telemetry['Distance'] - trap_distance).abs().idxmin()
                            trap_speed = telemetry.loc[trap_idx, 'Speed']
                            if trap_speed > speed_trap_data['value']:
                                speed_trap_data = {'value': float(trap_speed), 'driver': driver}
                    except:
                        continue
        except:
            pass

        statistics = {
            'fastestLap': {
                'time': fastest_lap['LapTime'].total_seconds() if fastest_lap is not None else 0,
                'driver': fastest_lap['Driver'] if fastest_lap is not None else 'N/A'
            },
            'topSpeed': top_speed_data,
            'speedTrap': speed_trap_data,
            'totalLaps': int(laps['LapNumber'].max()) if len(laps) > 0 else 0,
            'avgLapTime': avg_lap_time
        }

        return {
            'year': int(year),
            'gp': gp,
            'session': session_type,
            'drivers': drivers,
            'laps': lap_data,
            'statistics': statistics
        }

    except Exception as e:
        raise Exception(f"Failed to fetch session data: {str(e)}")

def get_telemetry_data(year, gp, session_type, driver1, lap1, driver2=None, lap2=None):
    """Fetch telemetry data for comparison with improved data structure"""
    try:
        session = fastf1.get_session(int(year), gp, session_type)
        session.load()

        # Get lap data for driver1
        laps1 = session.laps[session.laps['Driver'] == driver1]
        lap_data1 = laps1[laps1['LapNumber'] == int(lap1)]

        if len(lap_data1) == 0:
            raise Exception(f"No lap data found for {driver1} lap {lap1}")

        lap1_obj = lap_data1.iloc[0]
        telemetry1 = lap1_obj.get_telemetry()

        # Prepare clean telemetry arrays for driver1
        distance1 = telemetry1['Distance'].values if 'Distance' in telemetry1.columns else []
        speed1 = telemetry1['Speed'].values if 'Speed' in telemetry1.columns else []
        throttle1 = telemetry1['Throttle'].values if 'Throttle' in telemetry1.columns else []
        brake1 = telemetry1['Brake'].values if 'Brake' in telemetry1.columns else []
        gear1 = telemetry1['nGear'].values if 'nGear' in telemetry1.columns else []
        rpm1 = telemetry1['RPM'].values if 'RPM' in telemetry1.columns else []
        drs1 = telemetry1['DRS'].values if 'DRS' in telemetry1.columns else []

        # Calculate metrics for driver1
        metrics1 = {
            'maxSpeed': float(np.max(speed1)) if len(speed1) > 0 else 0,
            'avgSpeed': float(np.mean(speed1)) if len(speed1) > 0 else 0,
            'avgThrottle': float(np.mean(throttle1)) if len(throttle1) > 0 else 0,
            'avgBrake': float(np.mean(brake1)) if len(brake1) > 0 else 0,
            'drsUsage': float(np.mean(drs1) * 100) if len(drs1) > 0 else 0,
            'lapTime': lap1_obj['LapTime'].total_seconds() if pd.notna(lap1_obj['LapTime']) else 0,
            'sector1': lap1_obj['Sector1Time'].total_seconds() if pd.notna(lap1_obj['Sector1Time']) else 0,
            'sector2': lap1_obj['Sector2Time'].total_seconds() if pd.notna(lap1_obj['Sector2Time']) else 0,
            'sector3': lap1_obj['Sector3Time'].total_seconds() if pd.notna(lap1_obj['Sector3Time']) else 0,
        }

        # Get compound for driver1
        compound1 = 'UNKNOWN'
        if pd.notna(lap1_obj['Compound']):
            compound1 = str(lap1_obj['Compound']).upper()

        result = {
            'driver1': {
                'driver': driver1,
                'lap': int(lap1),
                'telemetry': {
                    'distance': [float(x) for x in distance1],
                    'speed': [float(x) for x in speed1],
                    'throttle': [float(x) for x in throttle1],
                    'brake': [float(x) for x in brake1],
                    'gear': [int(x) for x in gear1],
                    'rpm': [float(x) for x in rpm1],
                    'drs': [int(x) for x in drs1],
                    'compound': compound1,
                },
                'metrics': metrics1
            }
        }

        # Add driver2 data if provided
        if driver2 and lap2:
            laps2 = session.laps[session.laps['Driver'] == driver2]
            lap_data2 = laps2[laps2['LapNumber'] == int(lap2)]

            if len(lap_data2) == 0:
                raise Exception(f"No lap data found for {driver2} lap {lap2}")

            lap2_obj = lap_data2.iloc[0]
            telemetry2 = lap2_obj.get_telemetry()

            # Prepare clean telemetry arrays for driver2
            distance2 = telemetry2['Distance'].values if 'Distance' in telemetry2.columns else []
            speed2 = telemetry2['Speed'].values if 'Speed' in telemetry2.columns else []
            throttle2 = telemetry2['Throttle'].values if 'Throttle' in telemetry2.columns else []
            brake2 = telemetry2['Brake'].values if 'Brake' in telemetry2.columns else []
            gear2 = telemetry2['nGear'].values if 'nGear' in telemetry2.columns else []
            rpm2 = telemetry2['RPM'].values if 'RPM' in telemetry2.columns else []
            drs2 = telemetry2['DRS'].values if 'DRS' in telemetry2.columns else []

            metrics2 = {
                'maxSpeed': float(np.max(speed2)) if len(speed2) > 0 else 0,
                'avgSpeed': float(np.mean(speed2)) if len(speed2) > 0 else 0,
                'avgThrottle': float(np.mean(throttle2)) if len(throttle2) > 0 else 0,
                'avgBrake': float(np.mean(brake2)) if len(brake2) > 0 else 0,
                'drsUsage': float(np.mean(drs2) * 100) if len(drs2) > 0 else 0,
                'lapTime': lap2_obj['LapTime'].total_seconds() if pd.notna(lap2_obj['LapTime']) else 0,
                'sector1': lap2_obj['Sector1Time'].total_seconds() if pd.notna(lap2_obj['Sector1Time']) else 0,
                'sector2': lap2_obj['Sector2Time'].total_seconds() if pd.notna(lap2_obj['Sector2Time']) else 0,
                'sector3': lap2_obj['Sector3Time'].total_seconds() if pd.notna(lap2_obj['Sector3Time']) else 0,
            }

            # Get compound for driver2
            compound2 = 'UNKNOWN'
            if pd.notna(lap2_obj['Compound']):
                compound2 = str(lap2_obj['Compound']).upper()

            result['driver2'] = {
                'driver': driver2,
                'lap': int(lap2),
                'telemetry': {
                    'distance': [float(x) for x in distance2],
                    'speed': [float(x) for x in speed2],
                    'throttle': [float(x) for x in throttle2],
                    'brake': [float(x) for x in brake2],
                    'gear': [int(x) for x in gear2],
                    'rpm': [float(x) for x in rpm2],
                    'drs': [int(x) for x in drs2],
                    'compound': compound2,
                },
                'metrics': metrics2
            }

        return result

    except Exception as e:
        raise Exception(f"Failed to fetch telemetry data: {str(e)}")

def get_tire_degradation(year, gp, session_type, driver):
    """Analyze tire degradation for a specific driver"""
    try:
        session = fastf1.get_session(int(year), gp, session_type)
        session.load()

        driver_laps = session.laps[session.laps['Driver'] == driver]

        tire_stints = []
        current_compound = None
        stint_laps = []

        for _, lap in driver_laps.iterrows():
            if pd.notna(lap['Compound']) and pd.notna(lap['LapTime']):
                compound = str(lap['Compound']).upper()

                if compound != current_compound:
                    if stint_laps:
                        tire_stints.append({
                            'compound': current_compound,
                            'laps': stint_laps,
                            'avgLapTime': np.mean([l['time'] for l in stint_laps]),
                            'degradation': calculate_degradation(stint_laps)
                        })
                    current_compound = compound
                    stint_laps = []

                stint_laps.append({
                    'lapNumber': int(lap['LapNumber']),
                    'time': lap['LapTime'].total_seconds()
                })

        if stint_laps:
            tire_stints.append({
                'compound': current_compound,
                'laps': stint_laps,
                'avgLapTime': np.mean([l['time'] for l in stint_laps]),
                'degradation': calculate_degradation(stint_laps)
            })

        return {
            'driver': driver,
            'stints': tire_stints
        }
    except Exception as e:
        raise Exception(f"Failed to fetch tire degradation data: {str(e)}")

def calculate_degradation(stint_laps):
    """Calculate tire degradation per lap"""
    if len(stint_laps) < 3:
        return 0
    times = [l['time'] for l in stint_laps]
    degradation = (times[-1] - times[0]) / len(times)
    return float(degradation)

def get_available_gps(year):
    """Get available Grand Prix events for a given year"""
    try:
        schedule = fastf1.get_event_schedule(int(year))
        gps = []

        for _, event in schedule.iterrows():
            # Only include official race weekends (not testing)
            if event['EventFormat'] != 'testing':
                gps.append({
                    'name': event['EventName'],
                    'location': event['Location'],
                    'country': event['Country'],
                    'round': event['RoundNumber']
                })

        return gps

    except Exception as e:
        raise Exception(f"Failed to fetch GP schedule: {str(e)}")

def get_race_pace(year, gp, session_type, drivers):
    """Compare race pace between multiple drivers"""
    try:
        session = fastf1.get_session(int(year), gp, session_type)
        session.load()

        pace_data = []

        for driver in drivers:
            driver_laps = session.laps[session.laps['Driver'] == driver]
            valid_laps = driver_laps.dropna(subset=['LapTime'])

            if len(valid_laps) > 0:
                avg_pace = valid_laps['LapTime'].mean().total_seconds()
                median_pace = valid_laps['LapTime'].median().total_seconds()
                best_pace = valid_laps['LapTime'].min().total_seconds()

                pace_data.append({
                    'driver': driver,
                    'avgPace': avg_pace,
                    'medianPace': median_pace,
                    'bestPace': best_pace,
                    'totalLaps': len(valid_laps)
                })

        return {'paceComparison': pace_data}
    except Exception as e:
        raise Exception(f"Failed to fetch race pace data: {str(e)}")

def get_corner_analysis(year, gp, session_type, driver, lap_number):
    """Analyze corner speeds and performance with brake points"""
    try:
        session = fastf1.get_session(int(year), gp, session_type)
        session.load()

        lap = session.laps[(session.laps['Driver'] == driver) & (session.laps['LapNumber'] == int(lap_number))].iloc[0]
        telemetry = lap.get_telemetry()

        # Get telemetry data
        speed = telemetry['Speed'].values if 'Speed' in telemetry.columns else []
        distance = telemetry['Distance'].values if 'Distance' in telemetry.columns else []
        brake = telemetry['Brake'].values if 'Brake' in telemetry.columns else []
        throttle = telemetry['Throttle'].values if 'Throttle' in telemetry.columns else []

        # Improved corner detection with better filtering
        corners = []
        i = 30
        min_corner_distance = 150  # Minimum distance between corners
        min_speed_drop = 40  # Minimum km/h speed drop to be considered a corner
        last_corner_dist = -min_corner_distance

        while i < len(speed) - 40:
            # Look for significant speed reduction (corner entry)
            # More robust detection: check speed drop over a longer window
            if i > 20:
                speed_before = np.mean(speed[i-10:i])
                speed_at = speed[i]
                speed_drop = speed_before - speed_at

                # Check if this is a significant corner and far enough from last corner
                if (speed_drop > min_speed_drop and 
                    (distance[i] - last_corner_dist) > min_corner_distance):

                    # Find brake point (first significant brake application before corner)
                    brake_point_idx = i
                    for j in range(max(0, i-35), i):
                        if brake[j] > 25:
                            brake_point_idx = j
                            break

                    # Find minimum speed (apex) - look ahead with better window
                    apex_idx = i
                    min_speed = speed[i]
                    for j in range(i, min(i + 40, len(speed))):
                        if speed[j] < min_speed:
                            min_speed = speed[j]
                            apex_idx = j

                    # Find corner exit (when throttle is reapplied and speed increases)
                    exit_idx = apex_idx
                    for j in range(apex_idx, min(apex_idx + 40, len(speed))):
                        if throttle[j] > 60 and speed[j] > speed[apex_idx] + 15:
                            exit_idx = j
                            break

                    # Calculate speed delta for corner classification
                    speed_delta = float(speed[brake_point_idx] - speed[apex_idx])

                    # Only add if it's a significant corner
                    if speed_delta > 25:
                        corner_data = {
                            'cornerNumber': len(corners) + 1,
                            'brakePoint': {
                                'distance': float(distance[brake_point_idx]),
                                'speed': float(speed[brake_point_idx]),
                                'brakeForce': float(brake[brake_point_idx])
                            },
                            'apex': {
                                'distance': float(distance[apex_idx]),
                                'minSpeed': float(speed[apex_idx])
                            },
                            'exit': {
                                'distance': float(distance[exit_idx]),
                                'speed': float(speed[exit_idx]),
                                'throttle': float(throttle[exit_idx])
                            },
                            'speedDelta': speed_delta,
                            'type': 'slow' if speed[apex_idx] < 100 else 'medium' if speed[apex_idx] < 180 else 'fast'
                        }
                        corners.append(corner_data)
                        last_corner_dist = distance[apex_idx]
                        i = exit_idx + 20  # Skip ahead to avoid duplicate detection
                    else:
                        i += 5
                else:
                    i += 5
            else:
                i += 1

        return {
            'driver': driver,
            'lap': int(lap_number),
            'corners': corners  # Return all detected corners
        }
    except Exception as e:
        raise Exception(f"Failed to fetch corner analysis: {str(e)}")

def get_downforce_analysis(year, gp, session_type, driver, lap_number):
    """Estimate downforce levels based on speed and cornering behavior"""
    try:
        session = fastf1.get_session(int(year), gp, session_type)
        session.load()

        lap = session.laps[(session.laps['Driver'] == driver) & (session.laps['LapNumber'] == int(lap_number))].iloc[0]
        telemetry = lap.get_telemetry()

        speed = telemetry['Speed'].values if 'Speed' in telemetry.columns else []
        distance = telemetry['Distance'].values if 'Distance' in telemetry.columns else []

        # Calculate downforce indicators
        # High-speed stability (average speed in high-speed sections)
        high_speed_mask = speed > np.percentile(speed, 75)
        high_speed_avg = float(np.mean(speed[high_speed_mask])) if np.any(high_speed_mask) else 0

        # Low-speed cornering (minimum speeds in corners)
        low_speed_mask = speed < np.percentile(speed, 25)
        low_speed_avg = float(np.mean(speed[low_speed_mask])) if np.any(low_speed_mask) else 0

        # Calculate speed variance (indicator of downforce efficiency)
        speed_variance = float(np.var(speed)) if len(speed) > 0 else 0

        # Estimate relative downforce level (0-100 scale)
        # Higher speeds in corners and lower variance indicate higher downforce
        downforce_index = min(100, (high_speed_avg / 350 * 70) + (30 - speed_variance / 100))

        return {
            'driver': driver,
            'lap': int(lap_number),
            'downforceIndex': float(downforce_index),
            'highSpeedAvg': high_speed_avg,
            'lowSpeedAvg': low_speed_avg,
            'speedVariance': speed_variance,
            'aerodynamicEfficiency': float(high_speed_avg / (speed_variance + 1))
        }
    except Exception as e:
        raise Exception(f"Failed to fetch downforce analysis: {str(e)}")

def get_brake_analysis(year, gp, session_type, driver, lap_number):
    """Detailed brake performance analysis"""
    try:
        session = fastf1.get_session(int(year), gp, session_type)
        session.load()

        lap = session.laps[(session.laps['Driver'] == driver) & (session.laps['LapNumber'] == int(lap_number))].iloc[0]
        telemetry = lap.get_telemetry()

        brake = telemetry['Brake'].values if 'Brake' in telemetry.columns else []
        speed = telemetry['Speed'].values if 'Speed' in telemetry.columns else []
        distance = telemetry['Distance'].values if 'Distance' in telemetry.columns else []

        # Find brake zones
        brake_zones = []
        in_brake_zone = False
        zone_start = 0

        for i in range(len(brake)):
            if brake[i] > 10 and not in_brake_zone:
                in_brake_zone = True
                zone_start = i
            elif brake[i] <= 10 and in_brake_zone:
                in_brake_zone = False
                zone_data = brake[zone_start:i]
                speed_data = speed[zone_start:i]

                if len(zone_data) > 5:
                    brake_zones.append({
                        'startDistance': float(distance[zone_start]),
                        'endDistance': float(distance[i-1]),
                        'peakBrakeForce': float(np.max(zone_data)),
                        'avgBrakeForce': float(np.mean(zone_data)),
                        'speedLoss': float(speed_data[0] - speed_data[-1]) if len(speed_data) > 0 else 0,
                        'duration': float(len(zone_data) / 100)  # Assuming 100Hz sampling
                    })

        # Calculate overall brake performance
        total_brake_time = sum(1 for b in brake if b > 0) / len(brake) * 100 if len(brake) > 0 else 0
        avg_brake_force = float(np.mean(brake[brake > 0])) if np.any(brake > 0) else 0

        return {
            'driver': driver,
            'lap': int(lap_number),
            'brakeZones': brake_zones[:10],  # Top 10 brake zones
            'totalBrakeTimePercent': float(total_brake_time),
            'avgBrakeForce': avg_brake_force
        }
    except Exception as e:
        raise Exception(f"Failed to fetch brake analysis: {str(e)}")

def get_throttle_trace(year, gp, session_type, driver, lap_number):
    """Detailed throttle application analysis"""
    try:
        session = fastf1.get_session(int(year), gp, session_type)
        session.load()

        lap = session.laps[(session.laps['Driver'] == driver) & (session.laps['LapNumber'] == int(lap_number))].iloc[0]
        telemetry = lap.get_telemetry()

        throttle = telemetry['Throttle'].values if 'Throttle' in telemetry.columns else []
        distance = telemetry['Distance'].values if 'Distance' in telemetry.columns else []

        # Calculate throttle zones
        full_throttle_pct = float(np.sum(throttle >= 95) / len(throttle) * 100) if len(throttle) > 0 else 0
        partial_throttle_pct = float(np.sum((throttle > 20) & (throttle < 95)) / len(throttle) * 100) if len(throttle) > 0 else 0
        coast_pct = float(np.sum(throttle <= 20) / len(throttle) * 100) if len(throttle) > 0 else 0

        # Find throttle application points after corners
        throttle_points = []
        for i in range(1, len(throttle) - 1):
            if throttle[i-1] < 50 and throttle[i] >= 50:
                throttle_points.append({
                    'distance': float(distance[i]),
                    'throttleLevel': float(throttle[i])
                })

        return {
            'driver': driver,
            'lap': int(lap_number),
            'fullThrottlePct': full_throttle_pct,
            'partialThrottlePct': partial_throttle_pct,
            'coastPct': coast_pct,
            'throttleApplicationPoints': throttle_points[:15]
        }
    except Exception as e:
        raise Exception(f"Failed to fetch throttle trace: {str(e)}")

def get_gear_usage(year, gp, session_type, driver, lap_number):
    """Analyze gear usage throughout a lap"""
    try:
        session = fastf1.get_session(int(year), gp, session_type)
        session.load()

        lap = session.laps[(session.laps['Driver'] == driver) & (session.laps['LapNumber'] == int(lap_number))].iloc[0]
        telemetry = lap.get_telemetry()

        gear = telemetry['nGear'].values if 'nGear' in telemetry.columns else []
        distance = telemetry['Distance'].values if 'Distance' in telemetry.columns else []

        gear_usage = {}
        for g in range(1, 9):
            usage_pct = np.sum(gear == g) / len(gear) * 100 if len(gear) > 0 else 0
            gear_usage[f'gear{g}'] = float(usage_pct)

        return {
            'driver': driver,
            'lap': int(lap_number),
            'gearUsage': gear_usage
        }
    except Exception as e:
        raise Exception(f"Failed to fetch gear usage data: {str(e)}")

def get_fuel_effect(year, gp, session_type, driver):
    """Estimate fuel effect on lap times"""
    try:
        session = fastf1.get_session(int(year), gp, session_type)
        session.load()

        driver_laps = session.laps[session.laps['Driver'] == driver]
        valid_laps = driver_laps.dropna(subset=['LapTime'])

        if len(valid_laps) < 5:
            return {'driver': driver, 'fuelEffect': 0}

        lap_times = valid_laps['LapTime'].apply(lambda x: x.total_seconds()).values
        lap_numbers = valid_laps['LapNumber'].values

        # Linear regression to estimate fuel effect
        if len(lap_times) > 1:
            coeffs = np.polyfit(lap_numbers, lap_times, 1)
            fuel_effect_per_lap = float(coeffs[0])
        else:
            fuel_effect_per_lap = 0

        return {
            'driver': driver,
            'fuelEffectPerLap': fuel_effect_per_lap,
            'totalFuelEffect': fuel_effect_per_lap * len(lap_times)
        }
    except Exception as e:
        raise Exception(f"Failed to fetch fuel effect data: {str(e)}")

def main():
    if len(sys.argv) < 2:
        print("Usage: python f1_data_fetcher.py <command> [args...]")
        sys.exit(1)

    command = sys.argv[1]

    try:
        if command == "session":
            if len(sys.argv) < 5:
                raise Exception("Usage: session <year> <gp> <session_type> [drivers...]")

            year = sys.argv[2]
            gp = sys.argv[3]
            session_type = sys.argv[4]
            drivers = sys.argv[5:] if len(sys.argv) > 5 else None

            result = get_session_data(year, gp, session_type, drivers)
            print(json.dumps(result))

        elif command == "telemetry":
            if len(sys.argv) < 7:
                raise Exception("Usage: telemetry <year> <gp> <session_type> <driver1> <lap1> [driver2] [lap2]")

            year = sys.argv[2]
            gp = sys.argv[3]
            session_type = sys.argv[4]
            driver1 = sys.argv[5]
            lap1 = sys.argv[6]
            driver2 = sys.argv[7] if len(sys.argv) > 7 else None
            lap2 = sys.argv[8] if len(sys.argv) > 8 else None

            result = get_telemetry_data(year, gp, session_type, driver1, lap1, driver2, lap2)
            print(json.dumps(result))

        elif command == "gps":
            if len(sys.argv) < 3:
                raise Exception("Usage: gps <year>")

            year = sys.argv[2]
            result = get_available_gps(year)
            print(json.dumps(result))

        elif command == "tire-degradation":
            if len(sys.argv) < 6:
                raise Exception("Usage: tire-degradation <year> <gp> <session_type> <driver>")

            year = sys.argv[2]
            gp = sys.argv[3]
            session_type = sys.argv[4]
            driver = sys.argv[5]
            result = get_tire_degradation(year, gp, session_type, driver)
            print(json.dumps(result))

        elif command == "race-pace":
            if len(sys.argv) < 6:
                raise Exception("Usage: race-pace <year> <gp> <session_type> <driver1> [driver2...]")

            year = sys.argv[2]
            gp = sys.argv[3]
            session_type = sys.argv[4]
            drivers = sys.argv[5:]
            result = get_race_pace(year, gp, session_type, drivers)
            print(json.dumps(result))

        elif command == "corner-analysis":
            if len(sys.argv) < 7:
                raise Exception("Usage: corner-analysis <year> <gp> <session_type> <driver> <lap>")

            year = sys.argv[2]
            gp = sys.argv[3]
            session_type = sys.argv[4]
            driver = sys.argv[5]
            lap_number = sys.argv[6]
            result = get_corner_analysis(year, gp, session_type, driver, lap_number)
            print(json.dumps(result))

        elif command == "gear-usage":
            if len(sys.argv) < 7:
                raise Exception("Usage: gear-usage <year> <gp> <session_type> <driver> <lap>")

            year = sys.argv[2]
            gp = sys.argv[3]
            session_type = sys.argv[4]
            driver = sys.argv[5]
            lap_number = sys.argv[6]
            result = get_gear_usage(year, gp, session_type, driver, lap_number)
            print(json.dumps(result))

        elif command == "fuel-effect":
            if len(sys.argv) < 6:
                raise Exception("Usage: fuel-effect <year> <gp> <session_type> <driver>")

            year = sys.argv[2]
            gp = sys.argv[3]
            session_type = sys.argv[4]
            driver = sys.argv[5]
            result = get_fuel_effect(year, gp, session_type, driver)
            print(json.dumps(result))

        elif command == "downforce-analysis":
            if len(sys.argv) < 7:
                raise Exception("Usage: downforce-analysis <year> <gp> <session_type> <driver> <lap>")

            year = sys.argv[2]
            gp = sys.argv[3]
            session_type = sys.argv[4]
            driver = sys.argv[5]
            lap_number = sys.argv[6]
            result = get_downforce_analysis(year, gp, session_type, driver, lap_number)
            print(json.dumps(result))

        elif command == "brake-analysis":
            if len(sys.argv) < 7:
                raise Exception("Usage: brake-analysis <year> <gp> <session_type> <driver> <lap>")

            year = sys.argv[2]
            gp = sys.argv[3]
            session_type = sys.argv[4]
            driver = sys.argv[5]
            lap_number = sys.argv[6]
            result = get_brake_analysis(year, gp, session_type, driver, lap_number)
            print(json.dumps(result))

        elif command == "throttle-trace":
            if len(sys.argv) < 7:
                raise Exception("Usage: throttle-trace <year> <gp> <session_type> <driver> <lap>")

            year = sys.argv[2]
            gp = sys.argv[3]
            session_type = sys.argv[4]
            driver = sys.argv[5]
            lap_number = sys.argv[6]
            result = get_throttle_trace(year, gp, session_type, driver, lap_number)
            print(json.dumps(result))

        elif command == "tire-analysis":
            if len(sys.argv) < 7:
                raise Exception("Usage: tire-analysis <year> <gp> <session_type> <driver> <lap>")

            year = sys.argv[2]
            gp = sys.argv[3]
            session_type = sys.argv[4]
            driver = sys.argv[5]
            lap_number = sys.argv[6]

            session = fastf1.get_session(int(year), gp, session_type)
            session.load()

            lap = session.laps[(session.laps['Driver'] == driver) & (session.laps['LapNumber'] == int(lap_number))].iloc[0]
            telemetry = lap.get_telemetry()

            compound = 'UNKNOWN'
            if pd.notna(lap['Compound']):
                compound = str(lap['Compound']).upper()

            tire_age = int(lap['TyreLife']) if pd.notna(lap['TyreLife']) else 0

            speed = telemetry['Speed'].values if 'Speed' in telemetry.columns else []
            avg_speed = float(np.mean(speed)) if len(speed) > 0 else 0

            driver_laps = session.laps[session.laps['Driver'] == driver]
            same_compound_laps = driver_laps[driver_laps['Compound'] == lap['Compound']].dropna(subset=['LapTime'])

            degradation_rate = 0
            if len(same_compound_laps) > 1:
                times = same_compound_laps['LapTime'].apply(lambda x: x.total_seconds()).values
                degradation_rate = float((times[-1] - times[0]) / len(times)) if len(times) > 1 else 0

            performance = 'optimal' if tire_age < 10 else ('degraded' if tire_age < 20 else 'critical')
            estimated_life = max(0, 30 - tire_age)
            temp_impact = min(100, tire_age * 2.5)
            wear_level = min(100, (tire_age / 30) * 100)

            result = {
                'driver': driver,
                'lap': int(lap_number),
                'compound': compound,
                'tireAge': tire_age,
                'avgSpeed': avg_speed,
                'degradationRate': degradation_rate,
                'estimatedLifeRemaining': estimated_life,
                'performance': performance,
                'tempImpact': temp_impact,
                'wearLevel': wear_level
            }
            print(json.dumps(result))

        elif command == "energy-analysis":
            if len(sys.argv) < 7:
                raise Exception("Usage: energy-analysis <year> <gp> <session_type> <driver> <lap>")

            year = sys.argv[2]
            gp = sys.argv[3]
            session_type = sys.argv[4]
            driver = sys.argv[5]
            lap_number = sys.argv[6]

            session = fastf1.get_session(int(year), gp, session_type)
            session.load()

            lap = session.laps[(session.laps['Driver'] == driver) & (session.laps['LapNumber'] == int(lap_number))].iloc[0]
            telemetry = lap.get_telemetry()

            throttle = telemetry['Throttle'].values if 'Throttle' in telemetry.columns else []
            brake = telemetry['Brake'].values if 'Brake' in telemetry.columns else []
            speed = telemetry['Speed'].values if 'Speed' in telemetry.columns else []

            full_throttle_pct = float(np.sum(throttle >= 95) / len(throttle) * 100) if len(throttle) > 0 else 0
            lift_coast_pct = float(np.sum(throttle <= 20) / len(throttle) * 100) if len(throttle) > 0 else 0

            brake_energy = float(np.sum(brake * speed) / 1000) if len(brake) > 0 and len(speed) > 0 else 0

            energy_recovery = brake_energy * 0.65

            pu_stress = min(100, full_throttle_pct * 0.8 + (100 - lift_coast_pct) * 0.2)
            fuel_efficiency = 0.8 + (lift_coast_pct / 100) * 0.3
            efficiency_score = (100 - lift_coast_pct) * 0.6 + (energy_recovery / 100) * 0.4

            result = {
                'driver': driver,
                'lap': int(lap_number),
                'fullThrottlePct': full_throttle_pct,
                'liftAndCoastPct': lift_coast_pct,
                'estimatedBrakeEnergy': brake_energy,
                'estimatedEnergyRecovery': energy_recovery,
                'efficiencyScore': float(min(100, max(0, efficiency_score))),
                'ersDeployment': 'high' if full_throttle_pct > 70 else 'medium' if full_throttle_pct > 50 else 'low',
                'puStress': pu_stress,
                'fuelEfficiency': fuel_efficiency
            }
            print(json.dumps(result))

        else:
            raise Exception(f"Unknown command: {command}")

    except Exception as e:
        print(f"Error: {str(e)}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()