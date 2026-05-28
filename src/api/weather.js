import { request } from './client'

/**
 * Weather API — interfaces with the JWordenAI backend to retrieve
 * paving-specific forecasts and seasonal risk analysis.
 */

/**
 * Gets a 7-day paving suitability forecast for a specific address.
 * @param {string} address - The project site address.
 * @returns {Promise<Object>} - The forecast data includingsuitability scores.
 */
export async function getPavingForecast(address) {
  return request('POST', '/api/v1/weather/paving-forecast', {
    body: JSON.stringify({ address })
  });
}

/**
 * Gets the seasonal weather risk for a US state.
 * @param {string} stateCode - 2-letter state abbreviation
 * @returns {Promise<Object>} - The monthly risk distribution.
 */
export async function getStateWeatherRisk(stateCode) {
  return request('GET', `/api/v1/weather/risk/${stateCode.toUpperCase()}`);
}
