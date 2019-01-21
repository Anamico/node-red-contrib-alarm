'use strict';

const Formats = {
    default:    0,
    homekit:    1,
    value:      2
};

module.exports = function(RED) {

    function AnamicoAlarmChangeState(config) {
        RED.nodes.createNode(this, config);
        var node = this;

        this.configError = false;
        this.format = parseInt(config.format || '0');
        this._panel = RED.nodes.getNode(config.panel);

        /**
         * handle inputs
         */
        /* Here's an example payload from homekit
            {
                "payload":{
                    "SecuritySystemTargetState":1
                },
                "hap":{
                    "oldValue":0,
                    "newValue":1,
                    "context":{                 <-- this is absent if it's echoing an incoming message
                        "keepalive":true,
                        "2.10":true,
                        "2.11":true
                    },
                    "characteristic":blah blah blah
                },
                "name":"Alarm",
                "_msgid":"8044bfc.f837b4"
            }
         */
        node.on('input', function(msg) {
            node.log(node);

            if (this.configError) { return; }  // ignore everything if in error state, can only redeploy to fix this state
            // error if not in homekit mode and we get a homekit message
            if (( node.format != Formats.homekit ) && msg.hap && msg.hap.context) {
                node.error('homekit message received when not in homekit mode', msg);
                node.status({ fill: "red", shape: "dot", text: "homekit message received" });
                this.configError = true;
                return
            }

            // silently ignore non-homekit messages (if we are expecting homekit) to avoid loops
            if (( node.format == Formats.homekit ) && !(msg.hap && msg.hap.context)) {
                return
            }
            delete msg.hap; // make sure we remove "hap" details to avoid future problems down the track.

            // basic sanity check
            if (typeof msg.payload === 'undefined') {
                node.error('missing payload', msg);
                node.status({ fill: "red", shape: "dot", text: "missing payload" });
                return
            }

            if ( node.format == Formats.value) {    // raw value mode, the incoming value is the desired alarm state
                if (isNaN(msg.payload)) {
                    node.error('non-numeric payload received', msg);
                    node.status({ fill: "red", shape: "dot", text: "non-numeric payload received" });
                    return
                }
                msg.payload = {
                    SecuritySystemTargetState: msg.payload,
                    SecuritySystemCurrentState: msg.payload
                };
            }

            msg.payload.fromHomekit = ( node.format == Formats.homekit);

            node.status({ fill: "blue", shape:"dot", text: "updating panel..." });
            node._panel && node._panel.setState(msg, function(result) {
                node.status({ fill: result.error || node._panel.isAlarm ? "red" : "green", shape: "dot", text: result.label });
            });
        });

        /**
         * listen for panel state changes
         */
        node.panel && node._panel.registerStateListener(this, function(msg) {
            if (node.configError) { node._panel.deregisterStateListener(node); return; }   // ignore everything if in error state, can only redeploy to fix this state
            node.status({
                fill: node._panel.isAlarm ? "red" : "green",
                shape:"dot",
                text:node._panel.alarmModes[node._panel.alarmState]
            });

            node.send(msg);
        });

        /**
         * clean up on node removal
         */
        node.on('close', function() {
            node._panel && node._panel.deregisterStateListener(node);
        });
    }
    RED.nodes.registerType("AnamicoAlarmChangeState", AnamicoAlarmChangeState);
};
