'use strict';

//const async = require('async');

module.exports = function(RED) {

    function AnamicoAlarmStateChanged(config) {
        RED.nodes.createNode(this, config);
        var node = this;

        this._panel = RED.nodes.getNode(config.panel);

        this._panel.registerStateSender(function(msg) {

            node.status({
                fill: node._panel.isAlarm ? "red" : "green",
                shape:"dot",
                text:"state: " + node._panel.alarmModes[node._panel.alarmState]
            });

            node.send(msg);
        });
    }
    RED.nodes.registerType("AnamicoAlarmStateChanged", AnamicoAlarmStateChanged);
};
