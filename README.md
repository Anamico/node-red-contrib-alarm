# node-red-contrib-alarm
[![Latest NPM Version](https://img.shields.io/npm/v/node-red-contrib-alarm.svg)](https://www.npmjs.com/package/node-red-contrib-alarm)
[![Donate](https://img.shields.io/badge/donate-PayPal-green.svg)](https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=JUYN6NBFELTC2&source=url)

Powerful and flexible node-red nodes to enable you to build your own home alarm system with any number of panels, zones, sensors, triggers and automations.
Designed to work easily with (but does not require) homekit.

![Homekit Bridge Alarm Example](https://github.com/Anamico/node-red-contrib-alarm/raw/master/images/alarm.png "Homekit Bridge Alarm Example")

There is 1 configuration node and four flow node types currently provided:
1. Alarm Panel (Configuration node)
2. ChangeState node
3. StateChanged node
4. Sensor node
5. Alarm Triggered node

## AlarmPanel

Create an alarmPanel configuration node to tie together states and sensors for a property or zone. So for a simple house with just arming and disarming, create a single panel.
For a bigger property where you may want to fully arm some zones and leave other disarmed or on night mode, create separate panels for each zone.

## ChangeState

Send a message to a "changeState" node to update the alarm panel state. Attach it to a panel to control that property or zone.

Payloads follow the HomeKit Alarm state conventions with SecuritySystemTargetState being the new state you would prefer the alarm panel to be in.

see: [HomeKit-Model-Reference - SecuritySystemTargetState](https://github.com/Colorado4Wheeler/HomeKit-Bridge/wiki/HomeKit-Model-Reference#securitysystemtargetstate)

Essentially, a "ChangeState" message updates the panel state and echos the state on ALL "StateChanged" emitters associated with that same panel
(see below for IMPORTANT WARNING about infinite loops!).

Make sure you select the right "mode" in the node configuration:

* Default - Basic payload
* Homekit - Special mode for working with HomeBridge Alarm Nodes
* Value - A new mode that essentially just accepts a single 0 to 4 value as the payload. This was introduced to work directly with Dashboard and a few other node-red nodes.

## StateChanged

This node emits a message when the alarm system changes state, such as switching from "Home" to "Away" or "Disarm", or if a sensor triggers an alarm when armed.

The current state will be in msg.payload.SecuritySystemCurrentState and follows the HomeKit Alarm state conventions (same document as above).

WARNING: There is NO infinite loop detection right now! So MAKE SURE if you create ANY path from a "StateChanged" to a "ChangeState" node, that you MUST
ensure the loop is not permanent or you will burn up cpu! A good enhancement would be perhaps to build in a "keepalive" countdown for 2 iterations or something to
auto-kill a message stuck in a loop if anyone wants to take that on.

![Automation Example](https://github.com/Anamico/node-red-contrib-alarm/raw/master/images/automation.png "Automation Example")

You can use this node to both set the state in the homekit alarm system or the dashboard controls, or for any automation in response to a panel state change.

Make sure you select the right "mode" in the node configuration:

* Default - Basic payload
* Homekit - Special mode for working with HomeBridge Alarm Nodes
* Value - A new mode that essentially just emits a single 0 to 4 value as the payload. This was introduced to work directly with Dashboard and a few other node-red nodes.

## Sensor

A sensor is an input to the alarm panel that you configure with one or more active "modes". ie: a laundry door may be "Armed" in "Away" and "Night" modes.
But a hall motion sensor may only be armed in "Away" mode.

![Sensor Examples](https://github.com/Anamico/node-red-contrib-alarm/raw/master/images/sensors.png "Sensor Examples")
![Smoke Detector Example](https://github.com/Anamico/node-red-contrib-alarm/raw/master/images/nest.png "Smoke Detector Example")

If a sensor receives ANY message at all, it will trigger an alarm IF the alarm panel it is associated with is in a mode that you have nominated as an "Active" alarm mode
in the sensor node configuration.

You can also use these nodes in flows that expose zwave or zigbee devices (like concealed door sensors) to homekit-bridge or other nodes:

![Door Sensor Example](https://github.com/Anamico/node-red-contrib-alarm/raw/master/images/laundry-door.png "Door Sensor Example")


## Alarm Triggered

An Alarm Triggered node is essentially an alarm siren/strobe/etc output node.
This node only really responds to an alarm state (the alarm has been 'triggered'). There is a delay on this node and on an alarm being triggered,
it will wait the number of seconds specified before firing (emitting a payload).

![Triggered Alarm Example](https://github.com/Anamico/node-red-contrib-alarm/raw/master/images/triggered.png "Triggered Alarm Example")

You can use this node to perhaps emit a payload immediately on alarm state to start some "warning beeps" from an internal alarm.
Then have another one set up to only fire after 30 seconds (an "entrance" delay) to trigger the main siren and strobe.

# Usage Examples

A basic configuration to work with HomeKit would be to use a HomeKit Bridge node between a "StateChanged" and a "ChangeState" node.

![Homekit Bridge Alarm Example](https://github.com/Anamico/node-red-contrib-alarm/raw/master/images/alarm.png "Homekit Bridge Alarm Example")

ie: If you create a Homekit Security System, it appears on your phone as an alarm system. When you use homekit to set the alarm to "Away" the
homekit bridge node will emit a message with the payload for "Away" = 1. The "ChangeState" node processes that new state and sets your node-red panel to "Away".
It will also emit that state as the new CurrentState to all "StateChanged" nodes, so you can set a dashboard, trigger another automation or whatever.

Note that the "StateChanged", "ChangeState", "Sensor" and "Alarm Triggered" nodes can be all on different flows and subflows and you can have any number of each type of node.
This offers ultimate flexibility in the way you configure your node-red alarm system.

Similarly, you could put a node-red dashboard dropdown selector in-line between another set of "StateChanged" and "ChangeState" nodes.

![Dashboard Control Example](https://github.com/Anamico/node-red-contrib-alarm/raw/master/images/dashboard.png "Dashboard Control Example")

So if you had both set up, then changing the mode on your iPhone or Mac Homekit client, will update the "panel" state in node-red and emit that new state to anything
attached to a "StateChanged" node. So your dashboard dropdown would update to the same state. NOTE: Make sure you do NOT pass-through the incoming message to the output on the dashboard drop-down element. It may create an endless loop.

So you could use a button, your Homekit client AND a dashboard widget all to arm and disarm the alarm panel, it's that powerful and completely up to you.

Try using node-red-contrib-wemo, hue and zwave modules to tap into existing door sensors and movement sensors to act as your alarm panel inputs.

## Siren Example

This example uses a zwave siren like [this](http://www.smarthome.com.au/vision-z-wave-outdoor-siren.html) or [this](http://www.smarthome.com.au/vision-z-wave-wireless-siren-strobe.html) connected to openhab2 and using
[node-red-contrib-openhab2](https://flows.nodered.org/node/node-red-contrib-openhab2).

To cater for an "Entry Delay" (in case someone forgets to disarm the alarm before entering the building), you can use the "alarm" node to start the alarm and the normal "State Changed" node to reset the alarm.

![Siren Example](https://github.com/Anamico/node-red-contrib-alarm/raw/master/images/siren.png "Siren Example")

In this example, the "State Changed" node is configured as a "Value" output. In this configuration it will emit a "msg.payload == 3" on disarming the system. This is the check you need to put in the "switch" node. Then the "Alarm Off" node sets payload to "OFF"
to turn off the siren when the alarm is disarmed.

To trigger the alarm, use an "Alarm" node with a suitable delay configuration (15 seconds? up to you). Then have a "Alarm On" node to set payload to "ON".

### Entry Delay Example

You can use the delay configuration on alarm modes to create an entry delay and push notifications or turn on siren "pips" accordingly.
This is how you could configure a 60 second entry delay with warning pips on an internal siren (like [this](https://www.ozsmartthings.com.au/products/dome-z-wave-siren)) and push alerts to slack (so you get notified immediately if the alarm trips, and to also act as a warning via your phone if the warning pips fail (no batteries?).

![Entry Delay Configuration](https://github.com/Anamico/node-red-contrib-alarm/raw/master/images/delay1.png "Entry Delay Configuration")

1. The top "Alarm" node is configured with a 60 second delay. So it will turn on the main siren and post an alarm state to Slack 60 seconds after the alarm trips IF the alarm is not turned off before then.
2. The 60, 30, 20 and 10 second alarm delays actually trigger after 0, 30, 40 and 50 seconds respectively, they announce that remains before the full alarm sounds via slack and ensure the internal piezo buzzer is set to "pip" mode.

For example, if you follow the nodes leading from the "10 Seconds" alarm mode, it is configured with a delay of 50 seconds (10 seconds before main alarm).

![50 Second Delay Configuration](https://github.com/Anamico/node-red-contrib-alarm/raw/master/images/delay2.png "50 Second Delay Configuration")

It ensures the internal piezo is still in "pip" mode (because if it somehow stopped, it's incorrect because the alarm has not been disabled). And feeds to a function node that sets the topic to send to slack:

![50 Second Slack Function Configuration](https://github.com/Anamico/node-red-contrib-alarm/raw/master/images/delay3.png "50 Second Slack Function Configuration")

With an appropriate payload to format the notification.

```json
{
    "text": "Alarm in 10 Seconds!",
    "username": "Alarm",
    "as_user": false,
    "icon_emoji": "cop",
    "channel": "alarm"
}
```

Likewise, you can use any such notification service, slack is just an example of a free way to notify your phone and desktop (pretty much any device actually).

## Nest Smoke Detector Example

By wiring up a smoke detector, you can configure the node to alarm only in away mode:

![Smoke Detector Example](https://github.com/Anamico/node-red-contrib-alarm/raw/master/images/nest.png "Smoke Detector Example")

Example node-red-contrib-nest node configuration:

![Nest Configuration](https://github.com/Anamico/node-red-contrib-alarm/raw/master/images/nest-config.png "Nest Configuration")

And use a function node to just set off an alarm IF there is any smoke detected at all:

```javascript
// if ANY smoke is detected when no one is home, then we need to set off the alarm
// the alternate reported states from nest smoke detectors are "warning" and "emergency"
// BOTH are bad if no one is home, as ANY smoke is a problem if no one is home (It could not be burnt toast!)
// we didn't bother with msg.payload.co_alarm_state as carbon monoxide would not typically requires fire department attendance

if (msg.payload.smoke_alarm_state == "ok") {
    return;
}

return msg;
```

# Donations [![Donate](https://img.shields.io/badge/donate-PayPal-green.svg)](https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=JUYN6NBFELTC2&source=url)

If you would like to donate some money to support ongoing development or as a simple thank you for me sharing this project for others to use, please feel free to send money via
[PayPal](https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=JUYN6NBFELTC2&source=url).

# Breaking Change from 0.9.4!

NOTE: Once you upgrade from 0.9.4, you need to update all "Change State" and "State Changed" nodes configurations to select a "Format" from 1 of 3 values.

* Default - Basic payload
* Homekit - Special mode for working with HomeBridge Alarm Nodes
* Value - A new mode that essentially just sets or accepts a single 0 to 4 value as the payload. This was introduced to work directly with Dashboard and a few other node-red nodes.

# Disclaimer

Of course, this software is completely opensource and offered with absolutely NO WARRANTY whatsoever offered or implied.

If you choose to set up your own alarm system, and you get burgled, it's your problem, nothing to do with this software as there is no warranty
that this provides any form of protection whatsoever. Up to you to use it completely at your own risk. So YOU HAVE BEEN WARNED!
