'use strict';

//const async = require('async');

module.exports = function(RED) {

    function AnamicoAlarmSensor(config) {
        RED.nodes.createNode(this, config);
        var node = this;

        this._panel = RED.nodes.getNode(config.panel);
        this.alarmStates = JSON.parse("[" + config.alarmStates + "]");

        this.resetTimer = null;

        node.on('input', function(msg) {

            //node.log(node.alarmStates);

            node.status({ fill:"blue", shape:"dot", text:"trigger" });

            msg.payload = {
                zone: "test",
                modes: node.alarmStates
            };

            if (node.resetTimer) {
                clearTimeout(node.resetTimer);
            }
            node.resetTimer = setTimeout(function() {
                node.status({});
                // todo: allow for momentary and fixed (motion vs nc/no)
            }, 3000);

            node._panel && node._panel.sensor(msg, function(triggered) {
                if (triggered) {
                    node.log('triggered:' + triggered);
                    if (node.resetTimer) {
                        clearTimeout(node.resetTimer);
                        node.resetTimer = null;
                    }
                    return node.status({ fill:"red", shape:"dot", text:"ALARM!" });
                }
            });
        });

        // todo: persist the sensor state on the panel and check it/warn/alarm if alarm state when arming the panel

        /**
         * listen for panel state changes
         */
        node._panel && node._panel.registerStateListener(node, function(msg) {
            //
            // alarm state
            //
            const SecuritySystemCurrentState = msg.payload && msg.payload.SecuritySystemCurrentState;
            if (SecuritySystemCurrentState !== 4) {
                node.status({});
            }
        });

        /**
         * clean up on node removal
         */
        node.on('close', function() {
            node._panel && node._panel.deregisterStateListener(node);
        });

    }
    RED.nodes.registerType("AnamicoAlarmSensor", AnamicoAlarmSensor);
};
