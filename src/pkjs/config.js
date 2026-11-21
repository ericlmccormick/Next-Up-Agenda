module.exports = [
  {
    "type": "heading",
    "defaultValue": "Calendar Settings"
  },
  {
    "type": "section",
    "items": [
      {
        "type": "heading",
        "defaultValue": "Pebble Calendar"
      },
      {
        "type": "select",
        "messageKey": "PLUGIN_COLOR",
        "label": "Default Calendar Color",
        "defaultValue": "4",
        "options": [
          {
            "label": "Blue",
            "value": "1"
          },
          {
            "label": "Red",
            "value": "2"
          },
          {
            "label": "Green",
            "value": "3"
          },
          {
            "label": "Yellow",
            "value": "4"
          },
          {
            "label": "Orange",
            "value": "5"
          },
          {
            "label": "Purple",
            "value": "6"
          }
        ]
      }
    ]
  },
  {
    "type": "section",
    "items": [
      {
        "type": "heading",
        "defaultValue": "Preferences"
      },
      {
        "type": "select",
        "messageKey": "THEME_MODE",
        "defaultValue": "0",
        "label": "Appearance",
        "options": [
          {
            "label": "Auto (day/night)",
            "value": "0"
          },
          {
            "label": "Light",
            "value": "1"
          },
          {
            "label": "Dark",
            "value": "2"
          }
        ]
      },
      {
        "type": "select",
        "messageKey": "SHOW_PAST",
        "defaultValue": "0",
        "label": "Past Events",
        "options": [
          {
            "label": "Hide completed events",
            "value": "0"
          },
          {
            "label": "Show all events",
            "value": "1"
          }
        ]
      },
      {
        "type": "select",
        "messageKey": "DETAIL_STATUS_BAR",
        "defaultValue": "0",
        "label": "Detail Status Bar",
        "options": [
          {
            "label": "Off (more reading space)",
            "value": "0"
          },
          {
            "label": "On (show current time)",
            "value": "1"
          }
        ]
      },
      {
        "type": "select",
        "messageKey": "FONT_SIZE",
        "defaultValue": "0",
        "label": "Event Font Size",
        "options": [
          {
            "label": "System Default",
            "value": "0"
          },
          {
            "label": "Small",
            "value": "1"
          },
          {
            "label": "Medium",
            "value": "2"
          },
          {
            "label": "Large",
            "value": "3"
          }
        ]
      },
      {
        "type": "select",
        "messageKey": "TIME_FORMAT",
        "defaultValue": "System",
        "label": "Time Format",
        "options": [
          {
            "label": "System Watch Preference",
            "value": "System"
          },
          {
            "label": "12 Hour (AM/PM)",
            "value": "12h"
          },
          {
            "label": "24 Hour",
            "value": "24h"
          }
        ]
      }
    ]
  },
  {
    "type": "section",
    "items": [
      { "type": "heading", "defaultValue": "Weather" },
      {
        "type": "select",
        "messageKey": "WEATHER_SOURCE",
        "label": "Weather Source",
        "description": "Controls forecasts and sunrise/sunset for Auto appearance. No Weather uses local clock times.",
        "defaultValue": "auto",
        "options": [
          { "label": "Pebble Preferred Source (default)", "value": "auto" },
          { "label": "No Weather", "value": "none" }
        ]
      }
    ]
  },
  {
    "type": "submit",
    "defaultValue": "Save Settings"
  }
];
