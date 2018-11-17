# node-red-contrib-alarm
Powerful and flexible node-red nodes to enable you to build your own home alarm system with any number of panels, zones, sensors, triggers and automations.
Designed to work easily with (but does not require) homekit.

The three node types currently provided are:
1. Alarm Panel (Configuration node)
2. ChangeState node
3. StateChanged node
4. Sensor node

## AlarmPanel

Create an alarmPanel configuration node to tie together states and sensors for a property or zone. So for a simple house with just arming and disarming, create a single panel.
For a bigger property where you may want to fully arm some zones and leave other disarmed or on night mode, create separate panels for each zone.

## ChangeState

Send a message to a "changeState" node to update the alarm panel state. Attach it to a panel to control that property or zone.

Payloads follow the HomeKit Alarm state conventions with SecuritySystemTargetState being the new state you would prefer the alarm panel to be in.

see: (https://github.com/Colorado4Wheeler/HomeKit-Bridge/wiki/HomeKit-Model-Reference#securitysystemtargetstate)[https://github.com/Colorado4Wheeler/HomeKit-Bridge/wiki/HomeKit-Model-Reference#securitysystemtargetstate]

Essentially, a "ChangeState" message updates the panel state and echos the state on ALL "StateChanged" emitters associated with that same panel
(see below for IMPORTANT WARNING about infinite loops!).

## StateChanged

This node emits a message when the alarm system changes state, such as switching from "Home" to "Away" or "Disarm", or if a sensor triggers an alarm when armed.

The current state will be in msg.payload.SecuritySystemCurrentState and follows the HomeKit Alarm state conventions (same document as above).


WARNING: There is NO infinite loop detection right now! So MAKE SURE if you create ANY path from a "StateChanged" to a "ChangeState" node, that you MUST
ensure the loop is not permanent or you will burn up cpu! A good enhancement would be perhaps to build in a "keepalive" countdown for 2 iterations or something to
auto-kill a message stuck in a loop if anyone wants to take that on.

## Sensor

A sensor is an input to the alarm panel that you configure with one or more active "modes". ie: a laundry door may be "Armed" in "Away" and "Night" modes.
But a hall motion sensor may only be armed in "Away" mode.

If a sensor receives ANY message at all, it will trigger an alarm IF the alarm panel it is associated with is in a mode that you have nominated as an "Active" alarm mode
in the sensor node configuration.

# Usage Example

A basic configuration to work with HomeKit would be to use a HomeKit Bridge node between a "StateChanged" and a "ChangeState" node.

ie: If you create a Homekit Security System, it appears on your phone as an alarm system. When you use homekit to set the alarm to "Away" the
homekit bridge node will emit a message with the payload for "Away" = 1. The "ChangeState" node processes that new state and sets your node-red panel to "Away".
It will also emit that state as the new CurrentState to all "StateChanged" nodes, so you can set a dashboard, trigger another automation or whatever.

Note that the "StateChanged", "ChangeState" and "Sensor" nodes can be all on different flows and subflows and you can have any number of each type of node.
This offers ultimate flexibility in the way you configure your node-red alarm system.

Similarly, you could put a node-red dashboard dropdown selector in-line between another (or the same) "StateChanged" and "ChangeState" nodes.
So if you had both set up, then changing the mode on your iPhone or Mac Homekit client, will update the "panel" state in node-red and emit that new state to anything
attached to a "StateChanged" node. So your dashboard dropdown would update to the same state.

So you could use a button, your Homekit client AND a dashboard widget all to arm and disarm the alarm panel, it's that powerful and completely up to you.


# Disclaimer

Of course, this software is completely opensource and offered with absolutely NO WARRANTY whatsoever offered or implied.

If you choose to set up your own alarm system, and you get burgled, it's your problem, nothing to do with this software as there is no warranty
that this provides any form of protection whatsoever. Up to you to use it completely at your own risk. So YOU HAVE BEEN WARNED!