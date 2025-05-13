////////////////
// Settings data
var howFrequent = 60;                     // What interval (minutes) to run this script on to check for new events.  Any integer can be used, but will be rounded up to 5, 10, 15, 30 or to the nearest hour after that.. 60, 120, etc. 1440 (24 hours) is the maximum value.  Anything above that will be replaced with 1440.
var metaCalName = "$metadata";            // The name of the calendar that stores the metadata events (and nothing else)
var statEventName = "statistics";         // The name of the event that stores the statistics data

////////////////
// Main function
function updateMetadata()
{
  var calCounts = {};
  var metaCal = null;

  getCalendars().forEach(
    cal => {
      var name = cal.summaryOverride || cal.summary;
      if (name == metaCalName)
      {
        metaCal = cal;
        return;
      }
      var events = Calendar.Events.list(cal.id, {showHidden: true, maxResults: 2500, timeMin: new Date().toISOString()});
      calCounts[cal.id] = events.items.length;

      Logger.log(`${name}, ${cal.id} event count: ${calCounts[cal.id]}`);
    });
  var metaEvents = Calendar.Events.list(metaCal.id, {showHidden: true, maxResults: 2500});

  var statEvent = metaEvents.items.filter(e => e.summary == statEventName)[0];
  var stats = JSON.stringify(calCounts, Object.keys(calCounts).sort());
  statEvent.setDescription(stats);
  Calendar.Events.update(statEvent, metaCal.id, statEvent.id);
}

///////////////////
// Trigger creation
function install() {
  // Delete any already existing triggers so we don't create excessive triggers
  deleteAllTriggers();

  // Schedule sync routine to explicitly repeat and schedule the initial sync
  var adjustedMinutes = getValidTriggerFrequency(howFrequent);
  if (adjustedMinutes >= 60) {
    ScriptApp.newTrigger("updateMetadata")
      .timeBased()
      .everyHours(adjustedMinutes / 60)
      .create();
  } else {
    ScriptApp.newTrigger("updateMetadata")
      .timeBased()
      .everyMinutes(adjustedMinutes)
      .create();
  }
}

//////////////////
// Trigger cleanup
function uninstall(){
  deleteAllTriggers();
}
