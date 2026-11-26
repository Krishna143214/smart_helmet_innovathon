
import type {
  HelmetHistoryRecord,
} from "@/lib/types";

export interface SensorReading {
  timestamp: number;
  gas: number;
  temperature: number;
  humidity?: number;
}

/**
 * Converts Firebase history records into clean AI sensor readings.
 */
export function mapHistoryToReadings(
  history: HelmetHistoryRecord[],
): SensorReading[] {
  return history
    .filter((record) => {
      const sensors = record.sensors;
      const timestamp = record.device?.lastUpdate;

      return (
        sensors !== null &&
        sensors !== undefined &&
        record.device !== null &&
        record.device !== undefined &&
        typeof timestamp === "number" &&
        Number.isFinite(timestamp) &&
        timestamp > 0 &&
        typeof sensors.gas === "number" &&
        Number.isFinite(sensors.gas) &&
        sensors.gas >= 0 &&
        sensors.gas <= 1023 &&
        sensors.temperatureValid === true &&
        typeof sensors.temperature === "number" &&
        Number.isFinite(sensors.temperature)
      );
    })
    .map((record) => {
      const sensors = record.sensors!;
      const timestamp = record.device!.lastUpdate as number;

      return {
        timestamp,
        gas: sensors.gas!,
        temperature: sensors.temperature!,
        humidity:
          sensors.humidityValid === true &&
          typeof sensors.humidity === "number" &&
          Number.isFinite(sensors.humidity)
            ? sensors.humidity
            : undefined,
      };
    })
    .sort((a, b) => a.timestamp - b.timestamp);
}


export interface SensorBaseline {
  gasMean: number;
  gasStdDev: number;
  temperatureMean: number;
  temperatureStdDev: number;
  sampleCount: number;
}

function mean(values: number[]): number {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function standardDeviation(values: number[], average: number): number {
  const variance =
    values.reduce(
      (sum, value) => sum + Math.pow(value - average, 2),
      0,
    ) / values.length;

  return Math.sqrt(variance);
}


export function buildBaseline(
  readings: SensorReading[],
): SensorBaseline | null {
  // Wait until sufficient data is available
  if (!readings || readings.length < 30) {
    return null;
  }

  const gasValues = readings.map((r) => r.gas);
  const temperatureValues = readings.map((r) => r.temperature);

  const gasMean = mean(gasValues);
  const temperatureMean = mean(temperatureValues);

  return {
    gasMean,
    gasStdDev: standardDeviation(gasValues, gasMean),
    temperatureMean,
    temperatureStdDev: standardDeviation(
      temperatureValues,
      temperatureMean,
    ),
    sampleCount: readings.length,
  };
}


export type ReadingLabel =
  | "CLEAN_BASELINE"
  | "INCENSE_RESPONSE"
  | "SUNLIGHT_TEMP_VARIATION"
  | "UNKNOWN";

export interface LabeledSensorReading extends SensorReading {
  label: ReadingLabel;
}