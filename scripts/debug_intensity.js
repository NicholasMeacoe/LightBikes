const { IntensityConfigManager } = require('./IntensityConfigManager.js');

const manager = new IntensityConfigManager();

console.log('Initial state:');
console.log('Level:', manager.getIntensityLevel());
console.log('Effective:', manager.getEffectiveIntensity());
console.log('Levels object:', manager.getAvailableLevels());

console.log('\nSetting to off:');
const result = manager.setIntensityLevel('off');
console.log('Set result:', result);
console.log('Level:', manager.getIntensityLevel());
console.log('Effective:', manager.getEffectiveIntensity());
console.log('Levels object:', manager.getAvailableLevels());
console.log('Direct access:', manager.intensityLevels['off']);