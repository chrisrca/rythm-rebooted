function convert(seconds) {
    if (seconds < 3600) {
        return convertSecondsToMinutesWhenLessThanAnHour(seconds)
    } else {
        return convertSecondsToHoursAndMinutes(seconds)
    }
  
    function convertSecondsToMinutesWhenLessThanAnHour(seconds) {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
    }
  
    function convertSecondsToMinutes(seconds) {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return `${minutes < 10 ? '0' : ''}${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
    }
  
    function convertSecondsToHoursAndMinutes(seconds) {
        const hours = Math.floor(seconds / 3600);
        const remainingSeconds = seconds % 3600;
        return `${hours}:${convertSecondsToMinutes(remainingSeconds)}`;
    }
}

module.exports = { convert }