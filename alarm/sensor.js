'use strict';

//const async = require('async');

module.exports = function(RED) {

    function AnamicoAlarmSensor(config) {
        RED.nodes.createNode(this, config);
        var node = this;

        this._panel = RED.nodes.getNode(config.panel);

        node.on('input', function(msg) {

            node.status({ fill:"blue", shape:"dot", text:"trigger" });
            node._panel.sensor(function(val) {
                node.status({ fill:"red", shape:"dot", text:"status " + val });
            });
        });
    }
    RED.nodes.registerType("AnamicoAlarmSensor", AnamicoAlarmSensor);
};
