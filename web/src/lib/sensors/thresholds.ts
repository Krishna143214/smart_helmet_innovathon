/** Demo alert bands. Tune and calibrate these against the deployed sensors. */
export const SENSOR_THRESHOLDS = {
  gas: { min: 0, max: 400, unit: "ADC" },
  temperature: { min: 10, max: 35, unit: "°C" },
  humidity: { min: 20, max: 80, unit: "%" },
} as const;
