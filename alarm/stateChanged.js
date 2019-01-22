'use strict';

const Formats = {
    default:    0,
    homekit:    1,
    value:      2
};

module.exports = function(RED) {

    function AnamicoAlarmStateChanged(config) {
        RED.nodes.createNode(this, config);
        var node = this;

        this.format = parseInt(config.format || '0');
        this._panel = RED.nodes.getNode(config.panel);

        /**
         * listen for panel state changes
         */
        this._panel && this._panel.registerStateListener(this, function(msg) {

            node.log("new State");
            node.log(JSON.stringify(msg, null, 2));

            node.status({
                fill: node._panel.isAlarm ? "red" : "green",
                shape:"dot",
                text:node._panel.alarmModes[node._panel.alarmState]
            });

            if (msg.initialState && !config.sendInitialState) {
                return;
            }
            if (msg.payload) {
                switch (node.format) {
                    case Formats.homekit:
                        const oldPayload = msg.payload;
                        msg.payload = {};
                        if (typeof oldPayload.SecuritySystemTargetState !== "undefined") {
                            msg.payload.SecuritySystemTargetState = oldPayload.SecuritySystemTargetState;
                        }
                        if (typeof oldPayload.SecuritySystemCurrentState !== "undefined") {
                            msg.payload.SecuritySystemCurrentState = oldPayload.SecuritySystemCurrentState;
                        }
                        if (typeof oldPayload.SecuritySystemAlarmType !== "undefined") {
                            msg.payload.SecuritySystemAlarmType = oldPayload.SecuritySystemAlarmType;
                        }
                        break;
                    case Formats.value:
                        msg.payload = msg.payload.SecuritySystemCurrentState;
                        break;
                    default:
                }
            }

            node.send(msg);
        });

        /**
         * clean up on node removal
         */
        node.on('close', function() {
            node._panel && node._panel.deregisterStateListener(node);
        });
    }
    RED.nodes.registerType("AnamicoAlarmStateChanged", AnamicoAlarmStateChanged);
};
