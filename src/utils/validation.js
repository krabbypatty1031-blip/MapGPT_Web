/**
 * 验证工具函数
 * 提供常用的数据验证方法
 */

/**
 * 验证坐标是否有效
 * @param {Object} coordinate - 坐标对象 {latitude, longitude}
 * @returns {boolean} 是否有效
 */
export const isValidCoordinate = (coordinate) => {
  if (!coordinate) return false;
  
  const { latitude, longitude } = coordinate;
  
  return (
    typeof latitude === 'number' &&
    typeof longitude === 'number' &&
    isFinite(latitude) &&
    isFinite(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
  );
};

/**
 * 验证位置对象是否有效
 * @param {Object} location - 位置对象
 * @returns {boolean} 是否有效
 */
export const isValidLocation = (location) => {
  if (!location) return false;
  
  return isValidCoordinate({
    latitude: location.latitude,
    longitude: location.longitude,
  });
};

/**
 * 过滤有效的位置列表
 * @param {Array} locations - 位置列表
 * @returns {Array} 有效的位置列表
 */
export const filterValidLocations = (locations) => {
  if (!Array.isArray(locations)) return [];
  
  return locations.filter(isValidLocation);
};

/**
 * 验证标记对象是否有效
 * @param {Object} marker - 标记对象
 * @returns {boolean} 是否有效
 */
export const isValidMarker = (marker) => {
  if (!marker) return false;
  
  const coordinate = marker.coordinate || {
    latitude: marker.latitude,
    longitude: marker.longitude,
  };
  
  return isValidCoordinate(coordinate);
};

/**
 * 过滤有效的标记列表
 * @param {Array} markers - 标记列表
 * @returns {Array} 有效的标记列表
 */
export const filterValidMarkers = (markers) => {
  if (!Array.isArray(markers)) return [];
  
  return markers.filter(isValidMarker);
};

/**
 * 验证字符串是否非空
 * @param {string} str - 字符串
 * @returns {boolean} 是否非空
 */
export const isNonEmptyString = (str) => {
  return typeof str === 'string' && str.trim().length > 0;
};

/**
 * 验证数组是否非空
 * @param {Array} arr - 数组
 * @returns {boolean} 是否非空
 */
export const isNonEmptyArray = (arr) => {
  return Array.isArray(arr) && arr.length > 0;
};

export default {
  isValidCoordinate,
  isValidLocation,
  filterValidLocations,
  isValidMarker,
  filterValidMarkers,
  isNonEmptyString,
  isNonEmptyArray,
};

