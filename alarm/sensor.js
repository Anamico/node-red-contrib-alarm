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

            node.log(node.alarmStates);

            node.status({ fill:"blue", shape:"dot", text:"trigger" });

            msg.payload.zone = "test";
            msg.payload.modes = node.alarmStates;

            if (node.resetTimer) {
                clearTimeout(node.resetTimer);
            }
            node.resetTimer = setTimeout(function() {
                node.status({});
                // todo: allow for momentary and fixed (motion vs nc/no)
            }, 1000);

            node._panel.sensor(msg, function(triggered) {
                if (triggered) {
                    if (node.resetTimer) {
                        clearTimeout(node.resetTimer);
                        node.resetTimer = null;
                    }
                    node.status({ fill:"red", shape:"dot", text:"ALARM!" });
                    return;
                }
            });
        });

        // todo: persist the sensor state on the panel and check it/warn/alarm if alarm state when arming the panel

    }
    RED.nodes.registerType("AnamicoAlarmSensor", AnamicoAlarmSensor);
};
